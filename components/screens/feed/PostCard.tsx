import React, { useState } from 'react';
import { Modal, Pressable, Share, View } from 'react-native';
import { Bookmark, Flag, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Body, BodyMedium, Caption } from '@/components/ui/Text';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors, softShadowLg } from '@/lib/theme';
import { timeAgo } from '@/lib/time';
import { toggleLike, toggleSave, type Post } from '@/lib/api/posts';
import { ApiRequestError } from '@/lib/api/client';
import { ImageCarousel } from './ImageCarousel';
import { CommentsSheet } from './CommentsSheet';
import { ReportSheet } from './ReportSheet';
import { LikeHeart } from './LikeHeart';

type MenuItemProps = {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  onPress: () => void;
  danger?: boolean;
};

function MenuItem({ icon: Icon, label, onPress, danger }: MenuItemProps) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center px-4 py-3.5">
      <Icon size={18} color={danger ? colors.danger : colors.textSecondary} />
      <Body className={`ml-3 ${danger ? 'text-danger' : ''}`}>{label}</Body>
    </Pressable>
  );
}

export function PostCard({ post }: { post: Post }) {
  const toast = useToast();
  const [liked, setLiked] = useState(post.liked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [saved, setSaved] = useState(post.saved);
  const [commentsCount, setCommentsCount] = useState(post.commentsCount);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const toggleLikeLocal = async () => {
    const next = !liked;
    setLiked(next);
    setLikesCount((c) => (next ? c + 1 : c - 1));
    if (next) haptic.tap();
    try {
      const result = await toggleLike(post.id);
      setLiked(result.liked);
      setLikesCount(result.likesCount);
    } catch (err) {
      setLiked(!next);
      setLikesCount((c) => (next ? c - 1 : c + 1));
      const message = err instanceof ApiRequestError ? err.message : 'Could not update like';
      toast(message, 'error');
    }
  };

  const handleDoubleTapLike = () => {
    if (!liked) toggleLikeLocal();
  };

  const toggleSaveLocal = async () => {
    const next = !saved;
    setSaved(next);
    haptic.select();
    try {
      const result = await toggleSave(post.id);
      setSaved(result.saved);
    } catch (err) {
      setSaved(!next);
      const message = err instanceof ApiRequestError ? err.message : 'Could not update saved posts';
      toast(message, 'error');
    }
  };

  const showsMore = post.caption.length > 60;
  const avatarUri = post.author.avatarUrl;

  return (
    <Card tone="white" className="mb-4">
      <View className="flex-row items-center">
        <Avatar uri={avatarUri} name={post.author.fullName} size={44} />
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <BodyMedium className="mr-2">{post.author.fullName}</BodyMedium>
            {post.author.course && <Badge label={post.author.course} tone="neutral" />}
          </View>
          <Caption className="mt-0.5">{timeAgo(post.createdAt)}</Caption>
        </View>
        <IconButton size={36} onPress={() => setMenuOpen(true)}>
          <MoreHorizontal size={18} color={colors.ink} />
        </IconButton>
      </View>

      {post.images.length > 0 && (
        <View className="mt-3">
          <ImageCarousel images={post.images.map((i) => i.url)} onDoubleTap={handleDoubleTapLike} />
        </View>
      )}

      <View className="flex-row items-center mt-3.5">
        <AnimatedPressable onPress={toggleLikeLocal} haptics="none" scaleTo={0.85} className="mr-4">
          <LikeHeart liked={liked} />
        </AnimatedPressable>
        <AnimatedPressable onPress={() => setCommentsOpen(true)} haptics="tap" className="mr-4">
          <MessageCircle size={22} color={colors.textSecondary} />
        </AnimatedPressable>
        <AnimatedPressable
          onPress={() => {
            Share.share({ message: `${post.author.fullName} on Campus Connect: ${post.caption}` }).catch(() => {});
          }}
          haptics="tap"
        >
          <Share2 size={22} color={colors.textSecondary} />
        </AnimatedPressable>
        <View className="flex-1" />
        <AnimatedPressable onPress={toggleSaveLocal} haptics="none">
          <Bookmark size={22} color={saved ? colors.primary : colors.textSecondary} fill={saved ? colors.primary : 'none'} />
        </AnimatedPressable>
      </View>

      <BodyMedium className="mt-3">{likesCount} likes</BodyMedium>

      <Pressable onPress={() => setExpanded((e) => !e)} className="mt-1">
        <Body numberOfLines={expanded ? undefined : 2}>
          <BodyMedium>{post.author.fullName} </BodyMedium>
          {post.caption}
        </Body>
        {showsMore && (
          <Caption className="mt-0.5">{expanded ? 'less' : '...more'}</Caption>
        )}
      </Pressable>

      {commentsCount > 0 && (
        <Pressable onPress={() => setCommentsOpen(true)} className="mt-1.5">
          <Caption>View all {commentsCount} comments</Caption>
        </Pressable>
      )}

      <Modal transparent visible={menuOpen} animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable className="flex-1 bg-black/40" onPress={() => setMenuOpen(false)}>
          <View style={{ paddingTop: 90 }} className="items-end px-5">
            <View style={softShadowLg} className="bg-white dark:bg-surface-dark rounded-card py-1.5 w-48 overflow-hidden">
              <MenuItem
                icon={Flag}
                label="Report"
                danger
                onPress={() => {
                  setMenuOpen(false);
                  setReportOpen(true);
                }}
              />
            </View>
          </View>
        </Pressable>
      </Modal>

      <CommentsSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        onCommentPosted={() => setCommentsCount((c) => c + 1)}
      />
      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} postId={post.id} />
    </Card>
  );
}
