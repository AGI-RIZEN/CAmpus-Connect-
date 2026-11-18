import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { LayoutGrid, MessageCircle, Plus, Rss } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Chip } from '@/components/ui/Chip';
import { IconButton } from '@/components/ui/IconButton';
import { BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { Reveal } from '@/components/ui/Reveal';
import { GradientBlob } from '@/components/ui/GradientBlob';
import { useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { useToast } from '@/components/ui/Toast';
import { listFeed, type FeedScope, type Post } from '@/lib/api/posts';
import { ApiRequestError, isNetworkError } from '@/lib/api/client';
import { PostCard } from '@/components/screens/feed/PostCard';

const TABS: { key: FeedScope; label: string }[] = [
  { key: 'forYou', label: 'For You' },
  { key: 'popular', label: 'Popular' },
  { key: 'myCourse', label: 'My Course' },
];

export default function FeedScreen() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<FeedScope>('forYou');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listFeed(activeTab);
      setPosts(result);
      setOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        return;
      }
      const message = err instanceof ApiRequestError ? err.message : 'Could not load the feed';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load, refreshing]);

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <View className="flex-row items-center justify-between pt-4 pb-1">
        <View className="flex-row items-center">
          <View className="w-9 h-9 rounded-full bg-primary items-center justify-center mr-2">
            <BodyMedium className="text-white">CC</BodyMedium>
          </View>
          <H2>Campus Connect</H2>
        </View>
        <View className="flex-row items-center">
          <IconButton size={40} onPress={() => router.push('/(app)/feed/create')} className="mr-2">
            <Plus size={22} color={colors.ink} />
          </IconButton>
          <IconButton size={40} onPress={() => router.push('/(app)/chat')}>
            <MessageCircle size={22} color={colors.ink} />
          </IconButton>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/(app)/feed/my-posts')}
        className="flex-row items-center self-end mt-2 mb-3 px-1 py-1"
      >
        <LayoutGrid size={14} color={colors.primary} />
        <Caption className="ml-1.5 text-primary">My Posts</Caption>
      </Pressable>

      <View className="flex-row mb-4">
        {TABS.map((tab) => (
          <Chip key={tab.key} label={tab.label} active={activeTab === tab.key} onPress={() => setActiveTab(tab.key)} />
        ))}
      </View>

      {loading ? (
        <>
          <SkeletonCard />
          <View className="mb-4" />
          <SkeletonCard />
          <View className="mb-4" />
          <SkeletonCard />
        </>
      ) : offline ? (
        <OfflineState onRetry={retry} />
      ) : posts.length === 0 ? (
        <Reveal spring scaleIn className="rounded-card overflow-hidden" style={{ position: 'relative' }}>
          <GradientBlob
            blobs={[
              { size: 220, top: -40, left: -70, colors: ['#2F6FED33', '#2F6FED00'], driftRange: 16, duration: 6500 },
              { size: 180, bottom: -50, right: -60, colors: ['#5B8DFF2E', '#5B8DFF00'], driftRange: 20, duration: 7800 },
            ]}
          />
          <EmptyState
            icon={<Rss size={32} color={colors.primary} />}
            title="No posts yet"
            description="Approved posts from your campus will show up here."
          />
        </Reveal>
      ) : (
        posts.map((post, i) => (
          <Reveal key={post.id} index={i} spring>
            <PostCard post={post} />
          </Reveal>
        ))
      )}
    </Screen>
  );
}
