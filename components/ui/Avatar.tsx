import React from 'react';
import { Image, Text, View } from 'react-native';
import { User } from 'lucide-react-native';
import { cardToneClasses, colors, type CardTone } from '@/lib/theme';

type Props = {
  uri?: string | null;
  /** Used to render initials (and a deterministic color) when there's no `uri`. */
  name?: string;
  size?: number;
  ring?: boolean;
  className?: string;
};

const INITIALS_TONES: CardTone[] = ['lavender', 'mint', 'butter', 'peach', 'sky'];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function toneFor(seed: string): CardTone {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return INITIALS_TONES[hash % INITIALS_TONES.length];
}

/** Renders the real photo when one exists; otherwise a deterministic colored initials circle
 *  (or a generic person icon if no name is available either) — never a stock placeholder photo. */
export function Avatar({ uri, name, size = 40, ring, className = '' }: Props) {
  const ringClass = ring ? 'border-2 border-white dark:border-surface-dark' : '';

  if (uri) {
    return (
      <View style={{ width: size, height: size }} className={`rounded-full ${ringClass} ${className}`}>
        <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: size / 2 }} />
      </View>
    );
  }

  const initials = name ? initialsFor(name) : '';
  const tone = toneFor(name || 'guest');

  return (
    <View
      style={{ width: size, height: size }}
      className={`rounded-full items-center justify-center ${cardToneClasses[tone]} ${ringClass} ${className}`}
    >
      {initials ? (
        <Text
          numberOfLines={1}
          style={{ fontSize: Math.max(10, size * 0.38), lineHeight: Math.max(12, size * 0.44) }}
          className="font-poppins-semibold text-text-primary dark:text-text-primary-dark"
        >
          {initials}
        </Text>
      ) : (
        <User size={size * 0.5} color={colors.textSecondary} />
      )}
    </View>
  );
}
