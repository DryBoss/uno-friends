// src/game/deck.js
import { v4 as uuidv4 } from "uuid";
import { COLORS, TYPES, VARIANTS } from "./constants";

/**
 * Helper to create a single card object
 */
const createCard = (color, type, value = null, back = null) => ({
  id: uuidv4(),
  color, // Current active color (Light side)
  type, // Current active action
  value, // Number (0-9) or null
  back, // Data for the "Dark Side" (Flip only)
  isFaceUp: false, // For animation states
});

/**
 * GENERATOR: Classic Uno
 * 108 Cards: 4 colors (0-9, Skip, Rev, +2) + Wilds
 */
const generateClassicDeck = () => {
  const deck = [];
  const mainColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];

  mainColors.forEach((color) => {
    // 1x Zero
    deck.push(createCard(color, TYPES.NUMBER, 0));

    // 2x (1-9, Skip, Reverse, Draw2)
    for (let i = 0; i < 2; i++) {
      for (let n = 1; n <= 9; n++) {
        deck.push(createCard(color, TYPES.NUMBER, n));
      }
      deck.push(createCard(color, TYPES.SKIP));
      deck.push(createCard(color, TYPES.REVERSE));
      deck.push(createCard(color, TYPES.DRAW_2));
    }
  });

  // Wild Cards (4x Wild, 4x Wild Draw 4)
  for (let i = 0; i < 4; i++) {
    deck.push(createCard(COLORS.BLACK, TYPES.WILD));
    deck.push(createCard(COLORS.BLACK, TYPES.WILD_DRAW_4));
  }

  return deck;
};

/**
 * GENERATOR: No Mercy
 * Classic Deck + Brutal Cards (Draw 6, Draw 10, Skip Everyone)
 */
const generateNoMercyDeck = () => {
  let deck = generateClassicDeck(); // Start with base cards

  const mainColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];

  // Add No Mercy Specials to colored cards
  mainColors.forEach((color) => {
    for (let i = 0; i < 2; i++) {
      deck.push(createCard(color, TYPES.SKIP_EVERYONE));
      deck.push(createCard(color, TYPES.DISCARD_ALL));
    }
  });

  // Add Brutal Wilds
  for (let i = 0; i < 4; i++) {
    deck.push(createCard(COLORS.BLACK, TYPES.WILD_DRAW_6));
    deck.push(createCard(COLORS.BLACK, TYPES.WILD_DRAW_10));
  }

  return deck;
};

/**
 * GENERATOR: Flip Uno
 * Double-sided cards. Light Side -> Dark Side mapping.
 */
const generateFlipDeck = () => {
  const deck = [];
  const lightColors = [COLORS.RED, COLORS.BLUE, COLORS.GREEN, COLORS.YELLOW];
  const darkColors = [COLORS.ORANGE, COLORS.TEAL, COLORS.PURPLE, COLORS.PINK];

  // We map Light colors to Dark colors by index
  lightColors.forEach((lColor, index) => {
    const dColor = darkColors[index];

    // Generate Number cards (1-9)
    for (let n = 1; n <= 9; n++) {
      // Create 2 copies of each number
      for (let k = 0; k < 2; k++) {
        deck.push(
          createCard(
            lColor,
            TYPES.NUMBER,
            n,
            // The Back Side: Dark Color with same Number
            { color: dColor, type: TYPES.NUMBER, value: n },
          ),
        );
      }
    }

    // Add "Flip" Cards (2 per color)
    for (let i = 0; i < 2; i++) {
      deck.push(
        createCard(lColor, TYPES.FLIP, null, {
          color: dColor,
          type: TYPES.FLIP,
          value: null,
        }),
      );
    }

    // Add Action Cards (Skip, Draw 1, Wild)
    // For simplicity, we map Light Skip -> Dark Skip Everyone
    for (let i = 0; i < 2; i++) {
      deck.push(
        createCard(lColor, TYPES.SKIP, null, {
          color: dColor,
          type: TYPES.SKIP_EVERYONE,
          value: null,
        }),
      );
    }
  });

  return deck;
};

// Fisher-Yates Shuffle Algorithm
const shuffle = (array) => {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
};

/**
 * MAIN EXPORT
 */
export const getDeck = (variant) => {
  switch (variant) {
    case VARIANTS.NO_MERCY:
      return shuffle(generateNoMercyDeck());
    case VARIANTS.FLIP:
      return shuffle(generateFlipDeck());
    case VARIANTS.CLASSIC:
    default:
      return shuffle(generateClassicDeck());
  }
};
