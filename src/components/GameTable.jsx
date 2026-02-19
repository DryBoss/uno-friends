// src/components/GameTable.jsx
import React, { useEffect, useState } from "react";
import { LogOut, RefreshCcw, BellRing } from "lucide-react";
import useGameStore from "../store/gameStore";
import Hand from "./Hand";
import Card from "./Card";
import networkManager from "../network/NetworkManager";

// We reuse the animal logic so the table knows how to draw them
const ANIMAL_AVATARS = [
  { id: "bear", emoji: "🐻", color: "bg-amber-200" },
  { id: "panda", emoji: "🐼", color: "bg-slate-200" },
  { id: "fox", emoji: "🦊", color: "bg-orange-300" },
  { id: "koala", emoji: "🐨", color: "bg-gray-300" },
  { id: "lion", emoji: "🦁", color: "bg-yellow-300" },
  { id: "tiger", emoji: "🐯", color: "bg-orange-400" },
  { id: "cat", emoji: "🐱", color: "bg-pink-200" },
  { id: "dog", emoji: "🐶", color: "bg-stone-300" },
  { id: "rabbit", emoji: "🐰", color: "bg-rose-200" },
  { id: "frog", emoji: "🐸", color: "bg-green-300" },
  { id: "pig", emoji: "🐷", color: "bg-red-200" },
  { id: "cow", emoji: "🐮", color: "bg-slate-100" },
  { id: "monkey", emoji: "🐵", color: "bg-amber-300" },
  { id: "penguin", emoji: "🐧", color: "bg-sky-200" },
  { id: "owl", emoji: "🦉", color: "bg-stone-400" },
  { id: "dragon", emoji: "🐲", color: "bg-emerald-300" },
];

