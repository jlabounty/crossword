import type { Board, Player, BonusType } from '@/types';

// ─── Palette (mirrors tailwind.config.js) ─────────────────────────────────────
const C = {
  bg:      '#1b4332',
  cell:    '#40916c',
  border:  '#1b4332',
  bonuses: {
    DL:    '#219ebc',
    TL:    '#023e8a',
    DW:    '#e07a5f',
    TW:    '#c1121f',
    START: '#e07a5f',
  } as Record<NonNullable<BonusType>, string>,
  tileCellBg: '#d4a853',
  tileFace:   '#f2cc8f',
  tileText:   '#264653',
  textPrimary:   '#ffffff',
  textSecondary: 'rgba(255,255,255,0.6)',
  gold:    '#ffd700',
  winner:  'rgba(234,179,8,0.25)',  // yellow-500/25
};

const BONUS_LABELS: Record<NonNullable<BonusType>, string> = {
  DL: '2×L', TL: '3×L', DW: '2×W', TW: '3×W', START: '★',
};

// ─── Layout constants ─────────────────────────────────────────────────────────
const PAD    = 20;   // outer padding (px)
const CELL   = 24;   // board cell size (px)
const GAP    = 1;    // gap between cells (px)
const HDR_H  = 52;   // header height
const SCORES_PAD = 12; // vertical padding around scores block

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Renders the final board + scores onto a canvas and returns it.
 * @param board   The committed board (no pending tiles expected)
 * @param players Players sorted highest→lowest by the caller if desired
 */
export function renderBoardToCanvas(board: Board, players: Player[]): HTMLCanvasElement {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  // Scale cell size so very large boards still fit in ~720px
  const MAX_BOARD_PX = 600;
  const cellSize = Math.max(8, Math.min(CELL, Math.floor(MAX_BOARD_PX / Math.max(rows, cols))));
  const gap = cellSize >= 12 ? GAP : 0;

  const boardW = cols * cellSize + (cols - 1) * gap;
  const boardH = rows * cellSize + (rows - 1) * gap;

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const scoresH = sortedPlayers.length * 36 + SCORES_PAD * 2;

  const canvasW = boardW + PAD * 2;
  const canvasH = HDR_H + boardH + scoresH + PAD * 2;

  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d')!;

  // ── Background ──────────────────────────────────────────────────────────────
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, canvasW, canvasH);

  // ── Header ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = C.textPrimary;
  ctx.font = `bold ${Math.round(HDR_H * 0.42)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Word Board', canvasW / 2, HDR_H / 2);

  // ── Board ───────────────────────────────────────────────────────────────────
  const boardOriginX = PAD;
  const boardOriginY = HDR_H;

  board.forEach(row => row.forEach(cell => {
    const x = boardOriginX + cell.position.col * (cellSize + gap);
    const y = boardOriginY + cell.position.row * (cellSize + gap);

    // Cell background
    const tile = cell.tile; // only committed tiles at game end
    if (tile) {
      ctx.fillStyle = C.tileCellBg;
    } else if (cell.bonus && !cell.bonusConsumed) {
      ctx.fillStyle = C.bonuses[cell.bonus];
    } else {
      ctx.fillStyle = C.cell;
    }
    ctx.fillRect(x, y, cellSize, cellSize);

    if (tile) {
      // Tile face (inset by 2px)
      const inset = Math.max(1, Math.round(cellSize * 0.08));
      ctx.fillStyle = C.tileFace;
      ctx.fillRect(x + inset, y + inset, cellSize - inset * 2, cellSize - inset * 2);

      // Letter
      ctx.fillStyle = C.tileText;
      const displayLetter = tile.isBlank ? (tile.playedAs ?? '?') : tile.letter;
      const fontSize = Math.max(6, Math.round(cellSize * 0.52));
      ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(displayLetter, x + cellSize / 2, y + cellSize / 2 - cellSize * 0.04);

      // Point value (bottom-right, small)
      if (!tile.isBlank && cellSize >= 16) {
        const valSize = Math.max(4, Math.round(cellSize * 0.26));
        ctx.font = `${valSize}px system-ui, sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(tile.value), x + cellSize - 2, y + cellSize - 1);
      }
    } else if (cell.bonus && !cell.bonusConsumed && cellSize >= 14) {
      // Bonus label
      const labelSize = Math.max(4, Math.round(cellSize * 0.28));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = `bold ${labelSize}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(BONUS_LABELS[cell.bonus], x + cellSize / 2, y + cellSize / 2);
    }
  }));

  // ── Scores ───────────────────────────────────────────────────────────────────
  const scoresOriginY = HDR_H + boardH + SCORES_PAD;
  const rowH = 36;
  const scoreX = PAD;
  const scoreW = boardW;

  sortedPlayers.forEach((player, i) => {
    const y = scoresOriginY + i * rowH;
    const isWinner = i === 0;

    // Row background
    ctx.fillStyle = isWinner ? C.winner : 'rgba(255,255,255,0.06)';
    roundRect(ctx, scoreX, y + 2, scoreW, rowH - 4, 6);
    ctx.fill();

    // Rank + name
    const textY = y + rowH / 2;
    ctx.font = `${isWinner ? 'bold' : 'normal'} 14px system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.textSecondary;
    ctx.fillText(`${i + 1}.`, scoreX + 10, textY);

    ctx.fillStyle = isWinner ? C.gold : C.textPrimary;
    ctx.font = `${isWinner ? 'bold' : 'normal'} 14px system-ui, sans-serif`;
    const crown = isWinner ? ' 👑' : '';
    ctx.fillText(player.name + crown, scoreX + 30, textY);

    // Score (right-aligned)
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = isWinner ? C.gold : C.textPrimary;
    ctx.fillText(String(player.score), scoreX + scoreW - 12, textY);
  });

  return canvas;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ─── Share helpers ────────────────────────────────────────────────────────────

/** Returns true if the browser supports sharing image files natively. */
export function canNativeShare(): boolean {
  try {
    return typeof navigator.share === 'function' && typeof navigator.canShare === 'function';
  } catch {
    return false;
  }
}

/** Trigger a PNG download from a canvas element. */
export function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string): void {
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/** Copy canvas PNG to clipboard. Returns true on success. */
export async function copyCanvasToClipboard(canvas: HTMLCanvasElement): Promise<boolean> {
  try {
    const blob = await canvasToBlob(canvas);
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

/** Share canvas PNG using the Web Share API. */
export async function shareCanvasPng(canvas: HTMLCanvasElement, title: string, text: string): Promise<boolean> {
  try {
    const blob = await canvasToBlob(canvas);
    const file = new File([blob], 'wordboard-result.png', { type: 'image/png' });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ title, text, files: [file] });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Canvas toBlob failed')), 'image/png');
  });
}
