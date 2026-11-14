import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, ClipboardList, Eye, Megaphone, Target } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { listQuizzes, getQuizAnalytics, type QuizStatus, type QuizSummary } from '@/lib/api/quizzes';
import { listNotices, getNoticeAnalytics, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { timeAgo } from '@/lib/time';

const QUIZ_STATUS_LABEL: Record<QuizStatus, string> = {
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
};

const QUIZ_STATUS_TONE: Record<QuizStatus, 'warning' | 'success' | 'primary'> = {
  upcoming: 'warning',
  live: 'success',
  completed: 'primary',
};

const NOTICE_BADGE_TONE: Record<NoticeCategory, 'danger' | 'warning' | 'primary' | 'success'> = {
  Urgent: 'danger',
  Exam: 'warning',
  Event: 'primary',
  General: 'success',
};

export default function TeacherAnalyticsOverviewScreen() {
  const toast = useToast();
  const { refreshing, onRefresh } = useFakeRefresh();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [avgQuizCompletion, setAvgQuizCompletion] = useState(0);
  const [avgNoticeRead, setAvgNoticeRead] = useState(0);

  const load = useCallback(async () => {
    try {
      const [quizList, noticeList] = await Promise.all([
        listQuizzes({ mine: true }),
        listNotices({ mine: true }),
      ]);
      setQuizzes(quizList);
      setNotices(noticeList);

      const [quizAnalytics, noticeAnalytics] = await Promise.all([
        Promise.all(
          quizList.filter((q) => q.status !== 'upcoming').map((q) => getQuizAnalytics(q.id).catch(() => null))
        ),
        Promise.all(noticeList.map((n) => getNoticeAnalytics(n.id).catch(() => null))),
      ]);
      const validQuiz = quizAnalytics.filter((a): a is NonNullable<typeof a> => a !== null);
      const validNotice = noticeAnalytics.filter((a): a is NonNullable<typeof a> => a !== null);
      setAvgQuizCompletion(
        validQuiz.length ? Math.round(validQuiz.reduce((sum, a) => sum + a.attemptedPct, 0) / validQuiz.length) : 0
      );
      setAvgNoticeRead(
        validNotice.length ? Math.round(validNotice.reduce((sum, a) => sum + a.readPct, 0) / validNotice.length) : 0
      );
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load analytics';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  if (loading) {
    return (
      <Screen>
        <Skeleton width={180} height={28} className="mt-6 mb-5" />
        <View className="flex-row flex-wrap -mx-1.5 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="w-1/2 px-1.5 mb-3">
              <Skeleton height={140} radius={20} />
            </View>
          ))}
        </View>
        <SkeletonCard />
        <View className="mt-5">
          <SkeletonCard />
        </View>
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <H1 className="mt-6 mb-5">Analytics</H1>

      <View className="flex-row flex-wrap -mx-1.5 mb-6">
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<ClipboardList size={20} color={colors.ink} />}
            label="Quizzes Created"
            value={String(quizzes.length)}
            animateValue={quizzes.length}
            animateDelay={0}
            tone="lavender"
          />
        </View>
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Megaphone size={20} color={colors.ink} />}
            label="Notices Posted"
            value={String(notices.length)}
            animateValue={notices.length}
            animateDelay={100}
            tone="peach"
          />
        </View>
        <View className="w-1/2 px-1.5">
          <StatCard
            icon={<Target size={20} color={colors.ink} />}
            label="Avg. Quiz Completion"
            value={`${avgQuizCompletion}%`}
            animateValue={avgQuizCompletion}
            animateFormat={(n) => `${n}%`}
            animateDelay={200}
            tone="mint"
          />
        </View>
        <View className="w-1/2 px-1.5">
          <StatCard
            icon={<Eye size={20} color={colors.ink} />}
            label="Avg. Read Rate"
            value={`${avgNoticeRead}%`}
            animateValue={avgNoticeRead}
            animateFormat={(n) => `${n}%`}
            animateDelay={300}
            tone="butter"
          />
        </View>
      </View>

      <Reveal index={0}>
        <Card tone="white" className="mb-5">
          <View className="flex-row items-center justify-between mb-4">
            <H2>My Quizzes</H2>
            <AnimatedPressable haptics="select" onPress={() => router.push('/(teacher)/quizzes')}>
              <Caption className="text-primary font-poppins-semibold">View All →</Caption>
            </AnimatedPressable>
          </View>
          {quizzes.length === 0 ? (
            <Caption>No quizzes yet.</Caption>
          ) : (
            quizzes.slice(0, 4).map((quiz, idx) => (
              <AnimatedPressable
                key={quiz.id}
                haptics="select"
                onPress={() => router.push(`/(teacher)/quizzes/${quiz.id}/analytics`)}
                className={`flex-row items-center justify-between ${idx === Math.min(quizzes.length, 4) - 1 ? '' : 'mb-3.5'}`}
              >
                <View className="flex-1 pr-3">
                  <BodyMedium numberOfLines={1}>{quiz.title}</BodyMedium>
                  <Caption numberOfLines={1} className="mt-0.5">
                    {quiz.course} · Sem {quiz.semester}
                  </Caption>
                </View>
                <View className="flex-row items-center">
                  <Badge label={QUIZ_STATUS_LABEL[quiz.status]} tone={QUIZ_STATUS_TONE[quiz.status]} className="mr-1" />
                  <ChevronRight size={18} color={colors.textSecondary} />
                </View>
              </AnimatedPressable>
            ))
          )}
        </Card>
      </Reveal>

      <Reveal index={1}>
        <Card tone="white">
          <View className="flex-row items-center justify-between mb-4">
            <H2>My Notices</H2>
            <AnimatedPressable haptics="select" onPress={() => router.push('/(teacher)/notices')}>
              <Caption className="text-primary font-poppins-semibold">View All →</Caption>
            </AnimatedPressable>
          </View>
          {notices.length === 0 ? (
            <Caption>No notices yet.</Caption>
          ) : (
            notices.slice(0, 4).map((notice, idx) => (
              <AnimatedPressable
                key={notice.id}
                haptics="select"
                onPress={() => router.push(`/(teacher)/notices/${notice.id}/analytics`)}
                className={`flex-row items-center justify-between ${idx === Math.min(notices.length, 4) - 1 ? '' : 'mb-3.5'}`}
              >
                <View className="flex-1 pr-3">
                  <BodyMedium numberOfLines={1}>{notice.title}</BodyMedium>
                  <Caption numberOfLines={1} className="mt-0.5">
                    {timeAgo(notice.createdAt)}
                  </Caption>
                </View>
                <View className="flex-row items-center">
                  <Badge label={notice.category} tone={NOTICE_BADGE_TONE[notice.category]} className="mr-1" />
                  <ChevronRight size={18} color={colors.textSecondary} />
                </View>
              </AnimatedPressable>
            ))
          )}
        </Card>
      </Reveal>
    </Screen>
  );
}
