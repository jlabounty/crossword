export type BonusType = 'DL' | 'TL' | 'DW' | 'TW' | 'START' | null;

export const BONUS_LABELS: Record<NonNullable<BonusType>, string> = {
  DL: '2×L',
  TL: '3×L',
  DW: '2×W',
  TW: '3×W',
  START: '★',
};

export const BONUS_COLORS: Record<NonNullable<BonusType>, string> = {
  DL: 'bg-[#219ebc] text-white',
  TL: 'bg-[#023e8a] text-white',
  DW: 'bg-[#e07a5f] text-white',
  TW: 'bg-[#c1121f] text-white',
  START: 'bg-[#e07a5f] text-white',
};
