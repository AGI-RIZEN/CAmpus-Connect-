import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { UserPlus, Flag, Bell as BellIcon } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { BodyMedium, Body, Caption } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { getAdminNotifications, type AdminNotification } from '@/lib/api/admin';
import { ApiRequestError } from '@/lib/api/client';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const iconFor = (type: string) => {
  if (type === 'user_applied') return UserPlus;
  if (type === 'post_reported') return Flag;
  return BellIcon;
};

export default function AdminNotificationsScreen() {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const result = await getAdminNotifications();
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

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Notifications" onBack={() => router.back()} />

      {loading ? (
        <>
          <Skeleton height={72} radius={28} className="mb-3" />
          <Skeleton height={72} radius={28} className="mb-3" />
          <Skeleton height={72} radius={28} className="mb-3" />
        </>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<BellIcon size={32} color={colors.primary} />}
          title="Nothing yet"
          description="New account applications and activity will show up here."
        />
      ) : (
        notifications.map((n, idx) => {
          const Icon = iconFor(n.type);
          return (
            <Reveal key={n.id} index={idx}>
              <Card tone="white" className="flex-row items-start mb-3">
                <View className="w-10 h-10 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center mr-3">
                  <Icon size={18} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <BodyMedium>{n.title}</BodyMedium>
                  <Body className="mt-0.5 text-text-secondary dark:text-text-secondary-dark">{n.body}</Body>
                  <Caption className="mt-1">{timeAgo(n.createdAt)}</Caption>
                </View>
                {!n.isRead && <View className="w-2 h-2 rounded-full bg-primary mt-2" />}
              </Card>
            </Reveal>
          );
        })
      )}
    </Screen>
  );
}
