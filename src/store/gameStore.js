// src/store/gameStore.js
import { create } from "zustand";
import { getDeck } from "../game/deck";
import { VARIANTS, TYPES, COLORS } from "../game/constants";

const useGameStore = create((set, get) => ({
  // ------------------------------------------------------
  // 1. GAME STATE
  // ------------------------------------------------------
  gameState: "LOBBY",
  variant: VARIANTS.CLASSIC,
  rules: {
    stacking: true,
    sevenZero: false,
    jumpIn: false,
  },

  deck: [],
  discardPile: [],
  players: [],

  // --- ANIMATION STATE ---
  animations: [],

  currentPlayerIndex: 0,
  direction: 1, // 1 = Clockwise, -1 = Counter-Clockwise
  activeColor: null,
  accumulatedPenalty: 0,
  isDarkSide: false,
  winner: null,

  // Who am I in this device?
  myPlayerIndex: 0,
  setMyPlayerIndex: (idx) => set({ myPlayerIndex: idx }),

  // ------------------------------------------------------
  // 2. ACTIONS
  // ------------------------------------------------------

  // CRITICAL: Synchronizes the exact game state from Host to Joiners
  syncState: (payload) => {
    set({ ...payload });
  },

  // --- ANIMATION TRIGGER ---
  // --- ANIMATION TRIGGER ---
  triggerAnimation: (type, card, playerIndex) => {
    const animId = Math.random().toString();

    // We store the actual playerIndex now instead of a broken 'isMe' calculation
    set((state) => ({
      animations: [
        ...state.animations,
        { id: animId, type, card, playerIndex },
      ],
    }));

    setTimeout(() => {
      set((state) => ({
        animations: state.animations.filter((a) => a.id !== animId),
      }));
    }, 600);
  },

  startGame: (variant, players, rules) => {
    const deck = getDeck(variant);

    // Deal 7 cards to each player and add UNO tracking
    players.forEach((p) => {
      p.hand = deck.splice(0, 7);
      p.unoCalled = false; // Add safety tracker
    });

    const firstCard = deck.shift();

    set({
      gameState: "PLAYING",
      variant,
      rules: rules || get().rules, // Save custom house rules
      deck,
      discardPile: [firstCard],
      players,
      animations: [], // Reset animations
      currentPlayerIndex: 0,
      direction: 1,
      activeColor:
        firstCard.color === COLORS.BLACK ? COLORS.RED : firstCard.color,
      accumulatedPenalty: 0,
      isDarkSide: false,
      winner: null,
    });
  },

  // --- THE UNO BUTTON LOGIC ---
  pressUno: (callerId) => {
    const { players, deck } = get();
    let newPlayers = [...players];
    let currentDeck = [...deck];
    let caughtSomeone = false;

    // 1. Can we catch anyone?
    newPlayers.forEach((p, idx) => {
      // If they have 1 card, are NOT the caller, and forgot to call UNO
      if (p.id !== callerId && p.hand.length === 1 && !p.unoCalled) {
        // Draw 2 penalty cards!
        const penaltyCards = currentDeck.splice(0, 2);
        p.hand = [...p.hand, ...penaltyCards];
        p.unoCalled = false;
        caughtSomeone = true;

        // Animate the penalty cards flying to them
        penaltyCards.forEach((c, i) => {
          setTimeout(() => get().triggerAnimation("draw", c, idx), i * 150);
        });
      }
    });

    // 2. If no one was caught, try to make the caller "Safe"
    if (!caughtSomeone) {
      const callerIndex = newPlayers.findIndex((p) => p.id === callerId);
      if (callerIndex !== -1 && newPlayers[callerIndex].hand.length <= 2) {
        newPlayers[callerIndex].unoCalled = true;
      }
    }

    set({ players: newPlayers, deck: currentDeck });
  },

  // Update the function signature to accept chosenColor
  playCard: (playerIndex, cardIndex, chosenColor = null) => {
    const state = get();
    const {
      players,
      currentPlayerIndex,
      discardPile,
      rules,
      activeColor,
      accumulatedPenalty,
      isDarkSide,
    } = state;

    const player = players[playerIndex];
    const card = player.hand[cardIndex];

    const currentCard = isDarkSide && card.back ? card.back : card;
    const topCardRaw = discardPile[discardPile.length - 1];
    const topCard =
      isDarkSide && topCardRaw.back ? topCardRaw.back : topCardRaw;

    // --- 1. JUMP-IN CHECK ---
    const isMyTurn = currentPlayerIndex === playerIndex;
    let isJumpIn = false;

    if (!isMyTurn && rules.jumpIn) {
      if (
        currentCard.color !== COLORS.BLACK &&
        currentCard.color === topCard.color
      ) {
        if (currentCard.value !== null && currentCard.value === topCard.value)
          isJumpIn = true;
        if (
          currentCard.type !== TYPES.NUMBER &&
          currentCard.type === topCard.type
        )
          isJumpIn = true;
      }
    }

    if (!isMyTurn && !isJumpIn) return false;

    // --- 2. STANDARD VALIDATION ---
    let isValid = false;

    if (accumulatedPenalty > 0) {
      if (rules.stacking && currentCard.type === topCard.type) isValid = true;
      else return false;
    } else {
      if (currentCard.color === COLORS.BLACK) isValid = true;
      else if (currentCard.color === activeColor) isValid = true;
      else if (
        currentCard.value !== null &&
        currentCard.value === topCard.value
      )
        isValid = true;
      else if (
        currentCard.type !== TYPES.NUMBER &&
        currentCard.type === topCard.type
      )
        isValid = true;
    }

    if (!isValid) return false;

    // --- TRIGGER PLAY ANIMATION ---
    get().triggerAnimation("play", currentCard, playerIndex);

    // --- 3. EXECUTE MOVE ---
    const newHand = player.hand.filter((_, i) => i !== cardIndex);
    let newPlayers = [...players];
    newPlayers[playerIndex] = { ...player, hand: newHand };

    if (newHand.length > 1) {
      newPlayers[playerIndex].unoCalled = false;
    }

    const newDiscard = [...discardPile, card];

    if (newHand.length === 0) {
      set({
        winner: player.name,
        gameState: "GAME_OVER",
        players: newPlayers,
        discardPile: newDiscard,
      });
      return true;
    }

    if (isJumpIn) set({ currentPlayerIndex: playerIndex });

    // SET THE CHOSEN COLOR HERE
    set({
      players: newPlayers,
      discardPile: newDiscard,
      activeColor:
        chosenColor ||
        (currentCard.color === COLORS.BLACK ? COLORS.RED : currentCard.color),
    });

    get().applyCardEffect(currentCard, playerIndex);
    return true;
  },

  applyCardEffect: (cardData, playedByIndex) => {
    let nextTurnSkip = 0;
    const { rules, direction, players } = get();

    // 7-0 Rule Handling
    if (rules.sevenZero && cardData.type === TYPES.NUMBER) {
      if (cardData.value === 0) {
        // 0: Rotate all hands in the direction of play
        let newPlayers = [...get().players];
        const hands = newPlayers.map((p) => p.hand);
        const unoStatuses = newPlayers.map((p) => p.unoCalled); // Swap safety states too!

        newPlayers.forEach((p, idx) => {
          // If direction is 1 (Clockwise), P1 gets P0's hand, P2 gets P1's hand
          let fromIdx = (idx - direction + players.length) % players.length;
          p.hand = hands[fromIdx];
          p.unoCalled = unoStatuses[fromIdx];
        });
        set({ players: newPlayers });
      } else if (cardData.value === 7) {
        // 7: Swap with the next player
        let newPlayers = [...get().players];
        const nextIdx =
          (playedByIndex + direction + players.length) % players.length;

        const tempHand = [...newPlayers[playedByIndex].hand];
        const tempUno = newPlayers[playedByIndex].unoCalled;

        newPlayers[playedByIndex].hand = [...newPlayers[nextIdx].hand];
        newPlayers[playedByIndex].unoCalled = newPlayers[nextIdx].unoCalled;

        newPlayers[nextIdx].hand = tempHand;
        newPlayers[nextIdx].unoCalled = tempUno;

        set({ players: newPlayers });
      }
    }

    // Standard Actions
    switch (cardData.type) {
      case TYPES.REVERSE:
        set((state) => ({ direction: state.direction * -1 }));
        if (get().players.length === 2) nextTurnSkip = 1; // Reverse = Skip in 2-player
        break;

      case TYPES.SKIP:
      case TYPES.SKIP_EVERYONE: // No Mercy
        nextTurnSkip = 1;
        break;

      case TYPES.DRAW_2:
        set((state) => ({ accumulatedPenalty: state.accumulatedPenalty + 2 }));
        break;

      case TYPES.WILD_DRAW_4:
        set((state) => ({ accumulatedPenalty: state.accumulatedPenalty + 4 }));
        break;

      case TYPES.FLIP:
        set((state) => ({ isDarkSide: !state.isDarkSide }));
        break;
    }

    get().advanceTurn(nextTurnSkip);
  },

  drawCard: (playerId) => {
    const { deck, players, currentPlayerIndex, accumulatedPenalty } = get();

    // Find who clicked
    const pIndex = players.findIndex((p) => p.id === playerId);

    // Security check: only current player can draw, unless stacking is active but not allowed
    if (pIndex !== currentPlayerIndex) return;

    let cardsToDraw = accumulatedPenalty > 0 ? accumulatedPenalty : 1;
    let currentDeck = [...deck];
    let drawnCards = [];

    // Draw logic
    for (let i = 0; i < cardsToDraw; i++) {
      if (currentDeck.length === 0) break; // Needs reshuffle logic in a full app
      drawnCards.push(currentDeck.shift());
    }

    // --- TRIGGER STAGGERED DRAW ANIMATIONS ---
    drawnCards.forEach((c, idx) => {
      setTimeout(() => {
        get().triggerAnimation("draw", c, pIndex);
      }, idx * 100); // 100ms delay between cards flying
    });

    const newPlayers = [...players];
    newPlayers[currentPlayerIndex].hand = [
      ...newPlayers[currentPlayerIndex].hand,
      ...drawnCards,
    ];
    newPlayers[currentPlayerIndex].unoCalled = false; // Reset safety if you draw

    set({
      deck: currentDeck,
      players: newPlayers,
      accumulatedPenalty: 0, // Reset penalty
    });

    // End turn after drawing
    get().advanceTurn();
  },

  advanceTurn: (skipCount = 0) => {
    const { players, currentPlayerIndex, direction } = get();
    const len = players.length;

    let steps = 1 + skipCount;
    let nextIndex = currentPlayerIndex + steps * direction;

    // Modulo math for safe array wrapping (handles negatives)
    nextIndex = ((nextIndex % len) + len) % len;

    set({ currentPlayerIndex: nextIndex });
  },
}));

export default useGameStore;
