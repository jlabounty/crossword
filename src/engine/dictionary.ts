// Phase 1: accept all words (no dictionary loaded yet).
// Phase 2 will replace this with DAWG Web Worker integration.

export async function validateWords(words: string[]): Promise<{
  valid: boolean;
  invalidWords: string[];
}> {
  // Stub: always valid in Phase 1
  void words;
  return { valid: true, invalidWords: [] };
}
