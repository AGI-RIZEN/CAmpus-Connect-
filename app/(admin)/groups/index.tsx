import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Users } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useFakeRefresh } from '@/lib/hooks';
import { listAllGroups, type AdminGroup } from '@/lib/api/chat';
import { ApiRequestError } from '@/lib/api/client';
import { colors } from '@/lib/theme';

export default function AdminGroupsScreen() {
  const toast = useToast();
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
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
            <Card tone="white" className="flex-row items-center mb-3">
              <Avatar uri={g.iconUrl} name={g.name} size={48} />
              <View className="flex-1 ml-3">
                <BodyMedium numberOfLines={1}>{g.name}</BodyMedium>
                <View className="flex-row items-center mt-1">
                  <Users size={14} color={colors.textSecondary} />
                  <Caption className="ml-1.5">{g.memberCount} members</Caption>
                </View>
              </View>
            </Card>
          </Reveal>
        ))
      )}
    </Screen>
  );
}
