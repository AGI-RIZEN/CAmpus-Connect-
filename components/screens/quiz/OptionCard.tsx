import React, { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { BodyMedium } from '@/components/ui/Text';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';

const LETTERS = ['A', 'B', 'C', 'D'];

type Props = {
  index: number;
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ index, label, selected, onPress }: Props) {
  // Selection feedback lives on an outer wrapper so it never fights AnimatedPressable's own
  // press-scale transform: the card gives a short springy "pop" when it becomes selected, and
  // the letter bubble gets a slightly bigger pop so the eye lands on the chosen answer.
  const cardScale = useSharedValue(1);
  const letterScale = useSharedValue(1);

  useEffect(() => {
    if (selected) {
      cardScale.value = withSequence(
        withSpring(1.035, { damping: 9, stiffness: 320, mass: 0.5 }),
        withSpring(1, { damping: 14, stiffness: 220, mass: 0.5 })
      );
      letterScale.value = withSequence(
        withSpring(1.22, { damping: 7, stiffness: 340, mass: 0.5 }),
        withSpring(1, { damping: 12, stiffness: 240, mass: 0.5 })
      );
    } else {
      cardScale.value = withTiming(1, { duration: 140 });
      letterScale.value = withTiming(1, { duration: 140 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));
  const letterStyle = useAnimatedStyle(() => ({ transform: [{ scale: letterScale.value }] }));

  return (
    <Animated.View style={cardStyle} className="mb-3">
      <AnimatedPressable
        onPress={onPress}
        scaleTo={0.97}
        haptics="select"
        lift
        className={`flex-row items-center rounded-card px-4 py-4 ${
          selected ? 'bg-primary' : 'bg-white dark:bg-surface-dark'
        }`}
      >
        <Animated.View
          style={letterStyle}
          className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
            selected ? 'bg-white/20' : 'bg-card-lavender dark:bg-card-lavender-dark'
          }`}
        >
          <BodyMedium className={selected ? 'text-white' : ''}>{LETTERS[index]}</BodyMedium>
        </Animated.View>
        <BodyMedium className={`flex-1 ${selected ? 'text-white' : ''}`}>{label}</BodyMedium>
      </AnimatedPressable>
    </Animated.View>
  );
}
