import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { router } from 'expo-router';
import { Check } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H2, Body, BodyMedium } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { haptic } from '@/lib/haptics';

const sections = [
  {
    heading: '1. Acceptance of Terms',
    body:
      'By creating an account on Campus Connect, you agree to be bound by these Terms & Conditions and all applicable college policies. If you do not agree, please do not use the app.',
  },
  {
    heading: '2. Eligibility',
    body:
      'Campus Connect is available only to currently enrolled students and verified faculty members of the institution. Accounts found to misrepresent eligibility may be suspended without notice.',
  },
  {
    heading: '3. User Conduct',
    body:
      'You agree not to post content that is abusive, defamatory, spammy, or otherwise violates community guidelines. Harassment of any member of the campus community will result in immediate account review.',
  },
  {
    heading: '4. Content Ownership',
    body:
      'You retain ownership of content you post, but grant Campus Connect a non-exclusive license to display it within the app for moderation, notices and feed purposes.',
  },
  {
    heading: '5. Privacy',
    body:
      'We collect only the information necessary to operate the app — your name, college email, course and semester. Your data is never sold or shared with third parties outside the institution.',
  },
  {
    heading: '6. Account Termination',
    body:
      'Accounts that repeatedly violate these terms may be suspended or permanently banned at the discretion of the admin team, with reasons communicated via the app wherever possible.',
  },
];

export default function Terms() {
  const [reachedEnd, setReachedEnd] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const atEnd = contentOffset.y + layoutMeasurement.height >= contentSize.height - 24;
    if (atEnd) setReachedEnd(true);
  };

  const canAccept = reachedEnd && agreed;
  const wasEnabled = useRef(false);

  useEffect(() => {
    if (canAccept && !wasEnabled.current) {
      haptic.success();
    }
    wasEnabled.current = canAccept;
  }, [canAccept]);

  return (
    <Screen scroll={false}>
      <Header title="Terms & Conditions" />

      <ScrollView
        style={{ flex: 1 }}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Card className="mb-4">
          {sections.map((s, i) => (
            <View key={s.heading} className={i === sections.length - 1 ? '' : 'mb-5'}>
              <H2 className="mb-2">{s.heading}</H2>
              <Body className="text-text-secondary dark:text-text-secondary-dark">{s.body}</Body>
            </View>
          ))}
        </Card>
      </ScrollView>

      <View className="pt-4 pb-2">
        {!reachedEnd && (
          <Body className="text-center mb-2 text-text-secondary dark:text-text-secondary-dark">
            Scroll to the bottom to continue
          </Body>
        )}
        <AnimatedPressable
          haptics="select"
          scaleTo={0.98}
          onPress={() => setAgreed((a) => !a)}
          className="flex-row items-center mb-4"
        >
          <View
            className={`w-5 h-5 rounded-md mr-3 border items-center justify-center ${
              agreed ? 'bg-primary border-primary' : 'border-border-light dark:border-border-dark'
            }`}
          >
            {agreed && <Check size={14} color="#fff" />}
          </View>
          <BodyMedium>I have read and agree</BodyMedium>
        </AnimatedPressable>

        <PrimaryButton label="Accept & Continue" disabled={!canAccept} onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
