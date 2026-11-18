import React, { useCallback, useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';
import { Users, Trash2 } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { useFakeRefresh } from '@/lib/hooks';
import { listAllGroups, deleteGroup, type AdminGroup } from '@/lib/api/chat';
import { ApiRequestError } from '@/lib/api/client';
import { colors } from '@/lib/theme';

export default function AdminGroupsScreen() {
  const toast = useToast();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listAllGroups();
      setGroups(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load groups';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const confirmDelete = (group: AdminGroup) => {
    Alert.alert(
      `Delete "${group.name}"?`,
      'This permanently deletes the group, all its messages, and its member list. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(group.id);
            try {
              await deleteGroup(group.id);
              setGroups((list) => list.filter((g) => g.id !== group.id));
              toast(`"${group.name}" deleted`);
              haptic.warning();
            } catch (err) {
              const message = err instanceof ApiRequestError ? err.message : 'Could not delete the group';
              toast(message, 'error');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="Groups" />

      <View className="mb-5">
        <PrimaryButton label="Create Group" onPress={() => router.push('/(admin)/groups/create')} />
      </View>

      {loading ? (
        <>
          <Skeleton height={76} radius={20} className="mb-3" />
          <Skeleton height={76} radius={20} className="mb-3" />
        </>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users size={32} color={colors.primary} />}
          title="No groups yet"
          description="Groups you create will show up here."
        />
      ) : (
        groups.map((g, idx) => (
          <Reveal key={g.id} index={idx}>
            <AnimatedPressable
              onPress={() => router.push(`/(app)/chat/group/${g.id}`)}
              haptics="select"
              scaleTo={0.98}
            >
              <Card tone="white" className="flex-row items-center mb-3">
                <Avatar uri={g.iconUrl} name={g.name} size={48} />
                <View className="flex-1 ml-3">
                  <BodyMedium numberOfLines={1}>{g.name}</BodyMedium>
                  <View className="flex-row items-center mt-1">
                    <Users size={14} color={colors.textSecondary} />
                    <Caption className="ml-1.5">{g.memberCount} members</Caption>
                  </View>
                </View>
                <IconButton
                  onPress={(e) => {
                    e.stopPropagation();
                    confirmDelete(g);
                  }}
                  disabled={deletingId === g.id}
                >
                  <Trash2 size={18} color={colors.danger} />
                </IconButton>
              </Card>
            </AnimatedPressable>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
