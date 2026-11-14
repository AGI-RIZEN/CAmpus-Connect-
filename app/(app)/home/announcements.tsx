import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { BodyMedium, Body, Caption } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { useFakeRefresh } from '@/lib/hooks';
import { Megaphone } from 'lucide-react-native';
import { listNotices, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { useToast } from '@/components/ui/Toast';
import { timeAgo } from '@/lib/time';

const categories: Array<NoticeCategory | 'All'> = ['All', 'Urgent', 'Exam', 'Event', 'General'];

const stripeColor: Record<NoticeCategory, string> = {
  Urgent: 'bg-danger',
  Exam: 'bg-warning',
  Event: 'bg-primary',
  General: 'bg-success',
};

const badgeTone: Record<NoticeCategory, 'danger' | 'warning' | 'primary' | 'success'> = {
  Urgent: 'danger',
  Exam: 'warning',
  Event: 'primary',
  General: 'success',
};

export default function AnnouncementsScreen() {
  const [active, setActive] = useState<NoticeCategory | 'All'>('All');
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const result = await listNotices();
      setAllNotices(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load announcements';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const pinned = allNotices.find((n) => n.pinned);
  const filtered = allNotices.filter((n) => {
    if (n.pinned) return false;
    if (active === 'All') return true;
    return n.category === active;
  });

  if (loading) {
    return (
      <Screen>
        <Header title="Announcements" />
        <View className="flex-row mb-4">
          {categories.map((cat) => (
            <Chip key={cat} label={cat} active={active === cat} onPress={() => setActive(cat)} />
          ))}
        </View>
        <View className="mb-3">
          <SkeletonCard />
        </View>
        <View className="mb-3">
          <SkeletonCard />
        </View>
        <SkeletonCard />
      </Screen>
    );
  }

  let revealIndex = 0;

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Announcements" />

      <View className="flex-row mb-4">
        {categories.map((cat) => (
          <Chip key={cat} label={cat} active={active === cat} onPress={() => setActive(cat)} />
        ))}
      </View>

      {pinned && (
        <Reveal index={revealIndex++} className="mb-4">
          <AnimatedPressable onPress={() => router.push(`/(app)/home/announcement/${pinned.id}`)} haptics="select">
            <Card tone="peach" className="relative">
              <View className="absolute top-4 right-4">
                <Badge label="URGENT" tone="danger" />
              </View>
              <BodyMedium className="pr-20" numberOfLines={2}>
                {pinned.title}
              </BodyMedium>
              <Body className="text-text-secondary dark:text-text-secondary-dark mt-1.5" numberOfLines={2}>
                {pinned.preview}
              </Body>
              <View className="flex-row items-center justify-between mt-3">
                <Caption>{pinned.author.fullName}</Caption>
                <Caption>{timeAgo(pinned.createdAt)}</Caption>
              </View>
            </Card>
          </AnimatedPressable>
        </Reveal>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={32} color="#7C5CFA" />}
          title="No announcements"
          description="There are no notices in this category yet."
        />
      ) : (
        filtered.map((notice) => (
          <Reveal key={notice.id} index={revealIndex++} className="mb-3">
            <AnimatedPressable onPress={() => router.push(`/(app)/home/announcement/${notice.id}`)} haptics="select">
              <Card tone="white" className="flex-row p-0 overflow-hidden">
                <View className={`w-1.5 ${stripeColor[notice.category]}`} />
                <View className="flex-1 px-4 py-4">
                  <View className="flex-row items-center justify-between mb-1">
                    <Badge label={notice.category} tone={badgeTone[notice.category]} />
                    {notice.unread && <View className="w-2 h-2 rounded-full bg-primary" />}
                  </View>
                  <BodyMedium numberOfLines={1} className="mt-1">
                    {notice.title}
                  </BodyMedium>
                  <Body className="text-text-secondary dark:text-text-secondary-dark mt-1" numberOfLines={2}>
                    {notice.preview}
                  </Body>
                  <Caption className="mt-2">{timeAgo(notice.createdAt)}</Caption>
                </View>
              </Card>
            </AnimatedPressable>
          </Reveal>
        ))
      )}

      <View className="mb-8" />
    </Screen>
  );
}
