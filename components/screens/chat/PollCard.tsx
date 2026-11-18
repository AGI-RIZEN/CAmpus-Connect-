import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Check } from 'lucide-react-native';
import { AnimatedPressable } from '@/components/ui/AnimatedPressable';
import { Reveal } from '@/components/ui/Reveal';
import { BodyMedium, Caption, H2 } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import { timeLeftLabel } from '@/lib/time';
import type { Poll, PollOption } from '@/lib/api/chat';

type Props = {
  poll: Poll;
  /** Use the larger heading style — for the standalone Polls tab rather than inside a chat bubble. */
  large?: boolean;
  /** Tint the bars for display on top of the violet "mine" bubble background. */
  inverted?: boolean;
  className?: string;
  onVote?: (optionId: string) => void;
};

/**
 * One poll option bar — fill eases from 0 to `pct` on mount, and re-eases to the new width
 * whenever `pct` changes (i.e. after a vote) instead of snapping, so results feel alive.
 */
function PollOptionBar({
  opt,
  mine,
  trackClass,
  fillClass,
  labelClass,
  onPress,
}: {
  opt: PollOption;
  mine: boolean;
  trackClass: string;
  fillClass: string;
  labelClass: string;
  onPress?: () => void;
}) {
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.value = withTiming(opt.pct, { duration: 650, easing: Easing.out(Easing.cubic) });
  }, [opt.pct]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value}%` }));

  return (
    // Tappable bars get the app-wide press-scale + a light "select" tick; when there is no
    // onPress (closed poll / read-only) the Pressable is disabled so nothing animates.
    <AnimatedPressable
      disabled={!onPress}
      onPress={onPress}
      scaleTo={0.97}
      haptics="select"
      className={`h-9 rounded-full overflow-hidden mb-2 justify-center ${trackClass} ${mine ? 'border-2 border-primary' : ''}`}
    >
      <Animated.View className={`absolute left-0 top-0 bottom-0 rounded-full ${fillClass}`} style={fillStyle} />
      <View className="flex-row items-center justify-between px-3.5">
        <View className="flex-row items-center">
          {mine && (
            <Reveal spring scaleIn step={0}>
              <Check size={12} color={colors.primary} style={{ marginRight: 4 }} />
            </Reveal>
          )}
          <Caption className={`font-poppins-semibold ${labelClass}`} numberOfLines={1}>
            {opt.label}
          </Caption>
        </View>
        <Caption className={`font-poppins-semibold ${labelClass}`}>{opt.pct}%</Caption>
      </View>
    </AnimatedPressable>
  );
}

export function PollCard({ poll, large, inverted, className = '', onVote }: Props) {
  const trackClass = inverted ? 'bg-white/20' : 'bg-border-light dark:bg-border-dark';
  const fillClass = inverted ? 'bg-white/35' : 'bg-primary/25 dark:bg-primary/35';
  const labelClass = inverted ? 'text-white' : '';
  const closed = poll.closesAt !== null && new Date(poll.closesAt) < new Date();

  return (
    <View className={className}>
      {large ? (
        <H2>{poll.question}</H2>
      ) : (
        <BodyMedium className={labelClass}>{poll.question}</BodyMedium>
      )}

      <View className="mt-3">
        {poll.options.map((opt) => (
          <PollOptionBar
            key={opt.id}
            opt={opt}
            mine={poll.myVote === opt.id}
            trackClass={trackClass}
            fillClass={fillClass}
            labelClass={labelClass}
            onPress={onVote && !closed ? () => onVote(opt.id) : undefined}
          />
        ))}
      </View>

      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row items-center">
          <Caption className={labelClass}>{poll.totalVotes} votes</Caption>
          <View
            className={`w-1 h-1 rounded-full mx-2 ${inverted ? 'bg-white/60' : 'bg-text-secondary dark:bg-text-secondary-dark'}`}
          />
          <Caption className={labelClass}>{timeLeftLabel(poll.closesAt)}</Caption>
        </View>
        {poll.myVote && (
          // Mounts the moment myVote lands, so the badge springs in alongside the bar re-fill.
          <Reveal spring scaleIn className="flex-row items-center">
            <Check size={12} color={inverted ? '#fff' : colors.primary} />
            <Caption className={`ml-1 ${inverted ? 'text-white' : 'text-primary'}`}>You voted</Caption>
          </Reveal>
        )}
      </View>
    </View>
  );
}
