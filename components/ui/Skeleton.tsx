import React, { useEffect } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

type Props = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
};

export function Skeleton({ width = '100%', height = 16, radius = 10, className = '' }: Props) {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 700 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[style, { width, height, borderRadius: radius }]}
      className={`bg-card-lavender dark:bg-card-lavender-dark ${className}`}
    />
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
