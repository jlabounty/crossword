import { useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import {
  renderBoardToCanvas,
  canNativeShare,
  downloadCanvasPng,
  copyCanvasToClipboard,
  shareCanvasPng,
} from '@/utils/captureBoard';

export function GameOverScreen() {
  const players = useGameStore(s => s.players);
  const board   = useGameStore(s => s.board);
  const resetToSetup = useGameStore(s => s.resetToSetup);

  const [copied, setCopied] = useState(false);
  const [working, setWorking] = useState(false);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

  const buildCanvas = useCallback(() =>
    renderBoardToCanvas(board, sorted), [board, sorted]);

  const handleShare = async () => {
    setWorking(true);
    const canvas = buildCanvas();
    const title  = `${winner.name} wins Word Board!`;
    const text   = sorted.map((p, i) => `${i + 1}. ${p.name}: ${p.score}`).join('  ');
    const shared = canNativeShare() && await shareCanvasPng(canvas, title, text);
    if (!shared) downloadCanvasPng(canvas, `wordboard-${winner.name}.png`);
    setWorking(false);
  };

  const handleCopy = async () => {
    setWorking(true);
    const canvas = buildCanvas();
    const ok = await copyCanvasToClipboard(canvas);
    setWorking(false);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Clipboard API unavailable — fall back to download
      downloadCanvasPng(canvas, `wordboard-${winner.name}.png`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <div className="text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold text-white">{winner.name} wins!</h1>
        <p className="text-white/60 mt-2">Final Scores</p>
      </div>

      <div className="bg-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-3">
        {sorted.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center justify-between px-4 py-3 rounded-lg
              ${i === 0 ? 'bg-yellow-500/30 ring-1 ring-yellow-400' : 'bg-white/5'}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-white/50 text-sm w-5">{i + 1}.</span>
              <span className="text-white font-medium">
                {player.name}
                {i === 0 && ' 👑'}
              </span>
            </div>
            <span className="text-white font-bold tabular-nums text-lg">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Share / copy row */}
      <div className="flex gap-3">
        <button
          onClick={handleShare}
          disabled={working}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50
            text-white rounded-xl font-semibold text-sm transition-colors shadow"
        >
          {canNativeShare() ? '📤 Share' : '⬇️ Save Image'}
        </button>
        <button
          onClick={handleCopy}
          disabled={working}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 disabled:opacity-50
            text-white rounded-xl font-semibold text-sm transition-colors shadow"
        >
          {copied ? '✅ Copied!' : '📋 Copy Image'}
        </button>
      </div>

      <button
        onClick={resetToSetup}
        className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
