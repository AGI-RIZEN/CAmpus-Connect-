import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { softShadowLg } from '@/lib/theme';
import { PodiumSpot } from '@/components/screens/quiz/PodiumSpot';
import { useAuth } from '@/lib/auth-context';
import { getLeaderboard, type Leaderboard } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';

const FILTERS = ['Weekly', 'All-time', 'My Course', 'Semester'] as const;
type Filter = (typeof FILTERS)[number];

const FILTER_PARAMS: Record<Filter, { scope: 'all' | 'course' | 'semester'; window: 'all' | 'weekly' }> = {
  Weekly: { scope: 'all', window: 'weekly' },
  'All-time': { scope: 'all', window: 'all' },
  'My Course': { scope: 'course', window: 'all' },
  Semester: { scope: 'semester', window: 'all' },
};

// List rows continue the podium's stagger — the podium's own reveal sequence
// (3rd → 2nd → 1st pop) finishes around ~800ms, so rows pick up from there.
const LIST_BASE_DELAY = 650;

function PodiumSkeleton() {
  return (
    <View className="flex-row items-end mb-6">
      {[2, 1, 3].map((place) => (
        <View key={place} className="items-center flex-1">
          <View style={{ height: 24 }} />
          <Skeleton width={place === 1 ? 68 : 54} height={place === 1 ? 68 : 54} radius={34} />
          <Skeleton width={48} height={12} className="mt-2" />
          <Skeleton width={40} height={16} radius={8} className="mt-1.5" />
          <View
            style={{ height: place === 1 ? 104 : place === 2 ? 72 : 56 }}
            className="w-full rounded-t-2xl mt-2 bg-card-lavender dark:bg-card-lavender-dark"
          />
        </View>
      ))}
    </View>
  );
}

function RowSkeleton() {
  return (
    <View className="flex-row items-center bg-white dark:bg-surface-dark rounded-card px-4 py-3 mb-3">
      <Skeleton width={20} height={14} />
      <View className="ml-3">
        <Skeleton width={40} height={40} radius={20} />
      </View>
      <View className="flex-1 ml-3 pr-2">
        <Skeleton width="55%" height={14} />
        <Skeleton width="35%" height={12} className="mt-2" />
      </View>
      <Skeleton width={44} height={14} />
    </View>
  );
}

export default function LeaderboardScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [filter, setFilter] = useState<Filter>('All-time');
  const [board, setBoard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const result = await getLeaderboard(FILTER_PARAMS[filter]);
      setBoard(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load the leaderboard';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const entries = board?.entries ?? [];
  const [first, second, third] = entries;
  const rest = entries.slice(3);

  return (
    <Screen scroll={false} contentClassName="pb-0">
      <Header title="Leaderboard" />

      <View className="flex-row mb-5">
        {FILTERS.map((f) => (
          <Chip key={f} label={f} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {loading ? (
        <>
          <PodiumSkeleton />
          <View className="flex-1">
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </View>
        </>
      ) : entries.length === 0 ? (
        <Caption className="mt-8 text-center">No quiz points recorded yet for this filter.</Caption>
      ) : (
        <>
          {/* Podium */}
          <View className="flex-row items-end mb-6">
            {second ? <PodiumSpot entry={second} place={2} /> : <View className="flex-1" />}
            {first ? <PodiumSpot entry={first} place={1} /> : <View className="flex-1" />}
            {third ? <PodiumSpot entry={third} place={3} /> : <View className="flex-1" />}
          </View>

          {/* Rank list from #4 — own scroll area so the "your rank" bar below stays put */}
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerClassName="pb-3">
            {rest.map((entry, i) => (
              <Reveal key={entry.id} index={i} baseDelay={LIST_BASE_DELAY}>
                <View className="flex-row items-center bg-white dark:bg-surface-dark rounded-card px-4 py-3 mb-3">
                  <BodyMedium className="w-7 text-text-secondary dark:text-text-secondary-dark">
                    {entry.rank}
                  </BodyMedium>
                  <Avatar uri={entry.avatarUrl} name={entry.name} size={40} />
                  <View className="flex-1 ml-3 pr-2">
                    <BodyMedium numberOfLines={1}>{entry.name}</BodyMedium>
                    <Caption className="mt-0.5">{entry.course ?? '—'}</Caption>
                  </View>
                  <AnimatedCounter
                    value={entry.points}
                    delay={LIST_BASE_DELAY + i * 60 + 120}
                    className="mr-1.5 font-poppins-medium text-body text-text-primary dark:text-text-primary-dark"
                  />
                </View>
              </Reveal>
            ))}
          </ScrollView>
        </>
      )}

      {/* Sticky "your rank" bar */}
      <View style={softShadowLg} className="bg-ink rounded-card px-4 py-3.5 flex-row items-center mb-4">
        <Avatar uri={user?.avatarUrl} name={user?.fullName} size={40} ring />
        <View className="flex-1 ml-3">
          <BodyMedium className="text-white">
            Your Rank {board?.myRank ? `#${board.myRank.rank}` : '—'}
          </BodyMedium>
          <View className="flex-row items-center mt-0.5">
            <AnimatedCounter
              value={board?.myRank?.points ?? user?.points ?? 0}
              className="text-white/70 font-poppins-medium text-caption"
            />
            <Caption className="text-white/70"> pts</Caption>
          </View>
        </View>
      </View>
    </Screen>
  );
}
