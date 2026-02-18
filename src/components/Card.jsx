// src/components/Card.jsx
import React from "react";
import clsx from "clsx"; // npm install clsx (optional, for cleaner class strings)
import { COLORS } from "../game/constants";

const Card = ({ card, isDarkSide, onClick, isPlayable = false }) => {
  // Helper to map color codes to Tailwind CSS classes
  const getColorClass = (color) => {
    switch (color) {
      // Light Side
      case COLORS.RED:
        return "bg-red-500 text-white";
      case COLORS.BLUE:
        return "bg-blue-500 text-white";
      case COLORS.GREEN:
        return "bg-green-500 text-white";
      case COLORS.YELLOW:
        return "bg-yellow-400 text-black";
      // Dark Side
      case COLORS.TEAL:
        return "bg-teal-500 text-white";
      case COLORS.PINK:
        return "bg-pink-500 text-white";
      case COLORS.PURPLE:
        return "bg-purple-600 text-white";
      case COLORS.ORANGE:
        return "bg-orange-500 text-white";
      // Special
      case COLORS.BLACK:
        return "bg-gray-900 text-white border-2 border-white";
      default:
        return "bg-gray-300";
    }
  };

  // Helper to get the symbol/icon for the card
  const getIcon = (type) => {
    switch (type) {
      case "SKIP":
        return "🚫";
      case "REVERSE":
        return "🔁";
      case "DRAW_2":
        return "+2";
      case "WILD":
        return "🌈";
      case "WILD_DRAW_4":
        return "+4";
      case "FLIP":
        return "🔄";
      case "SKIP_EVERYONE":
        return "❌";
      case "DISCARD_ALL":
        return "🗑️";
      default:
        return type;
    }
  };

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={clsx(
        "group w-24 h-36 perspective-1000 cursor-pointer transition-all duration-200 select-none",
        isPlayable
          ? "hover:-translate-y-4 hover:scale-110 z-10"
          : "opacity-100", // Opacity logic handled by parent usually
      )}
    >
      <div
        className={clsx(
          "card-inner w-full h-full relative transition-transform duration-500 transform-style-3d",
          isDarkSide && "rotate-y-180",
        )}
      >
        {/* === FRONT FACE (LIGHT SIDE) === */}
        <div
          className={`card-face absolute w-full h-full rounded-lg flex flex-col items-center justify-center shadow-lg backface-hidden ${getColorClass(card.color)}`}
        >
          {/* Top Corner */}
          <span className="absolute top-1 left-2 text-sm font-bold">
            {card.type === "NUMBER" ? card.value : getIcon(card.type)}
          </span>

          {/* Center Big Icon */}
          <span className="text-4xl font-bold drop-shadow-md">
            {card.type === "NUMBER" ? card.value : getIcon(card.type)}
          </span>

          {/* Bottom Corner (Rotated) */}
          <span className="absolute bottom-1 right-2 text-sm font-bold rotate-180">
            {card.type === "NUMBER" ? card.value : getIcon(card.type)}
          </span>

          {/* Center Ellipse for Design */}
          <div className="absolute w-16 h-24 border-2 border-white/30 rounded-full pointer-events-none"></div>
        </div>

        {/* === BACK FACE (DARK SIDE) === */}
        {/* Only render if the card actually HAS a back (Flip Mode) */}
        {card.back && (
          <div
            className={`card-face absolute w-full h-full rounded-lg flex flex-col items-center justify-center shadow-lg backface-hidden rotate-y-180 ${getColorClass(card.back.color)}`}
          >
            <span className="absolute top-1 left-2 text-sm font-bold">
              {card.back.type === "NUMBER"
                ? card.back.value
                : getIcon(card.back.type)}
            </span>
            <span className="text-4xl font-bold drop-shadow-md">
              {card.back.type === "NUMBER"
                ? card.back.value
                : getIcon(card.back.type)}
            </span>
            <span className="absolute bottom-1 right-2 text-sm font-bold rotate-180">
              {card.back.type === "NUMBER"
                ? card.back.value
                : getIcon(card.back.type)}
            </span>
            <div className="absolute w-16 h-24 border-2 border-white/30 rounded-full pointer-events-none"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Card;
