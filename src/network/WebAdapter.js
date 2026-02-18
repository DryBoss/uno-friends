import Peer from "peerjs";

// A unique prefix so your game doesn't mix with other apps on the PeerJS server
const APP_PREFIX = "uno-friends-game-";

export default class WebAdapter {
  constructor() {
    this.peer = null;
    this.conn = null;
    this.callback = null;
  }

  setCallback(cb) {
    this.callback = cb;
  }

  // --- HOSTING ---
  async startServer() {
    return new Promise((resolve, reject) => {
      // 1. Generate a short 4-character code (e.g., "X7K9")
      const shortCode = Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase();
      const fullId = APP_PREFIX + shortCode;

      // 2. Request this specific ID from PeerJS
      this.peer = new Peer(fullId);

      this.peer.on("open", (id) => {
        console.log("Hosting with Short Code:", shortCode);
        // ONLY resolve the Short Code to the UI
        resolve(shortCode);
      });

      this.peer.on("connection", (conn) => {
        this.conn = conn;
        this.setupListeners();
        // Notify UI a player joined
        setTimeout(() => {
          if (this.callback)
            this.callback(JSON.stringify({ type: "PLAYER_CONNECTED" }));
        }, 500);
      });

      // Handle errors (e.g., if code is taken, rare but possible)
      this.peer.on("error", (err) => {
        console.error("Peer Error:", err);
        reject(err);
      });
    });
  }

  // --- JOINING ---
  async connect(shortCode) {
    return new Promise((resolve, reject) => {
      this.peer = new Peer(); // I (the joiner) don't need a specific ID

      this.peer.on("open", () => {
        // 1. Reconstruct the Full ID using the user's input
        const fullHostId = APP_PREFIX + shortCode.trim().toUpperCase();

        console.log("Connecting to:", fullHostId);
        this.conn = this.peer.connect(fullHostId);

        this.conn.on("open", () => {
          this.setupListeners();
          resolve(true);
        });

        this.conn.on("error", (err) => reject(err));
      });

      this.peer.on("error", (err) => reject(err));
    });
  }

  setupListeners() {
    if (!this.conn) return;
    this.conn.on("data", (data) => {
      if (this.callback) {
        // Ensure string format
        this.callback(typeof data === "string" ? data : JSON.stringify(data));
      }
    });
  }

  write(msg) {
    if (this.conn) this.conn.send(msg);
  }
}
