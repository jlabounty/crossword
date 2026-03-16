import { STANDARD_15x15 } from '@/constants/boardLayouts';
import { mulberry32 } from '@/utils/random';
import type { Board, BonusType } from '@/types';

type BonusDef = { type: BonusType; density: number };

const BONUS_DEFS: BonusDef[] = [
  { type: 'TW', density: 0.044 },
  { type: 'DW', density: 0.049 },
  { type: 'TL', density: 0.053 },
  { type: 'DL', density: 0.089 },
];

function generateRandomBonusMap(rows: number, cols: number, seed: number): BonusType[][] {
  const rng = mulberry32(seed);
  const map: BonusType[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  // Place START in center
  const cr = Math.floor(rows / 2);
  const cc = Math.floor(cols / 2);
  map[cr][cc] = 'START';

  // Work on top-left quadrant, mirror to all four
  const qr = Math.floor(rows / 2);
  const qc = Math.floor(cols / 2);

  const used = new Set<string>();
  used.add(`${cr},${cc}`);

  for (const { type, density } of BONUS_DEFS) {
    const targetCount = Math.round(rows * cols * density * 0.25); // per quadrant
    let placed = 0;
    let attempts = 0;
    while (placed < targetCount && attempts < 1000) {
      attempts++;
      const r = Math.floor(rng() * qr);
      const c = Math.floor(rng() * qc);
      const key = `${r},${c}`;
      if (used.has(key)) continue;
      used.add(key);
      // Mirror to all 4 quadrants
      const positions = [
        [r, c],
        [r, cols - 1 - c],
        [rows - 1 - r, c],
        [rows - 1 - r, cols - 1 - c],
      ];
      for (const [pr, pc] of positions) {
        const mk = `${pr},${pc}`;
        if (!used.has(mk)) {
          map[pr][pc] = type;
          used.add(mk);
        }
      }
      placed++;
    }
  }
  return map;
}

// Fixed seed used when randomBonuses=false for non-15×15 sizes — gives a
// consistent "house" layout for that dimension every game.
const FIXED_LAYOUT_SEED = 0xdeadbeef;

export function createBoard(rows: number, cols: number, seed: number, randomBonuses = false): Board {
  if (!Number.isInteger(rows) || !Number.isInteger(cols) ||
      rows < 5 || rows > 40 || cols < 5 || cols > 40) {
    throw new RangeError(`Invalid board dimensions: ${rows}×${cols}`);
  }
  let bonusMap: BonusType[][];

  if (!randomBonuses && rows === 15 && cols === 15) {
    bonusMap = STANDARD_15x15;
  } else if (!randomBonuses) {
    bonusMap = generateRandomBonusMap(rows, cols, FIXED_LAYOUT_SEED);
  } else {
    bonusMap = generateRandomBonusMap(rows, cols, seed);
  }

  return Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => ({
      position: { row, col },
      bonus: bonusMap[row]?.[col] ?? null,
      tile: null,
      pendingTile: null,
      bonusConsumed: false,
    }))
  );
}
