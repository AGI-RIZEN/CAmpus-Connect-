import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ShieldCheck, Users, Clock, UserCheck, Ban, Bell, Heart, MessageCircle } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, H2, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { SecondaryButton } from '@/components/ui/Button';
import { IconButton } from '@/components/ui/IconButton';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { Skeleton, SkeletonCard } from '@/components/ui/Skeleton';
import { useFakeLoading, useFakeRefresh } from '@/lib/hooks';
import { FilterPill } from '@/components/screens/admin/FilterPill';
import { LineChart } from '@/components/screens/admin/LineChart';
import { PillBarChart } from '@/components/screens/admin/PillBarChart';
import { courses, semesters } from '@/lib/mock-data';
import { colors } from '@/lib/theme';
import { getAdminNotifications, getDashboardStats, type AdminDashboardStats } from '@/lib/api/admin';
import { listNotices } from '@/lib/api/notices';
import { listQuizzes } from '@/lib/api/quizzes';

const dateRanges = ['Today', 'This Week', 'This Month', 'This Semester'] as const;

// Smaller, lower-alpha blobs than the GradientBlob defaults — the dashboard header is a short
// strip, not a full hero, so the ambient wash needs to fade out well before the strip's edges.
const HEADER_BLOBS = [
  { size: 170, top: -70, left: -50, colors: ['#2F6FED3D', '#2F6FED00'] as [string, string], driftRange: 14, duration: 6500 },
  { size: 150, top: -40, right: 10, colors: ['#5B8DFF33', '#5B8DFF00'] as [string, string], driftRange: 18, duration: 7800 },
];

