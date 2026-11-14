import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H2, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { SecondaryButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { Reveal } from '@/components/ui/Reveal';
import { colors } from '@/lib/theme';
import { getQuiz, getQuizAnalytics, type QuizSummary, type QuizAnalytics } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { CorrectPctBar } from '@/components/screens/quiz/CorrectPctBar';
import { Users } from 'lucide-react-native';

export default function QuizAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();

  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [analytics, setAnalytics] = useState<QuizAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [quizData, analyticsData] = await Promise.all([getQuiz(id), getQuizAnalytics(id)]);
      setQuiz(quizData);
      setAnalytics(analyticsData);
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

  if (loading || !quiz || !analytics) {
    return (
      <Screen>
        <Header title="Quiz Analytics" />
        <Skeleton height={80} radius={20} className="mb-5" />
        <Skeleton height={100} radius={20} className="mb-5" />
        <Skeleton height={80} radius={20} />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Quiz Analytics" />

      <View className="flex-row justify-end mb-4">
        <SecondaryButton
          label="Export CSV"
          onPress={() => toast('CSV export coming soon', 'info')}
          className="px-5 py-2.5"
        />
      </View>

      <Card tone="white" className="mb-5">
        <Caption className="mb-1">{quiz.subject}</Caption>
        <H2 numberOfLines={2}>{quiz.title}</H2>
      </Card>

      <View className="flex-row mb-5">
        <Card tone="mint" className="flex-1 mr-2">
          <Caption>Attempted</Caption>
          <H2 className="mt-1">{analytics.attemptedPct}%</H2>
          <Caption className="mt-1">{analytics.attemptedCount.toLocaleString()} students</Caption>
        </Card>
        <Card tone="peach" className="flex-1">
          <Caption>Missed</Caption>
          <H2 className="mt-1">{100 - analytics.attemptedPct}%</H2>
          <Caption className="mt-1">{analytics.missedCount.toLocaleString()} students</Caption>
        </Card>
      </View>

      <Card tone="white" className="mb-5">
        <Caption>Average Score</Caption>
        <H2 className="mt-1">{analytics.avgScore}</H2>
      </Card>

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

      <BodyMedium className="mb-3">Students Who Missed This Quiz</BodyMedium>
      {analytics.missedStudents.length === 0 ? (
        <EmptyState
          icon={<Users size={28} color={colors.success} />}
          title="Everyone's attempted"
          description="All listed students have attempted this quiz."
        />
      ) : (
        analytics.missedStudents.map((s, idx) => (
          <Reveal key={s.id} index={idx}>
            <Card
              tone="white"
              className={`flex-row items-center ${idx === analytics.missedStudents.length - 1 ? '' : 'mb-3'}`}
            >
              <Avatar uri={s.avatarUrl} name={s.name} size={44} />
              <View className="ml-3">
                <BodyMedium>{s.name}</BodyMedium>
                <Caption>{s.course}</Caption>
              </View>
            </Card>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
