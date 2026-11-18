import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Megaphone,
  Rss,
  Brain,
  Users,
  BarChart2,
  ArrowRight,
  Trophy,
  TrendingUp,
  Clock,
  Flame,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, H2, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { AttentionPulse } from '@/components/screens/notices/AttentionPulse';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { OfflineState } from '@/components/ui/OfflineState';
import { useFakeLoading, useFakeRefresh } from '@/lib/hooks';
import { colors, cardToneClasses, softShadow, softShadowLg, type CardTone } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';
import { listNotices, type Notice } from '@/lib/api/notices';
import { isNetworkError } from '@/lib/api/client';
import { getUnreadCount } from '@/lib/api/notifications';
import { listQuizzes, getLeaderboard, type QuizSummary } from '@/lib/api/quizzes';
import { startsInLabel } from '@/lib/time';

type QuickAction = {
  label: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
  tone: CardTone;
  route: Parameters<typeof router.push>[0];
};

const quickActions: QuickAction[] = [
  { label: 'Notices', icon: Megaphone, tone: 'lavender', route: '/(app)/home/announcements' },
  { label: 'Feed', icon: Rss, tone: 'mint', route: '/(app)/feed' },
  { label: 'Quiz', icon: Brain, tone: 'butter', route: '/(app)/quiz' },
  { label: 'Groups', icon: Users, tone: 'peach', route: '/(app)/chat' },
  { label: 'Polls', icon: BarChart2, tone: 'sky', route: '/(app)/chat' },
];

// Ambient colour behind the greeting + hero: a lavender bloom top-left (behind the avatar/name),
// a lighter primary bloom top-right (behind the bell), and a faint peach warm-up lower-left so
// the quick-actions row doesn't sit on flat background. Alphas are low enough to read as a
// soft wash in both light and dark mode rather than a visible gradient.
const HOME_BLOBS = [
  { size: 300, top: -140, left: -100, colors: ['#2F6FED3D', '#2F6FED00'] as [string, string], driftRange: 18, duration: 6400 },
  { size: 240, top: -70, right: -90, colors: ['#5B8DFF33', '#5B8DFF00'] as [string, string], driftRange: 22, duration: 7600 },
  { size: 220, bottom: -120, left: 40, colors: ['#FFB38A2B', '#FFB38A00'] as [string, string], driftRange: 16, duration: 8400 },
];

