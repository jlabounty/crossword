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
  ascendingBonus: true,
};

/** Flat bonus added to the score for each consecutive-scoring-turn streak level. */
export function streakBonusAmount(streak: number): number {
  if (streak >= 7) return 15;
  if (streak >= 5) return 10;
  if (streak >= 3) return 5;
  return 0;
}

/**
 * Bonus added for each turn whose raw word score strictly exceeds the previous turn's.
 * Kicks in at streak ≥ 2 (i.e. two consecutive ascending turns).
 */
export function ascendingBonusAmount(streak: number): number {
  if (streak >= 5) return 15;
  if (streak >= 4) return 10;
  if (streak >= 3) return 6;
  if (streak >= 2) return 3;
  return 0;
}
