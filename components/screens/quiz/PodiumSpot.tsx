import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Crown } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Reveal } from '@/components/ui/Reveal';
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
// Exported-in-spirit: leaderboard.tsx's LIST_BASE_DELAY is tuned to pick up after 1st place lands.
const REVEAL_DELAY: Record<Place, number> = { 3: 0, 2: 240, 1: 480 };

export function PodiumSpot({ entry, place }: { entry: Entry; place: Place }) {
  const isWinner = place === 1;

  // The pillar "rises" out of the floor under its spot, so the whole podium builds up rather
  // than fading in flat. Rises with a soft overshoot so it feels like it settles into place.
  const pillar = useSharedValue(0);
  // 1st place only: the avatar cluster gets an extra overshoot pop, and the crown drops onto it
  // from above once the pop lands — the "winner moment" the rest of the podium builds up to.
  const winnerPop = useSharedValue(isWinner ? 0.55 : 1);
  const crown = useSharedValue(0);

  useEffect(() => {
    const delay = REVEAL_DELAY[place];
    pillar.value = withDelay(delay, withSpring(1, { damping: 13, stiffness: 150, mass: 0.7 }));
    if (isWinner) {
      winnerPop.value = withDelay(
        delay + 40,
        withSequence(
          withSpring(1.14, { damping: 6, stiffness: 190 }),
          withSpring(1, { damping: 10, stiffness: 180 })
        )
      );
      crown.value = withDelay(delay + 260, withSpring(1, { damping: 7, stiffness: 170, mass: 0.6 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pillarStyle = useAnimatedStyle(() => ({
    height: PILLAR_HEIGHT[place] * Math.max(pillar.value, 0),
    opacity: Math.min(pillar.value * 1.6, 1),
  }));
  const winnerStyle = useAnimatedStyle(() => ({ transform: [{ scale: winnerPop.value }] }));
  const crownStyle = useAnimatedStyle(() => ({
    opacity: Math.min(Math.max(crown.value, 0), 1),
    transform: [{ translateY: (1 - crown.value) * -14 }, { scale: 0.6 + crown.value * 0.4 }, { rotate: `${(1 - crown.value) * -18}deg` }],
  }));

  return (
    <Reveal baseDelay={REVEAL_DELAY[place]} spring scaleIn className="items-center flex-1">
      <Animated.View style={isWinner ? winnerStyle : undefined} className="items-center">
        <Animated.View style={[{ height: 24 }, isWinner ? crownStyle : undefined]} className="items-center justify-end">
          {isWinner ? <Crown size={22} color={colors.warning} /> : null}
        </Animated.View>
        <Avatar uri={entry.avatarUrl} name={entry.name} size={AVATAR_SIZE[place]} ring />
      </Animated.View>
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
      <Animated.View
        style={pillarStyle}
        className={`w-full rounded-t-2xl mt-2 items-center pt-2 overflow-hidden ${PILLAR_TONE[place]}`}
      >
        <BodyMedium className="font-poppins-bold">#{entry.rank}</BodyMedium>
      </Animated.View>
    </Reveal>
  );
}
