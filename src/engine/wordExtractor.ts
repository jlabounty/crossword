import type { Board, PendingPlacement, Tile } from '@/types';
import { detectDirection } from './placement';

interface WordSegment {
  word: string;
  tiles: Array<{ tile: Tile; row: number; col: number; isNew: boolean }>;
}

export function extractWords(
  board: Board,
  pendingPlacements: PendingPlacement[]
): WordSegment[] {
  const rows = board.length;
  const cols = board[0].length;
  const direction = detectDirection(pendingPlacements);
  const words: WordSegment[] = [];

  const getEffectiveTile = (r: number, c: number): { tile: Tile; isNew: boolean } | null => {
    const pending = pendingPlacements.find(p => p.position.row === r && p.position.col === c);
    if (pending) return { tile: pending.tile, isNew: true };
    const cell = board[r]?.[c];
    if (cell?.tile) return { tile: cell.tile, isNew: false };
    return null;
  };

  // Extract primary word
  const primaryWord = extractLine(pendingPlacements, direction, rows, cols, getEffectiveTile);
  if (primaryWord && primaryWord.word.length >= 2) words.push(primaryWord);

  // Extract cross-words for each new tile
  const crossDir = direction === 'horizontal' ? 'vertical' : 'horizontal';
  for (const { position } of pendingPlacements) {
    const cross = extractLineAt(position.row, position.col, crossDir, rows, cols, getEffectiveTile);
    if (cross && cross.word.length >= 2) words.push(cross);
  }

  return words;
}

function extractLine(
  placements: PendingPlacement[],
  direction: 'horizontal' | 'vertical',
  rows: number,
  cols: number,
  getEffectiveTile: (r: number, c: number) => { tile: Tile; isNew: boolean } | null
): WordSegment | null {
  const positions = placements.map(p => p.position);
  let startRow: number, startCol: number;

  if (direction === 'horizontal') {
    startRow = positions[0].row;
    startCol = Math.min(...positions.map(p => p.col));
    // Extend left
    while (startCol > 0 && getEffectiveTile(startRow, startCol - 1)) startCol--;
    return extractFrom(startRow, startCol, direction, rows, cols, getEffectiveTile);
  } else {
    startCol = positions[0].col;
    startRow = Math.min(...positions.map(p => p.row));
    while (startRow > 0 && getEffectiveTile(startRow - 1, startCol)) startRow--;
    return extractFrom(startRow, startCol, direction, rows, cols, getEffectiveTile);
  }
}

function extractLineAt(
  row: number,
  col: number,
  direction: 'horizontal' | 'vertical',
  rows: number,
  cols: number,
  getEffectiveTile: (r: number, c: number) => { tile: Tile; isNew: boolean } | null
): WordSegment | null {
  let startRow = row;
  let startCol = col;

  if (direction === 'horizontal') {
    while (startCol > 0 && getEffectiveTile(row, startCol - 1)) startCol--;
  } else {
    while (startRow > 0 && getEffectiveTile(startRow - 1, col)) startRow--;
  }

  return extractFrom(startRow, startCol, direction, rows, cols, getEffectiveTile);
}

function extractFrom(
  startRow: number,
  startCol: number,
  direction: 'horizontal' | 'vertical',
  rows: number,
  cols: number,
  getEffectiveTile: (r: number, c: number) => { tile: Tile; isNew: boolean } | null
): WordSegment | null {
  const tiles: WordSegment['tiles'] = [];
  let r = startRow;
  let c = startCol;

  while (r < rows && c < cols) {
    const entry = getEffectiveTile(r, c);
    if (!entry) break;
    const letter = entry.tile.isBlank ? (entry.tile.playedAs ?? '_') : entry.tile.letter;
    tiles.push({ tile: entry.tile, row: r, col: c, isNew: entry.isNew });
    tiles[tiles.length - 1]; // just using as is
    if (direction === 'horizontal') c++;
    else r++;
    void letter;
  }

  if (tiles.length < 2) return null;

  const word = tiles
    .map(t => (t.tile.isBlank ? (t.tile.playedAs ?? '?') : t.tile.letter))
    .join('');

  return { word, tiles };
}

export type { WordSegment };
