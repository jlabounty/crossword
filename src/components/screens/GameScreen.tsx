import { useEffect } from 'react';
import { Board } from '../Board/Board';
import { TileRack } from '../Rack/TileRack';
import { Scoreboard } from '../Scoreboard/Scoreboard';
import { ActionBar } from '../Controls/ActionBar';
import { BlankTileModal } from '../shared/BlankTileModal';
import { useGameStore, useUIStore } from '@/store/gameStore';

export function GameScreen() {
  const resetToSetup = useGameStore(s => s.resetToSetup);
  const error = useUIStore(s => s.error);
  const setError = useUIStore(s => s.setError);
  const showSwapModal = useUIStore(s => s.showSwapModal);

  // Listen for game errors
  useEffect(() => {
    const handler = (e: Event) => {
      setError((e as CustomEvent<string>).detail);
      setTimeout(() => setError(null), 3000);
    };
    window.addEventListener('game:error', handler);
    window.addEventListener('game:invalidWords', (e: Event) => {
      const words = (e as CustomEvent<string[]>).detail;
      setError(`Invalid word${words.length > 1 ? 's' : ''}: ${words.join(', ')}`);
      setTimeout(() => setError(null), 3000);
    });
    return () => window.removeEventListener('game:error', handler);
  }, [setError]);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-board-border/80">
        <button
          onClick={resetToSetup}
          className="text-white/60 hover:text-white text-sm transition-colors"
        >
          ← Menu
        </button>
        <span className="text-white/80 font-semibold text-sm">Word Board</span>
        <div className="w-16" />
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm animate-bounce">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="flex flex-1 gap-3 p-3 overflow-hidden">
        {/* Board — center */}
        <div className="flex-1 flex items-start justify-center">
          <Board />
        </div>

        {/* Sidebar: scoreboard */}
        <div className="hidden sm:flex flex-col gap-3 w-36 shrink-0">
          <Scoreboard />
        </div>
      </div>

      {/* Mobile scoreboard */}
      <div className="sm:hidden px-3 pb-1">
        <Scoreboard />
      </div>

      {/* Rack + controls */}
      <div className="flex flex-col items-center gap-3 px-4 py-3 bg-board-border/60 border-t border-white/10">
        <TileRack showSwap={showSwapModal} />
        <ActionBar />
      </div>

      <BlankTileModal />
    </div>
  );
}
