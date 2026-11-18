import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { Images } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Badge, statusTone } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { OfflineState } from '@/components/ui/OfflineState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Reveal } from '@/components/ui/Reveal';
import { useToast } from '@/components/ui/Toast';
import { useFakeRefresh } from '@/lib/hooks';
import { colors } from '@/lib/theme';
import { listMyPosts, type Post } from '@/lib/api/posts';
import { ApiRequestError, isNetworkError } from '@/lib/api/client';

const COLUMNS = 3;
const GAP = 8;

export default function MyPostsScreen() {
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [gridWidth, setGridWidth] = useState(0);
  const tileSize = gridWidth > 0 ? (gridWidth - GAP * (COLUMNS - 1)) / COLUMNS : 0;
  const { refreshing, onRefresh } = useFakeRefresh();

  const load = useCallback(async () => {
    try {
      const result = await listMyPosts();
      setPosts(result);
      setOffline(false);
    } catch (err) {
      if (isNetworkError(err)) {
        setOffline(true);
        return;
      }
      const message = err instanceof ApiRequestError ? err.message : 'Could not load your posts';
      toast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load, refreshing]);

  const describeStatus = (post: Post) => {
    if (post.status === 'Rejected' && post.rejectedReason) {
      return `Rejected: ${post.rejectedReason}`;
    }
    return `Status: ${post.status}`;
  };

  return (
    <Screen refreshing={refreshing} onRefresh={onRefresh}>
      <Header title="My Posts" />

      {!loading && offline ? (
        <OfflineState onRetry={retry} />
      ) : !loading && posts.length === 0 ? (
        <Reveal spring scaleIn>
          <EmptyState
            icon={<Images size={32} color={colors.primary} />}
            title="No posts yet"
            description="Posts you share will show up here while they're pending, approved, or rejected."
          />
        </Reveal>
      ) : (
        <View
          className="flex-row flex-wrap"
          style={{ gap: GAP }}
          onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
        >
          {loading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} width={tileSize || '30%'} height={tileSize} radius={16} />
              ))
            : posts.map((post, i) => (
                <Reveal key={post.id} index={i} step={40} spring scaleIn>
                  <Pressable
                    onPress={() => toast(describeStatus(post), post.status === 'Rejected' ? 'error' : 'info')}
                    style={{ width: tileSize, height: tileSize }}
                    className="rounded-input overflow-hidden bg-card-lavender dark:bg-card-lavender-dark"
                  >
                    {tileSize > 0 && post.images[0] && (
                      <Image source={{ uri: post.images[0].url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    )}
                    <View className="absolute bottom-1.5 left-1.5">
                      <Badge label={post.status} tone={statusTone(post.status)} />
                    </View>
                  </Pressable>
                </Reveal>
              ))}
        </View>
      )}
    </Screen>
  );
}
