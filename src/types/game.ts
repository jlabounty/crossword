import type { Board, Position } from './board';
import type { Tile } from './tile';
import type { Player, BotDifficulty } from './player';

export type GamePhase = 'setup' | 'playing' | 'gameOver';

export type TurnPhase =
  | 'placing'     // player is placing/recalling tiles
  | 'validating'  // async check in progress (future: dictionary)
  | 'animating'   // score animation, drawing tiles
  | 'botThinking'; // bot computing its move

export interface PendingPlacement {
  tile: Tile;
  position: Position;
}

export interface CommittedMove {
  playerId: string;
  placements: PendingPlacement[];
  wordsFormed: string[];
  score: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  invalidWords?: string[];
  wordsFormed?: string[];
  score?: number;
}

export interface GameConfig {
  rows: number;
  cols: number;
  rackSize: number;
  bingoBonus: number;
  difficulty: BotDifficulty;
  boardSeed: number;
  randomBonuses: boolean;
  /** Award +5/+10/+15 bonus pts after 3/5/7 consecutive scoring turns. */
  streakBonus: boolean;
  /** Randomly assign golden/cursed/volatile power-ups to ~15% of tiles. */
  powerUpTiles: boolean;
  /** Award an escalating bonus for each turn whose word score beats the previous turn's word score. */
  ascendingBonus: boolean;
}

export interface GameState {
  phase: GamePhase;
  turnPhase: TurnPhase;
  board: Board;
  players: Player[];
  currentPlayerIndex: number;
  tileBag: Tile[];
  pendingPlacements: PendingPlacement[];
  lastMove: CommittedMove | null;
  consecutiveScorelessTurns: number;
  config: GameConfig;
  turnNumber: number;
  swapSelection: string[]; // tile ids selected for swap
}
