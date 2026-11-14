import React, { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View, type NativeSyntheticEvent, type NativeScrollEvent } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
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

  useEffect(() => {
    progress.value = withTiming(active ? 1 : 0, { duration: 220 });
  }, [active]);

  const dotStyle = useAnimatedStyle(() => ({
    width: 6 + progress.value * 14,
    opacity: 0.45 + progress.value * 0.55,
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

  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  const heartStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const triggerHeartBurst = () => {
    scale.value = 0.6;
    opacity.value = 0;
    scale.value = withSequence(
      withTiming(1.15, { duration: 220 }),
      withTiming(1, { duration: 150 }),
      withTiming(0.85, { duration: 300 }),
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(1, { duration: 350 }),
      withTiming(0, { duration: 250 }),
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
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, heartStyle, { alignItems: 'center', justifyContent: 'center' }]}
          >
            <Heart size={90} color={colors.danger} fill={colors.danger} />
          </Animated.View>
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
