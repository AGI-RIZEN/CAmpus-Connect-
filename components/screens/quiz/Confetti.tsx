import React, { useEffect, useMemo } from 'react';
import { Dimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Pulled straight from design tokens so the burst reads as "part of the app", not generic confetti.
const PIECE_COLORS = [
  colors.primary,
  colors.success,
  colors.warning,
  colors.card.butter,
  colors.card.peach,
  colors.card.sky,
];
const EMOJIS = ['🎉', '✨', '🎊', '⭐'];
const PIECE_COUNT = 26;

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Roughly 1-in-5 pieces is a sparkle emoji; the rest are tumbling colored chips/dots —
  // mixing the two keeps the burst from looking mechanically uniform.
  const isEmoji = index % 5 === 0;
  const isCircle = index % 3 === 0;

  const left = useMemo(() => Math.random() * (SCREEN_WIDTH - 24), []);
  const delay = useMemo(() => Math.random() * 400, []);
  const fallDuration = useMemo(() => 1300 + Math.random() * 900, []);
  const fallDistance = useMemo(() => 240 + Math.random() * 180, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 90, []);
  const spin = useMemo(() => (Math.random() - 0.5) * 560, []);
  const chipSize = useMemo(() => 6 + Math.random() * 7, []);
  const fontSize = useMemo(() => 16 + Math.random() * 10, []);
  const color = useMemo(() => PIECE_COLORS[Math.floor(Math.random() * PIECE_COLORS.length)], []);
  const emoji = EMOJIS[index % EMOJIS.length];

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(fallDistance, { duration: fallDuration, easing: Easing.out(Easing.quad) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(drift, { duration: fallDuration, easing: Easing.inOut(Easing.sin) })
    );
    rotate.value = withDelay(delay, withTiming(spin, { duration: fallDuration, easing: Easing.linear }));
    opacity.value = withDelay(delay + fallDuration * 0.55, withTiming(0, { duration: fallDuration * 0.45 }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  if (isEmoji) {
    return (
      <Animated.Text style={[{ position: 'absolute', left, top: 0, fontSize }, style]}>
        {emoji}
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left,
          top: 0,
          width: chipSize,
          height: isCircle ? chipSize : chipSize * 2.2,
          borderRadius: isCircle ? chipSize / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

/** A brief, one-shot confetti flourish — mount it once when the result screen appears. */
export function Confetti() {
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420, zIndex: 10 }}
    >
      {Array.from({ length: PIECE_COUNT }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
}
