import React from 'react';
import { View, Text as RNText } from 'react-native';
import { cardToneClasses, type CardTone } from '@/lib/theme';

type Props = {
  emoji: string;
  size?: number;
  tone?: CardTone;
  /** Escape hatch for tones outside the CardTone palette, e.g. a danger tint. */
  bgClassName?: string;
};

/**
 * Stand-in for a 3D illustration asset: a big emoji centered inside a soft
 * pastel circle. Used consistently across Splash / Onboarding / OTP /
 * Waiting-approval / Banned wherever the spec calls for a "3D character".
 */
export function Illustration({ emoji, size = 200, tone = 'lavender', bgClassName }: Props) {
  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={`items-center justify-center ${bgClassName ?? cardToneClasses[tone]}`}
    >
      <RNText style={{ fontSize: size * 0.4 }}>{emoji}</RNText>
    </View>
  );
}
