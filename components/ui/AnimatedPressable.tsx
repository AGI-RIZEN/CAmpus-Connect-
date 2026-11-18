import React, { useEffect, useState } from 'react';
import { Pressable, type LayoutChangeEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';

const AnimatedPressableBase = Animated.createAnimatedComponent(Pressable);
const CHUNK_OFFSET = 4;
const SHINE_BAND_RATIO = 0.5;

type Props = Omit<PressableProps, 'style' | 'onPressIn' | 'onPressOut' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  className?: string;
  children?: React.ReactNode;
  scaleTo?: number;
  haptics?: 'tap' | 'select' | 'none';
  /** Adds a soft shadow-glow bloom on release, on top of the usual press-scale — for primary
   *  CTAs that should feel extra tactile rather than just shrinking and snapping back. */
  lift?: boolean;
  /** Adds a "chunky 3D button" feel: a resting bottom lip (via borderBottomWidth) that the
   *  button presses down into on tap — the classic Duolingo-style tactile button. Pairs well
   *  with rounded-full/rounded-card shapes; the border still respects the shape's radius. */
  chunky?: boolean;
  /** A single soft highlight sweep across the button, once, shortly after mount — draws the
   *  eye to a CTA on a screen the user sees rarely (first-impression screens), rather than
   *  something that would get visually noisy on a button seen repeatedly. */
  shine?: boolean;
};

/**
 * Drop-in Pressable with a quick press-scale animation + haptic feedback baked in.
 * Used under the hood by Button/IconButton/Chip so the whole app gets this for free.
 */
export function AnimatedPressable({
  style,
  scaleTo = 0.96,
  haptics = 'tap',
  lift = false,
  chunky = false,
  shine = false,
  onPress,
  disabled,
  children,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const glow = useSharedValue(0);
  const press = useSharedValue(0); // 0 = resting (lip showing), 1 = pressed (lip collapsed)
  const shineX = useSharedValue(0);
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    if (!shine || !boxWidth) return;
    shineX.value = -boxWidth * SHINE_BAND_RATIO;
    shineX.value = withDelay(
      450,
      withTiming(boxWidth * (1 + SHINE_BAND_RATIO), { duration: 850, easing: Easing.out(Easing.cubic) })
    );
  }, [shine, boxWidth]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      ...(chunky ? [{ translateY: press.value * CHUNK_OFFSET }] : []),
    ],
    ...(lift ? { shadowOpacity: 0.1 + glow.value * 0.22, shadowRadius: 10 + glow.value * 16 } : {}),
    ...(chunky ? { borderBottomWidth: (1 - press.value) * CHUNK_OFFSET } : {}),
  }));

  const shineStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shineX.value }] }));

  return (
    <AnimatedPressableBase
      style={[
        lift ? { shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, elevation: 4 } : null,
        chunky ? { borderBottomColor: 'rgba(0,0,0,0.18)' } : null,
        shine ? { overflow: 'hidden' } : null,
        animStyle,
        style,
      ]}
      disabled={disabled}
      onLayout={(e: LayoutChangeEvent) => {
        if (shine) setBoxWidth(e.nativeEvent.layout.width);
        props.onLayout?.(e);
      }}
      onPressIn={() => {
        scale.value = withTiming(scaleTo, { duration: 80 });
        if (lift) glow.value = withTiming(0, { duration: 80 });
        if (chunky) press.value = withTiming(1, { duration: 70 });
      }}
      onPressOut={() => {
        scale.value = withTiming(1, { duration: 140 });
        if (lift) {
          glow.value = withTiming(1, { duration: 180 }, (finished) => {
            if (finished) glow.value = withTiming(0, { duration: 280 });
          });
        }
        if (chunky) press.value = withSpring(0, { damping: 9, stiffness: 220 });
      }}
      onPress={(e) => {
        if (!disabled) {
          if (haptics === 'tap') haptic.tap();
          else if (haptics === 'select') haptic.select();
        }
        onPress?.(e);
      }}
      {...props}
    >
      {children}
      {shine && boxWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: 'absolute', top: 0, bottom: 0, width: boxWidth * SHINE_BAND_RATIO }, shineStyle]}
        >
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.45)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </AnimatedPressableBase>
  );
}
