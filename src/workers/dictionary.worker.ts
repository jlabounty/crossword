/**
 * Dictionary Web Worker
 *
 * Responsibilities:
 * 1. Load the ENABLE1 word list and build an in-memory Trie
 * 2. Validate words on behalf of the turn engine (VALIDATE message)
 * 3. Generate the best bot move using Gordon's algorithm (FIND_MOVES message)
 */

import type { Board, Tile, PendingPlacement, BotDifficulty } from '@/types';
import { scoreMove } from '@/engine/scoring';
import { extractWords } from '@/engine/wordExtractor';

// ─── Trie ────────────────────────────────────────────────────────────────────

interface TrieNode {
  c: Map<string, TrieNode>;
  w: boolean; // isWord
}

function makeNode(): TrieNode {
  return { c: new Map(), w: false };
}

function trieInsert(root: TrieNode, word: string) {
  let n = root;
  for (const ch of word) {
    if (!n.c.has(ch)) n.c.set(ch, makeNode());
    n = n.c.get(ch)!;
  }
  n.w = true;
}

function trieHas(root: TrieNode, word: string): boolean {
  let n: TrieNode | undefined = root;
  for (const ch of word) {
    n = n.c.get(ch);
    if (!n) return false;
  }
  return n.w;
}

function trieGetNode(root: TrieNode, prefix: string): TrieNode | null {
  let n: TrieNode | undefined = root;
  for (const ch of prefix) {
    n = n.c.get(ch);
    if (!n) return null;
  }
  return n;
}

// ─── State ───────────────────────────────────────────────────────────────────

let trie: TrieNode | null = null;
let dictReady = false;

function buildTrieFromText(text: string) {
  trie = makeNode();
  for (const line of text.split('\n')) {
    const w = line.trim();
    if (w.length >= 2) trieInsert(trie, w);
  }
  dictReady = true;
}

// ─── Cross-check computation ─────────────────────────────────────────────────
// For horizontal moves: for each empty cell, compute which letters produce valid
// VERTICAL cross-words when placed there.
// null means any letter is valid (no surrounding vertical tiles).

type CrossChecks = Array<Array<Set<string> | null>>;

function effectiveLetter(tile: Tile): string {
  return tile.isBlank ? (tile.playedAs ?? '?') : tile.letter;
}

function computeCrossChecksHorizontal(board: Board): CrossChecks {
  const rows = board.length;
  const cols = board[0].length;
  const result: CrossChecks = Array.from({ length: rows }, () =>
    Array(cols).fill(null)
  );
  if (!trie) return result;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].tile) continue; // occupied — no cross-check needed

      // Build prefix (tiles ABOVE)
      let prefix = '';
      for (let row = r - 1; row >= 0; row--) {
        const t = board[row][c].tile;
        if (!t) break;
        prefix = effectiveLetter(t) + prefix;
      }

      // Build suffix (tiles BELOW)
      let suffix = '';
      for (let row = r + 1; row < rows; row++) {
        const t = board[row][c].tile;
        if (!t) break;
        suffix += effectiveLetter(t);
      }

      if (prefix === '' && suffix === '') {
        result[r][c] = null; // any letter valid
      } else {
        const valid = new Set<string>();
        for (let i = 0; i < 26; i++) {
          const L = String.fromCharCode(65 + i); // A-Z
          if (trieHas(trie!, prefix + L + suffix)) valid.add(L);
        }
        result[r][c] = valid;
      }
    }
  }
  return result;
}

// ─── Board transposition for vertical moves ───────────────────────────────────

function transposeBoard(board: Board): Board {
  const rows = board.length;
  const cols = board[0].length;
  return Array.from({ length: cols }, (_, c) =>
    Array.from({ length: rows }, (_, r) => ({
      ...board[r][c],
      position: { row: c, col: r },
    }))
  );
}

// ─── Anchor detection ────────────────────────────────────────────────────────