export default function AdminDashboardScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const courseOptions = useMemo(() => ['All Courses', ...courses], []);
  const semesterOptions = useMemo(
    () => ['All Semesters', ...semesters.map((s) => `Semester ${s}`)],
    []
  );

  const [course, setCourse] = useState(courseOptions[0]);
  const [semester, setSemester] = useState(semesterOptions[0]);
  const [dateRange, setDateRange] = useState<(typeof dateRanges)[number]>('This Week');

  // The pills show display strings ("All Courses", "Semester 2") — translate those back to
  // the real filter values the API expects (undefined = no filter).
  const courseFilter = course === 'All Courses' ? undefined : course;
  const semesterFilter = semester === 'All Semesters' ? undefined : Number(semester.replace('Semester ', ''));

  const [demoNoticeId, setDemoNoticeId] = useState<string | null>(null);
  const [demoQuizId, setDemoQuizId] = useState<string | null>(null);

  const missedTrackColor = isDark ? 'rgba(239,68,68,0.28)' : 'rgba(239,68,68,0.16)';

  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const loading = useFakeLoading(700) || statsLoading;
  const { refreshing, onRefresh } = useFakeRefresh();

  const [unreadCount, setUnreadCount] = useState(0);
  useEffect(() => {
    getAdminNotifications()
      .then((list) => setUnreadCount(list.filter((n) => !n.isRead).length))
      .catch(() => {});
  }, [refreshing]);

  useEffect(() => {
    // Not resetting statsLoading to true here — it's already true on first mount, and
    // re-fetches on filter changes should just swap the numbers in place, not flash the
    // full skeleton again.
    getDashboardStats({ course: courseFilter, semester: semesterFilter, dateRange })
      .then(setStats)
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [refreshing, courseFilter, semesterFilter, dateRange]);

  useEffect(() => {
    listNotices()
      .then((list) => setDemoNoticeId(list[0]?.id ?? null))
      .catch(() => {});
    listQuizzes()
      .then((list) => setDemoQuizId(list[0]?.id ?? null))
      .catch(() => {});
  }, [refreshing]);

  if (loading) {
    return (
      <Screen>
        <View className="flex-row items-center mt-6 mb-5">
          <Skeleton width={44} height={44} radius={22} />
          <Skeleton width="55%" height={22} className="ml-3" />
        </View>

        <View className="flex-row mb-6">
          <Skeleton height={42} radius={999} className="flex-1 mr-2" />
          <Skeleton height={42} radius={999} className="flex-1 mr-2" />
          <Skeleton height={42} radius={999} className="flex-1" />
        </View>

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
        <View className="mt-5">
          <SkeletonCard />
        </View>
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Negative margin + matching padding so the ambient blob panel runs a touch wider than
          the content column without shifting the header's own alignment. */}
      <View className="relative overflow-hidden rounded-[28px] -mx-3 px-3 py-3 mt-3 mb-5">
        <GradientBlob blobs={HEADER_BLOBS} />
        <Reveal index={0} spring scaleIn className="flex-row items-center">
          <View className="w-11 h-11 rounded-full bg-primary/15 items-center justify-center mr-3">
            <ShieldCheck size={22} color={colors.primary} />
          </View>
          <H1 className="flex-1">Admin Control Room</H1>
          <IconButton onPress={() => router.push('/(admin)/dashboard/notifications')}>
            <View>
              <Bell size={20} color={colors.ink} />
              {unreadCount > 0 && (
                <View className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-danger" />
              )}
            </View>
          </IconButton>
        </Reveal>
      </View>

      <View className="flex-row mb-6">
        <FilterPill label="Course" value={course} options={courseOptions} onChange={setCourse} className="flex-1 mr-2" />
        <FilterPill
          label="Semester"
          value={semester}
          options={semesterOptions}
          onChange={setSemester}
          className="flex-1 mr-2"
        />
        <FilterPill
          label="Date Range"
          value={dateRange}
          options={[...dateRanges]}
          onChange={setDateRange}
          className="flex-1"
        />
      </View>

      <View className="flex-row flex-wrap -mx-1.5 mb-6">
        <Reveal index={0} step={80} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <StatCard
            icon={<Users size={20} color={colors.ink} />}
            label="Total Students"
            value={(stats?.totalStudents ?? 0).toLocaleString()}
            animateValue={stats?.totalStudents ?? 0}
            animateDelay={0}
            tone="lavender"
            onPress={() => router.push({ pathname: '/(admin)/more/users', params: { role: 'Student', status: 'Active' } })}
          />
        </Reveal>

        <Reveal index={1} step={80} spring scaleIn className="w-1/2 px-1.5 mb-3">
          <Card tone="peach" className="min-h-[140px] justify-between">
            <View className="w-10 h-10 rounded-full bg-white/60 dark:bg-black/15 items-center justify-center">
              <Clock size={20} color={colors.ink} />
            </View>
            <View className="mt-3">
              <AnimatedCounter
                value={stats?.pendingApprovals ?? 0}
                delay={100}
                className="font-poppins-semibold text-h1 text-text-primary dark:text-text-primary-dark"
              />
              <Caption className="mt-0.5 mb-2.5">Pending Approvals</Caption>
              <SecondaryButton
                label="Review"
                onPress={() => router.push('/(admin)/approvals')}
                className="self-start px-4 py-2"
              />
            </View>
          </Card>
        </Reveal>

        <Reveal index={2} step={80} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<UserCheck size={20} color={colors.ink} />}
            label="Active Today"
            value={(stats?.activeToday ?? 0).toLocaleString()}
            animateValue={stats?.activeToday ?? 0}
            animateDelay={200}
            tone="mint"
            onPress={() => router.push({ pathname: '/(admin)/more/users', params: { activeToday: 'true' } })}
          />
        </Reveal>

        <Reveal index={3} step={80} spring scaleIn className="w-1/2 px-1.5">
          <StatCard
            icon={<Ban size={20} color={colors.ink} />}
            label="Banned Users"
            value={String(stats?.bannedUsers ?? 0)}
            animateValue={stats?.bannedUsers ?? 0}
            animateDelay={300}
            tone="butter"
            onPress={() => router.push({ pathname: '/(admin)/more/users', params: { status: 'Banned' } })}
          />
        </Reveal>
      </View>

      {/* Chart cards start their reveal after the stat-card cascade has landed. */}
      <Reveal index={0} baseDelay={240}>
        <Card tone="white" className="mb-5">
          <H2 className="mb-1">Active Users (7 days)</H2>
          <Caption className="mb-4">Daily active students across all courses</Caption>
          <LineChart data={stats?.activeUsersWeek ?? [0, 0, 0, 0, 0, 0, 0]} />
        </Card>
      </Reveal>

      <Reveal index={1} baseDelay={240}>
        <Card tone="white" className="mb-5">
          <H2 className="mb-4">Announcement Read Rate</H2>
          <PillBarChart data={stats?.readRates ?? []} />
          {demoNoticeId && (
            <Pressable
              onPress={() => router.push(`/(admin)/dashboard/announcement-analytics/${demoNoticeId}`)}
              className="mt-4 self-start"
            >
              <Caption className="text-primary font-poppins-semibold">View details →</Caption>
            </Pressable>
          )}
        </Card>
      </Reveal>

      <Reveal index={2}>
        <Card tone="white" className="mb-5">
          <H2 className="mb-4">Quiz Participation</H2>
          <View className="items-center">
            <ProgressRing
              size={150}
              strokeWidth={14}
              progress={(stats?.quizAttempted ?? 0) / 100}
              color={colors.primary}
              trackColor={missedTrackColor}
            >
              <View className="items-center">
                <H1>{stats?.quizAttempted ?? 0}%</H1>
                <Caption>Attempted</Caption>
              </View>
            </ProgressRing>
          </View>

          <View className="flex-row justify-center mt-5">
            <View className="flex-row items-center mr-5">
              <View className="w-2.5 h-2.5 rounded-full bg-primary mr-1.5" />
              <Caption>Attempted · {stats?.quizAttempted ?? 0}%</Caption>
            </View>
            <View className="flex-row items-center">
              <View className="w-2.5 h-2.5 rounded-full bg-danger mr-1.5" />
              <Caption>Missed · {stats?.quizMissed ?? 0}%</Caption>
            </View>
          </View>

          {demoQuizId && (
            <Pressable
              onPress={() => router.push(`/(admin)/dashboard/quiz-analytics/${demoQuizId}`)}
              className="mt-4 self-start"
            >
              <Caption className="text-primary font-poppins-semibold">View details →</Caption>
            </Pressable>
          )}
        </Card>
      </Reveal>

      <Reveal index={3}>
        <Card tone="white">
          <H2 className="mb-4">Top Posts</H2>
          {(stats?.topPosts ?? []).length === 0 && <Caption>No approved posts yet.</Caption>}
          {(stats?.topPosts ?? []).map((post, idx, arr) => (
            <View
              key={post.id}
              className={`flex-row items-center ${idx === arr.length - 1 ? '' : 'mb-3.5'}`}
            >
              <View>
                <Avatar uri={post.avatarUrl} name={post.author} size={40} />
                <View
                  className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full items-center justify-center border-2 border-white dark:border-surface-dark ${
                    idx === 0
                      ? 'bg-card-butter'
                      : idx === 1
                        ? 'bg-card-sky'
                        : idx === 2
                          ? 'bg-card-peach'
                          : 'bg-card-lavender'
                  }`}
                >
                  <Caption className="font-poppins-bold" style={{ fontSize: 10, lineHeight: 12 }}>
                    {idx + 1}
                  </Caption>
                </View>
              </View>
              <View className="flex-1 ml-3">
                <BodyMedium>{post.author}</BodyMedium>
                <View className="flex-row items-center mt-1">
                  <Heart size={11} color={colors.textSecondary} />
                  <Caption className="ml-1 mr-3">{post.likes}</Caption>
                  <MessageCircle size={11} color={colors.textSecondary} />
                  <Caption className="ml-1">{post.comments}</Caption>
                </View>
              </View>
            </View>
          ))}
        </Card>
      </Reveal>
    </Screen>
  );
}
