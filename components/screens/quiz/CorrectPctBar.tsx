import React, { useEffect } from 'react';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

export function CorrectPctBar({ pct, index }: { pct: number; index: number }) {
  const target = Math.min(Math.max(pct, 0), 100);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(index * 90, withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [target]);

  const style = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  return <Animated.View style={style} className="h-full rounded-full bg-danger" />;
}
