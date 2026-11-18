import React, { useEffect } from 'react';
import type { ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

type Props = ViewProps & {
  /** How far the content gently drifts, in px (vertical drift is ~60% of this). */
  range?: number;
  duration?: number;
  children: React.ReactNode;
};

/**
 * Wraps children in a slow, continuous back-and-forth drift — the same ambient-motion technique
 * `GradientBlob.tsx` uses for its blobs, generalized so any small decorative element (e.g. the
 * floating accent dots on auth screens) can share it instead of sitting static once its entrance
 * animation finishes.
 */
export function Drift({ range = 14, duration = 5000, children, style, ...props }: Props) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (t.value - 0.5) * range }, { translateY: (t.value - 0.5) * (range * 0.6) }],
  }));

  return (
    <Animated.View style={[animStyle, style]} {...props}>
      {children}
    </Animated.View>
  );
}
