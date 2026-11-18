import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
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
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
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

  // 1 = unread, 0 = read. Rows keep their key across `markRead` (the list is mapped, not
  // remounted), so the state flip lands here as a prop change — we ease the unread dot and
  // the faint row highlight out together instead of letting them vanish on the next frame.
  const unread = useSharedValue(item.isRead ? 0 : 1);
  useEffect(() => {
    unread.value = withTiming(item.isRead ? 0 : 1, { duration: 340, easing: Easing.out(Easing.cubic) });
  }, [item.isRead]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: unread.value,
    transform: [{ scale: 0.4 + unread.value * 0.6 }],
  }));
  const highlightStyle = useAnimatedStyle(() => ({ opacity: unread.value * 0.07 }));

  return (
    <Reveal index={index} spring>
      <AnimatedPressable
        haptics="select"
        scaleTo={0.985}
        className="flex-row items-start rounded-[20px] -mx-2 px-2 py-2 mb-2"
        onPress={onPress}
      >
        {/* Soft primary tint behind unread rows — fades away once the row is marked read. */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, highlightStyle]} className="rounded-[20px] bg-primary" />
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
          <Animated.View style={dotStyle} className="w-2 h-2 rounded-full bg-primary mt-1.5" />
        </View>
      </AnimatedPressable>
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

  // Unread-first within each tier — the thing most worth seeing first is what hasn't been seen
  // yet, not just the newest. `sort` is stable in modern JS engines, so this only reorders by
  // read-state and otherwise preserves the server's own (newest-first) ordering within each group.
  const byUnreadFirst = (a: Notification, b: Notification) => Number(a.isRead) - Number(b.isRead);

  const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();
  const isThisWeek = (iso: string) => new Date().getTime() - new Date(iso).getTime() < 7 * 24 * 60 * 60 * 1000;

  const today = notifications.filter((n) => isToday(n.createdAt)).sort(byUnreadFirst);
  const thisWeek = notifications.filter((n) => !isToday(n.createdAt) && isThisWeek(n.createdAt)).sort(byUnreadFirst);
  const earlier = notifications.filter((n) => !isToday(n.createdAt) && !isThisWeek(n.createdAt)).sort(byUnreadFirst);

  if (loading) {
    return (
      <Screen>
        <Header title="Notifications" />
        <H2 className="mt-5 mb-3">Today</H2>
        <NotificationsSkeleton />
        <H2 className="mt-5 mb-3">This Week</H2>
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
            <Reveal index={0}>
              <H2 className="mb-3">Today</H2>
            </Reveal>
            {today.length === 0 ? (
              <Caption>No notifications today.</Caption>
            ) : (
              today.map((item, i) => <NotificationRow key={item.id} item={item} index={i + 1} onPress={() => markRead(item)} />)
            )}
          </View>
          <View className="mt-5">
            <Reveal index={today.length + 1}>
              <H2 className="mb-3">This Week</H2>
            </Reveal>
            {thisWeek.length === 0 ? (
              <Caption>Nothing else this week.</Caption>
            ) : (
              thisWeek.map((item, i) => (
                <NotificationRow key={item.id} item={item} index={today.length + 2 + i} onPress={() => markRead(item)} />
              ))
            )}
          </View>
          <View className="mt-5">
            <Reveal index={today.length + thisWeek.length + 2}>
              <H2 className="mb-3">Earlier</H2>
            </Reveal>
            {earlier.length === 0 ? (
              <Caption>Nothing earlier.</Caption>
            ) : (
              earlier.map((item, i) => (
                <NotificationRow
                  key={item.id}
                  item={item}
                  index={today.length + thisWeek.length + 3 + i}
                  onPress={() => markRead(item)}
                />
              ))
            )}
          </View>
        </>
      )}
      <View className="mb-8" />
    </Screen>
  );
}
