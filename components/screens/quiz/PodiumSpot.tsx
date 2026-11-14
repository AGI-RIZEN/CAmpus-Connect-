import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Crown } from 'lucide-react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { BodyMedium } from '@/components/ui/Text';
import { colors } from '@/lib/theme';
import type { LeaderboardEntry } from '@/lib/api/quizzes';

type Entry = LeaderboardEntry;
type Place = 1 | 2 | 3;

const PILLAR_HEIGHT: Record<Place, number> = { 1: 104, 2: 72, 3: 56 };
const PILLAR_TONE: Record<Place, string> = {
  1: 'bg-card-butter dark:bg-card-butter-dark',
  2: 'bg-border-light dark:bg-border-dark',
  3: 'bg-card-peach dark:bg-card-peach-dark',
};
const AVATAR_SIZE: Record<Place, number> = { 1: 68, 2: 54, 3: 54 };

// Dramatic podium reveal order: 3rd place first, then 2nd, then 1st lands last with a bigger pop.
const REVEAL_DELAY: Record<Place, number> = { 3: 0, 2: 240, 1: 480 };

export function PodiumSpot({ entry, place }: { entry: Entry; place: Place }) {
  const progress = useSharedValue(0);
  const scale = useSharedValue(place === 1 ? 0.5 : 0.85);

  useEffect(() => {
    const delay = REVEAL_DELAY[place];
    progress.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    if (place === 1) {
      // 1st place gets a springy overshoot "pop" instead of a plain ease-in.
      scale.value = withDelay(
        delay,
        withSequence(
          withSpring(1.14, { damping: 6, stiffness: 180 }),
          withSpring(1, { damping: 10, stiffness: 180 })
        )
      );
    } else {
      scale.value = withDelay(delay, withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 18 }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle} className="items-center flex-1">
      <View style={{ height: 24 }} className="items-center justify-end">
        {place === 1 ? <Crown size={22} color={colors.warning} /> : null}
      </View>
      <Avatar uri={entry.avatarUrl} name={entry.name} size={AVATAR_SIZE[place]} ring />
      <BodyMedium className="mt-1.5 text-center" numberOfLines={1}>
        {entry.name.split(' ')[0]}
      </BodyMedium>
      <View className="bg-primary rounded-full px-2.5 py-0.5 mt-1">
        <AnimatedCounter
          value={entry.points}
          delay={REVEAL_DELAY[place] + 260}
          className="text-white font-poppins-semibold text-caption"
        />
      </View>
      <View
        style={{ height: PILLAR_HEIGHT[place] }}
        className={`w-full rounded-t-2xl mt-2 items-center pt-2 ${PILLAR_TONE[place]}`}
      >
        <BodyMedium className="font-poppins-bold">#{entry.rank}</BodyMedium>
      </View>
    </Animated.View>
  );
}
