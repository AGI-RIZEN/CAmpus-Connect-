import React, { useCallback, useEffect, useState } from 'react';
import { Image, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Check, X, ClipboardCheck } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Chip } from '@/components/ui/Chip';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { BodyMedium, Body, Caption } from '@/components/ui/Text';
import { SecondaryButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { ReasonSheet } from '@/components/screens/admin/ReasonSheet';
import { haptic } from '@/lib/haptics';
import { timeAgo } from '@/lib/time';
import * as postsApi from '@/lib/api/posts';
import { ApiRequestError } from '@/lib/api/client';

type Tab = 'Posts' | 'Reports';

type RejectTarget =
  | { kind: 'post'; data: postsApi.ModerationPost }
  | { kind: 'report'; data: postsApi.ReportedPost };

const EXIT_DURATION = 180;

/** Wraps a card so it fades + scales down right before being pulled out of the list array. */
function ExitCard({
  exiting,
  className = '',
  children,
}: {
  exiting: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (exiting) {
      progress.value = withTiming(0, { duration: EXIT_DURATION });
    }
  }, [exiting]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.85 + progress.value * 0.15 }],
  }));

  return (
    <Animated.View style={style} className={className}>
      {children}
    </Animated.View>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onPress,
  className = '',
}: {
  label: string;
  icon: React.ReactNode;
  tone: 'success' | 'danger';
  onPress: () => void;
  className?: string;
}) {
  return (
    <AnimatedPressable
      onPress={onPress}
      scaleTo={0.95}
      haptics="none"
      className={`flex-1 flex-row items-center justify-center rounded-full py-2.5 ${
        tone === 'success' ? 'bg-success' : 'bg-danger'
      } ${className}`}
    >
      {icon}
      <BodyMedium className="text-white ml-1.5">{label}</BodyMedium>
    </AnimatedPressable>
  );
}

/** Tracks which ids in a list are mid-exit-animation, so removal from state can be delayed
 *  until the fade+scale-down finishes instead of having cards vanish instantly. */
