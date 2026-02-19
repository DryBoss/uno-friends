// src/components/Hand.jsx
import React, { useState } from "react";
import { X } from "lucide-react";
import useGameStore from "../store/gameStore";
import Card from "./Card";
import networkManager from "../network/NetworkManager";

const Hand = ({ myPlayerIndex }) => {
  const {
    players,
    currentPlayerIndex,
    playCard,
    isDarkSide,
    activeColor,
    discardPile,
    gameState,
    accumulatedPenalty,
    rules,
  } = useGameStore();

  // State to handle Color Picker modal
  const [pendingWildIndex, setPendingWildIndex] = useState(null);

  const myHand = players[myPlayerIndex]?.hand || [];
  const isMyTurn =
    currentPlayerIndex === myPlayerIndex && gameState === "PLAYING";
  const topCard = discardPile[discardPile.length - 1];

  const checkPlayable = (card) => {
    if (!isMyTurn) return false;
    if (!topCard) return false;

    const currentCard = isDarkSide ? card.back : card;
    const currentTop = isDarkSide ? topCard.back : topCard;

    if (accumulatedPenalty > 0) {
      if (rules.stacking && currentCard.type === currentTop.type) return true;
      return false;
    }

    if (currentCard.color === "black") return true;
    if (currentCard.color === activeColor) return true;
    if (currentCard.value !== null && currentCard.value === currentTop.value)
      return true;
    if (currentCard.type !== "NUMBER" && currentCard.type === currentTop.type)
      return true;

    return false;
  };

  const handleCardClick = (card, index) => {
    if (checkPlayable(card)) {
      const currentCard = isDarkSide ? card.back : card;

      // If it's a wild card, open the color picker instead of playing instantly
      if (currentCard.color === "black") {
        setPendingWildIndex(index);
        return;
      }

      executePlay(index, null);
    }
  };

  const executePlay = (index, chosenColor) => {
    playCard(myPlayerIndex, index, chosenColor);
    networkManager.send("PLAY_CARD", {
      playerIndex: myPlayerIndex,
      cardIndex: index,
      chosenColor,
    });
    setPendingWildIndex(null); // Close modal
  };

  const middleIndex = (myHand.length - 1) / 2;

  // Render the correct color choices based on Light vs Dark side
  const colorOptions = isDarkSide
    ? [
        { id: "teal", bg: "bg-[#00897B]", border: "border-[#004D40]" },
        { id: "pink", bg: "bg-[#D81B60]", border: "border-[#880E4F]" },
        { id: "purple", bg: "bg-[#8E24AA]", border: "border-[#4A148C]" },
        { id: "orange", bg: "bg-[#F4511E]", border: "border-[#BF360C]" },
      ]
    : [
        { id: "red", bg: "bg-[#E53935]", border: "border-[#B71C1C]" },
        { id: "blue", bg: "bg-[#1E88E5]", border: "border-[#0D47A1]" },
        { id: "green", bg: "bg-[#43A047]", border: "border-[#1B5E20]" },
        { id: "yellow", bg: "bg-[#FFB300]", border: "border-[#FF8F00]" },
      ];

  return (
    <>
      {/* COLOR PICKER MODAL */}
      {pendingWildIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFF8E1] p-6 rounded-3xl border-4 border-[#FFECB3] shadow-2xl flex flex-col items-center relative">
            <button
              onClick={() => setPendingWildIndex(null)}
              className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full border-4 border-white shadow-md hover:scale-110 active:scale-95"
            >
              <X size={20} strokeWidth={4} />
            </button>
            <h3 className="text-2xl font-black text-[#3E2723] mb-6">
              Choose Color
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => executePlay(pendingWildIndex, color.id)}
                  className={`w-20 h-20 rounded-2xl ${color.bg} ${color.border} border-b-8 shadow-lg active:border-b-0 active:translate-y-2 hover:brightness-110 transition-all`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARD HAND */}
      <div className="absolute bottom-0 left-0 w-full h-48 flex justify-center items-end pb-6 overflow-visible pointer-events-none z-50">
        <div className="flex justify-center items-end pointer-events-auto relative h-full">
          {myHand.map((card, index) => {
            const isPlayable = checkPlayable(card);
            const overlapOffset =
              myHand.length > 8 ? (myHand.length - 8) * 3 : 0;
            const marginLeft = index === 0 ? "0px" : `-${20 + overlapOffset}px`;
            const rotationOffset = (index - middleIndex) * 3;
            const rotation = Math.max(-25, Math.min(25, rotationOffset));
            const translateY = Math.abs(index - middleIndex) * 2;

            return (
              <div
                key={card.id}
                style={{
                  marginLeft,
                  zIndex: index,
                  transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                  transformOrigin: "bottom center",
                }}
                className="relative"
              >
                <div
                  className={`transition-all duration-300 group
                  ${isPlayable ? "hover:-translate-y-12 hover:scale-110 cursor-pointer" : "opacity-80 brightness-75"}
                `}
                >
                  <Card
                    card={card}
                    isDarkSide={isDarkSide}
                    onClick={() => handleCardClick(card, index)}
                    isPlayable={isPlayable}
                  />
                  {isPlayable && (
                    <div className="absolute inset-0 bg-green-400 blur-xl opacity-0 group-hover:opacity-40 rounded-xl -z-10 transition-opacity pointer-events-none"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Hand;
