import { Modal } from './Modal';
import { useGameStore, useUIStore } from '@/store/gameStore';
import type { Letter } from '@/types';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('') as Letter[];

export function BlankTileModal() {
  const blankTileId = useUIStore(s => s.blankTileId);
  const setBlankTileId = useUIStore(s => s.setBlankTileId);
  const assignBlank = useGameStore(s => s.assignBlank);

  const handleSelect = (letter: Letter) => {
    if (!blankTileId) return;
    assignBlank(blankTileId, letter);
    setBlankTileId(null);
  };

  return (
    <Modal open={blankTileId !== null} title="Choose a letter for the blank tile">
      <div className="grid grid-cols-6 gap-2">
        {LETTERS.map(letter => (
          <button
            key={letter}
            onClick={() => handleSelect(letter)}
            className="aspect-square bg-tile-bg text-tile-text rounded font-bold text-sm hover:bg-tile-selected transition-colors"
          >
            {letter}
          </button>
        ))}
      </div>
    </Modal>
  );
}
