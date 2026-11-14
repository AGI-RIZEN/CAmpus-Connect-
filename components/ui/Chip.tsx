import React from 'react';
import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { Caption } from './Text';
import { AnimatedPressable } from './AnimatedPressable';

type Props = Omit<PressableProps, 'style'> & {
  label: string;
  active?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
};

export function Chip({ label, active, className = '', ...props }: Props) {
  return (
    <AnimatedPressable
      haptics="select"
      scaleTo={0.94}
      className={`rounded-full px-4 py-2 mr-2 border ${
        active
          ? 'bg-primary border-primary'
          : 'bg-white dark:bg-surface-dark border-border-light dark:border-border-dark'
      } ${className}`}
      {...props}
    >
      <Caption className={active ? 'text-white' : ''}>{label}</Caption>
    </AnimatedPressable>
  );
}