function isAnchor(board: Board, r: number, c: number, isFirstMove: boolean): boolean {
  if (board[r][c].tile) return false; // must be empty

  if (isFirstMove) {
    const rows = board.length;
    const cols = board[0].length;
    return r === Math.floor(rows / 2) && c === Math.floor(cols / 2);
  }

  const rows = board.length;
  const cols = board[0].length;
  const neighbors = [
    [r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1],
  ];
  return neighbors.some(
    ([nr, nc]) =>
      nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].tile !== null
  );
}

// ─── Move recording ───────────────────────────────────────────────────────────

interface BotPlacement {
  r: number;
  c: number;
  tile: Tile; // includes playedAs for blanks
}

export interface BotMove {
  placements: PendingPlacement[];
  score: number;
  wordsFormed: string[];
}

function recordMove(
  rawPlacements: BotPlacement[],
  board: Board,
  rackSize: number,
  bingoBonus: number,
  moves: BotMove[],
  seen: Set<string>
) {
  if (rawPlacements.length === 0) return;

  const pendingPlacements: PendingPlacement[] = rawPlacements.map(p => ({
    tile: p.tile,
    position: { row: p.r, col: p.c },
  }));

  // Deduplication key: sorted positions + letters
  const key = [...rawPlacements]
    .sort((a, b) => a.r * 1000 + a.c - (b.r * 1000 + b.c))
    .map(p => `${p.r},${p.c}:${effectiveLetter(p.tile)}`)
    .join('|');
  if (seen.has(key)) return;
  seen.add(key);

  // Extract all formed words
  const wordSegments = extractWords(board, pendingPlacements);
  if (wordSegments.length === 0) return;

  // Validate all words against trie (skip if no dict loaded)
  if (trie) {
    for (const ws of wordSegments) {
      if (!trieHas(trie, ws.word)) return;
    }
  }

  const score = scoreMove(board, pendingPlacements, wordSegments, rackSize, bingoBonus);
  moves.push({
    placements: pendingPlacements,
    score,
    wordsFormed: wordSegments.map(ws => ws.word),
  });
}

// ─── Gordon's algorithm ────────────────────────────────────────────────────────

type MutableRack = { tiles: Tile[] };

function extendRight(
  r: number,
  c: number,
  node: TrieNode,
  rawPlacements: BotPlacement[],
  rack: MutableRack,
  board: Board,
  crossChecks: CrossChecks,
  rackSize: number,
  bingoBonus: number,
  moves: BotMove[],
  seen: Set<string>
) {
  const cols = board[0].length;

  if (c >= cols) {
    if (node.w && rawPlacements.length > 0) {
      recordMove(rawPlacements, board, rackSize, bingoBonus, moves, seen);
    }
    return;
  }

  const cell = board[r][c];

  if (cell.tile !== null) {
    // Existing tile — must pass through it
    const letter = effectiveLetter(cell.tile);
    const next = node.c.get(letter);
    if (next) {
      extendRight(r, c + 1, next, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);
    }
  } else {
    // Empty cell — optionally stop or place a tile
    if (node.w && rawPlacements.length > 0) {
      recordMove(rawPlacements, board, rackSize, bingoBonus, moves, seen);
    }

    const cc = crossChecks[r][c]; // null = any letter OK

    for (const [letter, next] of node.c) {
      if (cc !== null && !cc.has(letter)) continue;

      // Try a regular tile
      const tileIdx = rack.tiles.findIndex(t => !t.isBlank && t.letter === letter);
      if (tileIdx !== -1) {
        const [tile] = rack.tiles.splice(tileIdx, 1);
        rawPlacements.push({ r, c, tile });
        extendRight(r, c + 1, next, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);
        rawPlacements.pop();
        rack.tiles.splice(tileIdx, 0, tile);
      }

      // Try a blank tile as this letter
      const blankIdx = rack.tiles.findIndex(t => t.isBlank);
      if (blankIdx !== -1) {
        const [blank] = rack.tiles.splice(blankIdx, 1);
        const usedBlank: Tile = { ...blank, playedAs: letter as Tile['letter'] };
        rawPlacements.push({ r, c, tile: usedBlank });
        extendRight(r, c + 1, next, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);
        rawPlacements.pop();
        rack.tiles.splice(blankIdx, 0, blank);
      }
    }
  }
}

