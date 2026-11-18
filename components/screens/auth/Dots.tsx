import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';

type Props = {
  count: number;
  activeIndex: number;
  className?: string;
};

const ACTIVE_WIDTH = 24;
const IDLE_WIDTH = 8;

function Dot({ active }: { active: boolean }) {
  // Width springs between pill and dot so the indicator "slides" into place instead of snapping.
  const style = useAnimatedStyle(() => ({
    width: withSpring(active ? ACTIVE_WIDTH : IDLE_WIDTH, { damping: 16, stiffness: 220, mass: 0.6 }),
  }));

  return (
    <Animated.View
      style={style}
      className={`h-2 rounded-full mr-1.5 ${active ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
    />
  );
}

/** Small pill dot indicator — active dot is wider and violet. */
export function Dots({ count, activeIndex, className = '' }: Props) {
  return (
    <View className={`flex-row items-center ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Dot key={i} active={i === activeIndex} />
      ))}
    </View>
  );
}
