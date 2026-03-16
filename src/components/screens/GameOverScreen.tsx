import { useGameStore } from '@/store/gameStore';

export function GameOverScreen() {
  const players = useGameStore(s => s.players);
  const resetToSetup = useGameStore(s => s.resetToSetup);

  const sorted = [...players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];

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

      <button
        onClick={resetToSetup}
        className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors"
      >
        Play Again
      </button>
    </div>
  );
}
