import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { Body, Caption } from '@/components/ui/Text';
import { formatClockTime } from '@/lib/time';
import type { ChatMessage } from '@/lib/api/chat';
import { PollCard } from './PollCard';

type Props = {
  message: ChatMessage;
  mine: boolean;
  onVote?: (pollId: string, optionId: string) => void;
};

export function MessageBubble({ message, mine, onVote }: Props) {
  const { sender, text, image, poll, createdAt } = message;

  // Mount-only fade+slide-up so a freshly-appended message feels alive. Because each
  // bubble is keyed by message.id, this effect only ever fires once per message —
  // existing messages already mounted are untouched by later re-renders of the list.
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withTiming(1, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, []);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: entrance.value,
    transform: [{ translateY: (1 - entrance.value) * 10 }],
  }));

  const bubbleClass = mine
    ? 'bg-primary rounded-2xl rounded-br-md'
    : 'bg-white dark:bg-surface-dark rounded-2xl rounded-bl-md';

  const bubbleStyle = poll
    ? { maxWidth: 300, width: '100%' as const }
    : image
    ? undefined
    : { maxWidth: '78%' as const };

  const paddingClass = image ? 'p-1.5' : poll ? 'p-4' : 'px-4 py-3';

  const content = poll ? (
    <PollCard poll={poll} inverted={mine} onVote={onVote ? (optionId) => onVote(poll.id, optionId) : undefined} />
  ) : image ? (
    <Image source={{ uri: image }} style={{ width: 224, height: 176, borderRadius: 18 }} />
  ) : (
    <Body className={mine ? 'text-white' : ''}>{text}</Body>
  );

  const time = formatClockTime(createdAt);

  if (mine) {
    return (
      <Animated.View className="items-end mb-4 px-4" style={entranceStyle}>
        <View className={`${bubbleClass} ${paddingClass}`} style={bubbleStyle}>
          {content}
        </View>
        <Caption className="mt-1 mr-1">{time}</Caption>
      </Animated.View>
    );
  }

  return (
    <Animated.View className="flex-row items-start mb-4 px-4" style={entranceStyle}>
      <Avatar uri={sender.avatarUrl} name={sender.fullName} size={32} />
      <View className="ml-2 flex-1 items-start">
        <Caption className="mb-1 ml-1">{sender.fullName}</Caption>
        <View className={`${bubbleClass} ${paddingClass}`} style={bubbleStyle}>
          {content}
        </View>
        <Caption className="mt-1 ml-1">{time}</Caption>
      </View>
    </Animated.View>
  );
}