function useExitingIds() {
  const [exitingIds, setExitingIds] = useState<Set<string>>(new Set());

  const startExit = (id: string, onDone: () => void) => {
    setExitingIds((prev) => new Set(prev).add(id));
    setTimeout(() => {
      onDone();
      setExitingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, EXIT_DURATION);
  };

  const isExiting = (id: string) => exitingIds.has(id);

  return { startExit, isExiting };
}

export default function ApprovalsScreen() {
  const [tab, setTab] = useState<Tab>('Posts');
  const [posts, setPosts] = useState<postsApi.ModerationPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [reportList, setReportList] = useState<postsApi.ReportedPost[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const toast = useToast();

  const postExit = useExitingIds();
  const reportExit = useExitingIds();

  const loadPendingPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const result = await postsApi.listPendingPosts();
      setPosts(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load pending posts';
      toast(message, 'error');
    } finally {
      setLoadingPosts(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    setLoadingReports(true);
    try {
      const result = await postsApi.listOpenReports();
      setReportList(result);
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not load reports';
      toast(message, 'error');
    } finally {
      setLoadingReports(false);
    }
  }, []);

  useEffect(() => {
    loadPendingPosts();
    loadReports();
  }, [loadPendingPosts, loadReports]);

  const submitReject = async (reason: string) => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      if (rejectTarget.kind === 'post') {
        const post = rejectTarget.data;
        await postsApi.rejectPost(post.id, reason);
        toast(`Rejected post by ${post.author.fullName}`, 'error');
        setRejectTarget(null);
        postExit.startExit(post.id, () => {
          setPosts((list) => list.filter((x) => x.id !== post.id));
          haptic.warning();
        });
      } else {
        const report = rejectTarget.data;
        await postsApi.actionReports(report.postId, reason);
        toast('Post removed', 'error');
        setRejectTarget(null);
        reportExit.startExit(report.postId, () => {
          setReportList((list) => list.filter((x) => x.postId !== report.postId));
          haptic.error();
        });
      }
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not complete this action';
      toast(message, 'error');
    } finally {
      setRejecting(false);
    }
  };

  const approvePost = async (post: postsApi.ModerationPost) => {
    try {
      await postsApi.approvePost(post.id);
      toast(`Approved post by ${post.author.fullName}`);
      postExit.startExit(post.id, () => {
        setPosts((list) => list.filter((x) => x.id !== post.id));
        haptic.success();
      });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not approve post';
      toast(message, 'error');
    }
  };

  const dismissReport = async (report: postsApi.ReportedPost) => {
    try {
      await postsApi.dismissReports(report.postId);
      toast('Report dismissed');
      reportExit.startExit(report.postId, () => {
        setReportList((list) => list.filter((x) => x.postId !== report.postId));
        haptic.success();
      });
    } catch (err) {
      const message = err instanceof ApiRequestError ? err.message : 'Could not dismiss report';
      toast(message, 'error');
    }
  };

  const reasonSheetProps = (() => {
    if (!rejectTarget) return null;
    if (rejectTarget.kind === 'post') {
      return {
        title: `Reject post by ${rejectTarget.data.author.fullName}`,
        description: "They'll see this reason on their post.",
        quickReasons: ['Inappropriate content', 'Blurry or low quality', 'Violates guidelines', 'Duplicate post'],
      };
    }
    return {
      title: `Remove post by ${rejectTarget.data.post.author.fullName}`,
      description: 'The post will be rejected and removed from the feed.',
      quickReasons: ['Confirmed spam', 'Confirmed harassment', 'Inappropriate content', 'Violates guidelines'],
    };
  })();

  return (
    <Screen>
      <Header title="Approvals" />

      <View className="flex-row mb-5">
        <Chip label="Posts" active={tab === 'Posts'} onPress={() => setTab('Posts')} />
        <Chip label="Reports" active={tab === 'Reports'} onPress={() => setTab('Reports')} />
      </View>

      {tab === 'Posts' &&
        (loadingPosts ? (
          <>
            <Skeleton height={260} radius={28} className="mb-4" />
            <Skeleton height={260} radius={28} className="mb-4" />
          </>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={32} color="#2F6FED" />}
            title="All caught up"
            description="There are no pending post approvals right now."
          />
        ) : (
          posts.map((p, idx) => (
            <Reveal key={p.id} index={idx}>
              <ExitCard exiting={postExit.isExiting(p.id)} className="mb-4">
                <Card tone="white" className="p-0 overflow-hidden">
                  {p.images[0] && (
                    <Image source={{ uri: p.images[0].url }} style={{ width: '100%', height: 220 }} />
                  )}
                  <View className="p-4">
                    <View className="flex-row items-center mb-2.5">
                      <Avatar uri={p.author.avatarUrl} name={p.author.fullName} size={36} />
                      <View className="flex-1 ml-2.5">
                        <BodyMedium>{p.author.fullName}</BodyMedium>
                        <Caption>{timeAgo(p.createdAt)}</Caption>
                      </View>
                    </View>
                    {p.caption && <Body className="mb-3.5">{p.caption}</Body>}
                    <View className="flex-row">
                      <ActionButton
                        label="Approve"
                        icon={<Check size={16} color="#fff" />}
                        tone="success"
                        className="mr-2"
                        onPress={() => approvePost(p)}
                      />
                      <ActionButton
                        label="Reject"
                        icon={<X size={16} color="#fff" />}
                        tone="danger"
                        onPress={() => setRejectTarget({ kind: 'post', data: p })}
                      />
                    </View>
                  </View>
                </Card>
              </ExitCard>
            </Reveal>
          ))
        ))}

      {tab === 'Reports' &&
        (loadingReports ? (
          <>
            <Skeleton height={240} radius={28} className="mb-4" />
            <Skeleton height={240} radius={28} className="mb-4" />
          </>
        ) : reportList.length === 0 ? (
          <EmptyState
            icon={<ClipboardCheck size={32} color="#2F6FED" />}
            title="No reports"
            description="There are no open reports right now."
          />
        ) : (
          reportList.map((r, idx) => (
            <Reveal key={r.postId} index={idx}>
              <ExitCard exiting={reportExit.isExiting(r.postId)} className="mb-4">
                <Card tone="white" className="p-0 overflow-hidden">
                  {r.post.image && <Image source={{ uri: r.post.image }} style={{ width: '100%', height: 200 }} />}
                  <View className="p-4">
                    <View className="flex-row items-center justify-between mb-2.5">
                      <BodyMedium>{r.post.author.fullName}</BodyMedium>
                      <Badge label={r.reasons.slice(0, 2).join(', ')} tone="danger" />
                    </View>
                    <Caption className="mb-2">
                      Reported by {r.reportedByCount} user{r.reportedByCount > 1 ? 's' : ''}
                    </Caption>
                    {r.reports
                      .filter((rep) => rep.details)
                      .map((rep) => (
                        <Caption key={rep.id} className="mb-1 text-text-secondary dark:text-text-secondary-dark">
                          "{rep.details}" — {rep.reportedBy.fullName}
                        </Caption>
                      ))}
                    <View className="h-2" />
                    <View className="flex-row">
                      <SecondaryButton
                        label="Dismiss"
                        className="flex-1 mr-2 px-0"
                        onPress={() => dismissReport(r)}
                      />
                      <AnimatedPressable
                        onPress={() => setRejectTarget({ kind: 'report', data: r })}
                        scaleTo={0.95}
                        haptics="none"
                        className="flex-1 bg-danger rounded-full items-center justify-center py-3.5"
                      >
                        <BodyMedium className="text-white">Remove Post</BodyMedium>
                      </AnimatedPressable>
                    </View>
                  </View>
                </Card>
              </ExitCard>
            </Reveal>
          ))
        ))}

      {reasonSheetProps && (
        <ReasonSheet
          visible={!!rejectTarget}
          title={reasonSheetProps.title}
          description={reasonSheetProps.description}
          quickReasons={reasonSheetProps.quickReasons}
          submitting={rejecting}
          onClose={() => setRejectTarget(null)}
          onSubmit={submitReject}
        />
      )}
    </Screen>
  );
}
