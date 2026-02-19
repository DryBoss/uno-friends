// src/components/Hand.jsx
import React, { useState, useEffect } from "react";
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

  const [pendingWildIndex, setPendingWildIndex] = useState(null);
  const [screenWidth, setScreenWidth] = useState(1000);

  // --- LIVE SCREEN SIZE TRACKING ---
  useEffect(() => {
    setScreenWidth(window.innerWidth);
    const handleResize = () => setScreenWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const handleCardClick = (card, originalIndex) => {
    if (checkPlayable(card)) {
      const currentCard = isDarkSide ? card.back : card;
      if (currentCard.color === "black") {
        setPendingWildIndex(originalIndex);
        return;
      }
      executePlay(originalIndex, null);
    }
  };

  const executePlay = (originalIndex, chosenColor) => {
    playCard(myPlayerIndex, originalIndex, chosenColor);
    networkManager.send("PLAY_CARD", {
      playerIndex: myPlayerIndex,
      cardIndex: originalIndex,
      chosenColor,
    });
    setPendingWildIndex(null);
  };

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

  // --- IMPROVED VISIBILITY MATH ---
  const scale = screenWidth < 768 ? 0.75 : 1;
  const effectiveWidth = screenWidth / scale;

  // REQUIRE at least 50px of visible space per card (more than half the card's width!)
  const maxCardsPerRow = Math.max(4, Math.floor((effectiveWidth - 100) / 50));

  const numRows = Math.ceil(myHand.length / maxCardsPerRow) || 1;
  const cardsPerRow = Math.ceil(myHand.length / numRows);

  const rows = [];
  for (let i = 0; i < numRows; i++) {
    rows.push(
      myHand.slice(i * cardsPerRow, (i + 1) * cardsPerRow).map((card, idx) => ({
        card,
        originalIndex: i * cardsPerRow + idx,
      })),
    );
  }

  return (
    <>
      {/* COLOR PICKER MODAL */}
      {pendingWildIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in px-4">
          <div className="bg-[#FFF8E1] p-6 rounded-3xl border-4 border-[#FFECB3] shadow-2xl flex flex-col items-center relative w-full max-w-[300px]">
            <button
              onClick={() => setPendingWildIndex(null)}
              className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full border-4 border-white shadow-md hover:scale-110 active:scale-95"
            >
              <X size={20} strokeWidth={4} />
            </button>
            <h3 className="text-2xl font-black text-[#3E2723] mb-6 text-center">
              Choose Color
            </h3>
            <div className="grid grid-cols-2 gap-4 w-full">
              {colorOptions.map((color) => (
                <button
                  key={color.id}
                  onClick={() => executePlay(pendingWildIndex, color.id)}
                  className={`w-full aspect-square rounded-2xl ${color.bg} ${color.border} border-b-8 shadow-lg active:border-b-0 active:translate-y-2 hover:brightness-110 transition-all`}
                ></button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CARD HAND SYSTEM */}
      <div className="absolute bottom-0 left-0 w-full flex flex-col items-center justify-end pointer-events-none z-50">
        <div className="relative w-full pb-4 sm:pb-8 flex flex-col items-center justify-end scale-[0.75] sm:scale-100 origin-bottom">
          {rows.map((row, rowIndex) => {
            const rowMiddleIndex = (row.length - 1) / 2;

            // Reduced vertical overlap! Back rows are now much higher and easier to see.
            const marginTop = rowIndex === 0 ? "0px" : "-45px";

            return (
              <div
                key={rowIndex}
                style={{ marginTop, zIndex: rowIndex * 10 }}
                className="flex justify-center items-end pointer-events-auto relative"
              >
                {row.map((item, index) => {
                  const isPlayable = checkPlayable(item.card);

                  // Reduced horizontal overlap! Capped at 46px, meaning 50px is ALWAYS showing.
                  const overlap = Math.min(46, 5 + row.length * 3.5);
                  const marginLeft = index === 0 ? "0px" : `-${overlap}px`;

                  // Gentler fan angle so tilted corners don't cover neighboring numbers
                  let rotation = (index - rowMiddleIndex) * 2;
                  rotation = Math.max(-20, Math.min(20, rotation));

                  const translateY =
                    Math.abs(index - rowMiddleIndex) *
                    (row.length > 10 ? 1 : 2);

                  return (
                    <div
                      key={item.card.id}
                      style={{
                        marginLeft,
                        zIndex: item.originalIndex,
                        transform: `rotate(${rotation}deg) translateY(${translateY}px)`,
                        transformOrigin: "bottom center",
                      }}
                      className="relative group hover:z-[100]"
                    >
                      <div
                        className={`transition-all duration-300 group
                        ${isPlayable ? "hover:-translate-y-12 sm:hover:-translate-y-16 hover:scale-110 cursor-pointer shadow-lg" : "opacity-90 brightness-75"}
                      `}
                      >
                        <Card
                          card={item.card}
                          isDarkSide={isDarkSide}
                          onClick={() =>
                            handleCardClick(item.card, item.originalIndex)
                          }
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
            );
          })}
        </div>
      </div>
    </>
  );
};

export default Hand;
