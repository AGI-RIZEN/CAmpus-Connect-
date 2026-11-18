// Campus Connect design tokens, mirrored from tailwind.config.js for use in
// contexts that need raw values (icon colors, gradients, chart fills, RN shadow props).

export const colors = {
  background: '#F6F7FB',
  backgroundDark: '#0E1116',
  surface: '#FFFFFF',
  surfaceDark: '#171B22',
  primary: '#2F6FED',
  primaryDark: '#5B8DFF',
  ink: '#101828',
  textPrimary: '#101828',
  textSecondary: '#5B6472',
  textPrimaryDark: '#F2F4F8',
  textSecondaryDark: '#9AA3B2',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  borderLight: '#E4E7EE',
  borderDark: '#242A33',
  card: {
    lavender: '#E3E8F5',
    mint: '#DCEEEA',
    butter: '#F5ECD7',
    peach: '#F5E2DC',
    sky: '#DCEAF8',
  },
  cardDark: {
    lavender: '#222838',
    mint: '#1E2A29',
    butter: '#2A2721',
    peach: '#2A221F',
    sky: '#1E2733',
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
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.06,
  shadowRadius: 24,
  elevation: 4,
} as const;

export const softShadowLg = {
  shadowColor: '#101828',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.1,
  shadowRadius: 32,
  elevation: 8,
} as const;
