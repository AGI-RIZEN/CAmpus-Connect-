import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, Clock3, FileDown, Hourglass, Target, Users } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Body, BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { SecondaryButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { getQuiz, getQuizAnalytics, type QuizSummary, type QuizAnalytics, type QuizStatus } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { CorrectPctBar } from '@/components/screens/quiz/CorrectPctBar';

const STATUS_LABEL: Record<QuizStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
};

const STATUS_TONE: Record<QuizStatus, 'warning' | 'success' | 'primary'> = {
  upcoming: 'warning',
  live: 'success',
  completed: 'primary',
};

export default function TeacherQuizAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { colorScheme } = useColorScheme();

  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const quizData = await getQuiz(id);
      setQuiz(quizData);
      if (quizData.status !== 'upcoming') {
        setAnalytics(await getQuizAnalytics(id));
      }
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load quiz analytics';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading || !quiz) {
    return (
      <Screen scroll contentClassName="pb-16">
        <View className="flex-row items-center pt-4 pb-5">
          <IconButton onPress={() => router.back()}>
            <ChevronLeft size={22} color={colors.ink} />
          </IconButton>
          <View className="flex-1 ml-3">
            <Skeleton width={160} height={20} />
          </View>
        </View>
        <Skeleton height={220} radius={28} className="mb-5" />
        <Skeleton height={100} radius={20} />
      </Screen>
    );
  }

  const hasRun = quiz.status !== 'upcoming';

  return (
    <Screen scroll contentClassName="pb-16">
      <View className="flex-row items-center pt-4 pb-5">
        <IconButton onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
        <View className="flex-1 ml-3">
          <H2>Quiz Analytics</H2>
          <Caption numberOfLines={1}>{quiz.title}</Caption>
        </View>
        <Badge label={STATUS_LABEL[quiz.status]} tone={STATUS_TONE[quiz.status]} />
      </View>

      {!hasRun || !analytics ? (
        <Card tone="white">
          <EmptyState
            icon={<Hourglass size={32} color={colors.primary} />}
            title="No analytics yet"
            description="This quiz hasn't run yet — analytics will appear once students start attempting it."
          />
        </Card>
      ) : (
        <>
          <View className="flex-row justify-end mb-4">
            <SecondaryButton
              label="Export CSV"
              onPress={() => toast('CSV export coming soon', 'info')}
              className="px-5 py-2.5"
            />
          </View>

          <Card tone="white" className="items-center mb-5">
            <ProgressRing
              size={150}
              strokeWidth={14}
              progress={analytics.attemptedPct / 100}
              color={colors.primary}
              trackColor={colorScheme === 'dark' ? colors.borderDark : colors.borderLight}
            >
              <View className="items-center">
                <H2>{analytics.attemptedPct}%</H2>
                <Caption>Completion</Caption>
              </View>
            </ProgressRing>

            <View className="flex-row mt-5 w-full">
              <View className="flex-1 bg-success/15 rounded-input px-4 py-3 mr-2">
                <View className="flex-row items-center">
                  <Users size={14} color={colors.success} />
                  <Caption className="ml-1.5">Attempted</Caption>
                </View>
                <H2 className="mt-0.5">{analytics.attemptedCount}</H2>
              </View>
              <View className="flex-1 bg-warning/15 rounded-input px-4 py-3">
                <View className="flex-row items-center">
                  <Clock3 size={14} color={colors.warning} />
                  <Caption className="ml-1.5">Haven&apos;t Attempted</Caption>
                </View>
                <H2 className="mt-0.5">{analytics.missedCount}</H2>
              </View>
            </View>
          </Card>

          <View className="flex-row mb-5">
            <Card tone="lavender" noShadow className="flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <Target size={16} color={colors.ink} />
                <Caption className="ml-1.5">Average Score</Caption>
              </View>
              <H2>{analytics.avgScore}</H2>
            </Card>
            <Card tone="mint" noShadow className="flex-1">
              <View className="flex-row items-center mb-1">
                <FileDown size={16} color={colors.ink} />
                <Caption className="ml-1.5">Questions</Caption>
              </View>
              <H2>{analytics.totalQuestions}</H2>
            </Card>
          </View>

          {analytics.hardestQuestions.length > 0 && (
            <>
              <BodyMedium className="mb-3">Hardest Questions</BodyMedium>
              <Card tone="white" className="mb-5">
                {analytics.hardestQuestions.map((q, idx) => (
                  <View key={q.id} className={idx === analytics.hardestQuestions.length - 1 ? '' : 'mb-4'}>
                    <Body numberOfLines={2} className="mb-1.5">
                      {q.text}
                    </Body>
                    <View className="flex-row items-center">
                      <View className="flex-1 h-3.5 rounded-full bg-border-light dark:bg-border-dark overflow-hidden">
                        <CorrectPctBar pct={q.correctPct} index={idx} />
                      </View>
                      <Caption className="ml-2.5 font-poppins-semibold">{q.correctPct}% correct</Caption>
                    </View>
                  </View>
                ))}
              </Card>
            </>
          )}

          <BodyMedium className="mb-3">Students Who Haven&apos;t Attempted</BodyMedium>
          {analytics.missedStudents.length === 0 ? (
            <EmptyState
              icon={<Users size={28} color={colors.success} />}
              title="Everyone's attempted"
              description="All listed students have attempted this quiz."
            />
          ) : (
            analytics.missedStudents.map((s, idx) => (
              <Reveal key={s.id} index={idx}>
                <Card tone="white" className={`flex-row items-center ${idx === analytics.missedStudents.length - 1 ? '' : 'mb-3'}`}>
                  <Avatar uri={s.avatarUrl} name={s.name} size={44} />
                  <View className="ml-3">
                    <BodyMedium>{s.name}</BodyMedium>
                    <Caption>{s.course}</Caption>
                  </View>
                </Card>
              </Reveal>
            ))
          )}
        </>
      )}
    </Screen>
  );
}
