import React from 'react';
import { View } from 'react-native';
import { ArrowUpRight } from 'lucide-react-native';
import { Card } from './Card';
import { Caption, H1 } from './Text';
import { AnimatedCounter } from './AnimatedCounter';
import { AnimatedPressable } from './AnimatedPressable';
import type { CardTone } from '@/lib/theme';

type Props = {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: CardTone;
  onPress?: () => void;
  className?: string;
  /** When set, animates the number counting up from 0 instead of rendering `value` statically. */
  animateValue?: number;
  animateFormat?: (n: number) => string;
  animateDelay?: number;
};

export function StatCard({
  icon,
  label,
  value,
  tone,
  onPress,
  className = '',
  animateValue,
  animateFormat,
  animateDelay = 0,
}: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={!onPress}
      haptics="select"
      scaleTo={0.97}
      className={className}
    >
      <Card tone={tone} className="justify-between min-h-[140px]">
        <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/15 items-center justify-center">
          {icon}
        </View>
        <View className="flex-row items-end justify-between mt-3">
          <View className="flex-1 pr-2">
            {animateValue !== undefined ? (
              <AnimatedCounter
                value={animateValue}
                format={animateFormat}
                delay={animateDelay}
                className="font-poppins-semibold text-h1 text-text-primary dark:text-text-primary-dark"
              />
            ) : (
              <H1>{value}</H1>
            )}
            <Caption className="mt-0.5">{label}</Caption>
          </View>
          {onPress && (
            <View className="w-8 h-8 rounded-full bg-ink items-center justify-center">
              <ArrowUpRight size={16} color="#fff" />
            </View>
          )}
        </View>
      </Card>
    </AnimatedPressable>
  );
}
