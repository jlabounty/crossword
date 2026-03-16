import type { Tile } from '@/types';
import { useUIStore } from '@/store/gameStore';

interface Props {
  tile: Tile;
  disabled?: boolean;
  isSwapSelected?: boolean;
  onSwapToggle?: () => void;
}

export function RackTile({ tile, disabled, isSwapSelected, onSwapToggle }: Props) {
  const selectedTileId = useUIStore(s => s.selectedTileId);
  const setSelectedTile = useUIStore(s => s.setSelectedTile);

  const isSelected = selectedTileId === tile.id;

  const handleClick = () => {
    if (disabled) return;
    if (onSwapToggle) {
      onSwapToggle();
      return;
    }
    setSelectedTile(isSelected ? null : tile.id);
  };

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        rounded-sm cursor-pointer select-none font-bold
        transition-all duration-100
        ${isSelected
          ? 'bg-tile-selected text-tile-text scale-110 shadow-lg ring-2 ring-white'
          : isSwapSelected
          ? 'bg-orange-400 text-white scale-105 ring-2 ring-orange-200'
          : 'bg-tile-bg text-tile-text hover:bg-tile-hover hover:scale-105'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        shadow-md
      `}
      style={{ aspectRatio: '1', minWidth: '2rem' }}
      onClick={handleClick}
      title={tile.isBlank ? 'Blank tile (choose a letter when placed)' : `${tile.letter} = ${tile.value} pts`}
    >
      <span className="text-[0.85em] leading-none">
        {tile.letter === '_' ? ' ' : tile.letter}
      </span>
      {!tile.isBlank && (
        <span className="text-[0.35em] leading-none opacity-75 absolute bottom-[2px] right-[3px]">
          {tile.value}
        </span>
      )}
    </div>
  );
}
