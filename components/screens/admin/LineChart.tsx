import React, { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Path, Polyline } from 'react-native-svg';
import Animated, { useAnimatedProps, useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { Caption } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  labels?: string[];
};

const defaultLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Hand-rolled 7-day active-users line chart. No charting lib — plain SVG polyline + soft fill. */
export function LineChart({ data, width = 280, height = 100, color = colors.primary, labels = defaultLabels }: Props) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padY = 8;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((value, i) => {
    const x = i * stepX;
    const y = height - padY - ((value - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const fillPath = `M0,${height} L${points.map((p) => `${p.x},${p.y}`).join(' L')} L${width},${height} Z`;

  // Draw the line in on mount by animating its approximate length via a dash array,
  // mirroring the stroke-dashoffset pattern ProgressRing uses for its fill animation.
  const pathLength = points.reduce((total, p, i) => {
    if (i === 0) return total;
    const prev = points[i - 1];
    return total + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0) || 1;

  const draw = useSharedValue(0);
  const fillOpacity = useSharedValue(0);

  useEffect(() => {
    draw.value = 0;
    fillOpacity.value = 0;
    draw.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
    fillOpacity.value = withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [data.join(',')]);

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: pathLength * (1 - draw.value),
  }));
  const fillAnimatedProps = useAnimatedProps(() => ({
    opacity: fillOpacity.value * 0.12,
  }));

  return (
    <View>
      <Svg width={width} height={height}>
        <AnimatedPath d={fillPath} fill={color} animatedProps={fillAnimatedProps} />
        <AnimatedPolyline
          points={polylinePoints}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={`${pathLength} ${pathLength}`}
          animatedProps={lineAnimatedProps}
        />
      </Svg>
      <View className="flex-row justify-between mt-2">
        {labels.map((label) => (
          <Caption key={label}>{label}</Caption>
        ))}
      </View>
    </View>
  );
}
