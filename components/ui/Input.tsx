import React, { useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming, interpolateColor } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { Eye, EyeOff } from 'lucide-react-native';
import { Caption } from './Text';
import { colors } from '@/lib/theme';

type Props = TextInputProps & {
  label?: string;
  className?: string;
  secure?: boolean;
  leftIcon?: React.ReactNode;
  error?: string;
};

/** Animated border/glow on focus instead of a static border — every form in the app uses this
 *  one component, so the whole app's inputs feel more responsive for free. Error state still
 *  wins outright (a plain, unambiguous red border, not blended with the focus animation). */
export function Input({ label, className = '', secure, leftIcon, error, onFocus, onBlur, ...props }: Props) {
  const [hidden, setHidden] = useState(true);
  const isSecure = secure && hidden;
  const { colorScheme } = useColorScheme();
  const focused = useSharedValue(0);

  const restingBorder = colorScheme === 'dark' ? colors.borderDark : colors.borderLight;

  const animatedStyle = useAnimatedStyle(() => {
    if (error) return {};
    return {
      borderColor: interpolateColor(focused.value, [0, 1], [restingBorder, colors.primary]),
      shadowOpacity: focused.value * 0.18,
    };
  });

  return (
    <View className={className}>
      {label && <Caption className="mb-2">{label}</Caption>}
      <Animated.View
        style={[
          { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowRadius: 8, elevation: 0 },
          animatedStyle,
        ]}
        className={`flex-row items-center rounded-input bg-white dark:bg-surface-dark border px-4 ${
          error ? 'border-danger' : ''
        }`}
      >
        {leftIcon && <View className="mr-2">{leftIcon}</View>}
        <TextInput
          placeholderTextColor={colors.textSecondary}
          secureTextEntry={isSecure}
          className="flex-1 py-3.5 font-poppins text-body text-text-primary dark:text-text-primary-dark"
          onFocus={(e) => {
            focused.value = withTiming(1, { duration: 180 });
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focused.value = withTiming(0, { duration: 180 });
            onBlur?.(e);
          }}
          {...props}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} className="pl-2 py-1">
            {hidden ? (
              <EyeOff size={20} color={colors.textSecondary} />
            ) : (
              <Eye size={20} color={colors.textSecondary} />
            )}
          </Pressable>
        )}
      </Animated.View>
      {error && <Caption className="text-danger mt-1">{error}</Caption>}
    </View>
  );
}
