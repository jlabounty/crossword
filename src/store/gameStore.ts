import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import type { GameState, GameConfig, Player, Position, Tile, PendingPlacement } from '@/types';
import { DEFAULT_CONFIG, streakBonusAmount, ascendingBonusAmount } from '@/constants/gameConfig';
import { createBoard } from '@/engine/boardGenerator';
import { initBag, drawTiles, swapTiles } from '@/engine/tileBag';
import { validatePlacement } from '@/engine/placement';
import { extractWords } from '@/engine/wordExtractor';
import { scoreMove } from '@/engine/scoring';
import { validateWords } from '@/engine/dictionary';

function makeInitialState(): GameState {
  return {
    phase: 'setup',
    turnPhase: 'placing',
    board: createBoard(DEFAULT_CONFIG.rows, DEFAULT_CONFIG.cols, DEFAULT_CONFIG.boardSeed, DEFAULT_CONFIG.randomBonuses),
    players: [],
    currentPlayerIndex: 0,
    tileBag: [],
    pendingPlacements: [],
    lastMove: null,
    consecutiveScorelessTurns: 0,
    config: DEFAULT_CONFIG,
    turnNumber: 0,
    swapSelection: [],
  };
}

interface GameActions {
  // Setup
  startGame: (config: GameConfig, players: Omit<Player, 'rack' | 'score' | 'consecutiveScorelessTurns' | 'scoringStreak' | 'ascendingStreak' | 'lastWordScore'>[]) => void;
  resetToSetup: () => void;
  loadGame: (snapshot: GameState) => void;

  // Placement
  placeTile: (tile: Tile, position: Position) => void;
  recallTile: (position: Position) => void;
  recallAll: () => void;

  // Turn actions
  playTurn: () => Promise<void>;
  passTurn: () => void;
  toggleSwapSelection: (tileId: string) => void;
  confirmSwap: () => void;

  // Blank tile
  assignBlank: (tileId: string, letter: Tile['playedAs']) => void;

