// Campus Connect design tokens, mirrored from tailwind.config.js for use in
// contexts that need raw values (icon colors, gradients, chart fills, RN shadow props).

export const colors = {
  background: '#F6F5FA',
  backgroundDark: '#0F0E14',
  surface: '#FFFFFF',
  surfaceDark: '#1C1B24',
  primary: '#7C5CFA',
  primaryDark: '#9478FF',
  ink: '#16151C',
  textPrimary: '#16151C',
  textSecondary: '#6B6A75',
  textPrimaryDark: '#F5F4FA',
  textSecondaryDark: '#A6A4B3',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  borderLight: '#ECEAF4',
  borderDark: '#2A2933',
  card: {
    lavender: '#E9E3FF',
    mint: '#DDF1EA',
    butter: '#FFF1C7',
    peach: '#FFE4D6',
    sky: '#DCEBFF',
  },
  cardDark: {
    lavender: '#2C2B36',
    mint: '#2B2C34',
    butter: '#2E2C31',
    peach: '#2E2B32',
    sky: '#2B2C36',
  },
} as const;

export type CardTone = keyof typeof colors.card;

export const cardToneClasses: Record<CardTone, string> = {
  lavender: 'bg-card-lavender dark:bg-card-lavender-dark',
  mint: 'bg-card-mint dark:bg-card-mint-dark',
  butter: 'bg-card-butter dark:bg-card-butter-dark',
  peach: 'bg-card-peach dark:bg-card-peach-dark',
  sky: 'bg-card-sky dark:bg-card-sky-dark',
};

// Soft shadow: 0 8 24, 6% opacity — RN needs discrete shadow* props (iOS) + elevation (Android).
export const softShadow = {
  shadowColor: '#16151C',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 4,
} as const;

export const softShadowLg = {
  shadowColor: '#16151C',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.1,
  shadowRadius: 32,
  elevation: 8,
} as const;
