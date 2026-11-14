import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming, Easing } from 'react-native-reanimated';
import { Caption } from '@/components/ui/Text';

export type PillBarEntry = { label: string; pct: number };

type Props = {
  data: PillBarEntry[];
  barClassName?: string;
};

function Pill({ pct, index, barClassName }: { pct: number; index: number; barClassName: string }) {
  const target = Math.min(Math.max(pct, 0), 100);
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withDelay(
      index * 90,
      withTiming(target, { duration: 700, easing: Easing.out(Easing.cubic) })
    );
  }, [target]);

  const style = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  return <Animated.View style={style} className={`h-full rounded-full ${barClassName}`} />;
}

/** Pure-RN pill-shaped bar chart — a rounded-full track with an inner rounded-full fill sized by pct. */
export function PillBarChart({ data, barClassName = 'bg-primary' }: Props) {
  return (
    <View>
      {data.map((item, idx) => (
        <View key={item.label} className={idx === 0 ? '' : 'mt-3.5'}>
          <Caption numberOfLines={1} className="mb-1.5">
            {item.label}
          </Caption>
          <View className="flex-row items-center">
            <View className="flex-1 h-3.5 rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
              <Pill pct={item.pct} index={idx} barClassName={barClassName} />
            </View>
            <Caption className="ml-2.5 font-poppins-semibold">{item.pct}%</Caption>
          </View>
        </View>
      ))}
    </View>
  );
}
