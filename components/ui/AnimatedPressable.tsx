import React from 'react';
import { Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut'> & {
  style?: StyleProp<ViewStyle>;
  className?: string;
  scaleTo?: number;
  haptics?: 'tap' | 'select' | 'none';
};

/**
 * Drop-in Pressable with a quick press-scale animation + haptic feedback baked in.
 * Used under the hood by Button/IconButton/Chip so the whole app gets this for free.
 */
export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  haptics = 'tap',
  onPress,
  disabled,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressableBase
      style={[animStyle, style]}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 80 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
      }}
      onPress={(e) => {
        if (!disabled) {
          if (haptics === 'tap') haptic.tap();
          else if (haptics === 'select') haptic.select();
        }
        onPress?.(e);
      }}
      {...props}
    />
  );
}
