import { useState } from 'react';
import { useGameStore, useUIStore } from '@/store/gameStore';

export function ActionBar() {
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const currentPlayer = players[currentPlayerIndex];
  const isBotTurn = currentPlayer?.type === 'bot';
  const playTurn = useGameStore(s => s.playTurn);
  const passTurn = useGameStore(s => s.passTurn);
  const recallAll = useGameStore(s => s.recallAll);
  const confirmSwap = useGameStore(s => s.confirmSwap);
  const pendingPlacements = useGameStore(s => s.pendingPlacements);
  const tileBag = useGameStore(s => s.tileBag);
  const config = useGameStore(s => s.config);
  const swapSelection = useGameStore(s => s.swapSelection);
  const turnPhase = useGameStore(s => s.turnPhase);
  const setShowSwapModal = useUIStore(s => s.setShowSwapModal);
  const showSwapModal = useUIStore(s => s.showSwapModal);
  const setError = useUIStore(s => s.setError);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const canPlay = pendingPlacements.length > 0 && turnPhase === 'placing';
  const canSwap = tileBag.length >= config.rackSize;
  const isValidating = turnPhase === 'validating';

  const handlePlay = async () => {
    setIsSubmitting(true);
    setError(null);
    await playTurn();
    setIsSubmitting(false);
  };

  if (isBotTurn) {
    return (
      <div className="flex items-center gap-2 text-white/70 text-sm animate-pulse">
        <span>🤖</span>
        <span>{currentPlayer.name} is thinking…</span>
      </div>
    );
  }

  if (showSwapModal) {
    return (
      <div className="flex flex-wrap gap-2 items-center justify-center">
        <span className="text-white/70 text-sm">Select tiles to swap, then confirm:</span>
        <button
          onClick={() => { confirmSwap(); setShowSwapModal(false); }}
          disabled={swapSelection.length === 0}
          className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-colors"
        >
          Swap {swapSelection.length > 0 ? `(${swapSelection.length})` : ''}
        </button>
        <button
          onClick={() => setShowSwapModal(false)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2 items-center justify-center">
      <button
        onClick={handlePlay}
        disabled={!canPlay || isSubmitting || isValidating}
        className="px-5 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg font-bold text-sm transition-colors shadow"
      >
        {isValidating ? 'Checking…' : 'Play'}
      </button>

      <button
        onClick={recallAll}
        disabled={pendingPlacements.length === 0}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
      >
        Recall
      </button>

      <button
        onClick={() => {
          if (canSwap) setShowSwapModal(true);
        }}
        disabled={!canSwap || pendingPlacements.length > 0}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
        title={!canSwap ? 'Need 7+ tiles in bag' : ''}
      >
        Swap
      </button>

      <button
        onClick={passTurn}
        disabled={isValidating}
        className="px-4 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white rounded-lg text-sm transition-colors"
      >
        Pass
      </button>
    </div>
  );
}
