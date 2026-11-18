import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Heart } from 'lucide-react-native';
import { colors } from '@/lib/theme';

type Props = {
  images: string[];
  /** Fired on a detected double-tap on the image — used by the caller to force-like the post. */
  onDoubleTap?: () => void;
};

const DOUBLE_TAP_WINDOW_MS = 300;

function CarouselDot({ active }: { active: boolean }) {
  const progress = useSharedValue(active ? 1 : 0);
  const bounce = useSharedValue(1);

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
    if (active) {
      // Same spring-bounce-on-focus as the BottomNav tab icon, scaled down for a 6px dot.
      bounce.value = 0.6;
      bounce.value = withSpring(1, { damping: 9, stiffness: 180 });
    }
  }, [active]);

  const dotStyle = useAnimatedStyle(() => ({
    width: 6 + progress.value * 14,
    opacity: 0.45 + progress.value * 0.55,
    transform: [{ scale: bounce.value }],
  }));

  return (
    <Animated.View
      style={dotStyle}
      className={`h-1.5 rounded-full mx-1 ${active ? 'bg-primary' : 'bg-border-light dark:bg-border-dark'}`}
    />
  );
}

export function ImageCarousel({ images, onDoubleTap }: Props) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const lastTap = useRef(0);

  // Heart burst: scales in from 0 on a spring (overshoots ~1.2 then settles), with a slight
  // rotation flick and a soft halo that blooms out behind it, then everything fades/drifts away.
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const halo = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }, { translateY: (1 - opacity.value) * -10 }],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: halo.value * 0.28,
    transform: [{ scale: 0.4 + halo.value * 1.6 }],
  }));

  const triggerHeartBurst = () => {
    // Each sequence starts with a 0ms "reset" step so re-triggering mid-animation restarts cleanly.
    const reset = (to: number) => withTiming(to, { duration: 0 });
    scale.value = withSequence(
      reset(0),
      withSpring(1.18, { damping: 7, stiffness: 240, mass: 0.6 }),
      withSpring(1, { damping: 12, stiffness: 180 }),
      withDelay(220, withTiming(0.7, { duration: 260, easing: Easing.in(Easing.cubic) }))
    );
    rotate.value = withSequence(reset(-12), withSpring(0, { damping: 8, stiffness: 160 }));
    opacity.value = withSequence(
      reset(0),
      withTiming(1, { duration: 110 }),
      withDelay(520, withTiming(0, { duration: 260, easing: Easing.in(Easing.cubic) }))
    );
    halo.value = withSequence(
      reset(0),
      withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }),
      withTiming(0, { duration: 360 })
    );
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_WINDOW_MS) {
      triggerHeartBurst();
      onDoubleTap?.();
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  };

  const handleMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(images.length - 1, i)));
  };

  const mediaHeight = width > 0 ? width * 1.05 : undefined;

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        <Pressable onPress={handleTap}>
          {width > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={handleMomentumEnd}
              scrollEventThrottle={16}
            >
              {images.map((uri, i) => (
                <Image
                  key={`${uri}-${i}`}
                  source={{ uri }}
                  style={{ width, height: mediaHeight, borderRadius: 24 }}
                  resizeMode="cover"
                />
              ))}
            </ScrollView>
          )}
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }]}>
            <Animated.View
              style={[
                { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#FFFFFF' },
                haloStyle,
              ]}
            />
            <Animated.View style={heartStyle}>
              <Heart size={90} color={colors.danger} fill={colors.danger} />
            </Animated.View>
          </View>
        </Pressable>
      </View>
      {images.length > 1 && (
        <View className="flex-row justify-center mt-2.5">
          {images.map((_, i) => (
            <CarouselDot key={i} active={i === index} />
          ))}
        </View>
      )}
    </View>
  );
}
