// src/network/NetworkManager.js
import { Capacitor } from "@capacitor/core";
import NativeAdapter from "./NativeAdapter";
import WebAdapter from "./WebAdapter";

class NetworkManager {
  constructor() {
    // Automatically switch based on platform
    // Web = PeerJS (Internet/Localhost)
    // Native = TCP Socket (Hotspot/Offline)
    this.adapter = Capacitor.isNativePlatform()
      ? new NativeAdapter()
      : new WebAdapter();
  }

  // Set the function that handles incoming messages (usually in App.jsx or Lobby.jsx)
  setCallback(cb) {
    this.adapter.setCallback(cb);
  }

  // Start Hosting
  async host() {
    return await this.adapter.startServer(8080);
  }

  // Join a Host
  async join(address) {
    await this.adapter.connect(address, 8080);
  }

  // Send Data
  send(type, payload) {
    const msg = JSON.stringify({ type, payload });
    this.adapter.write(msg);
  }
}

export default new NetworkManager();
