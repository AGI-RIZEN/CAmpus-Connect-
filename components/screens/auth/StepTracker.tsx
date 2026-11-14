import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Check, Clock } from 'lucide-react-native';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { colors } from '@/lib/theme';

export type Step = {
  label: string;
  sublabel?: string;
  status: 'done' | 'pending';
};

function PendingDot() {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.15, { duration: 700 }), -1, true);
  }, [scale]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={style}
      className="w-8 h-8 rounded-full bg-warning/15 border-2 border-warning items-center justify-center"
    >
      <Clock size={14} color={colors.warning} />
    </Animated.View>
  );
}

export function StepTracker({ steps }: { steps: Step[] }) {
  return (
    <View>
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        return (
          <View key={step.label} className="flex-row">
            <View className="items-center mr-4">
              {step.status === 'done' ? (
                <View className="w-8 h-8 rounded-full bg-success items-center justify-center">
                  <Check size={16} color="#fff" />
                </View>
              ) : (
                <PendingDot />
              )}
              {!isLast && (
                <View
                  className={`w-0.5 flex-1 ${step.status === 'done' ? 'bg-success' : 'bg-border-light dark:bg-border-dark'}`}
                  style={{ minHeight: 20 }}
                />
              )}
            </View>
            <View className={isLast ? 'flex-1' : 'flex-1 pb-4'}>
              <BodyMedium>{step.label}</BodyMedium>
              {step.sublabel && <Caption className="mt-0.5">{step.sublabel}</Caption>}
            </View>
          </View>
        );
      })}
    </View>
  );
}
