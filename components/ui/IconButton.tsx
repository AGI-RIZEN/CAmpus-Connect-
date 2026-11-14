import React from 'react';
import { type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { AnimatedPressable } from './AnimatedPressable';
import { softShadow } from '@/lib/theme';

type Props = Omit<PressableProps, 'style'> & {
  children: React.ReactNode;
  size?: number;
  className?: string;
  variant?: 'white' | 'ink' | 'primary';
  style?: StyleProp<ViewStyle>;
};

const variantClasses: Record<NonNullable<Props['variant']>, string> = {
  white: 'bg-white dark:bg-surface-dark',
  ink: 'bg-ink',
  primary: 'bg-primary',
};

export function IconButton({ children, size = 44, className = '', variant = 'white', style, ...props }: Props) {
  return (
    <AnimatedPressable
      scaleTo={0.9}
      style={[softShadow, { width: size, height: size }, style]}
      className={`rounded-full items-center justify-center ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}
