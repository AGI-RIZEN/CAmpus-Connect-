import React, { useEffect, useRef } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  liked: boolean;
  size?: number;
  /** Color when not liked — defaults to the secondary text color. */
  idleColor?: string;
};

/**
 * Heart icon that "pops" (quick squash → spring overshoot) whenever `liked` flips to true, and
 * blooms a soft red halo behind it. Purely presentational — the parent still owns the like state
 * and the API call; this just reacts to the prop changing. Mirrors the BottomNav tab-icon bounce.
 */
export function LikeHeart({ liked, size = 22, idleColor = colors.textSecondary }: Props) {
  const scale = useSharedValue(1);
  const halo = useSharedValue(0);
  const mounted = useRef(false);

  useEffect(() => {
    // Skip the mount pass so an already-liked post doesn't bounce when it first scrolls in.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (liked) {
      scale.value = withSequence(
        withTiming(0.7, { duration: 70 }),
        withSpring(1.25, { damping: 7, stiffness: 260, mass: 0.5 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
      halo.value = 0;
      halo.value = withSequence(withTiming(1, { duration: 160 }), withTiming(0, { duration: 420 }));
    } else {
      scale.value = withSequence(withTiming(0.85, { duration: 80 }), withSpring(1, { damping: 12, stiffness: 220 }));
    }
  }, [liked]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value * 0.35,
    transform: [{ scale: 0.6 + halo.value * 1.4 }],
  }));

  const haloSize = size * 1.6;

  return (
    <Animated.View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, iconStyle]}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            width: haloSize,
            height: haloSize,
            borderRadius: haloSize / 2,
            backgroundColor: colors.danger,
          },
          haloStyle,
        ]}
      />
      <Heart size={size} color={liked ? colors.danger : idleColor} fill={liked ? colors.danger : 'none'} />
    </Animated.View>
  );
}
