import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { H2, BodyMedium, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { startQuizAttempt, submitQuizAttempt, type QuizAttemptStart } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { OptionCard } from '@/components/screens/quiz/OptionCard';

// Fallback only, used for the brief window before the real attempt (and its timeLimitMinutes)
// has loaded. Once loaded, the real per-question allocation is the quiz's declared time limit
// split evenly across its questions — previously this was hardcoded to 45s regardless of the
// quiz's actual time limit, so a 10-question quiz advertised as "15 min" only gave 7.5 minutes.
const DEFAULT_TIMER_SECONDS = 45;

export default function QuizQuestionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const toast = useToast();

  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_TIMER_SECONDS);
  // Which question's countdown is currently loaded into `secondsRemaining` — lets us reset
  // the timer synchronously during render (React's recommended way to adjust state when a
  // value changes) instead of via a setState-in-effect, which would cascade an extra render.
  const [timedQuestionIndex, setTimedQuestionIndex] = useState(-1);
  const answersRef = useRef<{ questionId: string; selectedIndex: number | null; secondsRemaining: number }[]>([]);

  // Tracks whether the "entering danger zone" haptic has already fired for this question,
  // so it buzzes exactly once per threshold crossing rather than on every re-render/tick.
  const warnedRef = useRef(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const result = await startQuizAttempt(id);
        setAttempt(result);
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Could not start this quiz';
        toast(message, 'error');
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalQuestions = attempt?.questions.length ?? 0;
  const question = attempt?.questions[currentIndex];

  // The quiz's declared time limit, split evenly across its questions.
  const secondsPerQuestion =
    attempt && totalQuestions > 0
      ? Math.max(10, Math.round((attempt.timeLimitMinutes * 60) / totalQuestions))
      : DEFAULT_TIMER_SECONDS;

  // Reset the countdown when we land on a new question (or `attempt` first loads).
  if (attempt && timedQuestionIndex !== currentIndex) {
    setTimedQuestionIndex(currentIndex);
    setSecondsRemaining(secondsPerQuestion);
  }

  // Ticks the countdown every second.
  useEffect(() => {
    if (!attempt) return;
    const interval = setInterval(() => {
      setSecondsRemaining((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex, attempt]);

  // Auto-advance (auto-submit) once the timer hits zero — fire a distinct "ran out of time"
  // buzz here so it reads differently from a normal in-time "Next" tap.
  useEffect(() => {
    if (attempt && secondsRemaining === 0) {
      haptic.error();
      advance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsRemaining]);

  const progressPct = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;
  const isDanger = secondsRemaining < 30;

  // Fire a single warning buzz the instant the ring flips into the red danger zone.
  useEffect(() => {
    if (isDanger && !warnedRef.current) {
      warnedRef.current = true;
      haptic.warning();
    }
  }, [isDanger]);

  // Smoothly ease the "Question N/Total" bar between questions instead of snapping.
  const progressAnim = useSharedValue(progressPct);
  useEffect(() => {
    progressAnim.value = withTiming(progressPct, { duration: 300 });
  }, [progressPct]);
  const progressBarStyle = useAnimatedStyle(() => ({ width: `${progressAnim.value}%` }));

  async function advance() {
    if (!attempt || !question) return;
    answersRef.current.push({ questionId: question.id, selectedIndex: selectedOption, secondsRemaining });

    if (currentIndex + 1 >= totalQuestions) {
      setSubmitting(true);
      try {
        await submitQuizAttempt(attempt.quizId, answersRef.current);
        router.replace(`/(app)/quiz/result/${attempt.quizId}`);
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Could not submit the quiz';
        toast(message, 'error');
        setSubmitting(false);
      }
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      // secondsRemaining resets via the effect above, keyed off currentIndex.
      warnedRef.current = false;
    }
  }

  if (loading || !attempt || !question) {
    return (
      <Screen scroll={false}>
        <Header title="Quiz" />
        <Skeleton height={64} width={64} radius={32} className="mb-6" />
        <Skeleton height={100} radius={20} className="mb-6" />
        <Skeleton height={56} radius={16} className="mb-3" />
        <Skeleton height={56} radius={16} className="mb-3" />
        <Skeleton height={56} radius={16} className="mb-3" />
        <Skeleton height={56} radius={16} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <Header title={attempt.subject} />

      <View className="flex-row items-center mt-2 mb-6">
        <ProgressRing
          size={64}
          strokeWidth={6}
          progress={secondsRemaining / secondsPerQuestion}
          color={isDanger ? colors.danger : colors.primary}
          trackColor={colorScheme === 'dark' ? colors.borderDark : colors.borderLight}
        >
          <BodyMedium className={isDanger ? 'text-danger' : ''}>{secondsRemaining}</BodyMedium>
        </ProgressRing>

        <View className="flex-1 ml-4">
          <View className="flex-row items-center justify-between mb-2">
            <Caption>
              Question {currentIndex + 1}/{totalQuestions}
            </Caption>
            <Caption className="text-primary font-poppins-semibold">Up to {attempt.pointsPerQuestion} pts — faster is worth more</Caption>
          </View>
          <View className="h-2 rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
            <Animated.View style={progressBarStyle} className="h-2 rounded-full bg-primary" />
          </View>
        </View>
      </View>

      <Card tone="lavender" className="mb-6">
        <H2>{question.text}</H2>
      </Card>

      <View className="flex-1">
        {question.options.map((opt, idx) => (
          <OptionCard
            key={idx}
            index={idx}
            label={opt}
            selected={selectedOption === idx}
            onPress={() => setSelectedOption(idx)}
          />
        ))}
      </View>

      <PrimaryButton
        label={submitting ? 'Submitting…' : currentIndex + 1 >= totalQuestions ? 'Submit' : 'Next'}
        disabled={selectedOption === null || submitting}
        onPress={advance}
        className="mb-6"
      />
    </Screen>
  );
}
