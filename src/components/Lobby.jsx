// src/components/Lobby.jsx
import React, { useState, useEffect } from "react";
import networkManager from "../network/NetworkManager";
import useGameStore from "../store/gameStore";

const Lobby = () => {
  const [mode, setMode] = useState("MENU"); // 'MENU', 'HOST', 'JOIN'
  const [hostId, setHostId] = useState(null); // The Code/IP to share
  const [joinId, setJoinId] = useState(""); // The Code/IP to enter
  const [status, setStatus] = useState(""); // Status messages
  const [isConnected, setIsConnected] = useState(false); // Can we start?

  const startGame = useGameStore((state) => state.startGame);

  // --- 1. HOST LOGIC ---
  const handleHost = async () => {
    setStatus("Creating Game Room...");
    try {
      // Get the ID (PeerID for Web, IP for App)
      const id = await networkManager.host();
      setHostId(id);
      setMode("HOST");
      setStatus("Waiting for friend to connect...");

      // Listen for players joining
      networkManager.setCallback((msgString) => {
        const msg = JSON.parse(msgString);
        if (msg.type === "PLAYER_CONNECTED") {
          setStatus("Player Connected! Ready to Start.");
          setIsConnected(true);
        }
      });
    } catch (e) {
      setStatus("Error: " + e.message);
      setMode("MENU");
    }
  };

  // --- 2. START GAME LOGIC (Host Only) ---
  const handleStartGame = () => {
    // 1. Tell the other player to start
    networkManager.send("GAME_START", { variant: "CLASSIC" });

    // 2. Start my own game engine
    startGame("CLASSIC", [
      { id: "p1", name: "Host (You)", hand: [] },
      { id: "p2", name: "Player 2", hand: [] },
    ]);
  };

  // --- 3. JOIN LOGIC ---
  const handleJoin = async () => {
    if (!joinId) return;
    setStatus("Connecting...");

    try {
      await networkManager.join(joinId);
      setMode("JOINED");
      setStatus("Connected! Waiting for Host to start...");

      // Listen for "GAME_START" command
      networkManager.setCallback((msgString) => {
        const msg = JSON.parse(msgString);
        if (msg.type === "GAME_START") {
          startGame(msg.payload.variant, [
            { id: "p1", name: "Host", hand: [] },
            { id: "p2", name: "Player 2 (You)", hand: [] },
          ]);
        }
      });
    } catch (e) {
      setStatus("Connection Failed. Check ID.");
    }
  };

  // --- RENDER: MAIN MENU ---
  if (mode === "MENU") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-8">
        <h1 className="text-6xl text-yellow-400 font-bold drop-shadow-lg tracking-wider">
          UNO
        </h1>

        <button
          onClick={handleHost}
          className="w-64 py-6 bg-red-600 rounded-xl text-2xl font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          HOST GAME
        </button>

        <button
          onClick={() => setMode("JOIN")}
          className="w-64 py-6 bg-blue-600 rounded-xl text-2xl font-bold text-white shadow-lg active:scale-95 transition-transform"
        >
          JOIN GAME
        </button>

        <p className="text-gray-500 mt-4">{status}</p>
      </div>
    );
  }

  // --- RENDER: HOST SCREEN ---
  if (mode === "HOST") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white bg-red-800">
        <h2 className="text-2xl mb-4 opacity-80">HOSTING ROOM</h2>

        {/* The ID Display Box */}
        <div className="bg-black/40 p-8 rounded-xl text-center mb-8 border-2 border-white/20">
          <p className="text-sm mb-2 text-gray-300 uppercase tracking-widest">
            Share this Code
          </p>
          <h1 className="text-4xl font-mono font-bold text-yellow-400 select-all">
            {hostId || "Generating..."}
          </h1>
        </div>

        <p className="mb-8 text-xl font-bold animate-pulse">{status}</p>

        {/* Start Button (Only appears when someone connects) */}
        {isConnected && (
          <button
            onClick={handleStartGame}
            className="px-10 py-4 bg-green-500 text-white font-bold text-2xl rounded-full shadow-xl hover:scale-105 transition-transform animate-bounce"
          >
            START GAME
          </button>
        )}

        <button
          onClick={() => setMode("MENU")}
          className="mt-12 text-sm underline opacity-50 hover:opacity-100"
        >
          Cancel
        </button>
      </div>
    );
  }

  // --- RENDER: JOIN SCREEN ---
  if (mode === "JOIN") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-white bg-blue-800">
        <h2 className="text-2xl mb-6 font-bold">JOIN GAME</h2>

        <input
          type="text"
          placeholder="Enter Host Code"
          value={joinId}
          onChange={(e) => setJoinId(e.target.value)}
          className="text-black text-center text-3xl p-4 rounded-xl font-mono w-72 mb-6 border-4 border-blue-400 focus:border-yellow-400 outline-none"
        />

        <button
          onClick={handleJoin}
          className="px-10 py-4 bg-green-500 font-bold text-xl rounded-xl shadow-lg active:scale-95 transition-transform"
        >
          CONNECT
        </button>

        <p className="mt-6 text-yellow-300 font-semibold">{status}</p>

        <button
          onClick={() => setMode("MENU")}
          className="mt-12 text-sm underline opacity-50 hover:opacity-100"
        >
          Back
        </button>
      </div>
    );
  }

  // --- RENDER: WAITING LOBBY (After Joining) ---
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
      <div className="animate-spin text-6xl mb-4">⏳</div>
      <h2 className="text-2xl">Connected!</h2>
      <p className="opacity-70 mt-2">Waiting for Host to start the game...</p>
    </div>
  );
};

export default Lobby;
