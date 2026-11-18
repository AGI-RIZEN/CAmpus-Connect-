import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Trophy, Sparkles, ListChecks } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, Caption } from '@/components/ui/Text';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
import { useFakeRefresh } from '@/lib/hooks';
import { colors, softShadow, softShadowLg } from '@/lib/theme';
import { QuizCard } from '@/components/screens/quiz/QuizCard';
import { useAuth } from '@/lib/auth-context';
import { listQuizzes, getLeaderboard, type QuizSummary, type QuizStatus } from '@/lib/api/quizzes';
import { useToast } from '@/components/ui/Toast';
import { ApiRequestError, isNetworkError } from '@/lib/api/client';

const TABS: { key: QuizStatus; label: string }[] = [
  { key: 'live', label: 'Live' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

function QuizCardSkeleton() {
  return (
    <View className="flex-row items-center rounded-card bg-white dark:bg-surface-dark p-4 mb-3">
      <Skeleton width={48} height={48} radius={24} />
      <View className="flex-1 ml-3 pr-2">
        <Skeleton width="70%" height={14} />
        <Skeleton width="45%" height={12} className="mt-2" />
      </View>
      <Skeleton width={64} height={28} radius={14} />
    </View>
  );
}

export default function QuizHomeScreen() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState<QuizStatus>('live');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const [list, board] = await Promise.all([listQuizzes({ status: tab }), getLeaderboard()]);
      setQuizzes(list);
      setMyRank(board.myRank?.rank ?? null);
      setOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        return;
      }
      const message = err instanceof ApiRequestError ? err.message : 'Could not load quizzes';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      {/* Top row */}
      <View className="flex-row items-center justify-between mt-2">
        <H1>Quiz</H1>
        <IconButton onPress={() => router.push('/(app)/quiz/leaderboard')}>
          <Trophy size={20} color={colors.ink} />
        </IconButton>
      </View>

      {/* Hero — Quiz Arena */}
      <Reveal index={0}>
        <View style={softShadowLg} className="rounded-card bg-ink p-6 mt-5 overflow-hidden relative">
          <View
            style={{
              position: 'absolute',
              top: -50,
              right: -40,
              width: 170,
              height: 170,
              borderRadius: 85,
              backgroundColor: colors.primary,
              opacity: 0.35,
            }}
          />
          <View className="items-center">
            <View className="items-center justify-center" style={{ height: 88, width: 140 }}>
              <View className="absolute w-20 h-20 rounded-full bg-white/10" />
              <View style={softShadow} className="w-16 h-16 rounded-full bg-white items-center justify-center">
                <Trophy size={30} color={colors.primary} />
              </View>
              <View className="absolute top-0 right-6 w-7 h-7 rounded-full bg-card-butter items-center justify-center">
                <Sparkles size={13} color={colors.ink} />
              </View>
              <View className="absolute bottom-3 left-8 w-6 h-6 rounded-full bg-card-mint items-center justify-center">
                <Sparkles size={11} color={colors.ink} />
              </View>
            </View>
            <H1 className="text-white mt-1">Quiz Arena</H1>
            <View className="flex-row mt-4">
              <View className="bg-white/15 rounded-full px-4 py-1.5 mr-2 flex-row items-center">
                <Caption className="text-white font-poppins-semibold">My Points: </Caption>
                <AnimatedCounter
                  value={user?.points ?? 0}
                  className="text-white font-poppins-semibold text-caption"
                />
              </View>
              <View className="bg-white/15 rounded-full px-4 py-1.5 flex-row items-center">
                <Caption className="text-white font-poppins-semibold">
                  Rank {myRank ? `#${myRank}` : '—'}
                </Caption>
              </View>
            </View>
          </View>
        </View>
      </Reveal>

      {/* Status tabs */}
      <View className="flex-row mt-6 mb-4">
        {TABS.map((t) => (
          <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
        ))}
      </View>

      {/* Quiz list */}
      {loading ? (
        <>
          <QuizCardSkeleton />
          <QuizCardSkeleton />
          <QuizCardSkeleton />
        </>
      ) : offline ? (
        <OfflineState onRetry={load} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={32} color={colors.primary} />}
          title={`No ${tab} quizzes`}
          description={`There are no ${tab} quizzes right now. Check back soon.`}
        />
      ) : (
        quizzes.map((quiz, i) => (
          <Reveal key={quiz.id} index={i + 1}>
            <QuizCard quiz={quiz} />
          </Reveal>
        ))
      )}

      <View className="mb-8" />
    </Screen>
  );
}
