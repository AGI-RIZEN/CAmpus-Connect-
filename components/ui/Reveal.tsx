import React, { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, withSpring, Easing } from 'react-native-reanimated';

type Props = ViewProps & {
  index?: number;
  baseDelay?: number;
  step?: number;
  className?: string;
  children: React.ReactNode;
  /** Bouncier spring-based entrance instead of the default eased fade+slide — use for cards/
   *  hero elements that should feel more alive than a plain list row. */
  spring?: boolean;
  /** Adds a scale-in (0.9 -> 1) on top of the fade+slide/spring, for standout elements. */
  scaleIn?: boolean;
};

/**
 * Fade+slide-up entrance, staggered by `index`. Wrap list items/cards with this
 * (pass the item's index) to get a cascading reveal instead of a static mount.
 */
export function Reveal({
  index = 0,
  baseDelay = 0,
  step = 60,
  className = '',
  style,
  children,
  spring = false,
  scaleIn = false,
  ...props
}: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const delay = baseDelay + index * step;
    progress.value = withDelay(
      delay,
      spring
        ? withSpring(1, { damping: 16, stiffness: 150, mass: 0.7 })
        : withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    // Opacity is clamped — a spring overshooting past 1 would otherwise briefly warn/clip.
    opacity: Math.min(Math.max(progress.value, 0), 1),
    // translateY/scale are deliberately NOT clamped — letting a spring's overshoot show through
    // slightly past the resting position is exactly what makes `spring` feel bouncier than `fade`.
    transform: [{ translateY: (1 - progress.value) * 14 }, ...(scaleIn ? [{ scale: 0.9 + progress.value * 0.1 }] : [])],
  }));

  return (
    <Animated.View style={[animStyle, style]} className={className} {...props}>
      {children}
    </Animated.View>
  );
}
