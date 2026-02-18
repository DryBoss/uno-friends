// src/components/Hand.jsx
import React from "react";
import useGameStore from "../store/gameStore";
import Card from "./Card";
import networkManager from "../network/NetworkManager"; // To send the move

const Hand = () => {
  const {
    players,
    currentPlayerIndex,
    playCard,
    isDarkSide,
    activeColor,
    discardPile,
    gameState,
  } = useGameStore();

  // 1. Get "My" Hand
  // In a real app with auth, you'd check play.id === myUserId.
  // For this demo, we assume Player 1 (Index 0) is "You".
  const myPlayerIndex = 0;
  const myHand = players[myPlayerIndex]?.hand || [];
  const isMyTurn =
    currentPlayerIndex === myPlayerIndex && gameState === "PLAYING";

  const topCard = discardPile[discardPile.length - 1];

  // 2. Helper: Check if a card is playable
  const checkPlayable = (card) => {
    if (!isMyTurn) return false;
    if (!topCard) return false;

    // Handle Flip Mode (Check Back vs Front)
    const currentCard = isDarkSide ? card.back : card;
    const currentTop = isDarkSide ? topCard.back : topCard;

    // Wilds are always playable
    if (currentCard.color === "black") return true;

    // Match Active Color (handled by store for Wilds)
    if (currentCard.color === activeColor) return true;

    // Match Value (Numbers)
    if (currentCard.value !== null && currentCard.value === currentTop.value)
      return true;

    // Match Type (Skip on Skip, Draw2 on Draw2)
    if (currentCard.type === currentTop.type) return true;

    return false;
  };

  // 3. Handle Click
  const handleCardClick = (card, index) => {
    if (checkPlayable(card)) {
      // Execute in Store (Updates UI immediately)
      playCard("p1", index); // Hardcoded 'p1' for Host/You

      // Send to Network (Updates opponent)
      networkManager.send("PLAY_CARD", {
        playerIndex: myPlayerIndex,
        cardIndex: index,
      });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-48 flex justify-center items-end pb-4 overflow-x-visible z-50 pointer-events-none">
      <div
        className="flex justify-center items-end pointer-events-auto"
        style={{ width: "min(100%, 1000px)" }}
      >
        {myHand.map((card, index) => {
          const isPlayable = checkPlayable(card);

          // Dynamic Overlap: The more cards you have, the more they squeeze together
          const overlap =
            myHand.length > 8 ? `-${(myHand.length - 8) * 3 + 10}px` : "-10px";

          return (
            <div
              key={card.id}
              style={{ marginLeft: index === 0 ? 0 : overlap, zIndex: index }}
              className={`relative transition-all duration-300 ${isPlayable ? "hover:-translate-y-6 hover:scale-110 hover:z-50 cursor-pointer" : "opacity-70 grayscale-[0.5]"}`}
            >
              <Card
                card={card}
                isDarkSide={isDarkSide}
                onClick={() => handleCardClick(card, index)}
                isPlayable={isPlayable}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Hand;
