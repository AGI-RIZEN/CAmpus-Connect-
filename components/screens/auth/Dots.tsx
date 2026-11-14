import React from 'react';
import { View } from 'react-native';

type Props = {
  count: number;
  activeIndex: number;
  className?: string;
};

/** Small pill dot indicator — active dot is wider and violet. */
export function Dots({ count, activeIndex, className = '' }: Props) {
  return (
    <View className={`flex-row items-center ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          className={`h-2 rounded-full mr-1.5 ${
            i === activeIndex ? 'w-6 bg-primary' : 'w-2 bg-border-light dark:bg-border-dark'
          }`}
        />
      ))}
    </View>
  );
}
