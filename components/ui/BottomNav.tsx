import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { softShadowLg } from '@/lib/theme';
import { haptic } from '@/lib/haptics';
import type { ComponentType } from 'react';

type IconComp = ComponentType<{ size?: number; color?: string }>;

type Props = {
  state: any;
  navigation: any;
  descriptors: any;
  icons: Record<string, IconComp>;
};

function TabIcon({ Icon, focused }: { Icon: IconComp | undefined; focused: boolean }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = 0.6;
      scale.value = withSpring(1, { damping: 9, stiffness: 180 });
    }
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View
      style={animStyle}
      className={`w-11 h-11 rounded-full items-center justify-center ${focused ? 'bg-primary' : ''}`}
    >
      {Icon ? <Icon size={22} color={focused ? '#ffffff' : '#8A8894'} /> : null}
    </Animated.View>
  );
}

/** Floating dark pill bottom nav — active icon sits inside a violet circle with a spring bounce. */
export function FloatingTabBar({ state, navigation, icons }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 10 }}
      pointerEvents="box-none"
    >
      <View style={softShadowLg} className="flex-row bg-ink rounded-full px-2 py-2 items-center justify-between">
        {state.routes.map((route: any, index: number) => {
          const Icon = icons[route.name] ?? icons.default;
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              haptic.select();
              navigation.navigate(route.name);
            }
          };
          return (
            <Pressable key={route.key} onPress={onPress} className="flex-1 items-center py-1">
              <TabIcon Icon={Icon} focused={focused} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