function leftPart(
  partial: string,
  r: number,
  anchorC: number,
  len: number,
  limit: number,
  node: TrieNode,
  rawPlacements: BotPlacement[],
  rack: MutableRack,
  board: Board,
  crossChecks: CrossChecks,
  rackSize: number,
  bingoBonus: number,
  moves: BotMove[],
  seen: Set<string>
) {
  // Try extending right from the anchor with the current left part
  extendRight(r, anchorC, node, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);

  if (limit === 0) return;

  // Extend the left part one more step to the left.
  // Iterate all 26 letters and check whether prepending each letter still forms
  // a valid trie prefix (letter + partial).  Using node.c here was wrong because
  // node is the forward node for `partial`, not the root-relative prefix node for
  // the new left part — so many valid prefixes (e.g. "QU") were silently skipped.
  const col = anchorC - len - 1;
  const cc  = crossChecks[r]?.[col] ?? null; // cross-check for this left-part cell
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i) as Tile['letter'];
    // Apply cross-check: if a perpendicular word is formed at this cell, the
    // letter must be in the allowed set.
    if (cc !== null && !cc.has(letter)) continue;
    const newPartial = letter + partial; // prepend — left part grows leftward
    const newNode = trieGetNode(trie!, newPartial);
    if (!newNode) continue;

    // Try regular tile
    const tileIdx = rack.tiles.findIndex(t => !t.isBlank && t.letter === letter);
    if (tileIdx !== -1) {
      const [tile] = rack.tiles.splice(tileIdx, 1);
      rawPlacements.unshift({ r, c: col, tile });
      leftPart(newPartial, r, anchorC, len + 1, limit - 1, newNode, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);
      rawPlacements.shift();
      rack.tiles.splice(tileIdx, 0, tile);
    }

    // Try blank
    const blankIdx = rack.tiles.findIndex(t => t.isBlank);
    if (blankIdx !== -1) {
      const [blank] = rack.tiles.splice(blankIdx, 1);
      const usedBlank: Tile = { ...blank, playedAs: letter };
      rawPlacements.unshift({ r, c: col, tile: usedBlank });
      leftPart(newPartial, r, anchorC, len + 1, limit - 1, newNode, rawPlacements, rack, board, crossChecks, rackSize, bingoBonus, moves, seen);
      rawPlacements.shift();
      rack.tiles.splice(blankIdx, 0, blank);
    }
  }
}

function generateHorizontalMoves(
  board: Board,
  rack: Tile[],
  isFirstMove: boolean,
  rackSize: number,
  bingoBonus: number,
  moves: BotMove[],
  seen: Set<string>
) {
  if (!trie) return;
  const rows = board.length;
  const cols = board[0].length;
  const crossChecks = computeCrossChecksHorizontal(board);
  const mutableRack: MutableRack = { tiles: [...rack] };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isAnchor(board, r, c, isFirstMove)) continue;

      if (c > 0 && board[r][c - 1].tile !== null) {
        // Existing tiles immediately to the left — build the left part from the board
        let startC = c - 1;
        while (startC > 0 && board[r][startC - 1].tile !== null) startC--;
        const leftPartStr = Array.from(
          { length: c - startC },
          (_, i) => effectiveLetter(board[r][startC + i].tile!)
        ).join('');
        const node = trieGetNode(trie, leftPartStr);
        if (node) {
          extendRight(r, c, node, [], mutableRack, board, crossChecks, rackSize, bingoBonus, moves, seen);
        }
      } else {
        // Empty cells to the left — generate left parts from rack
        let leftLimit = 0;
        for (let k = c - 1; k >= 0; k--) {
          if (board[r][k].tile !== null) break;
          leftLimit++;
          // Don't count past another anchor (prevents duplicate work)
          if (k > 0 && isAnchor(board, r, k, isFirstMove)) break;
        }
        leftPart('', r, c, 0, leftLimit, trie, [], mutableRack, board, crossChecks, rackSize, bingoBonus, moves, seen);
      }
    }
  }
}

