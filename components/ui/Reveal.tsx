import React, { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';

type Props = ViewProps & {
  index?: number;
  baseDelay?: number;
  step?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fade+slide-up entrance, staggered by `index`. Wrap list items/cards with this
 * (pass the item's index) to get a cascading reveal instead of a static mount.
 */
export function Reveal({ index = 0, baseDelay = 0, step = 60, className = '', style, children, ...props }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      baseDelay + index * step,
      withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 14 }],
  }));

  return (
    <Animated.View style={[animStyle, style]} className={className} {...props}>
      {children}
    </Animated.View>
  );
}
