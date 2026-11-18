import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, Grid3x3, Brain, Bookmark } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { H1, H2, Caption } from '@/components/ui/Text';
import { IconButton } from '@/components/ui/IconButton';
import { SecondaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useFakeLoading, useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { useAuth } from '@/lib/auth-context';

type TabKey = 'posts' | 'quiz' | 'saved';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'posts', label: 'Posts' },
  { key: 'quiz', label: 'Quiz History' },
  { key: 'saved', label: 'Saved' },
];

function ProfileSkeleton() {
  return (
    <Screen padded={false} contentClassName="pb-10">
      <View className="relative">
        <Skeleton width="100%" height={150} radius={0} className="rounded-b-[28px]" />
        <View className="absolute -bottom-11 left-0 right-0 items-center">
          <Skeleton width={88} height={88} radius={44} />
        </View>
      </View>

      <View className="px-screen items-center mt-14">
        <Skeleton width={160} height={20} />
        <Skeleton width={120} height={13} className="mt-2.5" />

        <View className="flex-row items-center justify-center mt-6 w-full">
          <View className="flex-1 items-center">
            <Skeleton width={36} height={20} />
            <Skeleton width={40} height={11} className="mt-2" />
          </View>
          <View className="w-px h-9 bg-border-light dark:bg-border-dark" />
          <View className="flex-1 items-center">
            <Skeleton width={36} height={20} />
            <Skeleton width={40} height={11} className="mt-2" />
          </View>
          <View className="w-px h-9 bg-border-light dark:bg-border-dark" />
          <View className="flex-1 items-center">
            <Skeleton width={36} height={20} />
            <Skeleton width={40} height={11} className="mt-2" />
          </View>
        </View>

        <View className="flex-row mt-7 self-start">
          <Skeleton width={64} height={32} radius={16} className="mr-2" />
          <Skeleton width={96} height={32} radius={16} className="mr-2" />
          <Skeleton width={64} height={32} radius={16} />
        </View>
      </View>
    </Screen>
  );
}

export default function ProfileScreen() {
  const [tab, setTab] = useState<TabKey>('posts');
  const loading = useFakeLoading(600);
  const { refreshing, onRefresh } = useFakeRefresh();
  const { user } = useAuth();

  if (loading || !user) {
    return <ProfileSkeleton />;
  }


  return (
    <Screen padded={false} contentClassName="pb-10" refreshing={refreshing} onRefresh={onRefresh}>
      {/* Cover gradient */}
      <View className="relative">
        <LinearGradient
          colors={[colors.primary, '#1E4FBA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ height: 150, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}
        />
        <View className="absolute top-14 right-5">
          <IconButton variant="white" onPress={() => router.push('/(app)/profile/settings')}>
            <Settings size={20} color={colors.ink} />
          </IconButton>
        </View>
        <View className="absolute -bottom-11 left-0 right-0 items-center">
          <Avatar uri={user.avatarUrl} name={user.fullName} size={88} ring />
        </View>
      </View>

      <View className="px-screen items-center mt-14">
        <H1>{user.fullName}</H1>
        <Caption className="mt-1.5">
          {user.course ?? user.role} {user.semester ? `· Semester ${user.semester}` : ''}
        </Caption>

        {/* Stats row */}
        <View className="flex-row items-center justify-center mt-6 w-full">
          <View className="flex-1 items-center">
            <H2>0</H2>
            <Caption className="mt-1">Posts</Caption>
          </View>
          <View className="w-px h-9 bg-border-light dark:bg-border-dark" />
          <View className="flex-1 items-center">
            <H2>
              <AnimatedCounter value={user.points} delay={100} />
            </H2>
            <Caption className="mt-1">Points</Caption>
          </View>
          <View className="w-px h-9 bg-border-light dark:bg-border-dark" />
          <View className="flex-1 items-center">
            <H2>—</H2>
            <Caption className="mt-1">Rank</Caption>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row mt-7 self-start">
          {tabs.map((t) => (
            <Chip key={t.key} label={t.label} active={tab === t.key} onPress={() => setTab(t.key)} />
          ))}
        </View>
      </View>

      <View className="mt-5">
        {/* Feed, quiz history, and saved posts don't have a backend yet (see Feed/Quiz
            sections) — showing honest empty states here rather than another user's mock
            content under "your" profile. */}
        {tab === 'posts' && (
          <EmptyState
            icon={<Grid3x3 size={32} color={colors.primary} />}
            title="No posts yet"
            description="Share something with campus and it'll show up here."
            action={<SecondaryButton label="Create a post" onPress={() => router.push('/(app)/feed/create')} />}
          />
        )}

        {tab === 'quiz' && (
          <EmptyState
            icon={<Brain size={32} color={colors.primary} />}
            title="No quizzes completed"
            description="Finish a quiz to see your history here."
            action={<SecondaryButton label="Browse quizzes" onPress={() => router.push('/(app)/quiz')} />}
          />
        )}

        {tab === 'saved' && (
          <EmptyState
            icon={<Bookmark size={32} color={colors.primary} />}
            title="Nothing saved"
            description="Tap the bookmark icon on any post to save it for later."
            action={<SecondaryButton label="Browse feed" onPress={() => router.push('/(app)/feed')} />}
          />
        )}
      </View>
    </Screen>
  );
}
