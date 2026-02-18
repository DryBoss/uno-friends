// src/components/GameTable.jsx
import React from "react";
import useGameStore from "../store/gameStore";
import Card from "./Card";
import Hand from "./Hand";
import networkManager from "../network/NetworkManager";

const GameTable = () => {
  const {
    gameState,
    discardPile,
    isDarkSide,
    activeColor,
    direction,
    players,
    currentPlayerIndex,
    drawCard,
    winner,
  } = useGameStore();

  if (gameState === "LOBBY") {
    return <div className="text-white text-center mt-20">Loading Game...</div>;
  }

  // Get the top card to display in the center
  const topCard = discardPile[discardPile.length - 1];

  // Helper to determine background color based on Game Mode
  const getBgColor = () => {
    if (winner) return "bg-yellow-900"; // Winner state
    if (isDarkSide) return "bg-slate-900"; // Flip Mode
    return "bg-red-700"; // Classic Mode
  };

  // Handle Drawing a Card
  const handleDraw = () => {
    // 1. Update Local State
    drawCard("p1"); // Hardcoded 'p1' (You) for now
    // 2. Notify Network
    networkManager.send("DRAW_CARD", { playerId: "p1" });
  };

  return (
    <div
      className={`w-screen h-screen overflow-hidden flex flex-col items-center relative transition-colors duration-1000 ${getBgColor()}`}
    >
      {/* --- 1. OPPONENT AREA (TOP) --- */}
      <div className="w-full flex justify-center gap-8 p-4 pt-8">
        {players.map((p, idx) => {
          if (idx === 0) return null; // Skip "Me" (Player 0)

          const isTurn = currentPlayerIndex === idx;

          return (
            <div
              key={p.id}
              className={`flex flex-col items-center transition-all duration-300 ${isTurn ? "scale-110 opacity-100" : "opacity-60 scale-90"}`}
            >
              {/* Avatar Circle */}
              <div
                className={`w-16 h-16 rounded-full bg-gray-200 border-4 overflow-hidden shadow-lg mb-[-10px] z-10 ${isTurn ? "border-yellow-400 animate-pulse" : "border-white"}`}
              >
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.name}`}
                  alt="avatar"
                  className="w-full h-full"
                />
              </div>

              {/* Card Count Badge */}
              <div className="bg-black/70 text-white px-4 py-1 rounded-full text-sm font-bold border border-white/20 z-20">
                {p.hand.length} 🎴
              </div>

              {/* Name Label */}
              <span className="text-white font-bold mt-1 text-xs drop-shadow-md">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* --- 2. CENTER PLAY AREA --- */}
      <div className="flex-1 flex items-center justify-center gap-16 relative z-0">
        {/* A. Draw Pile (Deck) */}
        <div
          className="relative group cursor-pointer transition-transform active:scale-95"
          onClick={handleDraw}
        >
          {/* The Top Card of Deck */}
          <div
            className={`w-24 h-36 rounded-lg border-2 border-white shadow-2xl flex items-center justify-center ${isDarkSide ? "bg-indigo-900" : "bg-black"}`}
          >
            <span className="text-white font-bold text-2xl italic">UNO</span>
          </div>

          {/* Stack Effect (Cards underneath) */}
          <div
            className={`absolute top-1 left-1 w-24 h-36 rounded-lg border border-white/50 -z-10 ${isDarkSide ? "bg-indigo-950" : "bg-gray-900"}`}
          ></div>
          <div
            className={`absolute top-2 left-2 w-24 h-36 rounded-lg border border-white/30 -z-20 ${isDarkSide ? "bg-black" : "bg-gray-800"}`}
          ></div>
        </div>

        {/* B. Discard Pile (Active Card) */}
        <div className="relative transform transition-transform duration-300">
          {topCard && (
            <Card
              card={topCard}
              isDarkSide={isDarkSide}
              isPlayable={false} // Can't click the discard pile
            />
          )}

          {/* Active Color Glow (The Halo) */}
          <div
            className={`absolute -inset-6 rounded-full blur-2xl -z-10 opacity-60 transition-colors duration-500
             ${
               activeColor === "red"
                 ? "bg-red-500"
                 : activeColor === "blue"
                   ? "bg-blue-500"
                   : activeColor === "green"
                     ? "bg-green-500"
                     : activeColor === "yellow"
                       ? "bg-yellow-400"
                       : "bg-white"
             }`}
          ></div>
        </div>
      </div>

      {/* --- 3. PLAYER HAND (BOTTOM) --- */}
      <Hand />

      {/* --- 4. UI OVERLAYS --- */}

      {/* Direction Arrow (Background) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border-[20px] border-white/5 rounded-full pointer-events-none -z-0 flex items-center justify-center transition-transform duration-700 ${direction === -1 ? "scale-x-[-1]" : ""}`}
      >
        <div className="absolute top-0 w-8 h-8 bg-white/10 rotate-45"></div>
      </div>

      {/* Winner Modal */}
      {winner && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center flex-col animate-fade-in">
          <h1 className="text-6xl font-bold text-yellow-400 mb-4 animate-bounce">
            WINNER!
          </h1>
          <p className="text-3xl text-white">{winner} has won the game!</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-8 px-8 py-3 bg-red-600 text-white rounded-lg text-xl font-bold hover:bg-red-500"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default GameTable;
