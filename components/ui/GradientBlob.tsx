import React, { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

type BlobSpec = {
  size: number;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  /** [center, edge] — center should carry the alpha, edge should be fully transparent. */
  colors: [string, string];
  /** How far the blob gently drifts, in px. */
  driftRange?: number;
  duration?: number;
};

type Props = {
  blobs?: BlobSpec[];
  style?: ViewStyle;
};

const DEFAULT_BLOBS: BlobSpec[] = [
  { size: 260, top: -80, left: -60, colors: ['#2F6FED4D', '#2F6FED00'], driftRange: 18, duration: 6000 },
  { size: 220, top: 20, right: -70, colors: ['#5B8DFF40', '#5B8DFF00'], driftRange: 22, duration: 7200 },
];

function Blob({ spec }: { spec: BlobSpec }) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: spec.duration ?? 6000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, []);

  const animStyle = useAnimatedStyle(() => {
    const range = spec.driftRange ?? 16;
    return {
      transform: [{ translateX: (t.value - 0.5) * range }, { translateY: (t.value - 0.5) * (range * 0.6) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          width: spec.size,
          height: spec.size,
          borderRadius: spec.size / 2,
          top: spec.top,
          bottom: spec.bottom,
          left: spec.left,
          right: spec.right,
          overflow: 'hidden',
        },
        animStyle,
      ]}
    >
      <LinearGradient colors={spec.colors} style={{ flex: 1 }} start={{ x: 0.25, y: 0.2 }} end={{ x: 1, y: 1 }} />
    </Animated.View>
  );
}

/**
 * Soft ambient animated color blobs, meant to sit behind hero/first-impression screens
 * (onboarding, auth, home headers). Render it as the first child of a `position: relative`
 * container with `overflow: hidden`, so the blobs don't bleed past the screen edge — it fills
 * its parent and ignores touches (`pointerEvents="none"`), so it never blocks taps on content
 * rendered after it.
 */
export function GradientBlob({ blobs = DEFAULT_BLOBS, style }: Props) {
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, style]}>
      {blobs.map((b, i) => (
        <Blob key={i} spec={b} />
      ))}
    </View>
  );
}