  // Bot
  applyBotMove: (placements: PendingPlacement[], score: number, wordsFormed: string[]) => void;
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    immer((set, get) => ({
      ...makeInitialState(),

      startGame(config, playerDefs) {
        const seed = config.boardSeed ?? Math.floor(Math.random() * 0xffffffff);
        const newConfig = { ...config, boardSeed: seed };
        const board = createBoard(config.rows, config.cols, seed, config.randomBonuses ?? false);
        let bag = initBag(seed, config.powerUpTiles ?? true);

        const players: Player[] = playerDefs.map(def => {
          const { drawn, remaining } = drawTiles(bag, config.rackSize);
          bag = remaining;
          return {
            ...def,
            rack: drawn,
            score: 0,
            consecutiveScorelessTurns: 0,
            scoringStreak: 0,
            ascendingStreak: 0,
            lastWordScore: 0,
          };
        });

        set(state => {
          state.phase = 'playing';
          state.turnPhase = 'placing';
          state.board = board;
          state.players = players;
          state.currentPlayerIndex = 0;
          state.tileBag = bag;
          state.pendingPlacements = [];
          state.lastMove = null;
          state.consecutiveScorelessTurns = 0;
          state.config = newConfig;
          state.turnNumber = 1;
          state.swapSelection = [];
        });
      },

      resetToSetup() {
        set(makeInitialState());
      },

      placeTile(tile, position) {
        set(state => {
          // Remove from rack
          const player = state.players[state.currentPlayerIndex];
          const rackIdx = player.rack.findIndex(t => t.id === tile.id);
          if (rackIdx === -1) return;
          player.rack.splice(rackIdx, 1);

          // Place on board as pending
          state.board[position.row][position.col].pendingTile = tile;
          state.pendingPlacements.push({ tile, position });
        });
      },

      recallTile(position) {
        set(state => {
          const cell = state.board[position.row][position.col];
          if (!cell.pendingTile) return;
          const tile = cell.pendingTile;
          // Clear blank assignment on recall
          if (tile.isBlank) tile.playedAs = undefined;
          cell.pendingTile = null;
          state.players[state.currentPlayerIndex].rack.push(tile);
          state.pendingPlacements = state.pendingPlacements.filter(
            p => !(p.position.row === position.row && p.position.col === position.col)
          );
        });
      },

      recallAll() {
        set(state => {
          const player = state.players[state.currentPlayerIndex];
          for (const { tile, position } of state.pendingPlacements) {
            const t = { ...tile, playedAs: undefined };
            state.board[position.row][position.col].pendingTile = null;
            player.rack.push(t);
          }
          state.pendingPlacements = [];
        });
      },

      async playTurn() {
        const state = get();
        const { board, pendingPlacements, config, turnNumber } = state;
        const isFirstMove = turnNumber === 1;

        // Structural validation
        const structResult = validatePlacement(pendingPlacements, board, isFirstMove);
        if (!structResult.valid) {
          // UI layer handles displaying error via uiStore
          window.dispatchEvent(new CustomEvent('game:error', { detail: structResult.error }));
          return;
        }

        set(s => { s.turnPhase = 'validating'; });

        // Extract words
        const wordSegments = extractWords(board, pendingPlacements);
        const wordStrings = wordSegments.map(w => w.word);

        // Dictionary check (stub in Phase 1)
        const { valid, invalidWords } = await validateWords(wordStrings);
        if (!valid) {
          set(s => { s.turnPhase = 'placing'; });
          window.dispatchEvent(new CustomEvent('game:invalidWords', { detail: invalidWords }));
          return;
        }

        // Score
        const wordScore = scoreMove(board, pendingPlacements, wordSegments, config.rackSize, config.bingoBonus);

        set(state => {
          const player = state.players[state.currentPlayerIndex];
          const newStreak = wordScore > 0 ? player.scoringStreak + 1 : 0;
          const newAscStreak = (wordScore > 0 && wordScore > player.lastWordScore) ? player.ascendingStreak + 1 : 0;
          const bonus =
            ((state.config.streakBonus ?? true) ? streakBonusAmount(newStreak) : 0) +
            ((state.config.ascendingBonus ?? true) ? ascendingBonusAmount(newAscStreak) : 0);
          const score = wordScore + bonus;

          // Commit tiles
          for (const { tile, position } of state.pendingPlacements) {
            const cell = state.board[position.row][position.col];
            cell.tile = tile;
            cell.pendingTile = null;
            cell.bonusConsumed = true;
          }

          // Update score and streaks
          player.score += score;
          player.scoringStreak = newStreak;
          player.ascendingStreak = newAscStreak;
          player.lastWordScore = wordScore;
          player.consecutiveScorelessTurns = wordScore > 0 ? 0 : player.consecutiveScorelessTurns + 1;

          // Draw tiles
          const needed = config.rackSize - player.rack.length;
          if (needed > 0) {
            const { drawn, remaining } = drawTiles(state.tileBag, needed);
            player.rack.push(...drawn);
            state.tileBag = remaining;
          }

          // Record last move
          state.lastMove = {
            playerId: player.id,
            placements: [...state.pendingPlacements],
            wordsFormed: wordStrings,
            score,
          };

          state.pendingPlacements = [];
          state.consecutiveScorelessTurns = score > 0 ? 0 : state.consecutiveScorelessTurns + 1;
          state.turnPhase = 'placing';

          // Check game end
          const bagEmpty = state.tileBag.length === 0;
          const playerEmptiedRack = player.rack.length === 0;
          const maxScoreless = 2 * state.players.length;

          if ((bagEmpty && playerEmptiedRack) || state.consecutiveScorelessTurns >= maxScoreless) {
            state.phase = 'gameOver';
            finalizeScores(state);
          } else {
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            state.turnNumber += 1;
          }
        });
      },

      passTurn() {
        set(state => {
          // Recall any pending tiles first
          const player = state.players[state.currentPlayerIndex];
          for (const { tile, position } of state.pendingPlacements) {
            state.board[position.row][position.col].pendingTile = null;
            player.rack.push({ ...tile, playedAs: undefined });
          }
          state.pendingPlacements = [];

          player.scoringStreak = 0;
          player.ascendingStreak = 0;
          player.lastWordScore = 0;
          player.consecutiveScorelessTurns += 1;
          state.consecutiveScorelessTurns += 1;

          const maxScoreless = 2 * state.players.length;
          if (state.consecutiveScorelessTurns >= maxScoreless) {
            state.phase = 'gameOver';
            finalizeScores(state);
          } else {
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            state.turnNumber += 1;
          }
        });
      },

      toggleSwapSelection(tileId) {
        set(state => {
          const idx = state.swapSelection.indexOf(tileId);
          if (idx === -1) state.swapSelection.push(tileId);
          else state.swapSelection.splice(idx, 1);
        });
      },

      confirmSwap() {
        set(state => {
          if (state.tileBag.length < state.config.rackSize) return;
          const player = state.players[state.currentPlayerIndex];
          const toReturn = player.rack.filter(t => state.swapSelection.includes(t.id));
          if (toReturn.length === 0) return;

          const newSeed = Math.floor(Math.random() * 0xffffffff);
          const { drawn, remaining } = swapTiles(state.tileBag, toReturn, newSeed);
          player.rack = player.rack.filter(t => !state.swapSelection.includes(t.id));
          player.rack.push(...drawn);
          state.tileBag = remaining;
          state.swapSelection = [];

          player.scoringStreak = 0;
          player.ascendingStreak = 0;
          player.lastWordScore = 0;
          player.consecutiveScorelessTurns += 1;
          state.consecutiveScorelessTurns += 1;
          state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
          state.turnNumber += 1;
        });
      },

      assignBlank(tileId, letter) {
        set(state => {
          // Find in pending placements
          const p = state.pendingPlacements.find(p => p.tile.id === tileId);
          if (p) p.tile.playedAs = letter;
          // Also update on board
          for (const row of state.board) {
            for (const cell of row) {
              if (cell.pendingTile?.id === tileId) {
                cell.pendingTile.playedAs = letter;
              }
            }
          }
        });
      },

      applyBotMove(placements: PendingPlacement[], score: number, wordsFormed: string[]) {
        const { board, turnNumber } = get();
        const isFirstMove = turnNumber === 1 && board.every(row => row.every(c => c.tile === null));
        const structResult = validatePlacement(placements, board, isFirstMove);
        if (!structResult.valid) {
          // Bot generated a structurally invalid move — pass instead
          get().passTurn();
          return;
        }

        set(state => {
          const player = state.players[state.currentPlayerIndex];

          // Commit tiles
          for (const { tile, position } of placements) {
            const cell = state.board[position.row][position.col];
            cell.tile = tile;
            cell.pendingTile = null;
            cell.bonusConsumed = true;
            // Remove from rack
            const idx = player.rack.findIndex(t => t.id === tile.id);
            if (idx !== -1) player.rack.splice(idx, 1);
          }

          const newStreak = score > 0 ? player.scoringStreak + 1 : 0;
          const newAscStreak = (score > 0 && score > player.lastWordScore) ? player.ascendingStreak + 1 : 0;
          const bonus =
            ((state.config.streakBonus ?? true) ? streakBonusAmount(newStreak) : 0) +
            ((state.config.ascendingBonus ?? true) ? ascendingBonusAmount(newAscStreak) : 0);
          const totalScore = score + bonus;

          player.score += totalScore;
          player.scoringStreak = newStreak;
          player.ascendingStreak = newAscStreak;
          player.lastWordScore = score;
          player.consecutiveScorelessTurns = score > 0 ? 0 : player.consecutiveScorelessTurns + 1;

          // Draw tiles
          const needed = state.config.rackSize - player.rack.length;
          if (needed > 0) {
            const { drawn, remaining } = drawTiles(state.tileBag, needed);
            player.rack.push(...drawn);
            state.tileBag = remaining;
          }

          state.lastMove = {
            playerId: player.id,
            placements,
            wordsFormed,
            score: totalScore,
          };
          state.pendingPlacements = [];
          state.consecutiveScorelessTurns = score > 0 ? 0 : state.consecutiveScorelessTurns + 1;

          const bagEmpty = state.tileBag.length === 0;
          const playerEmptiedRack = player.rack.length === 0;
          const maxScoreless = 2 * state.players.length;

          if ((bagEmpty && playerEmptiedRack) || state.consecutiveScorelessTurns >= maxScoreless) {
            state.phase = 'gameOver';
            finalizeScores(state);
          } else {
            state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
            state.turnNumber += 1;
          }
        });
      },

      loadGame(snapshot: GameState) {
        set(state => {
          state.phase = snapshot.phase;
          state.turnPhase = snapshot.turnPhase === 'validating' ? 'placing' : snapshot.turnPhase;
          state.board = snapshot.board;
          state.players = snapshot.players.map(p => ({
            ...p,
            scoringStreak: p.scoringStreak ?? 0,
            ascendingStreak: p.ascendingStreak ?? 0,
            lastWordScore: p.lastWordScore ?? 0,
          }));
          state.currentPlayerIndex = snapshot.currentPlayerIndex;
          state.tileBag = snapshot.tileBag;
          state.pendingPlacements = snapshot.pendingPlacements ?? [];
          state.lastMove = snapshot.lastMove ?? null;
          state.consecutiveScorelessTurns = snapshot.consecutiveScorelessTurns ?? 0;
          state.config = snapshot.config;
          state.turnNumber = snapshot.turnNumber ?? 1;
          state.swapSelection = snapshot.swapSelection ?? [];
        });
      },
    })),
    {
      name: 'wordboard-game',
      partialize: (state) => ({
        phase: state.phase,
        turnPhase: state.turnPhase,
        board: state.board,
        players: state.players,
        currentPlayerIndex: state.currentPlayerIndex,
        tileBag: state.tileBag,
        pendingPlacements: state.pendingPlacements,
        lastMove: state.lastMove,
        consecutiveScorelessTurns: state.consecutiveScorelessTurns,
        config: state.config,
        turnNumber: state.turnNumber,
        swapSelection: state.swapSelection,
      }),
    }
  )
);

