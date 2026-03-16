import { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { BOARD_PRESETS } from '@/constants/boardLayouts';
import { DEFAULT_CONFIG } from '@/constants/gameConfig';
import type { GameConfig, BotDifficulty, PlayerType } from '@/types';

const CUSTOM_PRESET_IDX = BOARD_PRESETS.length; // sentinel index for "Custom"

const MIN_DIM = 5;
const MAX_DIM = 40;

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
  const [customRows, setCustomRows] = useState(15);
  const [customCols, setCustomCols] = useState(15);
  const [randomBonuses, setRandomBonuses] = useState(false);
  const [players, setPlayers] = useState<PlayerSetup[]>([
    { id: '1', name: 'Player 1', type: 'human', difficulty: null },
    { id: '2', name: 'Player 2', type: 'human', difficulty: null },
    { id: '3', name: 'Player 3', type: 'human', difficulty: null },
    { id: '4', name: 'Player 4', type: 'human', difficulty: null },
  ]);

  const isCustom = preset === CUSTOM_PRESET_IDX;

  const updatePlayer = (i: number, update: Partial<PlayerSetup>) => {
    setPlayers(prev => prev.map((p, idx) => idx === i ? { ...p, ...update } : p));
  };

  const clampDim = (v: number) => Math.max(MIN_DIM, Math.min(MAX_DIM, v || MIN_DIM));

  const handleStart = () => {
    const rows = isCustom ? clampDim(customRows) : BOARD_PRESETS[preset].rows;
    const cols = isCustom ? clampDim(customCols) : BOARD_PRESETS[preset].cols;
    const config: GameConfig = {
      ...DEFAULT_CONFIG,
      rows,
      cols,
      randomBonuses,
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
          <div className="flex gap-2 flex-wrap">
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
            <button
              onClick={() => setPreset(CUSTOM_PRESET_IDX)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors
                ${isCustom ? 'bg-green-600 text-white' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
            >
              Custom
            </button>
          </div>

          {/* Custom dimension inputs */}
          {isCustom && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex-1">
                <label className="text-white/60 text-xs block mb-1">Rows ({MIN_DIM}–{MAX_DIM})</label>
                <input
                  type="number"
                  min={MIN_DIM}
                  max={MAX_DIM}
                  value={customRows}
                  onChange={e => setCustomRows(Number(e.target.value))}
                  onBlur={e => setCustomRows(clampDim(Number(e.target.value)))}
                  className="w-full bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <span className="text-white/60 text-lg mt-4">×</span>
              <div className="flex-1">
                <label className="text-white/60 text-xs block mb-1">Cols ({MIN_DIM}–{MAX_DIM})</label>
                <input
                  type="number"
                  min={MIN_DIM}
                  max={MAX_DIM}
                  value={customCols}
                  onChange={e => setCustomCols(Number(e.target.value))}
                  onBlur={e => setCustomCols(clampDim(Number(e.target.value)))}
                  className="w-full bg-white/10 text-white rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          )}

          {/* Random bonuses toggle */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-white/80 text-sm font-medium">Random Bonuses</span>
              {!isCustom && preset === 0 && !randomBonuses && (
                <span className="text-white/40 text-xs ml-2">Classic Scrabble layout</span>
              )}
            </div>
            <button
              onClick={() => setRandomBonuses(v => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${randomBonuses ? 'bg-green-600' : 'bg-white/20'}`}
              role="switch"
              aria-checked={randomBonuses}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                  ${randomBonuses ? 'translate-x-6' : 'translate-x-1'}`}
              />
            </button>
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
