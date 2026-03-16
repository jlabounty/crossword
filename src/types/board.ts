import type { BonusType } from './bonus';
import type { Tile } from './tile';

export interface Position {
  row: number;
  col: number;
}

export interface Cell {
  position: Position;
  bonus: BonusType;
  tile: Tile | null;        // committed tile (from a previous turn)
  pendingTile: Tile | null; // tile placed this turn, not yet committed
  bonusConsumed: boolean;   // bonus only applies when tile is first placed
}

export type Board = Cell[][];

export type Direction = 'horizontal' | 'vertical';
