import type { Tile } from './tile';

export type PlayerType = 'human' | 'bot';
export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  type: PlayerType;
  difficulty: BotDifficulty | null;
  rack: Tile[];
  score: number;
  consecutiveScorelessTurns: number;
  /** Number of consecutive turns where this player scored > 0. Resets on pass/swap/0-score. */
  scoringStreak: number;
  /** Number of consecutive turns where word score strictly exceeded the previous turn's word score. */
  ascendingStreak: number;
  /** Raw word score from the last turn played (before streak bonuses). Used to evaluate ascending streak. */
  lastWordScore: number;
}
