import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { MessageCircle, ChevronRight, Users } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, H2, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Chip } from '@/components/ui/Chip';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useFakeRefresh } from '@/lib/hooks';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { listMyGroups, type GroupSummary } from '@/lib/api/chat';
import { ApiRequestError, isNetworkError } from '@/lib/api/client';
import { timeAgo } from '@/lib/time';

type Tab = 'community' | 'groups';

const tabs: { key: Tab; label: string }[] = [
  { key: 'community', label: 'Community' },
  { key: 'groups', label: 'Groups' },
];

export default function ChatHomeScreen() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('groups');
  const [groupsList, setGroupsList] = useState<GroupSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listMyGroups();
      setGroupsList(result);
      setOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        // Device can't reach the server at all — show the offline state instead of a toast.
        setOffline(true);
        return;
      }
      const message = err instanceof ApiRequestError ? err.message : 'Could not load your chats';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const community = groupsList.find((g) => g.isCommunity);
  const myGroups = groupsList.filter((g) => !g.isCommunity);
  const totalUnread = myGroups.reduce((sum, g) => sum + g.unreadCount, 0);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <H1 className="mt-6 mb-1">Chat</H1>
      <Body className="text-text-secondary dark:text-text-secondary-dark mb-5">
        Stay connected with your campus
      </Body>

      <View className="flex-row mb-5">
        {tabs.map((t) => (
          <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>

      {loading ? (
        <>
          <Skeleton height={86} radius={20} className="mb-6" />
          {[0, 1, 2, 3].map((i) => (
            <View key={i} className="flex-row items-center mb-4">
              <Skeleton width={52} height={52} radius={26} />
              <View className="flex-1 ml-3">
                <Skeleton width="55%" height={14} />
                <Skeleton width="75%" height={12} className="mt-2" />
              </View>
            </View>
          ))}
        </>
      ) : offline ? (
        <OfflineState onRetry={load} />
      ) : (
        <>
          {/* Community card — always shown */}
          {community && (
            <Reveal index={0} spring scaleIn>
              <AnimatedPressable onPress={() => router.push('/(app)/chat/community')}>
                <Card tone="lavender" className="flex-row items-center mb-6">
                  <View className="w-14 h-14 rounded-full bg-primary items-center justify-center">
                    <MessageCircle size={24} color="#fff" />
                  </View>
                  <View className="flex-1 ml-4">
                    <BodyMedium>Campus Community</BodyMedium>
                    <Body className="text-text-secondary dark:text-text-secondary-dark mt-0.5" numberOfLines={1}>
                      Everyone&apos;s talking here
                    </Body>
                    <View className="flex-row items-center mt-2">
                      <Users size={12} color={colors.textSecondary} />
                      <Caption className="ml-1.5">{community.memberCount} members</Caption>
                    </View>
                  </View>
                  <ChevronRight size={20} color={colors.ink} />
                </Card>
              </AnimatedPressable>
            </Reveal>
          )}

          {tab === 'groups' && (
            <>
              <View className="flex-row items-center justify-between mb-3">
                <H2>Your Groups</H2>
                {totalUnread > 0 && (
                  <Caption className="text-primary font-poppins-semibold">{totalUnread} unread</Caption>
                )}
              </View>

              {myGroups.length === 0 ? (
                <EmptyState
                  icon={<Users size={32} color={colors.primary} />}
                  title="No groups yet"
                  description="Groups your admin adds you to will show up here."
                />
              ) : (
                myGroups.map((group, i) => (
                  <Reveal key={group.id} index={i + 1} spring>
                    <AnimatedPressable
                      onPress={() => router.push(`/(app)/chat/group/${group.id}`)}
                      className="flex-row items-center mb-4"
                    >
                      <Avatar uri={group.iconUrl} name={group.name} size={52} />
                      <View className="flex-1 ml-3 pr-2">
                        <BodyMedium numberOfLines={1} className={group.unreadCount > 0 ? 'font-poppins-semibold' : ''}>
                          {group.name}
                        </BodyMedium>
                        <Body
                          className={`mt-0.5 ${
                            group.unreadCount > 0
                              ? 'text-text-primary dark:text-text-primary-dark font-poppins-medium'
                              : 'text-text-secondary dark:text-text-secondary-dark'
                          }`}
                          numberOfLines={1}
                        >
                          {group.lastMessage ?? 'No messages yet'}
                        </Body>
                      </View>
                      <View className="items-end" style={{ minWidth: 44 }}>
                        <Caption className={group.unreadCount > 0 ? 'text-primary font-poppins-semibold' : ''}>
                          {timeAgo(group.lastMessageAt)}
                        </Caption>
                        <View style={{ height: 22, marginTop: 6 }}>
                          {group.unreadCount > 0 && (
                            <View
                              style={{ minWidth: 22, height: 22, paddingHorizontal: 6 }}
                              className="rounded-full bg-primary items-center justify-center"
                            >
                              <Caption className="text-white font-poppins-semibold">{group.unreadCount}</Caption>
                            </View>
                          )}
                        </View>
                      </View>
                    </AnimatedPressable>
                  </Reveal>
                ))
              )}
            </>
          )}
        </>
      )}

      <View className="mb-8" />
    </Screen>
  );
}
