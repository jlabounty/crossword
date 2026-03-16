import type { GameState } from '@/types';

const SAVE_VERSION = 1;

interface SaveFile {
  version: number;
  savedAt: string;
  state: Omit<GameState, keyof ReturnType<typeof pickState> extends never ? never : string>;
}

function pickState(s: GameState) {
  return {
    phase: s.phase,
    turnPhase: s.turnPhase,
    board: s.board,
    players: s.players,
    currentPlayerIndex: s.currentPlayerIndex,
    tileBag: s.tileBag,
    pendingPlacements: s.pendingPlacements,
    lastMove: s.lastMove,
    consecutiveScorelessTurns: s.consecutiveScorelessTurns,
    config: s.config,
    turnNumber: s.turnNumber,
    swapSelection: s.swapSelection,
  };
}

export function saveGameToFile(state: GameState): void {
  const payload: SaveFile = {
    version: SAVE_VERSION,
    savedAt: new Date().toISOString(),
    state: pickState(state),
  };
  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  const turn = state.turnNumber ?? 0;
  a.href = url;
  a.download = `wordboard-turn${turn}-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function loadGameFromFile(): Promise<GameState> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        // Support both bare state dumps and the versioned wrapper format
        const raw: GameState = parsed.state ?? parsed;

        if (!raw.phase || !raw.board || !Array.isArray(raw.players)) {
          reject(new Error('Invalid save file — missing required fields'));
          return;
        }

        resolve(raw as GameState);
      } catch {
        reject(new Error('Could not parse save file'));
      }
    };

    // Reject if the dialog is dismissed without a selection
    input.addEventListener('cancel', () => reject(new Error('No file selected')));

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
}
