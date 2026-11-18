import React, { useEffect, useRef, useState } from 'react';
import {
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputKeyPressEventData,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';

type Props = {
  length?: number;
  onChange?: (values: string[]) => void;
  onComplete?: (code: string) => void;
};

/** Tiny pop when a digit lands in the box — purely visual, the TextInput underneath is untouched. */
function PopOnFill({ filled, children }: { filled: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (filled) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 90 }),
        withSpring(1, { damping: 12, stiffness: 260, mass: 0.5 })
      );
    }
  }, [filled]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

/** 6 individual rounded boxes with auto-advance focus, backspace-to-previous. */
export function OtpBoxes({ length = 6, onChange, onComplete }: Props) {
  const [values, setValues] = useState<string[]>(() => Array(length).fill(''));
  const refs = useRef<Array<TextInput | null>>([]);

  const handleChange = (text: string, index: number) => {
    const char = text.replace(/[^0-9]/g, '').slice(-1);
    const next = [...values];
    next[index] = char;
    setValues(next);
    onChange?.(next);

    if (char) {
      haptic.select();
      if (index < length - 1) {
        refs.current[index + 1]?.focus();
      }
    }
    if (next.every((v) => v !== '')) {
      haptic.success();
      onComplete?.(next.join(''));
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !values[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  return (
    <View className="flex-row justify-between">
      {values.map((v, i) => (
        <PopOnFill key={i} filled={v !== ''}>
          <TextInput
            ref={(r) => {
              refs.current[i] = r;
            }}
            value={v}
            onChangeText={(t) => handleChange(t, i)}
            onKeyPress={(e) => handleKeyPress(e, i)}
            maxLength={1}
            keyboardType="number-pad"
            selectTextOnFocus
            placeholderTextColor={colors.textSecondary}
            className={`w-12 h-14 rounded-input bg-white dark:bg-surface-dark border text-center font-poppins-semibold text-h2 text-text-primary dark:text-text-primary-dark ${
              v ? 'border-primary' : 'border-border-light dark:border-border-dark'
            }`}
          />
        </PopOnFill>
      ))}
    </View>
  );
}