// --- THE ANIMATION COMPONENT ---
const FlyingCard = ({ anim, isDarkSide, myPlayerIndex }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // A tiny timeout ensures the browser calculates the start position before transitioning
    const timer = setTimeout(() => setMounted(true), 20);
    return () => clearTimeout(timer);
  }, []);

  // Now the card calculates who "Me" is based on your rock-solid Device ID
  const isMe = anim.playerIndex === myPlayerIndex;

  const DECK_POS = "translate(-100px, 0px) scale(0.8) rotate(-12deg)";
  const DISCARD_POS = "translate(100px, 0px) scale(1) rotate(15deg)";
  const ME_POS = "translate(0px, 45vh) scale(0.5) rotate(0deg)";
  const OPPONENT_POS = "translate(0px, -45vh) scale(0.5) rotate(0deg)";

  let startPos, endPos;

  if (anim.type === "play") {
    startPos = isMe ? ME_POS : OPPONENT_POS;
    endPos = DISCARD_POS;
  } else {
    // draw
    startPos = DECK_POS;
    endPos = isMe ? ME_POS : OPPONENT_POS;
  }

  const showBack = anim.type === "draw" && !isMe;

  return (
    <div
      className="absolute top-1/2 left-1/2 -ml-12 -mt-18 z-[9999] pointer-events-none drop-shadow-[0_30px_30px_rgba(0,0,0,0.6)] transition-all duration-[600ms] ease-in-out"
      style={{
        transform: mounted ? endPos : startPos,
        opacity: mounted ? 1 : 0.5,
      }}
    >
      {showBack ? (
        <div className="w-24 h-36 rounded-xl border-4 border-white shadow-xl flex items-center justify-center bg-[#3E2723]">
          <span className="text-yellow-400 font-black text-3xl transform -rotate-12">
            UNO
          </span>
        </div>
      ) : (
        <Card card={anim.card} isDarkSide={isDarkSide} />
      )}
    </div>
  );
};

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
    playCard,
    winner,
    pressUno,
    animations, // <-- Bring animations array from the store
  } = useGameStore();

  const myDeviceId = localStorage.getItem("uno_device_id");
  const myPlayerIndex =
    players.findIndex((p) => p.id === myDeviceId) !== -1
      ? players.findIndex((p) => p.id === myDeviceId)
      : 0;

  // --- THE NETWORK LISTENER ---
  useEffect(() => {
    networkManager.setCallback((msgString) => {
      try {
        const msg = JSON.parse(msgString);
        if (msg.type === "PLAY_CARD") {
          playCard(
            msg.payload.playerIndex,
            msg.payload.cardIndex,
            msg.payload.chosenColor,
          );
        } else if (msg.type === "DRAW_CARD") {
          drawCard(msg.payload.playerId);
        } else if (msg.type === "PRESS_UNO") {
          pressUno(msg.payload.callerId);
        }
      } catch (e) {
        console.error("GameTable Network Error:", e);
      }
    });
  }, [playCard, drawCard, pressUno]);

  if (gameState === "LOBBY") return null;

  const topCard = discardPile[discardPile.length - 1];

  const handleDraw = () => {
    if (currentPlayerIndex === myPlayerIndex) {
      drawCard(players[myPlayerIndex].id);
      networkManager.send("DRAW_CARD", { playerId: players[myPlayerIndex].id });
    }
  };

  const handleUnoButton = () => {
    pressUno(myDeviceId);
    networkManager.send("PRESS_UNO", { callerId: myDeviceId });
  };

  const AnimalToken = ({ id, isTurn }) => {
    const animal = ANIMAL_AVATARS.find((a) => a.id === id) || ANIMAL_AVATARS[0];
    return (
      <div
        className={`w-14 h-14 ${animal.color} rounded-full flex items-center justify-center text-3xl shadow-inner border-4 ${
          isTurn ? "border-green-400 scale-110" : "border-[#FFECB3]/30"
        } transition-all duration-300`}
      >
        {animal.emoji}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#3E2723] flex flex-col items-center justify-between font-sans overflow-hidden select-none">
      {/* --- ANIMATION OVERLAY --- */}
      {animations.map((anim) => (
        <FlyingCard
          key={anim.id}
          anim={anim}
          isDarkSide={isDarkSide}
          myPlayerIndex={myPlayerIndex}
        />
      ))}

      {/* --- BACKGROUND TEXTURES --- */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(#D7CCC8 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      ></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] sm:w-[800px] sm:h-[600px] bg-[#4E342E] rounded-[100px] sm:rounded-full border-[16px] border-[#5D4037] shadow-inner pointer-events-none"></div>

      {/* --- TOP BAR (OPPONENTS) --- */}
      <div className="w-full flex justify-center gap-4 sm:gap-10 p-6 z-10 pt-10">
        {players.map((p, idx) => {
          if (idx === myPlayerIndex) return null;

          const isTurn = currentPlayerIndex === idx;

          return (
            <div
              key={p.id}
              className={`flex flex-col items-center transition-all duration-300 ${
                isTurn ? "opacity-100 -translate-y-2" : "opacity-60"
              }`}
            >
              <div className="relative">
                <AnimalToken id={p.avatarId} isTurn={isTurn} />

                {p.unoCalled && (
                  <div className="absolute -top-3 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white animate-bounce z-20">
                    SAFE!
                  </div>
                )}

                <div className="absolute -bottom-2 -right-2 bg-[#FFF8E1] text-[#3E2723] w-6 h-6 rounded-full flex items-center justify-center font-black text-xs border-2 border-[#3E2723] shadow-md z-10">
                  {p.hand?.length || 0}
                </div>
              </div>

              <span className="text-[#FFECB3] font-bold mt-3 text-sm drop-shadow-md bg-black/20 px-3 py-1 rounded-full">
                {p.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* --- CENTER AREA (DECK & DISCARD) --- */}
      <div className="relative flex-1 flex items-center justify-center gap-8 sm:gap-16 w-full z-10">
        {activeColor && (
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-[60px] opacity-40 -z-10 pointer-events-none transition-colors duration-500
             ${
               activeColor === "red"
                 ? "bg-red-500"
                 : activeColor === "blue"
                   ? "bg-blue-500"
                   : activeColor === "green"
                     ? "bg-green-500"
                     : activeColor === "yellow"
                       ? "bg-yellow-400"
                       : "bg-transparent"
             }`}
          ></div>
        )}

        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] border-[10px] border-dashed border-white/10 rounded-full pointer-events-none -z-0 flex items-center justify-center transition-transform duration-700 ${
            direction === -1 ? "scale-x-[-1]" : ""
          }`}
        >
          <div className="absolute top-[-15px] text-white/20">
            <RefreshCcw size={40} />
          </div>
        </div>

        {/* 1. DRAW PILE */}
        <div
          className={`relative group cursor-pointer transition-transform ${
            currentPlayerIndex === myPlayerIndex
              ? "hover:scale-105 active:scale-95"
              : "opacity-80"
          }`}
          onClick={handleDraw}
        >
          <div className="absolute top-2 left-2 w-24 h-36 rounded-xl bg-[#FFF8E1] border-2 border-[#D7CCC8]"></div>
          <div className="absolute top-1 left-1 w-24 h-36 rounded-xl bg-[#FFF8E1] border-2 border-[#D7CCC8]"></div>

          <div className="w-24 h-36 rounded-xl border-4 border-white shadow-[0_8px_0_rgba(0,0,0,0.4)] flex items-center justify-center bg-[#3E2723] relative z-10 overflow-hidden">
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "radial-gradient(#D7CCC8 1px, transparent 1px)",
                backgroundSize: "8px 8px",
              }}
            ></div>
            <span
              className="text-yellow-400 font-black text-3xl tracking-tighter transform -rotate-12"
              style={{ WebkitTextStroke: "1px white" }}
            >
              UNO
            </span>
          </div>

          {currentPlayerIndex === myPlayerIndex && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-bounce whitespace-nowrap">
              Your Turn!
            </div>
          )}
        </div>

        {/* 2. DISCARD PILE */}
        <div className="relative transform transition-transform duration-300">
          {topCard ? (
            <Card card={topCard} isDarkSide={isDarkSide} isPlayable={false} />
          ) : (
            <div className="w-24 h-36 rounded-xl border-4 border-dashed border-white/20 flex items-center justify-center">
              <span className="text-white/20 text-xs font-bold uppercase">
                Empty
              </span>
            </div>
          )}
        </div>
      </div>

      {/* --- UI BUTTONS --- */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
        <button
          onClick={handleUnoButton}
          className="bg-red-500 w-16 h-16 rounded-full flex items-center justify-center text-white border-4 border-red-700 shadow-[0_4px_0_rgb(153,27,27)] hover:bg-red-400 active:translate-y-1 active:shadow-none transition-all"
        >
          <BellRing size={28} />
          <span className="absolute -bottom-6 text-xs font-bold text-[#FFECB3]">
            UNO!
          </span>
        </button>
      </div>

      <div className="absolute left-4 top-4 z-20">
        <button
          onClick={() => window.location.reload()}
          className="p-3 bg-white/10 rounded-xl hover:bg-white/20 text-white transition backdrop-blur-sm"
        >
          <LogOut size={20} />
        </button>
      </div>

      {/* --- BOTTOM AREA (YOUR HAND) --- */}
      <div className="w-full z-20 h-48">
        {players[myPlayerIndex]?.unoCalled && (
          <div className="absolute bottom-48 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-1 rounded-full font-black border-2 border-white shadow-lg animate-pulse">
            YOU ARE SAFE
          </div>
        )}
        <Hand myPlayerIndex={myPlayerIndex} />
      </div>

      {/* --- WINNER OVERLAY --- */}
      {winner && (
        <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center flex-col animate-fade-in backdrop-blur-md">
          <h1 className="text-7xl font-black text-yellow-400 mb-6 drop-shadow-[0_4px_0_rgba(180,83,9,1)] animate-bounce tracking-tighter">
            {winner === players[myPlayerIndex]?.name ? "YOU WIN!" : "GAME OVER"}
          </h1>
          <p className="text-2xl font-bold text-white bg-white/10 px-6 py-2 rounded-full mb-8">
            {winner} took the crown 👑
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-10 py-5 bg-orange-500 border-b-4 border-orange-700 text-white rounded-2xl text-2xl font-black active:border-b-0 active:translate-y-1 transition-all"
          >
            Back to Lobby
          </button>
        </div>
      )}
    </div>
  );
};

export default GameTable;
