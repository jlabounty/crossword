export type Letter =
  | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M'
  | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z'
  | '_'; // _ = blank

/**
 * Special properties randomly assigned to ~15% of non-blank tiles at game start.
 *
 * golden  — tile's letter value is ×2 in every word it's part of (now and in future crossings).
 * cursed  — tile's letter value is negated in every word it's part of — a trap for your opponent.
 * volatile — when first placed the word scores ×2; in future crossings it contributes 0.
 */
export type TilePowerUp = 'golden' | 'cursed' | 'volatile';

export const POWER_UP_LABELS: Record<TilePowerUp, string> = {
  golden:   '★',  // letter ×2 always
  cursed:   '✦',  // letter negated always
  volatile: '⚡', // word ×2 on placement, 0 on crossings
};

export const POWER_UP_TITLES: Record<TilePowerUp, string> = {
  golden:   'Golden — letter value ×2 in every word',
  cursed:   'Cursed — letter value negated in every word (trap for opponent)',
  volatile: 'Volatile — word ×2 when placed, 0 contribution when crossed',
};

export interface Tile {
  id: string;
  letter: Letter;
  value: number;
  isBlank: boolean;
  playedAs?: Letter;  // letter assigned to blank when placed
  powerUp?: TilePowerUp;
}
