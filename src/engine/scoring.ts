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
      const letterValue = tile.isBlank ? 0 : tile.value;
      const cell = board[row][col];
      const key = `${row},${col}`;
      const isNewPlacement = isNew && pendingSet.has(key);

      let lv = letterValue;

      if (isNewPlacement && !cell.bonusConsumed) {
        if (cell.bonus === 'DL') lv *= 2;
        if (cell.bonus === 'TL') lv *= 3;
        if (cell.bonus === 'DW' || cell.bonus === 'START') wordMultiplier *= 2;
        if (cell.bonus === 'TW') wordMultiplier *= 3;
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
