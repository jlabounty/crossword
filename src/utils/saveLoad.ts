import type { GameState } from '@/types';

const SAVE_VERSION = 1;

interface SaveFile {
  version: number;
  savedAt: string;
  state: ReturnType<typeof pickState>;
}

function pickState(s: GameState) {
  return {
    phase: s.phase,
    turnPhase: s.turnPhase,
    board: s.board,
    players: s.players,
    currentPlayerIndex: s.currentPlayerIndex,
    tileBag: s.tileBag,
    pendingPlacements: s.pendingPlacements,
    lastMove: s.lastMove,
    consecutiveScorelessTurns: s.consecutiveScorelessTurns,
    config: s.config,
    turnNumber: s.turnNumber,
    swapSelection: s.swapSelection,
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_PHASES   = new Set<string>(['setup', 'playing', 'gameOver']);
const VALID_TURN_PHASES = new Set<string>(['placing', 'validating', 'animating', 'botThinking']);
const VALID_BONUSES    = new Set<string | null>(['DL', 'TL', 'DW', 'TW', 'START', null]);
const VALID_POWER_UPS  = new Set<string>(['golden', 'cursed', 'volatile']);
const VALID_LETTERS  = new Set<string>('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));

const MAX_PLAYERS    = 4;
const MAX_NAME_LEN   = 40;
const MAX_RACK_SIZE  = 20;
const MAX_TILE_BAG   = 500;
const MAX_BOARD_DIM  = 40;
const MIN_BOARD_DIM  = 5;

function err(msg: string): never {
  throw new Error(`Invalid save file — ${msg}`);
}

function isInt(v: unknown, min: number, max: number): v is number {
  return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max;
}

function validateTile(t: unknown, idx: string): void {
  if (!t || typeof t !== 'object') err(`tile ${idx} is not an object`);
  const tile = t as Record<string, unknown>;
  if (typeof tile.id !== 'string' || tile.id.length === 0 || tile.id.length > 64)
    err(`tile ${idx}: invalid id`);
  if (typeof tile.isBlank !== 'boolean') err(`tile ${idx}: isBlank must be boolean`);
  if (!tile.isBlank) {
    if (typeof tile.letter !== 'string' || !VALID_LETTERS.has(tile.letter))
      err(`tile ${idx}: invalid letter`);
    if (!isInt(tile.value, 0, 20)) err(`tile ${idx}: invalid value`);
  }
  if (tile.playedAs !== undefined && tile.playedAs !== null) {
    if (typeof tile.playedAs !== 'string' || !VALID_LETTERS.has(tile.playedAs))
      err(`tile ${idx}: invalid playedAs`);
  }
  if (tile.powerUp !== undefined && tile.powerUp !== null) {
    if (typeof tile.powerUp !== 'string' || !VALID_POWER_UPS.has(tile.powerUp))
      err(`tile ${idx}: invalid powerUp`);
  }
}

function validateSnapshot(raw: unknown): GameState {
  if (!raw || typeof raw !== 'object') err('root is not an object');
  const s = raw as Record<string, unknown>;

  // phase / turnPhase
  if (!VALID_PHASES.has(s.phase as string)) err(`unknown phase: ${String(s.phase)}`);
  if (!VALID_TURN_PHASES.has(s.turnPhase as string)) err(`unknown turnPhase: ${String(s.turnPhase)}`);

  // config
  if (!s.config || typeof s.config !== 'object') err('config missing');
  const cfg = s.config as Record<string, unknown>;
  if (!isInt(cfg.rows, MIN_BOARD_DIM, MAX_BOARD_DIM)) err(`config.rows out of range: ${String(cfg.rows)}`);
  if (!isInt(cfg.cols, MIN_BOARD_DIM, MAX_BOARD_DIM)) err(`config.cols out of range: ${String(cfg.cols)}`);
  if (!isInt(cfg.rackSize, 1, MAX_RACK_SIZE)) err(`config.rackSize invalid: ${String(cfg.rackSize)}`);
  if (!isInt(cfg.bingoBonus, 0, 1000)) err('config.bingoBonus invalid');
  if (typeof cfg.boardSeed !== 'number') err('config.boardSeed invalid');
  if (typeof cfg.randomBonuses !== 'boolean') err('config.randomBonuses invalid');
  // streakBonus and powerUpTiles are optional (old saves won't have them)
  if (cfg.streakBonus !== undefined && typeof cfg.streakBonus !== 'boolean') err('config.streakBonus invalid');
  if (cfg.powerUpTiles !== undefined && typeof cfg.powerUpTiles !== 'boolean') err('config.powerUpTiles invalid');
  if (cfg.ascendingBonus !== undefined && typeof cfg.ascendingBonus !== 'boolean') err('config.ascendingBonus invalid');

  const rows = cfg.rows as number;
  const cols = cfg.cols as number;

  // board
  if (!Array.isArray(s.board)) err('board must be an array');
  if (s.board.length !== rows) err(`board row count ${s.board.length} ≠ config.rows ${rows}`);
  for (let r = 0; r < rows; r++) {
    if (!Array.isArray(s.board[r])) err(`board[${r}] is not an array`);
    if (s.board[r].length !== cols) err(`board[${r}] col count ${s.board[r].length} ≠ config.cols ${cols}`);
    for (let c = 0; c < cols; c++) {
      const cell = s.board[r][c] as Record<string, unknown>;
      if (!cell || typeof cell !== 'object') err(`board[${r}][${c}] invalid`);
      if (!cell.position || typeof (cell.position as Record<string, unknown>).row !== 'number')
        err(`board[${r}][${c}].position invalid`);
      if (!VALID_BONUSES.has(cell.bonus as string | null)) err(`board[${r}][${c}].bonus invalid`);
      if (cell.tile !== null && cell.tile !== undefined) validateTile(cell.tile, `[${r}][${c}]`);
    }
  }

  // players
  if (!Array.isArray(s.players) || s.players.length === 0 || s.players.length > MAX_PLAYERS)
    err(`players must be array of 1–${MAX_PLAYERS}`);
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i] as Record<string, unknown>;
    if (!p || typeof p !== 'object') err(`players[${i}] invalid`);
    if (typeof p.id !== 'string' || p.id.length === 0) err(`players[${i}].id invalid`);
    if (typeof p.name !== 'string') err(`players[${i}].name invalid`);
    // Truncate names silently rather than rejecting (defensive)
    (s.players[i] as Record<string, unknown>).name = (p.name as string).slice(0, MAX_NAME_LEN);
    if (p.type !== 'human' && p.type !== 'bot') err(`players[${i}].type invalid`);
    if (typeof p.score !== 'number' || !isFinite(p.score)) err(`players[${i}].score invalid`);
    if (p.scoringStreak !== undefined && !isInt(p.scoringStreak, 0, 10000)) err(`players[${i}].scoringStreak invalid`);
    if (p.ascendingStreak !== undefined && !isInt(p.ascendingStreak, 0, 10000)) err(`players[${i}].ascendingStreak invalid`);
    if (p.lastWordScore !== undefined && (typeof p.lastWordScore !== 'number' || !isFinite(p.lastWordScore as number))) err(`players[${i}].lastWordScore invalid`);
    if (!Array.isArray(p.rack)) err(`players[${i}].rack invalid`);
    if (p.rack.length > MAX_RACK_SIZE) err(`players[${i}].rack too large`);
    for (let j = 0; j < p.rack.length; j++) validateTile(p.rack[j], `players[${i}].rack[${j}]`);
  }

  // currentPlayerIndex
  if (!isInt(s.currentPlayerIndex, 0, (s.players as unknown[]).length - 1))
    err(`currentPlayerIndex ${String(s.currentPlayerIndex)} out of range`);

  // turnNumber
  if (!isInt(s.turnNumber, 1, 100000)) err('turnNumber invalid');

  // tileBag
  if (!Array.isArray(s.tileBag)) err('tileBag must be an array');
  if (s.tileBag.length > MAX_TILE_BAG) err(`tileBag too large (${s.tileBag.length})`);
  for (let i = 0; i < s.tileBag.length; i++) validateTile(s.tileBag[i], `tileBag[${i}]`);

  // pendingPlacements — strip out-of-bounds entries rather than rejecting
  if (!Array.isArray(s.pendingPlacements)) s.pendingPlacements = [];
  s.pendingPlacements = (s.pendingPlacements as unknown[]).filter((pp: unknown) => {
    if (!pp || typeof pp !== 'object') return false;
    const { position } = pp as Record<string, unknown>;
    if (!position || typeof position !== 'object') return false;
    const pos = position as Record<string, unknown>;
    return isInt(pos.row, 0, rows - 1) && isInt(pos.col, 0, cols - 1);
  });

  // swapSelection
  if (!Array.isArray(s.swapSelection)) s.swapSelection = [];
  s.swapSelection = (s.swapSelection as unknown[]).filter(id => typeof id === 'string');

  // consecutiveScorelessTurns
  if (typeof s.consecutiveScorelessTurns !== 'number') s.consecutiveScorelessTurns = 0;

  return s as unknown as GameState;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function saveGameToFile(state: GameState): void {
  const payload: SaveFile = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: pickState(state),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  const turn = state.turnNumber ?? 0;
  a.href = url;
  a.download = `wordboard-turn${turn}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadGameFromFile(): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) { reject(new Error('No file selected')); return; }
      try {
        const text = await file.text();

        // Hard cap on file size (1 MB) before parsing
        if (text.length > 1_000_000) {
          reject(new Error('Save file too large (> 1 MB)'));
          return;
        }

        const parsed = JSON.parse(text);

        // Support both versioned wrapper and bare state dumps
        const raw: unknown = parsed?.state ?? parsed;

        const snapshot = validateSnapshot(raw);   // throws on invalid
        resolve(snapshot);
      } catch (e) {
        reject(e instanceof Error ? e : new Error('Could not parse save file'));
      }
    };

    input.addEventListener('cancel', () => reject(new Error('No file selected')));
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}

// Re-export for use outside file loading (e.g. loadGame from clipboard)
export { validateSnapshot };
