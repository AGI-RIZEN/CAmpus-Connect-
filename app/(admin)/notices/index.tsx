import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Megaphone, Plus } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { IconButton } from '@/components/ui/IconButton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useToast } from '@/components/ui/Toast';
import { useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { listNotices, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { timeAgo } from '@/lib/time';

const badgeTone: Record<NoticeCategory, 'danger' | 'warning' | 'primary' | 'success'> = {
  Urgent: 'danger',
  Exam: 'warning',
  Event: 'primary',
  General: 'success',
};

export default function AdminNoticesScreen() {
  const toast = useToast();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listNotices();
      setNotices(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load notices';
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
        <Header
          title="Notices"
          right={
            <IconButton variant="primary" size={40} onPress={() => router.push('/(admin)/notices/create')}>
              <Plus size={20} color="#fff" />
            </IconButton>
          }
        />

        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} className="rounded-card bg-white dark:bg-surface-dark p-5 mb-3">
            <View className="flex-row items-center justify-between mb-3">
              <Skeleton width={70} height={20} radius={999} />
              <Skeleton width={40} height={12} />
            </View>
            <Skeleton width="85%" height={16} />
            <View className="flex-row items-center justify-between mt-3">
              <Skeleton width="30%" height={12} />
              <Skeleton width="20%" height={12} />
            </View>
          </View>
        ))}
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header
        title="Notices"
        right={
          <IconButton variant="primary" size={40} onPress={() => router.push('/(admin)/notices/create')}>
            <Plus size={20} color="#fff" />
          </IconButton>
        }
      />

      {notices.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={32} color={colors.primary} />}
          title="No notices yet"
          description="Notices published by teachers and admins will show up here."
        />
      ) : (
        notices.map((notice, idx) => (
          <Reveal key={notice.id} index={idx}>
            <AnimatedPressable
              haptics="select"
              scaleTo={0.98}
              onPress={() => router.push(`/(admin)/dashboard/announcement-analytics/${notice.id}`)}
              className="mb-3"
            >
              <Card tone="white">
                <View className="flex-row items-center justify-between mb-2">
                  <Badge label={notice.category} tone={badgeTone[notice.category]} />
                  {notice.pinned && <Caption className="text-primary font-poppins-semibold">Pinned</Caption>}
                </View>
                <BodyMedium numberOfLines={2}>{notice.title}</BodyMedium>
                <View className="flex-row items-center justify-between mt-3">
                  <Caption>{notice.author.fullName}</Caption>
                  <Caption>{timeAgo(notice.createdAt)}</Caption>
                </View>
              </Card>
            </AnimatedPressable>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
