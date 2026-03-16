import type { GameConfig } from '@/types';

export const DEFAULT_CONFIG: GameConfig = {
  rows: 15,
  cols: 15,
  rackSize: 7,
  bingoBonus: 50,
  difficulty: 'medium',
  boardSeed: Math.floor(Math.random() * 0xffffffff),
  randomBonuses: false,
};
