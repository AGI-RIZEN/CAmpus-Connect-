import React, { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { H1, Body } from '@/components/ui/Text';
import { PrimaryButton, TextLinkButton } from '@/components/ui/Button';
import { Illustration } from '@/components/screens/auth/Illustration';
import { Dots } from '@/components/screens/auth/Dots';
import { haptic } from '@/lib/haptics';
import type { CardTone } from '@/lib/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Slide = {
  key: string;
  emoji: string;
  tone: CardTone;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    key: 's1',
    emoji: '🧑‍🎓',
    tone: 'lavender',
    title: 'Never Miss What Matters',
    description: 'Urgent notices, exam schedules and campus alerts — delivered to you the moment they drop.',
  },
  {
    key: 's2',
    emoji: '🤳',
    tone: 'peach',
    title: 'Share Your Campus Moments',
    description: 'Post photos, cheer on your friends and relive every fest, match and milestone together.',
  },
  {
    key: 's3',
    emoji: '🏆',
    tone: 'butter',
    title: 'Learn, Compete, Rise',
    description: 'Take quizzes, climb the leaderboard and turn every lecture into a little friendly competition.',
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const isLast = index === slides.length - 1;
  const current = slides[index];

  const goTo = (next: number) => {
    scrollRef.current?.scrollTo({ x: next * SCREEN_WIDTH, animated: true });
    setIndex(next);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (next !== index) haptic.select();
    setIndex(next);
  };

  const handlePrimary = () => {
    if (isLast) {
      router.replace('/(auth)/login');
    } else {
      goTo(index + 1);
    }
  };

  return (
    <Screen scroll={false} padded={false}>
      <View className="flex-row justify-end px-screen pt-2">
        <TextLinkButton label="Skip" onPress={() => router.replace('/(auth)/login')} />
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={{ flexGrow: 0 }}
      >
        {slides.map((slide) => (
          <View key={slide.key} style={{ width: SCREEN_WIDTH }} className="items-center justify-center py-10">
            <Illustration emoji={slide.emoji} tone={slide.tone} size={220} />
          </View>
        ))}
      </ScrollView>

      <View className="px-screen pb-6 flex-1 justify-end">
        <H1>{current.title}</H1>
        <Body className="mt-2 text-text-secondary dark:text-text-secondary-dark">{current.description}</Body>

        <Dots count={slides.length} activeIndex={index} className="mt-6" />

        <PrimaryButton
          label={isLast ? 'Get Started' : 'Next'}
          onPress={handlePrimary}
          className="mt-6"
        />
      </View>
    </Screen>
  );
}
