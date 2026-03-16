# Technical Details

## Stack

- **React 19** + **TypeScript** — UI and game logic
- **Vite** — dev server and bundler
- **Tailwind CSS v4** — styling
- **Zustand** + **Immer** — game state management (persisted to `localStorage`)
- **Web Worker** — dictionary trie (ENABLE1 word list) and bot move search run off the main thread

## Getting Started

```bash
npm install
npm run dev      # development server on http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build locally
```

## Architecture

```
src/
├── components/
│   ├── screens/        # MenuScreen, GameScreen, GameOverScreen
│   └── game/           # Board, Tile, rack, overlays, etc.
├── engine/
│   ├── boardGenerator  # createBoard — standard or random bonus layouts
│   ├── placement       # validatePlacement, detectDirection
│   ├── wordExtractor   # extractWords — finds primary + cross-words
│   ├── scoring         # scoreMove — letter/word multipliers + bingo bonus
│   └── dictionary      # DictionaryService — talks to the Web Worker
├── workers/
│   └── dictionary.worker  # Trie build (ENABLE1), VALIDATE, FIND_MOVES
├── store/
│   └── gameStore       # Zustand store — all game actions
├── constants/
│   ├── boardLayouts    # STANDARD_15x15 layout, BOARD_PRESETS
│   └── gameConfig      # DEFAULT_CONFIG
└── types/              # Shared TypeScript interfaces
```

## Board Generation

- **Standard layout** (`randomBonuses: false`, 15×15) — the classic Scrabble bonus pattern.
- **Fixed layout** (`randomBonuses: false`, other sizes) — a deterministic bonus map generated from a fixed seed so the layout is the same every game for that size.
- **Random layout** (`randomBonuses: true`, any size) — a new bonus map generated each game using a mirrored-quadrant algorithm seeded by `boardSeed` in `GameConfig`.

## Dictionary / Bot Worker

The ENABLE1 word list (~172 k words) is fetched on the main thread (visible in DevTools Network), then transferred to the worker which builds a trie. The main thread communicates via `postMessage`:

| Message | Direction | Purpose |
|---------|-----------|---------|
| `INIT { text }` | → worker | Build trie from raw word list |
| `READY` | ← worker | Trie ready (or fallback if build failed) |
| `VALIDATE { words }` | → worker | Check a list of words |
| `VALIDATE_RESULT` | ← worker | `{ valid, invalidWords }` |
| `FIND_MOVES { board, rack, … }` | → worker | Bot move search |
| `MOVES_RESULT` | ← worker | Best `BotMove` or `null` |

Bot move search uses the Appel–Jacobson (Gordon's) algorithm — anchor-square enumeration with left-part generation and right-part extension through the trie.

## ESLint

Type-aware rules can be enabled by replacing `tseslint.configs.recommended` with `tseslint.configs.recommendedTypeChecked` in `eslint.config.js` and adding:

```js
languageOptions: {
  parserOptions: {
    project: ['./tsconfig.node.json', './tsconfig.app.json'],
    tsconfigRootDir: import.meta.dirname,
  },
},
```
