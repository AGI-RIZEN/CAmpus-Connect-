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
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
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
      {/* Relative + overflow-hidden wrapper so the ambient blobs stay clipped to the screen. */}
      <View style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GradientBlob
          blobs={[
            { size: 300, top: -90, left: -80, colors: ['#2F6FED40', '#2F6FED00'], driftRange: 20, duration: 6400 },
            { size: 240, top: 40, right: -90, colors: ['#5B8DFF38', '#5B8DFF00'], driftRange: 24, duration: 7600 },
            { size: 220, bottom: 120, left: -100, colors: ['#FFE4D680', '#FFE4D600'], driftRange: 16, duration: 8200 },
          ]}
        />

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
          {slides.map((slide, i) => (
            <View key={slide.key} style={{ width: SCREEN_WIDTH }} className="items-center justify-center py-10">
              <Reveal index={i} spring scaleIn>
                <Illustration emoji={slide.emoji} tone={slide.tone} size={220} />
              </Reveal>
            </View>
          ))}
        </ScrollView>

        <View className="px-screen pb-6 flex-1 justify-end">
          {/* Keyed on the slide so the copy re-reveals each time the page changes. */}
          <Reveal key={current.key}>
            <H1>{current.title}</H1>
            <Body className="mt-2 text-text-secondary dark:text-text-secondary-dark">{current.description}</Body>
          </Reveal>

          <Dots count={slides.length} activeIndex={index} className="mt-6" />

          <Reveal index={2}>
            <PrimaryButton
              label={isLast ? 'Get Started' : 'Next'}
              onPress={handlePrimary}
              className="mt-6"
              shine
            />
          </Reveal>
        </View>
      </View>
    </Screen>
  );
}
