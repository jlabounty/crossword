import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BOARD_PRESETS } from '@/constants/boardLayouts';
import { DEFAULT_CONFIG } from '@/constants/gameConfig';
import type { GameConfig, BotDifficulty, PlayerType } from '@/types';

interface PlayerSetup {
  id: string;
  name: string;
  type: PlayerType;
  difficulty: BotDifficulty | null;
}

export function MenuScreen() {
  const startGame = useGameStore(s => s.startGame);

  const [playerCount, setPlayerCount] = useState(2);
  const [preset, setPreset] = useState(0);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { id: '1', name: 'Player 1', type: 'human', difficulty: null },
    { id: '2', name: 'Player 2', type: 'human', difficulty: null },
    { id: '3', name: 'Player 3', type: 'human', difficulty: null },
    { id: '4', name: 'Player 4', type: 'human', difficulty: null },
  ]);

  const updatePlayer = (i: number, update: Partial<PlayerSetup>) => {
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, ...update } : p));
  };

  const handleStart = () => {
    const { rows, cols } = BOARD_PRESETS[preset];
    const config: GameConfig = {
      ...DEFAULT_CONFIG,
      rows,
      cols,
      boardSeed: Math.floor(Math.random() * 0xffffffff),
    };
    startGame(config, players.slice(0, playerCount).map(p => ({
      id: p.id,
      name: p.name,
      type: p.type,
      difficulty: p.difficulty,
    })));
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-8 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white tracking-tight">Word Board</h1>
        <p className="text-white/60 mt-2">A word placement game for 1–4 players</p>
      </div>

      <div className="bg-white/10 rounded-2xl p-6 w-full max-w-md flex flex-col gap-6">
        {/* Board size */}
        <div>
          <label className="text-white/80 text-sm font-semibold block mb-2">Board Size</label>
          <div className="flex gap-2">
            {BOARD_PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => setPreset(i)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${preset === i ? 'bg-green-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Player count */}
        <div>
          <label className="text-white/80 text-sm font-semibold block mb-2">Number of Players</label>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setPlayerCount(n)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                  ${playerCount === n ? 'bg-green-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Player configs */}
        <div className="flex flex-col gap-3">
          {Array.from({ length: playerCount }, (_, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                className="flex-1 bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                value={players[i].name}
                onChange={e => updatePlayer(i, { name: e.target.value })}
                placeholder={`Player ${i + 1}`}
              />
              <button
                onClick={() => updatePlayer(i, {
                  type: players[i].type === 'human' ? 'bot' : 'human',
                  difficulty: players[i].type === 'human' ? 'medium' : null,
                  name: players[i].type === 'human' ? `Bot ${i + 1}` : `Player ${i + 1}`,
                })}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                  ${players[i].type === 'bot' ? 'bg-blue-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
              >
                {players[i].type === 'bot' ? '🤖 Bot' : '👤 Human'}
              </button>
              {players[i].type === 'bot' && (
                <select
                  value={players[i].difficulty ?? 'medium'}
                  onChange={e => updatePlayer(i, { difficulty: e.target.value as BotDifficulty })}
                  className="bg-white/10 text-white rounded-lg px-2 py-1.5 text-xs outline-none"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleStart}
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold text-lg transition-colors shadow-lg"
        >
          Start Game
        </button>
      </div>
    </div>
  );
}
