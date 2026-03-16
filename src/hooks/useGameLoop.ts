/**
 * useGameLoop — detects when it's a bot player's turn and triggers their move.
 * Must be mounted once in GameScreen.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/gameStore';
import { dictionaryService } from '@/engine/dictionary';

export function useGameLoop() {
  const players = useGameStore(s => s.players);
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex);
  const turnPhase = useGameStore(s => s.turnPhase);
  const phase = useGameStore(s => s.phase);
  const board = useGameStore(s => s.board);
  const config = useGameStore(s => s.config);
  const turnNumber = useGameStore(s => s.turnNumber);
  const applyBotMove = useGameStore(s => s.applyBotMove);
  const passTurn = useGameStore(s => s.passTurn);

  const inFlight = useRef(false);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (turnPhase !== 'placing') return;

    const currentPlayer = players[currentPlayerIndex];
    if (!currentPlayer || currentPlayer.type !== 'bot') return;
    if (inFlight.current) return;

    inFlight.current = true;
    let cancelled = false;

    const isFirstMove = turnNumber === 1;
    // Detect first move: board has no committed tiles
    const boardIsEmpty = board.every(row => row.every(cell => cell.tile === null));

    dictionaryService
      .findBotMove(
        board,
        currentPlayer.rack,
        config.rackSize,
        config.bingoBonus,
        currentPlayer.difficulty ?? 'medium',
        isFirstMove && boardIsEmpty
      )
      .then(move => {
        inFlight.current = false;
        if (cancelled) return;
        if (move && move.placements.length > 0) {
          applyBotMove(move.placements, move.score, move.wordsFormed);
        } else {
          passTurn();
        }
      })
      .catch(() => {
        inFlight.current = false;
        if (!cancelled) passTurn();
      });

    return () => { cancelled = true; };
  }, [phase, turnPhase, currentPlayerIndex, turnNumber]); // eslint-disable-line react-hooks/exhaustive-deps
}
