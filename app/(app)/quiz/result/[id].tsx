import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Check, Clock, X, Zap } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SecondaryButton } from '@/components/ui/Button';
import { SemiGauge } from '@/components/ui/ProgressRing';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { Display, BodyMedium, Caption } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { getQuizResult, getQuiz, type QuizResult } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { Confetti } from '@/components/screens/quiz/Confetti';

// Choreography (all presentation-only): confetti bursts across 0–400ms on mount, the score pops
// in at ~250ms (mid-burst, so it reads as part of the same celebration beat) and the counter
// starts ticking as the pop lands. Stat cards then cascade in just behind it.
const SCORE_POP_DELAY = 250;
const STATS_BASE_DELAY = 420;
const STATS_STEP = 90;

// Celebratory ambient blobs behind the gauge — mint (success) + brand purple, both fully transparent at the edge.
const RESULT_BLOBS = [
  { size: 240, top: -60, left: -50, colors: ['#22C55E40', '#22C55E00'] as [string, string], driftRange: 16, duration: 6400 },
  { size: 220, top: -30, right: -60, colors: ['#2F6FED4A', '#2F6FED00'] as [string, string], driftRange: 20, duration: 7600 },
  { size: 150, bottom: -50, left: 90, colors: ['#FFF1C7A0', '#FFF1C700'] as [string, string], driftRange: 12, duration: 5600 },
];

export default function QuizResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colorScheme } = useColorScheme();
  const toast = useToast();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const [resultData, quiz] = await Promise.all([getQuizResult(id), getQuiz(id)]);
        setResult(resultData);
        setTimeLimitMinutes(quiz.timeLimitMinutes);
        haptic.success();
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Could not load your result';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !result) {
    return (
      <Screen>
        <Header title="Quiz Result" />
        <Skeleton height={220} radius={110} className="mb-8 self-center" width={220} />
        <Skeleton height={140} radius={20} />
      </Screen>
    );
  }

  const total = result.totalQuestions;

  return (
    <Screen>
      <Header title="Quiz Result" />

      <View className="items-center mt-2 relative">
        {/* Ambient glow lives in its own clipped layer so the confetti above it can still fall
            past the hero's bounds without being cut off. */}
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: -40, left: -24, right: -24, bottom: -24, overflow: 'hidden', borderRadius: 48 }}
        >
          <GradientBlob blobs={RESULT_BLOBS} />
        </View>
        <Confetti />
        <SemiGauge
          size={220}
          strokeWidth={18}
          progress={total > 0 ? result.correctCount / total : 0}
          color={colors.success}
          trackColor={colorScheme === 'dark' ? colors.borderDark : colors.borderLight}
        >
          <Reveal baseDelay={SCORE_POP_DELAY} spring scaleIn className="items-center">
            <View className="flex-row items-baseline">
              <AnimatedCounter
                value={result.correctCount}
                duration={900}
                delay={SCORE_POP_DELAY + 80}
                className="font-poppins-bold text-display text-text-primary dark:text-text-primary-dark"
              />
              <Display>/{total}</Display>
            </View>
            <Caption className="mt-1">
              {result.correctCount >= total * 0.7 ? 'Great job! 🎉' : 'Keep practicing 💪'}
            </Caption>
          </Reveal>
        </SemiGauge>
      </View>

      <View className="flex-row flex-wrap -mx-1.5 mt-8">
        <Reveal index={0} baseDelay={STATS_BASE_DELAY} step={STATS_STEP} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Check size={20} color={colors.ink} />}
            label="Correct"
            value={String(result.correctCount)}
            animateValue={result.correctCount}
            animateDelay={STATS_BASE_DELAY + 120}
            tone="mint"
          />
        </Reveal>
        <Reveal index={1} baseDelay={STATS_BASE_DELAY} step={STATS_STEP} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<X size={20} color={colors.ink} />}
            label="Wrong"
            value={String(result.wrongCount)}
            animateValue={result.wrongCount}
            animateDelay={STATS_BASE_DELAY + STATS_STEP + 120}
            tone="peach"
          />
        </Reveal>
        <Reveal index={2} baseDelay={STATS_BASE_DELAY} step={STATS_STEP} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<Clock size={20} color={colors.ink} />}
            label="Time Limit"
            value={timeLimitMinutes ? `${timeLimitMinutes}m` : '—'}
            tone="sky"
          />
        </Reveal>
        <Reveal index={3} baseDelay={STATS_BASE_DELAY} step={STATS_STEP} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<Zap size={20} color={colors.ink} />}
            label="Points earned"
            value={`+${result.pointsEarned}`}
            animateValue={result.pointsEarned}
            animateFormat={(n) => `+${n}`}
            animateDelay={STATS_BASE_DELAY + STATS_STEP * 3 + 120}
            tone="butter"
          />
        </Reveal>
      </View>

      <Reveal baseDelay={STATS_BASE_DELAY + STATS_STEP * 4}>
        <SecondaryButton
          label={showReview ? 'Hide Answers' : 'Review Answers'}
          className="mt-6"
          onPress={() => {
            haptic.select();
            setShowReview((v) => !v);
          }}
        />
      </Reveal>

      {showReview && (
        <View className="mt-5">
          {result.review.map((q, i) => (
            <Reveal key={q.questionId} index={i} step={50}>
            <Card tone="white" className="mb-3">
              <View className="flex-row items-start">
                <View
                  className={`w-7 h-7 rounded-full items-center justify-center mr-3 mt-0.5 ${
                    q.isCorrect ? 'bg-success/15' : 'bg-danger/15'
                  }`}
                >
                  {q.isCorrect ? (
                    <Check size={14} color={colors.success} />
                  ) : (
                    <X size={14} color={colors.danger} />
                  )}
                </View>
                <View className="flex-1">
                  <BodyMedium numberOfLines={2}>{q.text}</BodyMedium>
                  <Caption className="mt-2">
                    Your answer:{' '}
                    <Caption className="text-text-primary dark:text-text-primary-dark">
                      {q.selectedIndex !== null ? q.options[q.selectedIndex] : 'Not answered'}
                    </Caption>
                  </Caption>
                  {!q.isCorrect && (
                    <Caption className="mt-1 text-success">
                      Correct answer: {q.options[q.correctIndex]}
                    </Caption>
                  )}
                  {q.explanation && (
                    <Caption className="mt-1">{q.explanation}</Caption>
                  )}
                </View>
              </View>
            </Card>
            </Reveal>
          ))}
        </View>
      )}

      <View className="mb-8" />
    </Screen>
  );
}
