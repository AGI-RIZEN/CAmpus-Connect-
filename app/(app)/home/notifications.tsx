import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  Bell,
  Heart,
  Trophy,
  MessageCircle,
  Megaphone,
  Flag,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { H2, BodyMedium, Body, Caption } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { timeAgo } from '@/lib/time';
import { listNotifications, markNotificationRead, type Notification } from '@/lib/api/notifications';
import { ApiRequestError } from '@/lib/api/client';

const iconMap: Record<string, LucideIcon> = {
  notice: Megaphone,
  notice_reminder: Megaphone,
  like: Heart,
  comment: MessageCircle,
  post_approved: CheckCircle2,
  post_rejected: XCircle,
  post_reported: Flag,
  quiz_result: Trophy,
};

function NotificationRow({ item, index, onPress }: { item: Notification; index: number; onPress: () => void }) {
  const Icon = iconMap[item.type] ?? Bell;
  return (
    <Reveal index={index}>
      <Pressable className="flex-row items-start mb-4" onPress={onPress}>
        <View className="w-11 h-11 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center">
          <Icon size={20} color={colors.primary} />
        </View>
        <View className="flex-1 ml-3">
          <BodyMedium numberOfLines={1}>{item.title}</BodyMedium>
          <Body className="text-text-secondary dark:text-text-secondary-dark mt-0.5" numberOfLines={1}>
            {item.body}
          </Body>
        </View>
        <View className="items-end">
          <Caption className="ml-2">{timeAgo(item.createdAt)}</Caption>
          {!item.isRead && <View className="w-2 h-2 rounded-full bg-primary mt-1.5" />}
        </View>
      </Pressable>
    </Reveal>
  );
}

function NotificationsSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <View key={i} className="flex-row items-start mb-4">
          <Skeleton width={44} height={44} radius={22} />
          <View className="flex-1 ml-3">
            <Skeleton width="70%" height={14} />
            <Skeleton width="50%" height={12} className="mt-2" />
          </View>
        </View>
      ))}
    </>
  );
}

export default function NotificationsScreen() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listNotifications();
      setNotifications(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load notifications';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const markRead = (item: Notification) => {
    if (item.isRead) return;
    setNotifications((list) => list.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
    markNotificationRead(item.id).catch(() => {});
  };

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
  const today = notifications.filter((n) => isToday(n.createdAt));
  const earlier = notifications.filter((n) => !isToday(n.createdAt));

  if (loading) {
    return (
      <Screen>
        <Header title="Notifications" />
        <H2 className="mt-5 mb-3">Today</H2>
        <NotificationsSkeleton />
        <H2 className="mt-5 mb-3">Earlier</H2>
        <NotificationsSkeleton />
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Notifications" />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={32} color={colors.primary} />}
          title="Nothing here"
          description="Likes, comments, and updates on your posts will show up here."
        />
      ) : (
        <>
          <View className="mt-5">
            <H2 className="mb-3">Today</H2>
            {today.length === 0 ? (
              <Caption>No notifications today.</Caption>
            ) : (
              today.map((item, i) => <NotificationRow key={item.id} item={item} index={i} onPress={() => markRead(item)} />)
            )}
          </View>
          <View className="mt-5">
            <H2 className="mb-3">Earlier</H2>
            {earlier.length === 0 ? (
              <Caption>Nothing earlier.</Caption>
            ) : (
              earlier.map((item, i) => (
                <NotificationRow key={item.id} item={item} index={today.length + i} onPress={() => markRead(item)} />
              ))
            )}
          </View>
        </>
      )}
      <View className="mb-8" />
    </Screen>
  );
}
