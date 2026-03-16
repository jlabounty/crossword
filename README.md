# Word Board

A browser-based word-placement game for 1–4 players, playable entirely offline.

## How to Play

Place letter tiles on the board to form words, Scrabble-style:

- **First move** must cover the center star square.
- Every move after that must connect to at least one tile already on the board.
- Tiles placed in a single turn must form one contiguous line (horizontal or vertical).
- All words created or extended by your placement (including cross-words) must be real words.
- Score is calculated from letter values and any bonus squares covered.

### Bonus Squares

| Square | Effect |
|--------|--------|
| **DL** (light blue) | Double the value of that letter |
| **TL** (dark blue) | Triple the value of that letter |
| **DW** (coral) | Double the word score |
| **TW** (red) | Triple the word score |
| ★ (center) | Double word score on the first move |

Letter and word multipliers stack — a tile on a TL inside a DW word gets tripled then doubled.
Bonuses are consumed after the first use.

Playing all 7 rack tiles in one turn earns a **50-point bingo bonus**.

### Special Tiles

- **Blank tiles** can represent any letter but are worth 0 points. When you place one, you'll be prompted to choose which letter it acts as.

### Turn Options

- **Play** — validate and commit your current placement.
- **Recall** — return all tiles from the board back to your rack.
- **Pass** — skip your turn (no points scored).
- **Swap** — exchange any number of tiles from your rack with random tiles from the bag (only available while tiles remain in the bag).

## Game Setup

| Option | Description |
|--------|-------------|
| **Board size** | 15×15 (standard), 11×11, 20×20, or any custom N×M (5–40 per side) |
| **Random Bonuses** | Toggle off for the classic fixed Scrabble layout on 15×15; toggle on for a freshly-generated layout each game |
| **Players** | 1–4 human or bot players |
| **Bot difficulty** | Easy · Medium · Hard |

## Game End

The game ends when:
- A player empties their rack after the tile bag is exhausted, **or**
- All players pass (or score zero) for two full rounds.

Final scores are adjusted: each player loses points equal to the sum of tiles remaining on their rack, and the player who went out gains those points from all opponents.

---

See [TECHNICAL.md](TECHNICAL.md) for build instructions and architecture details.
