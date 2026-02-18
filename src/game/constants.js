// src/game/constants.js

export const VARIANTS = {
  CLASSIC: "CLASSIC",
  NO_MERCY: "NO_MERCY",
  FLIP: "FLIP",
};

export const COLORS = {
  // Classic / Light Side
  RED: "red",
  BLUE: "blue",
  GREEN: "green",
  YELLOW: "yellow",

  // Flip Dark Side
  TEAL: "teal",
  PINK: "pink",
  PURPLE: "purple",
  ORANGE: "orange",

  // Special
  BLACK: "black", // For Wild cards
};

export const TYPES = {
  NUMBER: "NUMBER",
  SKIP: "SKIP",
  REVERSE: "REVERSE",
  DRAW_2: "DRAW_2",
  WILD: "WILD",
  WILD_DRAW_4: "WILD_DRAW_4",

  // No Mercy Specials
  SKIP_EVERYONE: "SKIP_EVERYONE",
  DISCARD_ALL: "DISCARD_ALL",
  WILD_DRAW_6: "WILD_DRAW_6",
  WILD_DRAW_10: "WILD_DRAW_10",

  // Flip Specials
  FLIP: "FLIP",
  WILD_DRAW_2: "WILD_DRAW_2", // Dark side specific
  WILD_DRAW_COLOR: "WILD_DRAW_COLOR",
};
