import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import {
  BookOpen,
  Clock,
  Cpu,
  Database,
  GitBranch,
  ListChecks,
  Network,
  Plus,
  Sigma,
  Star,
  type LucideIcon,
} from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, Caption, H2 } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { Chip } from '@/components/ui/Chip';
import { Badge } from '@/components/ui/Badge';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useFakeRefresh } from '@/lib/hooks';
import { cardToneClasses, colors, type CardTone } from '@/lib/theme';
import { listQuizzes, type QuizStatus, type QuizSummary } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';

type SubjectMeta = { icon: LucideIcon; tone: CardTone };

const SUBJECT_META: { match: string; icon: LucideIcon; tone: CardTone }[] = [
  { match: 'Mathematics', icon: Sigma, tone: 'butter' },
  { match: 'Database', icon: Database, tone: 'lavender' },
  { match: 'Operating', icon: Cpu, tone: 'mint' },
  { match: 'Network', icon: Network, tone: 'sky' },
  { match: 'Data Structures', icon: GitBranch, tone: 'peach' },
];

export function getTeacherSubjectMeta(subject: string): SubjectMeta {
  const hit = SUBJECT_META.find((m) => subject.includes(m.match));
  return hit ? { icon: hit.icon, tone: hit.tone } : { icon: BookOpen, tone: 'lavender' };
}

export const QUIZ_STATUS_TONE: Record<QuizStatus, 'warning' | 'success' | 'primary'> = {
  upcoming: 'warning',
  live: 'success',
  completed: 'primary',
};

const FILTERS: Array<'All' | QuizStatus> = ['All', 'upcoming', 'live', 'completed'];

const FILTER_LABEL: Record<(typeof FILTERS)[number], string> = {
  All: 'All',
  upcoming: 'Upcoming',
  live: 'Live',
  completed: 'Completed',
};

export default function MyQuizzesScreen() {
  const toast = useToast();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listQuizzes({ mine: true });
      setQuizzes(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load your quizzes';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const filtered = useMemo(
    () => (filter === 'All' ? quizzes : quizzes.filter((q) => q.status === filter)),
    [filter, quizzes]
  );

  if (loading) {
    return (
      <Screen>
        <View className="flex-row items-center justify-between pt-4 pb-5">
          <View>
            <Skeleton width={140} height={24} />
            <Skeleton width={100} height={14} className="mt-2" />
          </View>
          <Skeleton width={44} height={44} radius={22} />
        </View>
        <View className="flex-row mb-5">
          <Skeleton height={36} width={70} radius={999} className="mr-2" />
          <Skeleton height={36} width={80} radius={999} className="mr-2" />
          <Skeleton height={36} width={70} radius={999} />
        </View>
        {[0, 1, 2].map((i) => (
          <View key={i} className="mb-3">
            <Skeleton height={120} radius={20} />
          </View>
        ))}
      </Screen>
    );
  }

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-center justify-between pt-4 pb-5">
        <View>
          <H1>My Quizzes</H1>
          <Caption className="mt-0.5">{quizzes.length} total</Caption>
        </View>
        <IconButton variant="primary" onPress={() => router.push('/(teacher)/quizzes/create')}>
          <Plus size={20} color="#fff" />
        </IconButton>
      </View>

      <View className="flex-row flex-wrap mb-5">
        {FILTERS.map((f) => (
          <Chip key={f} label={FILTER_LABEL[f]} active={filter === f} onPress={() => setFilter(f)} />
        ))}
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks size={32} color={colors.primary} />}
          title="No quizzes here"
          description={`You don't have any ${filter === 'All' ? '' : FILTER_LABEL[filter].toLowerCase() + ' '}quizzes yet.`}
        />
      ) : (
        filtered.map((quiz, idx) => {
          const meta = getTeacherSubjectMeta(quiz.subject);
          const Icon = meta.icon;
          return (
            <Reveal key={quiz.id} index={idx}>
              <AnimatedPressable
                haptics="select"
                scaleTo={0.98}
                onPress={() => router.push(`/(teacher)/quizzes/${quiz.id}/analytics`)}
                className="mb-3"
              >
                <Card tone="white">
                  <View className="flex-row items-start justify-between mb-3">
                    <View className="flex-row items-center flex-1 pr-2">
                      <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${cardToneClasses[meta.tone]}`}>
                        <Icon size={18} color={colors.ink} />
                      </View>
                      <View className="flex-1">
                        <H2 numberOfLines={1}>{quiz.title}</H2>
                        <Caption numberOfLines={1} className="mt-0.5">
                          {quiz.course} · Sem {quiz.semester}
                        </Caption>
                      </View>
                    </View>
                    <Badge label={FILTER_LABEL[quiz.status]} tone={QUIZ_STATUS_TONE[quiz.status]} />
                  </View>

                  <View className="flex-row items-center">
                    <View className="flex-row items-center mr-4">
                      <ListChecks size={14} color={colors.textSecondary} />
                      <Caption className="ml-1.5">{quiz.totalQuestions} Qs</Caption>
                    </View>
                    <View className="flex-row items-center mr-4">
                      <Clock size={14} color={colors.textSecondary} />
                      <Caption className="ml-1.5">{quiz.timeLimitMinutes} min</Caption>
                    </View>
                    <View className="flex-row items-center">
                      <Star size={14} color={colors.textSecondary} />
                      <Caption className="ml-1.5">{quiz.pointsPerQuestion} pts/Q</Caption>
                    </View>
                  </View>
                </Card>
              </AnimatedPressable>
            </Reveal>
          );
        })
      )}
    </Screen>
  );
}
