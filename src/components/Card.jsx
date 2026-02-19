// src/components/Card.jsx
import React from "react";
import { Ban, RotateCcw, ArrowLeftRight, Trash2 } from "lucide-react";

// Custom 4-Color Wild Wheel (Looks exactly like a real Uno Wild Card!)
const WildSymbol = ({ isCorner }) => {
  const size = isCorner ? "w-4 h-4" : "w-14 h-14";
  const innerSize = isCorner ? "w-1.5 h-1.5" : "w-5 h-5";

  return (
    <div
      className={`${size} rounded-full border-[1.5px] border-white shadow-sm relative overflow-hidden flex items-center justify-center`}
      style={{
        background:
          "conic-gradient(#E53935 90deg, #1E88E5 90deg 180deg, #43A047 180deg 270deg, #FFB300 270deg 360deg)",
      }}
    >
      <div
        className={`${innerSize} bg-[#212121] rounded-full border border-white/50`}
      ></div>
    </div>
  );
};

const Card = ({ card, isDarkSide, onClick, isPlayable = false }) => {
  // Richer, cozy color palette
  const getColorStyle = (color) => {
    switch (color) {
      // Light Side
      case "red":
        return "bg-[#E53935] text-white border-[#B71C1C]";
      case "blue":
        return "bg-[#1E88E5] text-white border-[#0D47A1]";
      case "green":
        return "bg-[#43A047] text-white border-[#1B5E20]";
      case "yellow":
        return "bg-[#FFB300] text-[#3E2723] border-[#FF8F00]";
      // Dark Side (Flip)
      case "teal":
        return "bg-[#00897B] text-white border-[#004D40]";
      case "pink":
        return "bg-[#D81B60] text-white border-[#880E4F]";
      case "purple":
        return "bg-[#8E24AA] text-white border-[#4A148C]";
      case "orange":
        return "bg-[#F4511E] text-white border-[#BF360C]";
      // Wilds
      case "black":
        return "bg-[#212121] text-white border-black";
      default:
        return "bg-gray-400 border-gray-600";
    }
  };

  // Dynamically render the correct Icon based on placement (Corner vs Center)
  const getIcon = (type, isCorner = false) => {
    const iconSize = isCorner ? 16 : 40;
    const stroke = isCorner ? 4 : 3;

    switch (type) {
      case "SKIP":
        return <Ban size={iconSize} strokeWidth={stroke} />;
      case "REVERSE":
        return <RotateCcw size={iconSize} strokeWidth={stroke} />;
      case "DRAW_2":
        return (
          <span className={isCorner ? "text-[12px] leading-none" : ""}>+2</span>
        );
      case "WILD":
        return <WildSymbol isCorner={isCorner} />;
      case "WILD_DRAW_4":
        return (
          <div className="flex flex-col items-center justify-center leading-none">
            <WildSymbol isCorner={isCorner} />
            <span className={isCorner ? "text-[10px] mt-0.5" : "text-2xl mt-1"}>
              +4
            </span>
          </div>
        );
      case "FLIP":
        return <ArrowLeftRight size={iconSize} strokeWidth={stroke} />;
      case "SKIP_EVERYONE":
        return (
          <Ban
            size={iconSize}
            strokeWidth={stroke + 1}
            className={isCorner ? "" : "text-black/50"}
          />
        );
      case "DISCARD_ALL":
        return <Trash2 size={iconSize} strokeWidth={stroke} />;
      case "WILD_DRAW_6":
        return (
          <span className={isCorner ? "text-[12px] leading-none" : ""}>+6</span>
        );
      case "WILD_DRAW_10":
        return (
          <span className={isCorner ? "text-[12px] leading-none" : ""}>
            +10
          </span>
        );
      default:
        return type;
    }
  };

  const CardFace = ({ data, isBack = false }) => (
    <div
      className={`absolute w-full h-full rounded-xl flex flex-col items-center justify-center shadow-[0_4px_0_rgba(0,0,0,0.2)] backface-hidden border-4 border-[#FFF8E1] ${getColorStyle(data.color)} ${isBack ? "rotate-y-180" : ""}`}
    >
      {/* Texture Overlay */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(black 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      ></div>

      {/* Top Left Corner */}
      <div className="absolute top-1 left-1.5 font-black flex items-center justify-center h-6">
        {data.type === "NUMBER" ? (
          <span className="text-sm">{data.value}</span>
        ) : (
          getIcon(data.type, true)
        )}
      </div>

      {/* Center Graphic */}
      <div className="relative w-16 h-24 flex items-center justify-center">
        {/* Tilted Ellipse */}
        <div className="absolute w-full h-full bg-white/20 rounded-[50%] transform -rotate-12 shadow-inner border border-white/30 pointer-events-none"></div>
        <div
          className="z-10 flex items-center justify-center font-black text-5xl drop-shadow-md"
          style={{
            WebkitTextStroke:
              data.color === "yellow" ? "1px #3E2723" : "1px rgba(0,0,0,0.3)",
          }}
        >
          {data.type === "NUMBER" ? data.value : getIcon(data.type, false)}
        </div>
      </div>

      {/* Bottom Right Corner */}
      <div className="absolute bottom-1 right-1.5 font-black flex items-center justify-center h-6 rotate-180">
        {data.type === "NUMBER" ? (
          <span className="text-sm">{data.value}</span>
        ) : (
          getIcon(data.type, true)
        )}
      </div>
    </div>
  );

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`group w-24 h-36 perspective-1000 select-none ${isPlayable ? "cursor-pointer" : ""}`}
    >
      <div
        className={`w-full h-full relative transition-transform duration-500 transform-style-3d ${isDarkSide ? "rotate-y-180" : ""}`}
      >
        {/* Front */}
        <CardFace data={card} />
        {/* Back (For Flip Mode) */}
        {card.back && <CardFace data={card.back} isBack={true} />}
      </div>
    </div>
  );
};

export default Card;
