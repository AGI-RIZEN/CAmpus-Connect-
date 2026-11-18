import React, { useEffect, useState } from 'react';
import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { FileText, ChevronRight, CheckCheck } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { H1, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { AttentionPulse } from '@/components/screens/notices/AttentionPulse';
import { useToast } from '@/components/ui/Toast';
import { colors } from '@/lib/theme';
import { getNotice, markNoticeRead, type Notice, type NoticeCategory } from '@/lib/api/notices';
import { ApiRequestError } from '@/lib/api/client';
import { formatDate } from '@/lib/time';

const badgeTone: Record<NoticeCategory, 'danger' | 'warning' | 'primary' | 'success'> = {
  Urgent: 'danger',
  Exam: 'warning',
  Event: 'primary',
  General: 'success',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const result = await getNotice(id);
        setNotice(result);
        // Fire-and-forget — viewing the detail screen is the "read" action.
        markNoticeRead(id).catch(() => {});
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Could not load this announcement';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !notice) {
    return (
      <Screen>
        <Header title="Announcement" />
        <Skeleton height={24} width={90} className="mb-3" />
        <Skeleton height={28} width="80%" className="mb-4" />
        <Skeleton height={16} width="60%" />
      </Screen>
    );
  }

  return (
    <Screen>
      <Header title="Announcement" />

      {/* Hero (category + title) scales in with a spring; the byline and body follow on later
          beats so the eye lands on the title first. */}
      <Reveal index={0} spring scaleIn>
        <AttentionPulse active={notice.category === 'Urgent'} delay={520}>
          <Badge label={notice.category} tone={badgeTone[notice.category]} />
        </AttentionPulse>
        <H1 className="mt-3">{notice.title}</H1>
      </Reveal>

      <Reveal index={1}>
        <View className="flex-row items-center mt-4">
          <Avatar uri={notice.author.avatarUrl} name={notice.author.fullName} size={36} />
          <View className="ml-3">
            <BodyMedium>{notice.author.fullName}</BodyMedium>
            <Caption className="mt-0.5">{formatDate(notice.createdAt)}</Caption>
          </View>
        </View>
      </Reveal>

      <Reveal index={2}>
        <Body className="mt-5" style={{ lineHeight: 24 }}>
          {notice.body}
        </Body>
      </Reveal>

      {notice.attachment && (
        <Reveal index={3} spring className="mt-5">
          <AnimatedPressable haptics="tap" scaleTo={0.98} onPress={() => Linking.openURL(notice.attachment!.url)}>
            <Card tone="white" className="flex-row items-center">
              <View className="w-11 h-11 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center">
                <FileText size={20} color={colors.primary} />
              </View>
              <View className="flex-1 ml-3">
                <BodyMedium numberOfLines={1}>{notice.attachment.name}</BodyMedium>
                <Caption className="mt-0.5">{formatBytes(notice.attachment.bytes)}</Caption>
              </View>
              <ChevronRight size={20} color={colors.textSecondary} />
            </Card>
          </AnimatedPressable>
        </Reveal>
      )}

      <Reveal index={4}>
        <View className="flex-row items-center mt-8">
          <CheckCheck size={16} color={colors.success} />
          <Caption className="ml-1.5">Seen by you</Caption>
        </View>
      </Reveal>

      <View className="mb-8" />
    </Screen>
  );
}
