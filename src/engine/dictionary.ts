/**
 * DictionaryService — fetches the word list on the main thread then hands it
 * to the Web Worker to build the Trie.
 *
 * Ready-promise resolution rules (avoids first-word race):
 *  - Only resolved by the READY message from the worker (success or explicit fallback)
 *  - onerror sets isFallback=true but does NOT resolve immediately — waits for READY
 *    or the safety timeout in case the worker is truly dead
 *  - A 15-second safety timeout ensures the promise always resolves
 */

import type { Board, Tile, BotDifficulty } from '@/types';
import type { BotMove } from '@/workers/dictionary.worker';

type WorkerResponse =
  | { type: 'READY'; fallback?: boolean }
  | { type: 'VALIDATE_RESULT'; id: number; valid: boolean; invalidWords: string[] }
  | { type: 'MOVES_RESULT'; id: number; move: BotMove | null };

const READY_TIMEOUT_MS = 15_000;

class DictionaryService {
  private worker: Worker | null = null;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: unknown) => void }>();
  private idCounter = 0;
  private readyPromise: Promise<void>;
  private resolveReady!: () => void;
  public isReady = false;
  public isFallback = false;

  constructor() {
    this.readyPromise = new Promise(r => { this.resolveReady = r; });
    this.init();
  }

  private async init() {
    // Safety timeout — if the worker never sends READY, fall back gracefully.
    const timeout = setTimeout(() => {
      if (!this.isReady) {
        console.warn('[DictionaryService] Timed out waiting for worker READY — falling back');
        this.isFallback = true;
        this.resolveReady();
      }
    }, READY_TIMEOUT_MS);

    try {
      this.worker = new Worker(
        new URL('../workers/dictionary.worker.ts', import.meta.url),
        { type: 'classic' }
      );

      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === 'READY') {
          clearTimeout(timeout);
          this.isReady = true;
          this.isFallback = !!msg.fallback;
          this.resolveReady();   // sole normal resolution path
          return;
        }
        const handler = this.pending.get(msg.id);
        if (handler) {
          this.pending.delete(msg.id);
          handler.resolve(msg);
        }
      };

      // onerror marks the worker as broken but does NOT resolve readyPromise —
      // the safety timeout above will eventually do so, ensuring the promise
      // always resolves with isFallback reflecting the true final state.
      this.worker.onerror = (e) => {
        console.error('[DictionaryService] Worker error:', e);
        this.isFallback = true;
        // Do NOT call resolveReady() here — let the timeout handle it so any
        // pending validateWords call doesn't race against a late READY message.
      };

      // Fetch the word list on the main thread (visible in DevTools Network tab).
      const dictUrl = `${import.meta.env.BASE_URL}dict/enable1.txt`;
      const resp = await fetch(dictUrl);
      if (!resp.ok) throw new Error(`HTTP ${resp.status} ${dictUrl}`);
      const text = await resp.text();
      this.worker.postMessage({ type: 'INIT', text });
    } catch (err) {
      console.error('[DictionaryService] Init failed, falling back to accept-all:', err);
      clearTimeout(timeout);
      this.isFallback = true;
      this.resolveReady();
    }
  }

  private send<T>(msg: object): Promise<T> {
    return new Promise((resolve, reject) => {
      const id = this.idCounter++;
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.worker?.postMessage({ ...msg, id });
    });
  }

  async validateWords(words: string[]): Promise<{ valid: boolean; invalidWords: string[] }> {
    await this.readyPromise;
    if (!this.worker || this.isFallback) return { valid: true, invalidWords: [] };
    const res = await this.send<{ valid: boolean; invalidWords: string[] }>(
      { type: 'VALIDATE', words }
    );
    return res as { valid: boolean; invalidWords: string[] };
  }

  async findBotMove(
    board: Board,
    rack: Tile[],
    rackSize: number,
    bingoBonus: number,
    difficulty: BotDifficulty,
    isFirstMove: boolean
  ): Promise<BotMove | null> {
    await this.readyPromise;
    if (!this.worker || this.isFallback) return null;
    const res = await this.send<{ move: BotMove | null }>(
      { type: 'FIND_MOVES', board, rack, rackSize, bingoBonus, difficulty, isFirstMove }
    );
    return (res as { move: BotMove | null }).move;
  }
}

export const dictionaryService = new DictionaryService();

export async function validateWords(words: string[]): Promise<{
  valid: boolean;
  invalidWords: string[];
}> {
  return dictionaryService.validateWords(words);
}
