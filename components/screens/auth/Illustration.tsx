import React, { useEffect } from 'react';
import { Text as RNText } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { cardToneClasses, type CardTone } from '@/lib/theme';

type Props = {
  emoji: string;
  size?: number;
  tone?: CardTone;
  /** Escape hatch for tones outside the CardTone palette, e.g. a danger tint. */
  bgClassName?: string;
  /** Gentle idle bob so the hero never feels like a static sticker. On by default. */
  float?: boolean;
};

/**
 * Stand-in for a 3D illustration asset: a big emoji centered inside a soft
 * pastel circle. Used consistently across Splash / Onboarding / OTP /
 * Waiting-approval / Banned wherever the spec calls for a "3D character".
 */
export function Illustration({ emoji, size = 200, tone = 'lavender', bgClassName, float = true }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    if (!float) return;
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [float]);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float ? (t.value - 0.5) * -8 : 0 }],
  }));

  return (
    <Animated.View
      style={[{ width: size, height: size, borderRadius: size / 2 }, floatStyle]}
      className={`items-center justify-center ${bgClassName ?? cardToneClasses[tone]}`}
    >
      <RNText style={{ fontSize: size * 0.4 }}>{emoji}</RNText>
    </Animated.View>
  );
}
