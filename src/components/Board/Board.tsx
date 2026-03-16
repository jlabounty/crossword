import { useGameStore } from '@/store/gameStore';
import { BoardCell } from './BoardCell';

export function Board() {
  const board = useGameStore(s => s.board);
  const rows = board.length;
  const cols = board[0]?.length ?? 0;

  return (
    <div
      className="border-2 border-board-border bg-board-border inline-block"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: '1px',
        width: '100%',
        maxWidth: 'min(95vw, 95vh - 200px)',
        aspectRatio: `${cols} / ${rows}`,
      }}
    >
      {board.flat().map(cell => (
        <BoardCell
          key={`${cell.position.row}-${cell.position.col}`}
          cell={cell}
        />
      ))}
    </div>
  );
}
