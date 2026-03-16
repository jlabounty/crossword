/**
 * Phase 2 script: compile a word list text file into a DAWG binary.
 *
 * Usage:
 *   1. Place enable1.txt (one word per line) at scripts/words/enable1.txt
 *   2. Run: npm run build:dict
 *   3. Output: public/dict/enable1.dawg
 *
 * TODO (Phase 2): implement DAWG construction and binary serialization.
 */

import { existsSync } from 'fs';
import { join } from 'path';

const wordListPath = join(process.cwd(), 'scripts', 'words', 'enable1.txt');
const outputPath = join(process.cwd(), 'public', 'dict', 'enable1.dawg');

if (!existsSync(wordListPath)) {
  console.log(`Word list not found at ${wordListPath}`);
  console.log('Download enable1.txt from https://github.com/dolph/dictionary and place it there.');
  process.exit(0);
}

console.log(`Building DAWG from ${wordListPath} → ${outputPath}`);
console.log('TODO: DAWG compilation not yet implemented (Phase 2)');
