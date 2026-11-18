import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Users as UsersIcon } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { SearchBar } from '@/components/ui/SearchBar';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, statusTone } from '@/components/ui/Badge';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { ReasonSheet } from '@/components/screens/admin/ReasonSheet';
import { haptic } from '@/lib/haptics';
import * as adminApi from '@/lib/api/admin';
import { ApiRequestError, isNetworkError } from '@/lib/api/client';

type RoleFilter = 'All' | 'Student' | 'Teacher' | 'Admin' | 'Alumni';
type StatusFilter = 'All' | 'Active' | 'PendingApproval' | 'Rejected' | 'Banned';

const roles: RoleFilter[] = ['All', 'Student', 'Teacher', 'Admin', 'Alumni'];
const statuses: StatusFilter[] = ['All', 'Active', 'PendingApproval', 'Rejected', 'Banned'];
const statusLabel: Record<StatusFilter, string> = {
  All: 'All',
  Active: 'Active',
  PendingApproval: 'Pending',
  Rejected: 'Rejected',
  Banned: 'Banned',
};

export default function UserManagementScreen() {
  // Lets the dashboard's stat cards deep-link here already filtered, e.g. ?status=Banned
  // or ?activeToday=true for "who did something today" (there's no separate screen for that).
  const params = useLocalSearchParams<{ role?: string; status?: string; activeToday?: string }>();

  const [users, setUsers] = useState<adminApi.AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<RoleFilter>((params.role as RoleFilter) || 'All');
  const [status, setStatus] = useState<StatusFilter>((params.status as StatusFilter) || 'All');
  const activeToday = params.activeToday === 'true';
  const [banTarget, setBanTarget] = useState<adminApi.AdminUser | null>(null);
  const [banning, setBanning] = useState(false);
  const toast = useToast();

  const loadUsers = useCallback(
    async (searchTerm: string, roleFilter: RoleFilter, statusFilter: StatusFilter) => {
      setLoading(true);
      try {
        const result = await adminApi.listUsers({
          search: searchTerm || undefined,
          role: roleFilter === 'All' ? undefined : roleFilter,
          status: statusFilter === 'All' ? undefined : statusFilter,
          activeToday: activeToday || undefined,
        });
        setUsers(result);
        setOffline(false);
      } catch (err) {
        if (isNetworkError(err)) {
          setOffline(true);
          return;
        }
        const message = err instanceof ApiRequestError ? err.message : 'Could not load users';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    },
    [activeToday]
  );

  // Debounced so every keystroke doesn't fire a request.
  useEffect(() => {
    const t = setTimeout(() => loadUsers(search, role, status), 350);
    return () => clearTimeout(t);
  }, [search, role, status, loadUsers]);

  const handleUnban = async (user: adminApi.AdminUser) => {
    try {
      const updated = await adminApi.unbanUser(user.id);
      setUsers((list) => list.map((u) => (u.id === user.id ? updated : u)));
      toast(`${user.fullName} unbanned`, 'success');
      haptic.success();
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not unban user';
      toast(message, 'error');
    }
  };

  const submitBan = async (reason: string) => {
    if (!banTarget) return;
    setBanning(true);
    try {
      const updated = await adminApi.banUser(banTarget.id, reason);
      setUsers((list) => list.map((u) => (u.id === banTarget.id ? updated : u)));
      toast(`${banTarget.fullName} banned`, 'error');
      haptic.warning();
      setBanTarget(null);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not ban user';
      toast(message, 'error');
    } finally {
      setBanning(false);
    }
  };

  return (
    <Screen>
      <Header title="User Management" />

      <SearchBar placeholder="Search by name or email" value={search} onChangeText={setSearch} className="mb-4" />

      <View className="flex-row flex-wrap mb-2">
        {roles.map((r) => (
          <Chip key={r} label={r} active={role === r} onPress={() => setRole(r)} className="mb-2" />
        ))}
      </View>
      <View className="flex-row flex-wrap mb-4">
        {statuses.map((s) => (
          <Chip key={s} label={statusLabel[s]} active={status === s} onPress={() => setStatus(s)} className="mb-2" />
        ))}
      </View>
      {activeToday && (
        <Caption className="mb-4 text-primary">Showing only users active today</Caption>
      )}

      {loading ? (
        <>
          <Skeleton height={76} radius={28} className="mb-3" />
          <Skeleton height={76} radius={28} className="mb-3" />
          <Skeleton height={76} radius={28} className="mb-3" />
        </>
      ) : offline ? (
        <OfflineState onRetry={() => loadUsers(search, role, status)} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={32} color="#2F6FED" />}
          title="No users found"
          description="Try a different search term or filter."
        />
      ) : (
        users.map((u, idx) => (
          <Reveal key={u.id} index={idx}>
            <Card tone="white" className="flex-row items-center mb-3">
              <Avatar uri={u.avatarUrl} name={u.fullName} size={48} />
              <View className="flex-1 ml-3">
                <BodyMedium numberOfLines={1}>{u.fullName}</BodyMedium>
                <Caption className="mt-0.5">{u.course ?? u.role}</Caption>
                <View className="flex-row mt-1.5">
                  <Badge label={u.status} tone={statusTone(u.status)} />
                </View>
              </View>
              {u.status === 'Banned' ? (
                <Pressable onPress={() => handleUnban(u)} className="rounded-full px-4 py-2 bg-success">
                  <Caption className="text-white font-poppins-semibold">Unban</Caption>
                </Pressable>
              ) : u.status === 'Active' && u.role !== 'Admin' ? (
                <Pressable onPress={() => setBanTarget(u)} className="rounded-full px-4 py-2 bg-danger">
                  <Caption className="text-white font-poppins-semibold">Ban</Caption>
                </Pressable>
              ) : null}
            </Card>
          </Reveal>
        ))
      )}

      <ReasonSheet
        visible={!!banTarget}
        title={`Ban ${banTarget?.fullName ?? ''}`}
        description="They'll get an email with the reason, and lose access immediately."
        quickReasons={['Spam / abuse', 'Harassment', 'Violated community guidelines']}
        submitting={banning}
        onClose={() => setBanTarget(null)}
        onSubmit={submitBan}
      />
    </Screen>
  );
}
