// src/network/NativeAdapter.js
import { TcpSocket } from "capacitor-tcp-socket";
import { Network } from "@capacitor/network";

// Helper for Base64 (Required for Capacitor TCP)
const strToBase64 = (str) => btoa(unescape(encodeURIComponent(str)));
const base64ToStr = (b64) => decodeURIComponent(escape(atob(b64)));

export default class NativeAdapter {
  constructor() {
    this.serverSocketId = null;
    this.clientSocketId = null;
    this.callback = null;
    this.buffer = "";
  }

  setCallback(cb) {
    this.callback = cb;
  }

  // HOST: Start TCP Server
  async startServer(port = 8080) {
    try {
      const server = await TcpSocket.bind({ port, address: "0.0.0.0" });
      this.serverSocketId = server.id;

      TcpSocket.addListener("accept", (err, accept) => {
        if (!err) {
          this.clientSocketId = accept.client;
          if (this.callback) {
            this.callback(
              JSON.stringify({ type: "PLAYER_CONNECTED", id: accept.client }),
            );
          }
        }
      });

      TcpSocket.addListener("data", (err, packet) => {
        if (!err && packet.data) this.handleIncomingData(packet.data);
      });

      // Getting IP on Android 12+ is hard via plugin.
      // Safest to ask user to check settings or implement custom native code.
      return "Check Wi-Fi Settings";
    } catch (e) {
      console.error("Host Error:", e);
      throw e;
    }
  }

  // JOIN: Connect to IP
  async connect(ip, port = 8080) {
    try {
      const client = await TcpSocket.connect({ address: ip, port });
      this.clientSocketId = client.id;

      TcpSocket.addListener("data", (err, packet) => {
        if (!err && packet.data) this.handleIncomingData(packet.data);
      });
      return true;
    } catch (e) {
      throw e;
    }
  }

  write(msgString) {
    if (this.clientSocketId !== null) {
      // Add delimiter \n and encode to Base64
      const data = strToBase64(msgString + "\n");
      TcpSocket.write({ id: this.clientSocketId, data });
    }
  }

  handleIncomingData(rawData) {
    // Decode Base64
    let text = "";
    try {
      text = base64ToStr(rawData);
    } catch (e) {
      text = rawData;
    }

    this.buffer += text;

    // Split by newline \n
    let delimiterIndex;
    while ((delimiterIndex = this.buffer.indexOf("\n")) !== -1) {
      const message = this.buffer.slice(0, delimiterIndex);
      this.buffer = this.buffer.slice(delimiterIndex + 1);
      if (message.trim() && this.callback) this.callback(message);
    }
  }
}
