import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H2, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { SecondaryButton } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { getNoticeAnalytics, remindStudent, type NoticeAnalytics } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';

export default function TeacherNoticeAnalyticsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const { colorScheme } = useColorScheme();
  const [analytics, setAnalytics] = useState<NoticeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const result = await getNoticeAnalytics(id);
      setAnalytics(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load analytics';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const remind = async (studentId: string, name: string) => {
    try {
      await remindStudent(id, studentId);
      haptic.success();
      toast(`Reminder sent to ${name}`);
      setRemindedIds((prev) => new Set(prev).add(studentId));
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not send reminder';
      toast(message, 'error');
    }
  };

  if (loading || !analytics) {
    return (
      <Screen>
        <View className="flex-row items-center pt-4 pb-5">
          <IconButton onPress={() => router.back()}>
            <ChevronLeft size={22} color={colors.ink} />
          </IconButton>
          <View className="flex-1 ml-3">
            <Skeleton width={160} height={20} />
          </View>
        </View>
        <Skeleton height={220} radius={28} className="mb-5" />
        <Skeleton height={80} radius={28} className="mb-3" />
      </Screen>
    );
  }

  const remaining = analytics.unreadStudents.filter((s) => !remindedIds.has(s.id));

  return (
    <Screen>
      <View className="flex-row items-center pt-4 pb-5">
        <IconButton onPress={() => router.back()}>
          <ChevronLeft size={22} color={colors.ink} />
        </IconButton>
        <View className="flex-1 ml-3">
          <H2>Notice Analytics</H2>
          <Caption numberOfLines={1}>{analytics.title}</Caption>
        </View>
      </View>

      <Card tone="white" className="items-center mb-5">
        <ProgressRing
          size={150}
          strokeWidth={14}
          progress={analytics.readPct / 100}
          color={colors.success}
          trackColor={colorScheme === 'dark' ? colors.borderDark : colors.borderLight}
        >
          <View className="items-center">
            <H2>{analytics.readPct}%</H2>
            <Caption>Read</Caption>
          </View>
        </ProgressRing>

        <View className="flex-row mt-5 w-full">
          <View className="flex-1 bg-success/15 rounded-input px-4 py-3 mr-2">
            <Caption>Read</Caption>
            <H2 className="mt-0.5">{analytics.readCount.toLocaleString()}</H2>
          </View>
          <View className="flex-1 bg-warning/15 rounded-input px-4 py-3">
            <Caption>Unread</Caption>
            <H2 className="mt-0.5">{analytics.unreadCount.toLocaleString()}</H2>
          </View>
        </View>
      </Card>

      <BodyMedium className="mb-3">Haven&apos;t read yet</BodyMedium>

      {remaining.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={32} color={colors.success} />}
          title="Everyone's caught up"
          description="All listed students have read this notice."
        />
      ) : (
        remaining.map((s, idx) => (
          <Reveal key={s.id} index={idx}>
            <Card tone="white" className="flex-row items-center mb-3">
              <Avatar uri={s.avatarUrl} name={s.name} size={44} />
              <View className="flex-1 ml-3">
                <BodyMedium>{s.name}</BodyMedium>
                <Caption>{s.course}</Caption>
              </View>
              <SecondaryButton label="Remind" onPress={() => remind(s.id, s.name)} className="px-4 py-2" />
            </Card>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
