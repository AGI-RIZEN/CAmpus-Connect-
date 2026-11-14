import React from 'react';
import { Text, type TextProps } from 'react-native';
import { useCountUp } from '@/lib/hooks';

type Props = TextProps & {
  value: number;
  prefix?: string;
  suffix?: string;
  format?: (n: number) => string;
  duration?: number;
  delay?: number;
  className?: string;
};

/** Counts up from 0 to `value` on mount — drop-in replacement for a static number Text. */
export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  format,
  duration = 900,
  delay = 0,
  className = '',
  ...props
}: Props) {
  const current = useCountUp(value, duration, delay);
  const display = format ? format(current) : current.toLocaleString();

  return (
    <Text className={className} {...props}>
      {prefix}
      {display}
      {suffix}
    </Text>
  );
}
