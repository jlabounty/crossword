/**
 * DictionaryService — fetches the word list on the main thread then hands it
 * to the Web Worker to build the Trie.  Fetching here (rather than inside the
 * worker) makes the network request visible in browser DevTools and avoids
 * any worker-context URL-resolution quirks.
 */

import type { Board, Tile, BotDifficulty } from '@/types';
import type { BotMove } from '@/workers/dictionary.worker';

type WorkerResponse =
  | { type: 'READY'; fallback?: boolean }
  | { type: 'VALIDATE_RESULT'; id: number; valid: boolean; invalidWords: string[] }
  | { type: 'MOVES_RESULT'; id: number; move: BotMove | null };

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
    try {
      this.worker = new Worker(
        new URL('../workers/dictionary.worker.ts', import.meta.url),
        { type: 'classic' }
      );
      this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
        const msg = e.data;
        if (msg.type === 'READY') {
          this.isReady = true;
          this.isFallback = !!msg.fallback;
          this.resolveReady();
          return;
        }
        const handler = this.pending.get(msg.id);
        if (handler) {
          this.pending.delete(msg.id);
          handler.resolve(msg);
        }
      };
      this.worker.onerror = (e) => {
        console.error('[DictionaryService] Worker error:', e);
        this.isFallback = true;
        this.resolveReady();
      };

      // Fetch the word list here on the main thread so it appears in DevTools
      // Network tab and we get clear error messages if it 404s.
      const dictUrl = `${import.meta.env.BASE_URL}dict/enable1.txt`;
      const resp = await fetch(dictUrl);
      if (!resp.ok) throw new Error(`Failed to fetch dict: HTTP ${resp.status} ${dictUrl}`);
      const text = await resp.text();
      // Hand the raw text to the worker — it will build the Trie there.
      this.worker.postMessage({ type: 'INIT', text });
    } catch (err) {
      console.error('[DictionaryService] Init failed, falling back to accept-all:', err);
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

// Singleton — one worker for the whole app lifetime
export const dictionaryService = new DictionaryService();

export async function validateWords(words: string[]): Promise<{
  valid: boolean;
  invalidWords: string[];
}> {
  return dictionaryService.validateWords(words);
}
