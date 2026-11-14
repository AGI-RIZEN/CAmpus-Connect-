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
import { Display, BodyMedium, Caption } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { getQuizResult, getQuiz, type QuizResult } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { Confetti } from '@/components/screens/quiz/Confetti';

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
        <Confetti />
        <SemiGauge
          size={220}
          strokeWidth={18}
          progress={total > 0 ? result.correctCount / total : 0}
          color={colors.success}
          trackColor={colorScheme === 'dark' ? colors.borderDark : colors.borderLight}
        >
          <View className="items-center">
            <View className="flex-row items-baseline">
              <AnimatedCounter
                value={result.correctCount}
                duration={900}
                className="font-poppins-bold text-display text-text-primary dark:text-text-primary-dark"
              />
              <Display>/{total}</Display>
            </View>
            <Caption className="mt-1">
              {result.correctCount >= total * 0.7 ? 'Great job! 🎉' : 'Keep practicing 💪'}
            </Caption>
          </View>
        </SemiGauge>
      </View>

      <View className="flex-row flex-wrap -mx-1.5 mt-8">
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Check size={20} color={colors.ink} />}
            label="Correct"
            value={String(result.correctCount)}
            animateValue={result.correctCount}
            animateDelay={450}
            tone="mint"
          />
        </View>
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<X size={20} color={colors.ink} />}
            label="Wrong"
            value={String(result.wrongCount)}
            animateValue={result.wrongCount}
            animateDelay={550}
            tone="peach"
          />
        </View>
        <View className="w-1/2 px-1.5">
          <StatCard
            icon={<Clock size={20} color={colors.ink} />}
            label="Time Limit"
            value={timeLimitMinutes ? `${timeLimitMinutes}m` : '—'}
            tone="sky"
          />
        </View>
        <View className="w-1/2 px-1.5">
          <StatCard
            icon={<Zap size={20} color={colors.ink} />}
            label="Points earned"
            value={`+${result.pointsEarned}`}
            animateValue={result.pointsEarned}
            animateFormat={(n) => `+${n}`}
            animateDelay={750}
            tone="butter"
          />
        </View>
      </View>

      <SecondaryButton
        label={showReview ? 'Hide Answers' : 'Review Answers'}
        className="mt-6"
        onPress={() => {
          haptic.select();
          setShowReview((v) => !v);
        }}
      />

      {showReview && (
        <View className="mt-5">
          {result.review.map((q) => (
            <Card tone="white" key={q.questionId} className="mb-3">
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
          ))}
        </View>
      )}

      <View className="mb-8" />
    </Screen>
  );
}
