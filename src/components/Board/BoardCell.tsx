import type { Cell, Tile } from '@/types';
import { BONUS_LABELS, BONUS_COLORS } from '@/types';
import { useGameStore, useUIStore } from '@/store/gameStore';
import { useCallback } from 'react';

interface Props {
  cell: Cell;
}

export function BoardCell({ cell }: Props) {
  const recallTile = useGameStore(s => s.recallTile);
  const assignBlank = useGameStore(s => s.assignBlank);
  const turnPhase = useGameStore(s => s.turnPhase);
  const selectedTileId = useUIStore(s => s.selectedTileId);
  const setSelectedTile = useUIStore(s => s.setSelectedTile);
  const setBlankTileId = useUIStore(s => s.setBlankTileId);

  const activeTile: Tile | null = cell.pendingTile ?? cell.tile;
  const isPending = cell.pendingTile !== null;
  const isEmpty = activeTile === null;
  const isPlaying = turnPhase === 'placing';

  const handleClick = useCallback(() => {
    if (!isPlaying) return;

    if (isPending) {
      // Recall pending tile back to rack
      recallTile(cell.position);
      setSelectedTile(null);
      return;
    }

    if (cell.tile) return; // committed tile, can't interact

    if (selectedTileId) {
      // Find the tile in the game state and place it
      // The tile object is passed via the rack via the store
      // We emit a custom event that the rack listens to
      window.dispatchEvent(
        new CustomEvent('cell:clicked', { detail: { position: cell.position } })
      );
    }
  }, [isPlaying, isPending, cell, selectedTileId, recallTile, setSelectedTile]);

  let bgClass = 'bg-board-cell';
  if (cell.bonus && !cell.bonusConsumed && isEmpty) {
    bgClass = BONUS_COLORS[cell.bonus];
  }
  if (isPending) bgClass = 'bg-tile-placed';
  if (cell.tile) bgClass = 'bg-[#d4a853]';

  const showBonus = isEmpty && cell.bonus && !cell.bonusConsumed;

  return (
    <div
      className={`
        relative flex items-center justify-center
        border border-board-border cursor-pointer select-none
        transition-all duration-100
        ${bgClass}
        ${isEmpty && isPlaying && selectedTileId ? 'hover:brightness-125 ring-2 ring-yellow-300 ring-inset' : ''}
        ${isPending && isPlaying ? 'hover:brightness-90' : ''}
      `}
      style={{ aspectRatio: '1' }}
      onClick={handleClick}
      data-row={cell.position.row}
      data-col={cell.position.col}
    >
      {showBonus && (
        <span className="text-[0.45em] font-bold text-center leading-tight opacity-90 px-0.5">
          {BONUS_LABELS[cell.bonus!]}
        </span>
      )}

      {activeTile && (
        <TileDisplay
          tile={activeTile}
          isPending={isPending}
          isPlaying={isPlaying}
          onAssignBlank={() => {
            if (isPending && activeTile.isBlank && !activeTile.playedAs) {
              setBlankTileId(activeTile.id);
              void assignBlank;
            }
          }}
        />
      )}
    </div>
  );
}

function TileDisplay({
  tile,
  isPending,
  isPlaying,
  onAssignBlank,
}: {
  tile: Tile;
  isPending: boolean;
  isPlaying: boolean;
  onAssignBlank: () => void;
}) {
  const displayLetter = tile.isBlank ? (tile.playedAs ?? '?') : tile.letter;

  return (
    <div
      className={`
        absolute inset-[2px] rounded-sm flex flex-col items-center justify-center
        bg-tile-bg text-tile-text font-bold shadow-sm
        ${isPending && isPlaying ? 'ring-2 ring-yellow-400 cursor-pointer' : ''}
        ${tile.isBlank && isPending && !tile.playedAs ? 'ring-2 ring-red-400 animate-pulse' : ''}
      `}
      onClick={e => {
        if (isPending && tile.isBlank && !tile.playedAs) {
          e.stopPropagation();
          onAssignBlank();
        }
      }}
    >
      <span className="text-[0.8em] leading-none">{displayLetter}</span>
      {!tile.isBlank && (
        <span className="text-[0.35em] leading-none opacity-75 absolute bottom-[2px] right-[3px]">
          {tile.value}
        </span>
      )}
    </div>
  );
}
