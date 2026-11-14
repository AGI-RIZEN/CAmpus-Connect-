import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowUpRight,
  ClipboardList,
  Megaphone,
  Plus,
  TrendingUp,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, H2, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { listQuizzes, getQuizAnalytics, type QuizStatus, type QuizSummary } from '@/lib/api/quizzes';
import { listNotices, getNoticeAnalytics, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/time';

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

type ActivityItem = {
  id: string;
  kind: 'quiz' | 'notice';
  title: string;
  subtitle: string;
  route: string;
  label: string;
  tone: 'warning' | 'success' | 'primary' | 'danger';
  createdAt: string;
};

function QuickCreateCard({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  tone: 'lavender' | 'peach';
  onPress: () => void;
}) {
  return (
    <AnimatedPressable haptics="tap" scaleTo={0.97} onPress={onPress} className="flex-1">
      <Card tone={tone} className="min-h-[128px] justify-between">
        <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/15 items-center justify-center">
          {icon}
        </View>
        <View className="flex-row items-end justify-between mt-3">
          <BodyMedium className="flex-1 pr-2">{label}</BodyMedium>
          <View className="w-8 h-8 rounded-full bg-ink items-center justify-center">
            <ArrowUpRight size={16} color="#fff" />
          </View>
        </View>
      </Card>
    </AnimatedPressable>
  );
}

export default function TeacherHomeScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const { refreshing, onRefresh } = useFakeRefresh();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [avgReadPct, setAvgReadPct] = useState(0);

  const load = useCallback(async () => {
    try {
      const [quizList, noticeList] = await Promise.all([
        listQuizzes({ mine: true }),
        listNotices({ mine: true }),
      ]);
      setQuizzes(quizList);
      setNotices(noticeList);

      const readRates = await Promise.all(noticeList.map((n) => getNoticeAnalytics(n.id).catch(() => null)));
      const valid = readRates.filter((r): r is NonNullable<typeof r> => r !== null);
      setAvgReadPct(valid.length ? Math.round(valid.reduce((sum, r) => sum + r.readPct, 0) / valid.length) : 0);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load your dashboard';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  // Both lists are already newest-first from the API, so interleaving them in that
  // order is a reasonable approximation of "recent activity" across both kinds.
  const activity = useMemo<ActivityItem[]>(() => {
    const noticeItems: ActivityItem[] = notices.map((n) => ({
      id: `notice-${n.id}`,
      kind: 'notice',
      title: n.title,
      subtitle: `${n.category} · ${formatDate(n.createdAt)}`,
      route: `/(teacher)/notices/${n.id}/analytics`,
      label: n.category,
      tone: NOTICE_BADGE_TONE[n.category],
      createdAt: n.createdAt,
    }));
    const quizItems: ActivityItem[] = quizzes.map((q) => ({
      id: `quiz-${q.id}`,
      kind: 'quiz',
      title: q.title,
      subtitle: `${q.course} · Sem ${q.semester}`,
      route: `/(teacher)/quizzes/${q.id}/analytics`,
      label: QUIZ_STATUS_LABEL[q.status],
      tone: QUIZ_STATUS_TONE[q.status],
      createdAt: q.createdAt,
    }));
    return [...noticeItems, ...quizItems]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [notices, quizzes]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-row items-center mt-6 mb-6">
          <Skeleton width={52} height={52} radius={26} />
          <View className="ml-3 flex-1">
            <Skeleton width="60%" height={20} />
            <Skeleton width="40%" height={14} className="mt-2" />
          </View>
        </View>
        <View className="flex-row mb-6" style={{ gap: 12 }}>
          <Skeleton height={128} radius={20} className="flex-1" />
          <Skeleton height={128} radius={20} className="flex-1" />
        </View>
        <View className="flex-row flex-wrap -mx-1.5 mb-6">
          {[0, 1, 2].map((i) => (
            <View key={i} className="w-1/2 px-1.5 mb-3">
              <Skeleton height={140} radius={20} />
            </View>
          ))}
        </View>
        <SkeletonCard />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-center mt-6 mb-6">
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={52} />
        <View className="ml-3 flex-1">
          <H1 numberOfLines={1}>Hey, {user?.fullName ?? 'there'} 👋</H1>
          <View className="bg-card-lavender dark:bg-card-lavender-dark self-start rounded-full px-2.5 py-0.5 mt-1">
            <Caption className="font-poppins-semibold">Teacher</Caption>
          </View>
        </View>
      </View>

      <View className="flex-row mb-6" style={{ gap: 12 }}>
        <QuickCreateCard
          icon={<Plus size={20} color={colors.ink} />}
          label="Create Quiz"
          tone="lavender"
          onPress={() => router.push('/(teacher)/quizzes/create')}
        />
        <QuickCreateCard
          icon={<Plus size={20} color={colors.ink} />}
          label="Create Notice"
          tone="peach"
          onPress={() => router.push('/(teacher)/notices/create')}
        />
      </View>

      <View className="flex-row flex-wrap -mx-1.5 mb-6">
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<ClipboardList size={20} color={colors.ink} />}
            label="My Quizzes"
            value={String(quizzes.length)}
            animateValue={quizzes.length}
            animateDelay={0}
            tone="mint"
            onPress={() => router.push('/(teacher)/quizzes')}
          />
        </View>
        <View className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Megaphone size={20} color={colors.ink} />}
            label="My Notices"
            value={String(notices.length)}
            animateValue={notices.length}
            animateDelay={100}
            tone="butter"
            onPress={() => router.push('/(teacher)/notices')}
          />
        </View>
        <View className="w-full px-1.5">
          <StatCard
            icon={<TrendingUp size={20} color={colors.ink} />}
            label="Avg. Read Rate"
            value={`${avgReadPct}%`}
            animateValue={avgReadPct}
            animateFormat={(n) => `${n}%`}
            animateDelay={200}
            tone="sky"
            onPress={() => router.push('/(teacher)/analytics')}
          />
        </View>
      </View>

      <H2 className="mb-3">Recent Activity</H2>
      {activity.length === 0 ? (
        <Caption>Create a quiz or notice to see it here.</Caption>
      ) : (
        activity.map((item, idx) => {
          const Icon = item.kind === 'quiz' ? ClipboardList : Megaphone;
          return (
            <Reveal key={item.id} index={idx}>
              <AnimatedPressable
                haptics="select"
                scaleTo={0.98}
                onPress={() => router.push(item.route)}
                className="mb-3"
              >
                <Card tone="white" className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center mr-3">
                    <Icon size={18} color={colors.ink} />
                  </View>
                  <View className="flex-1 pr-2">
                    <BodyMedium numberOfLines={1}>{item.title}</BodyMedium>
                    <Caption numberOfLines={1} className="mt-0.5">
                      {item.subtitle}
                    </Caption>
                  </View>
                  <Badge label={item.label} tone={item.tone} />
                </Card>
              </AnimatedPressable>
            </Reveal>
          );
        })
      )}
    </Screen>
  );
}
