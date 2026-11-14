import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  size?: number;
  strokeWidth?: number;
  progress: number; // 0-1
  color: string;
  trackColor?: string;
  children?: React.ReactNode;
  /** ms to ease toward a new progress value — short for a ticking timer, long for a "fill in" reveal. */
  duration?: number;
};

export function ProgressRing({
  size = 72,
  strokeWidth = 7,
  progress,
  color,
  trackColor = '#ECEAF4',
  children,
  duration = 400,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, { duration });
  }, [clamped]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      {children}
    </View>
  );
}

/** Half-circle gauge used on the quiz result screen — fills in smoothly on mount. */
export function SemiGauge({
  size = 220,
  strokeWidth = 18,
  progress,
  color,
  trackColor = '#ECEAF4',
  children,
  duration = 900,
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;
  const clamped = Math.min(Math.max(progress, 0), 1);
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(clamped, { duration });
  }, [clamped]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={{ width: size, height: size / 2 + strokeWidth / 2 }} className="items-center">
      <Svg width={size} height={size / 2 + strokeWidth} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference * 2}`}
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
          strokeLinecap="round"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference * 2}`}
          animatedProps={animatedProps}
          rotation={180}
          origin={`${size / 2}, ${size / 2}`}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ marginTop: size / 2 - 28 }}>{children}</View>
    </View>
  );
}
