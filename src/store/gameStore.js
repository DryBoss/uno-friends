// src/store/gameStore.js
import { create } from "zustand";
import { getDeck } from "../game/deck";
import { VARIANTS, TYPES, COLORS } from "../game/constants";

const useGameStore = create((set, get) => ({
  // ------------------------------------------------------
  // 1. GAME STATE (The "Truth")
  // ------------------------------------------------------
  gameState: "LOBBY", // LOBBY, PLAYING, GAME_OVER
  variant: VARIANTS.CLASSIC,

  deck: [],
  discardPile: [],
  players: [], // [{ id: 'p1', name: 'Host', hand: [] }, ...]

  currentPlayerIndex: 0,
  direction: 1, // 1 = Clockwise, -1 = Counter-Clockwise
  activeColor: null, // Tracks current color (important for Wilds)

  // Special Mechanics
  accumulatedPenalty: 0, // For stacking (+2, +4)
  isDarkSide: false, // For Flip Uno
  winner: null,

  // ------------------------------------------------------
  // 2. ACTIONS (Changing the State)
  // ------------------------------------------------------

  /**
   * START GAME
   * Called by Host when clicking "Start"
   */
  startGame: (variant, players) => {
    const deck = getDeck(variant);

    // Deal 7 cards to each player
    players.forEach((p) => {
      p.hand = deck.splice(0, 7);
    });

    // Flip first card
    const firstCard = deck.shift();
    const discardPile = [firstCard];

    set({
      gameState: "PLAYING",
      variant,
      deck,
      discardPile,
      players,
      currentPlayerIndex: 0,
      direction: 1,
      activeColor:
        firstCard.color === COLORS.BLACK ? COLORS.RED : firstCard.color, // Default Wild to Red
      accumulatedPenalty: 0,
      isDarkSide: false,
      winner: null,
    });
  },

  /**
   * PLAY CARD
   * Validates and executes a move.
   * NOTE: This is called after the Network confirms the move is valid.
   */
  playCard: (playerId, cardIndex) => {
    const {
      players,
      currentPlayerIndex,
      discardPile,
      direction,
      activeColor,
      accumulatedPenalty,
      isDarkSide,
    } = get();

    const player = players[currentPlayerIndex];

    // Security Check: Is it actually this player's turn?
    if (player.id !== playerId) return false;

    const card = player.hand[cardIndex];

    // If we are in Dark Side mode, we look at the BACK of the card
    const currentCard = isDarkSide ? card.back : card;
    const topCard = isDarkSide
      ? discardPile[discardPile.length - 1].back
      : discardPile[discardPile.length - 1];

    // --- VALIDATION LOGIC ---
    let isValid = false;

    // 1. Wilds are always valid
    if (currentCard.color === COLORS.BLACK) isValid = true;
    // 2. Color Match
    else if (currentCard.color === activeColor) isValid = true;
    // 3. Number/Symbol Match
    else if (currentCard.value !== null && currentCard.value === topCard.value)
      isValid = true;
    else if (currentCard.type === topCard.type) isValid = true;

    // 4. Stacking Check (If there is a penalty active)
    if (accumulatedPenalty > 0) {
      // Must play a +2 on a +2, or +4 on a +4
      // Simple rule: type must match exactly to stack
      if (currentCard.type !== topCard.type) isValid = false;
    }

    if (!isValid) return false;

    // --- EXECUTE MOVE ---

    // 1. Remove from hand
    const newHand = player.hand.filter((_, i) => i !== cardIndex);
    const newPlayers = [...players];
    newPlayers[currentPlayerIndex] = { ...player, hand: newHand };

    // 2. Add to discard
    const newDiscard = [...discardPile, card];

    // 3. Check Win Condition
    if (newHand.length === 0) {
      set({ winner: player.name, gameState: "GAME_OVER" });
      return true;
    }

    // 4. Update State
    set({
      players: newPlayers,
      discardPile: newDiscard,
      activeColor:
        currentCard.color === COLORS.BLACK ? activeColor : currentCard.color, // Keep old color if Wild (for now)
    });

    // 5. Apply Card Effects (Skip, Draw 2, etc.)
    get().applyCardEffect(currentCard);

    return true;
  },

  /**
   * APPLY EFFECT
   * Handles what the card actually DOES
   */
  applyCardEffect: (cardData) => {
    let nextTurnSkip = 0; // 0 = normal, 1 = skip next player

    switch (cardData.type) {
      case TYPES.REVERSE:
        set((state) => ({ direction: state.direction * -1 }));
        // In 2-player, Reverse acts like Skip
        if (get().players.length === 2) nextTurnSkip = 1;
        break;

      case TYPES.SKIP:
        nextTurnSkip = 1;
        break;

      case TYPES.DRAW_2:
        set((state) => ({ accumulatedPenalty: state.accumulatedPenalty + 2 }));
        // If we don't support stacking, we would apply penalty immediately here
        break;

      case TYPES.WILD_DRAW_4:
        set((state) => ({ accumulatedPenalty: state.accumulatedPenalty + 4 }));
        break;

      case TYPES.FLIP:
        set((state) => ({ isDarkSide: !state.isDarkSide }));
        // When flipping, the active color might change physically,
        // but for logic we often keep the same "slot" color (e.g. Red flips to Orange)
        break;
    }

    get().advanceTurn(nextTurnSkip);
  },

  /**
   * DRAW CARD
   * Called when player clicks Deck or cannot play
   */
  drawCard: (playerId) => {
    const { deck, players, currentPlayerIndex, accumulatedPenalty } = get();

    // Security: Only current player can draw
    if (players[currentPlayerIndex].id !== playerId) return;

    let cardsToDraw = accumulatedPenalty > 0 ? accumulatedPenalty : 1;
    let currentDeck = [...deck];
    let drawnCards = [];

    // Draw X cards
    for (let i = 0; i < cardsToDraw; i++) {
      if (currentDeck.length === 0) {
        // Reshuffle discard if empty (implement later)
        break;
      }
      drawnCards.push(currentDeck.shift());
    }

    // Add to player hand
    const newPlayers = [...players];
    newPlayers[currentPlayerIndex].hand = [
      ...newPlayers[currentPlayerIndex].hand,
      ...drawnCards,
    ];

    set({
      deck: currentDeck,
      players: newPlayers,
      accumulatedPenalty: 0, // Reset penalty after drawing
    });

    // End turn
    get().advanceTurn();
  },

  /**
   * ADVANCE TURN
   * Calculates who goes next based on direction
   */
  advanceTurn: (skipCount = 0) => {
    const { players, currentPlayerIndex, direction } = get();
    const len = players.length;

    // Logic: Current + (Direction * (1 + skips))
    let steps = 1 + skipCount;
    let nextIndex = currentPlayerIndex + steps * direction;

    // Handle wrapping (Standard Modulo bug fix for negatives)
    nextIndex = ((nextIndex % len) + len) % len;

    set({ currentPlayerIndex: nextIndex });
  },
}));

export default useGameStore;
