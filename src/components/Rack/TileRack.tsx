import { useEffect } from 'react';
import { useGameStore, useUIStore } from '@/store/gameStore';
import { RackTile } from './RackTile';
import type { Position } from '@/types';

interface Props {
  showSwap?: boolean;
}

export function TileRack({ showSwap }: Props) {
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const placeTile = useGameStore(s => s.placeTile);
  const swapSelection = useGameStore(s => s.swapSelection);
  const toggleSwapSelection = useGameStore(s => s.toggleSwapSelection);
  const selectedTileId = useUIStore(s => s.selectedTileId);
  const setSelectedTile = useUIStore(s => s.setSelectedTile);
  const setBlankTileId = useUIStore(s => s.setBlankTileId);

  const player = players[currentPlayerIndex];
  const rack = player?.rack ?? [];

  // Listen for cell click events to place the selected tile
  useEffect(() => {
    const handler = (e: Event) => {
      const { position } = (e as CustomEvent<{ position: Position }>).detail;
      if (!selectedTileId) return;
      const tile = rack.find(t => t.id === selectedTileId);
      if (!tile) return;

      placeTile(tile, position);
      setSelectedTile(null);

      // If blank tile, prompt for letter
      if (tile.isBlank) {
        setBlankTileId(tile.id);
      }
    };
    window.addEventListener('cell:clicked', handler);
    return () => window.removeEventListener('cell:clicked', handler);
  }, [selectedTileId, rack, placeTile, setSelectedTile, setBlankTileId]);

  if (!player) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-sm text-white/70">
        {player.name}'s rack
        <span className="ml-2 text-white/50 text-xs">
          ({rack.length} tile{rack.length !== 1 ? 's' : ''})
        </span>
      </p>
      <div
        className="grid gap-1 p-2 bg-board-border rounded-lg"
        style={{ gridTemplateColumns: `repeat(${Math.max(rack.length, 1)}, 1fr)`, minHeight: '3rem' }}
      >
        {rack.map(tile => (
          <RackTile
            key={tile.id}
            tile={tile}
            isSwapSelected={swapSelection.includes(tile.id)}
            onSwapToggle={showSwap ? () => toggleSwapSelection(tile.id) : undefined}
          />
        ))}
        {rack.length === 0 && (
          <div className="col-span-7 text-white/40 text-sm flex items-center justify-center px-4">
            No tiles
          </div>
        )}
      </div>
    </div>
  );
}
