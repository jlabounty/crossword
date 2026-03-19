import type { GameConfig } from '@/types';

export const DEFAULT_CONFIG: GameConfig = {
  rows: 15,
  cols: 15,
  rackSize: 7,
  bingoBonus: 50,
  difficulty: 'medium',
  boardSeed: Math.floor(Math.random() * 0xffffffff),
  randomBonuses: false,
  streakBonus: true,
  powerUpTiles: true,
};

/** Flat bonus added to the score for each turn at the given streak level. */
export function streakBonusAmount(streak: number): number {
  if (streak >= 7) return 15;
  if (streak >= 5) return 10;
  if (streak >= 3) return 5;
  return 0;
}
