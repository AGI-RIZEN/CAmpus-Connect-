import React, { useEffect } from 'react';
import { type ViewProps } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

type Props = ViewProps & {
  /** Only pulse when true — e.g. `notice.category === 'Urgent'`. Defaults to on. */
  active?: boolean;
  /** Ms to wait before the pulse — tune so it lands just after the card's `Reveal` finishes. */
  delay?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * One-time, gentle "look here" pulse (1 -> 1.06 -> 1) on mount. Meant for the Urgent category
 * badge on notice cards: it draws the eye once as the card settles in, then stays still —
 * deliberately NOT a looping animation, so it never becomes distracting.
 */
export function AttentionPulse({ active = true, delay = 480, className = '', style, children, ...props }: Props) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!active) return;
    scale.value = withDelay(
      delay,
      withSequence(
        withTiming(1.06, { duration: 180, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 280, easing: Easing.inOut(Easing.quad) })
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, style]} className={`self-start ${className}`} {...props}>
      {children}
    </Animated.View>
  );
}
