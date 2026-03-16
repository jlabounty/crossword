import type { Board, PendingPlacement, Position, ValidationResult } from '@/types';
import { centerPosition, adjacentPositions, getCell, posEq } from '@/utils/boardUtils';

export function validatePlacement(
  pendingPlacements: PendingPlacement[],
  board: Board,
  isFirstMove: boolean
): ValidationResult {
  if (pendingPlacements.length === 0) {
    return { valid: false, error: 'Place at least one tile.' };
  }

  const rows = board.length;
  const cols = board[0].length;
  const positions = pendingPlacements.map(p => p.position);

  // 1. All in same row or same column
  const allSameRow = positions.every(p => p.row === positions[0].row);
  const allSameCol = positions.every(p => p.col === positions[0].col);
  if (!allSameRow && !allSameCol) {
    return { valid: false, error: 'Tiles must be placed in a straight line.' };
  }

  // 2. No tile on occupied cell
  for (const { position } of pendingPlacements) {
    const cell = board[position.row][position.col];
    if (cell.tile !== null) {
      return { valid: false, error: 'A cell is already occupied.' };
    }
  }

  // 3. No gaps — every cell between first and last must be occupied (pending or existing)
  if (!hasNoGaps(positions, pendingPlacements, board, allSameRow)) {
    return { valid: false, error: 'Tiles must form a contiguous word (no gaps).' };
  }

  // 4. First move must cover center
  if (isFirstMove) {
    const center = centerPosition(rows, cols);
    const coversCenter = positions.some(p => posEq(p, center));
    if (!coversCenter) {
      return { valid: false, error: 'The first word must cover the center square.' };
    }
  } else {
    // 5. Must be adjacent to at least one existing committed tile
    const adjacent = positions.some(pos =>
      adjacentPositions(pos, rows, cols).some(adj => {
        const cell = getCell(board, adj);
        return cell?.tile !== null;
      })
    );
    if (!adjacent) {
      return { valid: false, error: 'Tiles must connect to an existing word.' };
    }
  }

  return { valid: true };
}

function hasNoGaps(
  positions: Position[],
  pendingPlacements: PendingPlacement[],
  board: Board,
  isHorizontal: boolean
): boolean {
  if (positions.length === 1) return true;

  if (isHorizontal) {
    const row = positions[0].row;
    const cols = positions.map(p => p.col).sort((a, b) => a - b);
    for (let c = cols[0]; c <= cols[cols.length - 1]; c++) {
      const cell = board[row][c];
      const isPending = pendingPlacements.some(p => p.position.row === row && p.position.col === c);
      if (!isPending && cell.tile === null) return false;
    }
  } else {
    const col = positions[0].col;
    const rows = positions.map(p => p.row).sort((a, b) => a - b);
    for (let r = rows[0]; r <= rows[rows.length - 1]; r++) {
      const cell = board[r][col];
      const isPending = pendingPlacements.some(p => p.position.row === r && p.position.col === col);
      if (!isPending && cell.tile === null) return false;
    }
  }
  return true;
}

export function detectDirection(
  placements: PendingPlacement[]
): 'horizontal' | 'vertical' {
  if (placements.length <= 1) return 'horizontal';
  return placements[0].position.row === placements[1].position.row ? 'horizontal' : 'vertical';
}
