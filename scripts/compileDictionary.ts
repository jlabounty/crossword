/**
 * Downloads the ENABLE1 public-domain word list and writes a processed copy
 * to public/dict/enable1.txt (one uppercase word per line, 2+ letters, sorted).
 *
 * Usage:  npm run build:dict
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const WORD_LIST_URL =
  'https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt';
const OUTPUT_DIR = join(process.cwd(), 'public', 'dict');
const OUTPUT_PATH = join(OUTPUT_DIR, 'enable1.txt');

async function run() {
  console.log(`Downloading ENABLE1 word list from ${WORD_LIST_URL}...`);

  const resp = await fetch(WORD_LIST_URL);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  const text = await resp.text();

  const words = [
    ...new Set(
      text
        .split('\n')
        .map(w => w.trim().toUpperCase())
        .filter(w => w.length >= 2 && /^[A-Z]+$/.test(w))
    ),
  ].sort();

  mkdirSync(OUTPUT_DIR, { recursive: true });
  writeFileSync(OUTPUT_PATH, words.join('\n'), 'utf8');
  console.log(`✓ Wrote ${words.length} words → ${OUTPUT_PATH}`);
}

if (!existsSync(OUTPUT_PATH)) {
  run().catch(err => {
    console.error('Failed to build dictionary:', err.message);
    process.exit(1);
  });
} else {
  console.log(`Dictionary already exists at ${OUTPUT_PATH} (delete to re-download)`);
}
