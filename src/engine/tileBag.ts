import { v4 as uuid } from 'uuid';
import { LETTER_DISTRIBUTION } from '@/constants/letterDistribution';
import { mulberry32, shuffle } from '@/utils/random';
import type { Tile, TilePowerUp } from '@/types';

const POWER_UPS: TilePowerUp[] = ['golden', 'cursed', 'volatile'];

// ~6% golden, ~5% cursed, ~4% volatile = ~15% total
const POWER_UP_THRESHOLDS = [0.06, 0.11, 0.15] as const;

/**
 * Assign power-ups using a seeded RNG so the same boardSeed always produces the
 * same tile bag (important for save/load reproducibility and bot fairness).
 * The RNG is XOR-shifted from the board seed to avoid correlation with the shuffle.
 */
function assignPowerUp(rng: () => number): TilePowerUp | undefined {
  const r = rng();
  if (r < POWER_UP_THRESHOLDS[0]) return POWER_UPS[0]; // golden
  if (r < POWER_UP_THRESHOLDS[1]) return POWER_UPS[1]; // cursed
  if (r < POWER_UP_THRESHOLDS[2]) return POWER_UPS[2]; // volatile
  return undefined;
}

export function initBag(seed: number, powerUpTiles = true): Tile[] {
  const powerUpRng = mulberry32((seed ^ 0xDEADBEEF) >>> 0);
  const tiles: Tile[] = [];

  for (const { letter, count, value } of LETTER_DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      const tile: Tile = { id: uuid(), letter, value, isBlank: letter === '_' };
      if (powerUpTiles && !tile.isBlank) {
        const pu = assignPowerUp(powerUpRng);
        if (pu) tile.powerUp = pu;
      }
      tiles.push(tile);
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
