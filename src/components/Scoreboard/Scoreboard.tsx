import { useGameStore } from '@/store/gameStore';

function streakLabel(streak: number): string | null {
  if (streak >= 7) return '🔥🔥🔥';
  if (streak >= 5) return '🔥🔥';
  if (streak >= 3) return '🔥';
  return null;
}

function ascLabel(streak: number): string | null {
  if (streak >= 2) return `↑${streak}`;
  return null;
}

export function Scoreboard() {
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const tileBag = useGameStore(s => s.tileBag);
  const turnNumber = useGameStore(s => s.turnNumber);
  const streakBonusEnabled = useGameStore(s => s.config.streakBonus);
  const ascendingBonusEnabled = useGameStore(s => s.config.ascendingBonus);

  return (
    <div className="flex flex-col gap-1 min-w-[120px]">
      <div className="text-xs text-white/50 text-center mb-1">
        Bag: {tileBag.length} · Turn {turnNumber}
      </div>
      {players.map((player, i) => {
        const flame = streakBonusEnabled ? streakLabel(player.scoringStreak ?? 0) : null;
        const asc = ascendingBonusEnabled ? ascLabel(player.ascendingStreak ?? 0) : null;
        return (
          <div
            key={player.id}
            className={`
              flex items-center justify-between gap-3 px-3 py-1.5 rounded-lg text-sm
              ${i === currentPlayerIndex
                ? 'bg-white/20 ring-1 ring-white/50 text-white font-semibold'
                : 'bg-white/5 text-white/60'}
            `}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {i === currentPlayerIndex && (
                <span className="text-yellow-400 text-xs">▶</span>
              )}
              <span className="truncate">
                {player.name}
                {player.type === 'bot' && (
                  <span className="ml-1 text-xs opacity-60">(bot)</span>
                )}
              </span>
              {flame && (
                <span className="text-xs shrink-0" title={`${player.scoringStreak}-turn scoring streak (+${[5,5,10,15][[3,5,7].findIndex(t => (player.scoringStreak ?? 0) >= t)] ?? 5} bonus)`}>
                  {flame}
                </span>
              )}
              {asc && (
                <span
                  className="text-xs shrink-0 font-mono text-green-400"
                  title={`Ascending ${player.ascendingStreak}-turn streak — each turn scored higher than the last`}
                >
                  {asc}
                </span>
              )}
            </div>
            <span className="font-mono tabular-nums shrink-0">{player.score}</span>
          </div>
        );
      })}
    </div>
  );
}
