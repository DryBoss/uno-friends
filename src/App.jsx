// src/App.jsx
import React from "react";
import useGameStore from "./store/gameStore";
import Lobby from "./components/Lobby";
import GameTable from "./components/GameTable";

function App() {
  // 1. Listen to the global game state
  const gameState = useGameStore((state) => state.gameState);

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 select-none">
      {/* 2. Switch Screens based on State */}
      {gameState === "LOBBY" ? <Lobby /> : <GameTable />}
    </div>
  );
}

export default App;
