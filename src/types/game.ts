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
