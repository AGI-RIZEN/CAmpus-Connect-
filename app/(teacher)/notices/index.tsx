import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Megaphone, Plus, Users } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';
import { listNotices, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { timeAgo } from '@/lib/time';

const badgeTone: Record<NoticeCategory, 'danger' | 'warning' | 'primary' | 'success'> = {
  Urgent: 'danger',
  Exam: 'warning',
  Event: 'primary',
  General: 'success',
};

export default function MyNoticesScreen() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const result = await listNotices({ mine: true });
      setNotices(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load your notices';
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
        <View className="flex-row items-center justify-between pt-4 pb-5">
          <View>
            <Skeleton width={140} height={24} />
            <Skeleton width={100} height={14} className="mt-2" />
          </View>
          <Skeleton width={44} height={44} radius={22} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} className="mb-3">
            <Skeleton height={130} radius={20} />
          </View>
        ))}
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-center justify-between pt-4 pb-5">
        <View>
          <H1>My Notices</H1>
          <Caption className="mt-0.5">{notices.length} total</Caption>
        </View>
        <IconButton variant="primary" onPress={() => router.push('/(teacher)/notices/create')}>
          <Plus size={20} color="#fff" />
        </IconButton>
      </View>

      {notices.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={32} color={colors.primary} />}
          title="No notices yet"
          description="Notices you publish will show up here."
        />
      ) : (
        notices.map((notice, idx) => (
          <Reveal key={notice.id} index={idx}>
            <AnimatedPressable
              haptics="select"
              scaleTo={0.98}
              onPress={() => router.push(`/(teacher)/notices/${notice.id}/analytics`)}
              className="mb-3"
            >
              <Card tone="white">
                <View className="flex-row items-center justify-between mb-2">
                  <Badge label={notice.category} tone={badgeTone[notice.category]} />
                  <Caption>{timeAgo(notice.createdAt)}</Caption>
                </View>
                <BodyMedium numberOfLines={1} className="mb-1">
                  {notice.title}
                </BodyMedium>
                <Caption numberOfLines={2} className="mb-3">
                  {notice.preview}
                </Caption>
                <View className="flex-row items-center">
                  <Users size={14} color={colors.textSecondary} />
                  <Caption className="ml-1.5">
                    {notice.targetCourse
                      ? `By course · ${notice.targetCourse}${notice.targetSemester ? ` Sem ${notice.targetSemester}` : ''}`
                      : 'All Students'}
                  </Caption>
                </View>
              </Card>
            </AnimatedPressable>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