// ─── Main bot function ────────────────────────────────────────────────────────

function findBestMove(
  board: Board,
  rack: Tile[],
  rackSize: number,
  bingoBonus: number,
  difficulty: BotDifficulty,
  isFirstMove: boolean
): BotMove | null {
  const moves: BotMove[] = [];
  const seen = new Set<string>();

  // Horizontal moves
  generateHorizontalMoves(board, rack, isFirstMove, rackSize, bingoBonus, moves, seen);

  // Vertical moves: transpose board, run horizontal algorithm, un-transpose
  const tBoard = transposeBoard(board);
  const vMoves: BotMove[] = [];
  const vSeen = new Set<string>();
  generateHorizontalMoves(tBoard, rack, isFirstMove, rackSize, bingoBonus, vMoves, vSeen);

  // Un-transpose placements (swap row/col)
  for (const m of vMoves) {
    moves.push({
      ...m,
      placements: m.placements.map(p => ({
        tile: p.tile,
        position: { row: p.position.col, col: p.position.row },
      })),
    });
  }

  if (moves.length === 0) return null;

  // Sort by score descending
  moves.sort((a, b) => b.score - a.score);

  switch (difficulty) {
    case 'easy': {
      // Random move from bottom 50%, capped at score ≤ 20; fall back to lowest if none qualify
      const pool = moves.filter(m => m.score <= 20);
      return pool.length > 0
        ? pool[Math.floor(Math.random() * pool.length)]
        : moves[moves.length - 1]; // moves sorted desc, so last = lowest-scoring
    }
    case 'medium': {
      // Weighted random from all moves (higher score = higher weight, but not always best)
      const totalScore = moves.reduce((s, m) => s + m.score, 0);
      let r = Math.random() * totalScore;
      for (const m of moves) {
        r -= m.score;
        if (r <= 0) return m;
      }
      return moves[0];
    }
    case 'hard':
    default:
      return moves[0]; // best move
  }
}

// ─── Message handler ──────────────────────────────────────────────────────────

interface InitMsg { type: 'INIT'; text: string }
interface ValidateMsg { type: 'VALIDATE'; id: number; words: string[] }
interface FindMovesMsg {
  type: 'FIND_MOVES';
  id: number;
  board: Board;
  rack: Tile[];
  rackSize: number;
  bingoBonus: number;
  difficulty: BotDifficulty;
  isFirstMove: boolean;
}

self.onmessage = (e: MessageEvent<InitMsg | ValidateMsg | FindMovesMsg>) => {
  const msg = e.data;

  if (msg.type === 'INIT') {
    // Word list text fetched on main thread and posted here to build the Trie.
    buildTrieFromText(msg.text);
    self.postMessage({ type: 'READY' });
    return;
  }

  if (msg.type === 'VALIDATE') {
    if (!dictReady || !trie) {
      self.postMessage({ type: 'VALIDATE_RESULT', id: msg.id, valid: true, invalidWords: [] });
      return;
    }
    const invalidWords = msg.words.filter(w => !trieHas(trie!, w.toUpperCase()));
    self.postMessage({
      type: 'VALIDATE_RESULT',
      id: msg.id,
      valid: invalidWords.length === 0,
      invalidWords,
    });
    return;
  }

  if (msg.type === 'FIND_MOVES') {
    const delay = msg.difficulty === 'easy' ? 800 : msg.difficulty === 'medium' ? 1200 : 500;
    setTimeout(() => {
      const move = findBestMove(
        msg.board,
        msg.rack,
        msg.rackSize,
        msg.bingoBonus,
        msg.difficulty,
        msg.isFirstMove,
      );
      self.postMessage({ type: 'MOVES_RESULT', id: msg.id, move });
    }, delay);
    return;
  }
};
