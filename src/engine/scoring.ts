import type { Board, PendingPlacement } from '@/types';
import type { WordSegment } from './wordExtractor';

export function scoreMove(
  board: Board,
  pendingPlacements: PendingPlacement[],
  words: WordSegment[],
  rackSize: number,
  bingoBonus: number
): number {
  const pendingSet = new Set(
    pendingPlacements.map(p => `${p.position.row},${p.position.col}`)
  );

  let total = 0;

  for (const { tiles } of words) {
    let wordScore = 0;
    let wordMultiplier = 1;

    for (const { tile, row, col, isNew } of tiles) {
      const baseValue = tile.isBlank ? 0 : tile.value;
      const cell = board[row][col];
      const key = `${row},${col}`;
      const isNewPlacement = isNew && pendingSet.has(key);

      // ── Tile power-up effects ────────────────────────────────────────────────
      // volatile on an EXISTING board tile contributes nothing to crossing words
      if (tile.powerUp === 'volatile' && !isNewPlacement) {
        continue; // skip this tile entirely for this word
      }

      let lv = baseValue;
      if (tile.powerUp === 'golden') lv *= 2;
      else if (tile.powerUp === 'cursed') lv = -lv;
      // volatile when newly placed: letter value is normal, but word gets ×2 below

      // ── Board bonus squares (apply only when newly placed on unconsumed cell) ─
      if (isNewPlacement && !cell.bonusConsumed) {
        if (cell.bonus === 'DL') lv *= 2;
        if (cell.bonus === 'TL') lv *= 3;
        if (cell.bonus === 'DW' || cell.bonus === 'START') wordMultiplier *= 2;
        if (cell.bonus === 'TW') wordMultiplier *= 3;
      }

      // Volatile new placement: whole word ×2 (stacks with board bonuses)
      if (tile.powerUp === 'volatile' && isNewPlacement) {
        wordMultiplier *= 2;
      }

      wordScore += lv;
    }

    total += wordScore * wordMultiplier;
  }

  // Bingo bonus
  if (pendingPlacements.length === rackSize) {
    total += bingoBonus;
  }

  return total;
}
