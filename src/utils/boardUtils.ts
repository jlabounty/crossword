import type { Board, Cell, Position } from '@/types';

export function getCell(board: Board, pos: Position): Cell | null {
  return board[pos.row]?.[pos.col] ?? null;
}

export function isOccupied(cell: Cell): boolean {
  return cell.tile !== null || cell.pendingTile !== null;
}

export function centerPosition(rows: number, cols: number): Position {
  return { row: Math.floor(rows / 2), col: Math.floor(cols / 2) };
}

export function adjacentPositions(pos: Position, rows: number, cols: number): Position[] {
  const candidates: Position[] = [
    { row: pos.row - 1, col: pos.col },
    { row: pos.row + 1, col: pos.col },
    { row: pos.row, col: pos.col - 1 },
    { row: pos.row, col: pos.col + 1 },
  ];
  return candidates.filter(p => p.row >= 0 && p.row < rows && p.col >= 0 && p.col < cols);
}

export function posEq(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}
