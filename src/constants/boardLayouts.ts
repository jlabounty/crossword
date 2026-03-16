import type { BonusType } from '@/types';

// Standard 15x15 Scrabble bonus layout — null = no bonus
// prettier-ignore
export const STANDARD_15x15: BonusType[][] = [
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  ['TW', null, null, 'DL', null, null, null,'START',null, null, null, 'DL', null, null, 'TW'],
  [null, null, 'DL', null, null, null, 'DL', null, 'DL', null, null, null, 'DL', null, null],
  [null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'TL', null],
  [null, null, null, null, 'DW', null, null, null, null, null, 'DW', null, null, null, null],
  ['DL', null, null, 'DW', null, null, null, 'DL', null, null, null, 'DW', null, null, 'DL'],
  [null, null, 'DW', null, null, null, 'DL', null, 'DL', null, null, null, 'DW', null, null],
  [null, 'DW', null, null, null, 'TL', null, null, null, 'TL', null, null, null, 'DW', null],
  ['TW', null, null, 'DL', null, null, null, 'TW', null, null, null, 'DL', null, null, 'TW'],
];

export const BOARD_PRESETS = [
  { label: '15×15 (Standard)', rows: 15, cols: 15 },
  { label: '11×11 (Compact)', rows: 11, cols: 11 },
  { label: '20×20 (Big)', rows: 20, cols: 20 },
];
