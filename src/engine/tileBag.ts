import { v4 as uuid } from 'uuid';
import { LETTER_DISTRIBUTION } from '@/constants/letterDistribution';
import { mulberry32, shuffle } from '@/utils/random';
import type { Tile } from '@/types';

export function initBag(seed: number): Tile[] {
  const tiles: Tile[] = [];
  for (const { letter, count, value } of LETTER_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      tiles.push({ id: uuid(), letter, value, isBlank: letter === '_' });
    }
  }
  return shuffle(tiles, mulberry32(seed));
}

export function drawTiles(bag: Tile[], count: number): { drawn: Tile[]; remaining: Tile[] } {
  const n = Math.min(count, bag.length);
  return {
    drawn: bag.slice(-n),
    remaining: bag.slice(0, bag.length - n),
  };
}

export function swapTiles(
  bag: Tile[],
  toReturn: Tile[],
  seed: number
): { drawn: Tile[]; remaining: Tile[] } {
  const newBag = shuffle([...bag, ...toReturn], mulberry32(seed));
  return drawTiles(newBag, toReturn.length);
}
