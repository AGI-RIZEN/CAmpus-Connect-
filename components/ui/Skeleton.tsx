import React, { useEffect, useState } from 'react';
import { View, type DimensionValue, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing } from 'react-native-reanimated';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
};

const SHIMMER_BAND_RATIO = 0.55; // shimmer highlight band, as a fraction of the skeleton's own width

export function Skeleton({ width = '100%', height = 16, radius = 10, className = '' }: Props) {
  const [boxWidth, setBoxWidth] = useState(0);
  const translateX = useSharedValue(0);

  useEffect(() => {
    if (!boxWidth) return;
    translateX.value = -boxWidth * SHIMMER_BAND_RATIO;
    translateX.value = withRepeat(withTiming(boxWidth, { duration: 1100, easing: Easing.linear }), -1, false);
  }, [boxWidth]);

  const shimmerStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setBoxWidth(e.nativeEvent.layout.width)}
      style={{ width, height, borderRadius: radius, overflow: 'hidden' }}
      className={`bg-card-lavender dark:bg-card-lavender-dark ${className}`}
    >
      {boxWidth > 0 && (
        <Animated.View
          style={[{ position: 'absolute', top: 0, bottom: 0, width: boxWidth * SHIMMER_BAND_RATIO }, shimmerStyle]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

export function SkeletonCard() {
  return (
    <View className="rounded-card bg-white dark:bg-surface-dark p-5">
      <View className="flex-row items-center mb-4">
        <Skeleton width={44} height={44} radius={22} />
        <View className="ml-3 flex-1">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} className="mt-2" />
        </View>
      </View>
      <Skeleton height={140} radius={20} />
      <Skeleton width="80%" height={14} className="mt-4" />
    </View>
  );
}
