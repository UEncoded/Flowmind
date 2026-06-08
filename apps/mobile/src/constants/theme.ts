// ─── FlowMind Mobile Design Tokens ────────────────────────

export const Colors = {
  // Backgrounds
  bgBase:    '#0a0b0f',
  bgSubtle:  '#12141a',
  bgMuted:   '#1a1d26',
  bgCard:    '#1e2130',
  bgHover:   '#252840',

  // Borders
  borderFaint:   'rgba(255,255,255,0.06)',
  borderSubtle:  'rgba(255,255,255,0.10)',
  borderDefault: 'rgba(255,255,255,0.15)',
  borderStrong:  'rgba(255,255,255,0.22)',

  // Text
  textPrimary:   '#f0f2ff',
  textSecondary: '#9aa0c4',
  textMuted:     '#5c6388',
  textDisabled:  '#3a3f5c',

  // Brand
  accent:        '#6c63ff',
  accentLight:   '#8b83ff',
  accentLighter: '#b3acff',
  accentBg:      'rgba(108,99,255,0.10)',

  // Semantic
  teal:    '#00d4aa',
  tealBg:  'rgba(0,212,170,0.08)',
  coral:   '#ff6b6b',
  coralBg: 'rgba(255,107,107,0.08)',
  amber:   '#ffd166',
  amberBg: 'rgba(255,209,102,0.08)',
  pink:    '#f72585',
  pinkBg:  'rgba(247,37,133,0.08)',
  green:   '#06d6a0',
  greenBg: 'rgba(6,214,160,0.08)',
} as const

export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  xxxl: 32,
} as const

export const Radius = {
  sm:   6,
  md:   10,
  lg:   14,
  xl:   20,
  pill: 999,
} as const

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   16,
  lg:   18,
  xl:   22,
  xxl:  26,
  xxxl: 32,
} as const

export const gradientAccent = ['#6c63ff', '#534ab7'] as const
export const gradientTeal   = ['#6c63ff', '#00d4aa'] as const
export const gradientWarm   = ['#f72585', '#ffd166'] as const