export default function HomeScreen() {
  const { user } = useAuth();
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [noticesLoading, setNoticesLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [upcomingQuiz, setUpcomingQuiz] = useState<QuizSummary | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);

  const firstName = user?.fullName.split(' ')[0] ?? 'there';

  const { refreshing, onRefresh } = useFakeRefresh();

  const loadNotices = useCallback(async () => {
    try {
      const result = await listNotices();
      setAllNotices(result);
      setOffline(false);
    } catch (err) {
      // No connectivity at all → swap the screen for the offline state. Any other failure keeps
      // Home usable and just shows the static fallback card.
      if (isNetworkError(err)) setOffline(true);
    } finally {
      setNoticesLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotices();
  }, [loadNotices, refreshing]);

  // Retry from the offline state re-shows the skeleton while we try again (pull-to-refresh
  // deliberately doesn't, so this isn't folded into loadNotices itself).
  const retryNotices = useCallback(() => {
    setNoticesLoading(true);
    loadNotices();
  }, [loadNotices]);

  useEffect(() => {
    getUnreadCount()
      .then(setUnreadNotifs)
      .catch(() => {});
  }, [refreshing]);

  useEffect(() => {
    listQuizzes({ status: 'upcoming' })
      .then((list) => setUpcomingQuiz(list[0] ?? null))
      .catch(() => {});
  }, [refreshing]);

  useEffect(() => {
    getLeaderboard({ scope: 'all', window: 'all' })
      .then((board) => setMyRank(board.myRank?.rank ?? null))
      .catch(() => {});
  }, [refreshing]);

  const urgentNotice = allNotices.find((n) => n.category === 'Urgent') ?? allNotices[0];
  const unreadCount = allNotices.filter((n) => n.unread).length;

  const loading = useFakeLoading(600) || noticesLoading;

  if (loading) {
    return (
      <Screen>
        <View className="flex-row items-center justify-between mt-2">
          <View className="flex-row items-center flex-1 pr-3">
            <Skeleton width={48} height={48} radius={24} />
            <View className="ml-3 flex-1">
              <Skeleton width="55%" height={16} />
              <Skeleton width="35%" height={12} className="mt-2" />
            </View>
          </View>
          <Skeleton width={44} height={44} radius={22} />
        </View>

        <Skeleton height={150} radius={20} className="mt-6" />

        <View className="flex-row mt-6">
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} className="items-center mr-4">
              <Skeleton width={56} height={56} radius={28} />
            </View>
          ))}
        </View>

        <View className="flex-row flex-wrap -mx-1.5 mt-6">
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="w-1/2 px-1.5 mb-3">
              <Skeleton height={140} radius={20} />
            </View>
          ))}
        </View>

        <SkeletonCard />
      </Screen>
    );
  }

  if (offline) {
    return (
      <Screen>
        <OfflineState onRetry={retryNotices} />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Just the header gets the ambient blobs — scoped tightly so they read as a soft wash
          behind the greeting, not a background that bleeds across the notice card and quick
          actions below it (`-mx-screen` undoes Screen's padding, `px-screen` restores it for
          content, both undone outside this box once the header ends). */}
      <View className="relative overflow-hidden -mx-screen px-screen pt-2 pb-2">
        <GradientBlob blobs={HOME_BLOBS} />

      {/* Header */}
      <Reveal index={0} className="flex-row items-center justify-between">
        <AnimatedPressable
          onPress={() => router.push('/(app)/profile')}
          haptics="select"
          scaleTo={0.98}
          className="flex-row items-center flex-1 pr-3"
        >
          <Avatar uri={user?.avatarUrl} name={user?.fullName} size={48} ring />
          <View className="ml-3 flex-1">
            <H2 numberOfLines={1}>Hey, {firstName} 👋</H2>
            <View className="self-start bg-card-lavender dark:bg-card-lavender-dark rounded-full px-3 py-1 mt-1.5">
              <Caption>
                {user?.course ?? '—'} · Sem {user?.semester ?? '—'}
              </Caption>
            </View>
          </View>
        </AnimatedPressable>

        {(user?.currentStreak ?? 0) > 0 && (
          <Reveal spring scaleIn style={{ marginRight: 8 }}>
            <View className="flex-row items-center bg-card-butter dark:bg-card-butter-dark rounded-full px-3 py-1.5">
              <Flame size={16} color={colors.warning} />
              <BodyMedium className="ml-1">{user?.currentStreak}</BodyMedium>
            </View>
          </Reveal>
        )}

        <View className="relative">
          <IconButton onPress={() => router.push('/(app)/home/notifications')}>
            <Bell size={22} color={colors.ink} />
          </IconButton>
          {unreadNotifs > 0 && (
            <AttentionPulse delay={700} className="absolute top-0.5 right-0.5">
              <View className="w-3 h-3 rounded-full bg-danger border-2 border-background dark:border-background-dark" />
            </AttentionPulse>
          )}
        </View>
      </Reveal>
      </View>

      {/* Hero urgent notice */}
      {urgentNotice && (
        <Reveal index={1} spring scaleIn className="mt-6">
        <AnimatedPressable
          onPress={() => router.push(`/(app)/home/announcement/${urgentNotice.id}`)}
          haptics="select"
          scaleTo={0.98}
        >
          <LinearGradient
            colors={[colors.primary, '#1E4FBA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={softShadowLg}
            className="rounded-card p-5 overflow-hidden"
          >
            <View className="flex-row items-start">
              <View className="flex-1 pr-2">
                <AttentionPulse active={urgentNotice.category === 'Urgent'} delay={620}>
                  <View className="bg-white rounded-full px-3 py-1">
                    <Caption className="text-danger font-poppins-bold">URGENT</Caption>
                  </View>
                </AttentionPulse>
                <H2 className="text-white mt-3" numberOfLines={2}>
                  {urgentNotice.title}
                </H2>
                <Body className="text-white/80 mt-2" numberOfLines={2}>
                  {urgentNotice.preview}
                </Body>
                <AnimatedPressable
                  onPress={() => router.push(`/(app)/home/announcement/${urgentNotice.id}`)}
                  haptics="select"
                  className="flex-row items-center bg-white rounded-full px-5 py-2.5 self-start mt-4"
                >
                  <BodyMedium className="text-ink mr-1">View</BodyMedium>
                  <ArrowRight size={16} color={colors.ink} />
                </AnimatedPressable>
              </View>
              <View className="items-center justify-center" style={{ width: 72, height: 72 }}>
                <View className="absolute w-16 h-16 rounded-full bg-white/15" />
                <View style={softShadow} className="w-14 h-14 rounded-full bg-white items-center justify-center">
                  <Megaphone size={24} color={colors.primary} />
                </View>
              </View>
            </View>
          </LinearGradient>
        </AnimatedPressable>
        </Reveal>
      )}

      {/* Quick actions */}
      <Reveal index={2} spring>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-6 pb-1"
          contentContainerClassName="pr-4"
        >
          {quickActions.map((action) => (
            <AnimatedPressable
              key={action.label}
              onPress={() => router.push(action.route)}
              haptics="select"
              className="items-center mr-4"
              style={{ width: 60 }}
            >
              <View
                className={`w-14 h-14 rounded-full items-center justify-center ${cardToneClasses[action.tone]}`}
              >
                <action.icon size={22} color={colors.ink} />
              </View>
              <Caption className="mt-1.5">{action.label}</Caption>
            </AnimatedPressable>
          ))}
        </ScrollView>
      </Reveal>

      {/* Bento stats grid — each tile springs in on its own beat, left-to-right, top-to-bottom. */}
      <View className="flex-row flex-wrap -mx-1.5 mt-6">
        <Reveal index={3} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Trophy size={20} color={colors.ink} />}
            label="Quiz Points"
            value={String(user?.points ?? 0)}
            animateValue={user?.points ?? 0}
            animateDelay={0}
            tone="butter"
          />
        </Reveal>
        <Reveal index={4} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<TrendingUp size={20} color={colors.ink} />}
            label="My Rank"
            value={myRank ? `#${myRank}` : '—'}
            tone="mint"
            onPress={() => router.push('/(app)/quiz/leaderboard')}
          />
        </Reveal>
        <Reveal index={5} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<Bell size={20} color={colors.ink} />}
            label="Unread Notices"
            value={String(unreadCount)}
            animateValue={unreadCount}
            animateDelay={200}
            tone="lavender"
            onPress={() => router.push('/(app)/home/announcements')}
          />
        </Reveal>
        <Reveal index={6} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<Clock size={20} color={colors.ink} />}
            label="Upcoming Quiz"
            value={upcomingQuiz ? startsInLabel(upcomingQuiz.startAt) : '—'}
            tone="peach"
            onPress={() => router.push('/(app)/quiz')}
          />
        </Reveal>
      </View>

      {/* Upcoming quiz section */}
      <Reveal index={7}>
        <H2 className="mt-7 mb-3">Upcoming Quiz</H2>
        <Card tone="white">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Caption>{upcomingQuiz?.subject ?? 'General Knowledge'}</Caption>
              <BodyMedium className="mt-1" numberOfLines={1}>
                {upcomingQuiz?.title ?? 'New quiz coming soon'}
              </BodyMedium>
              <Caption className="mt-2 text-primary">
                Starts {upcomingQuiz ? startsInLabel(upcomingQuiz.startAt) : '— TBA'}
              </Caption>
            </View>
            <View className="bg-card-sky dark:bg-card-sky-dark rounded-full px-4 py-2 flex-row items-center">
              <Clock size={14} color={colors.ink} />
              <Caption className="ml-1.5 font-poppins-semibold">
                {upcomingQuiz ? startsInLabel(upcomingQuiz.startAt) : 'TBA'}
              </Caption>
            </View>
          </View>
        </Card>
      </Reveal>

      <View className="mb-8" />
    </Screen>
  );
}