function finalizeScores(state: GameState) {
  // Each player loses remaining tile values; player who emptied rack gains others' values
  const remainingValues = state.players.map(p =>
    p.rack.reduce((sum, t) => sum + (t.isBlank ? 0 : t.value), 0)
  );
  const emptyPlayerIdx = state.players.findIndex(p => p.rack.length === 0);
  const total = remainingValues.reduce((a, b) => a + b, 0);

  state.players.forEach((p, i) => {
    if (i === emptyPlayerIdx) {
      p.score += total;
    } else {
      p.score -= remainingValues[i];
    }
  });
}

// UI store for selected tiles, modals, errors
interface UIState {
  selectedTileId: string | null;
  error: string | null;
  showSwapModal: boolean;
  blankTileId: string | null; // tile needing letter assignment
  setSelectedTile: (id: string | null) => void;
  setError: (msg: string | null) => void;
  setShowSwapModal: (v: boolean) => void;
  setBlankTileId: (id: string | null) => void;
}

export const useUIStore = create<UIState>()(set => ({
  selectedTileId: null,
  error: null,
  showSwapModal: false,
  blankTileId: null,
  setSelectedTile: (id) => set({ selectedTileId: id }),
  setError: (msg) => set({ error: msg }),
  setShowSwapModal: (v) => set({ showSwapModal: v }),
  setBlankTileId: (id) => set({ blankTileId: id }),
}));

// Suppress unused uuid import warning
void uuid;
