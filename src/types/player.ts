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
}
