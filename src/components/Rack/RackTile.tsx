import type { Tile, TilePowerUp } from '@/types';
import { POWER_UP_LABELS, POWER_UP_TITLES } from '@/types';
import { useUIStore } from '@/store/gameStore';

interface Props {
  tile: Tile;
  disabled?: boolean;
  isSwapSelected?: boolean;
  onSwapToggle?: () => void;
}

// Base background/text per power-up (normal state)
const POWER_UP_BG: Record<TilePowerUp, string> = {
  golden:   'bg-amber-300 text-amber-900',
  cursed:   'bg-purple-900 text-purple-100',
  volatile: 'bg-sky-700 text-white',
};

// Background/text when the tile is selected (lifted)
const POWER_UP_BG_SELECTED: Record<TilePowerUp, string> = {
  golden:   'bg-amber-200 text-amber-900',
  cursed:   'bg-purple-700 text-purple-100',
  volatile: 'bg-sky-500 text-white',
};

// Icon color overrides (sits on top of coloured bg, so white usually reads best)
const POWER_UP_ICON_COLOR: Record<TilePowerUp, string> = {
  golden:   'text-amber-700',
  cursed:   'text-purple-300',
  volatile: 'text-sky-200',
};

export function RackTile({ tile, disabled, isSwapSelected, onSwapToggle }: Props) {
  const selectedTileId = useUIStore(s => s.selectedTileId);
  const setSelectedTile = useUIStore(s => s.setSelectedTile);

  const isSelected = selectedTileId === tile.id;
  const pu = tile.powerUp;

  const handleClick = () => {
    if (disabled) return;
    if (onSwapToggle) {
      onSwapToggle();
      return;
    }
    setSelectedTile(isSelected ? null : tile.id);
  };

  const bgClass = isSwapSelected
    ? 'bg-orange-400 text-white'
    : pu
    ? (isSelected ? `${POWER_UP_BG_SELECTED[pu]} scale-110 shadow-lg ring-2 ring-white` : `${POWER_UP_BG[pu]} hover:brightness-110 hover:scale-105`)
    : isSelected
    ? 'bg-tile-selected text-tile-text scale-110 shadow-lg ring-2 ring-white'
    : 'bg-tile-bg text-tile-text hover:bg-tile-hover hover:scale-105';

  return (
    <div
      className={`
        relative flex flex-col items-center justify-center
        rounded-sm cursor-pointer select-none font-bold
        transition-all duration-100
        ${bgClass}
        ${isSwapSelected ? 'scale-105 ring-2 ring-orange-200' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        shadow-md
      `}
      style={{ aspectRatio: '1', minWidth: '2rem' }}
      onClick={handleClick}
      title={
        tile.isBlank
          ? 'Blank tile (choose a letter when placed)'
          : pu
          ? `${tile.letter} = ${tile.value} pts · ${POWER_UP_TITLES[pu]}`
          : `${tile.letter} = ${tile.value} pts`
      }
    >
      {pu && (
        <span className={`absolute top-[1px] left-[2px] text-[0.3em] leading-none z-10 ${POWER_UP_ICON_COLOR[pu]}`}>
          {POWER_UP_LABELS[pu]}
        </span>
      )}
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
