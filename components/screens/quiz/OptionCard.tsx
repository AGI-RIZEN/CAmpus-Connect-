import React from 'react';
import { View } from 'react-native';
import { BodyMedium } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { softShadow } from '@/lib/theme';

const LETTERS = ['A', 'B', 'C', 'D'];

type Props = {
  index: number;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ index, label, selected, onPress }: Props) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.97}
      haptics="select"
      style={softShadow}
      className={`flex-row items-center rounded-card px-4 py-4 mb-3 ${
        selected ? 'bg-primary' : 'bg-white dark:bg-surface-dark'
      }`}
    >
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          selected ? 'bg-white/20' : 'bg-card-lavender dark:bg-card-lavender-dark'
        }`}
      >
        <BodyMedium className={selected ? 'text-white' : ''}>{LETTERS[index]}</BodyMedium>
      </View>
      <BodyMedium className={`flex-1 ${selected ? 'text-white' : ''}`}>{label}</BodyMedium>
    </AnimatedPressable>
  );
}
