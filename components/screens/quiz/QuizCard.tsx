import React, { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Clock, HelpCircle } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { BodyMedium, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { colors, cardToneClasses } from '@/lib/theme';
import type { QuizSummary } from '@/lib/api/quizzes';
import { startsInLabel } from '@/lib/time';
import { getSubjectMeta } from './subjectMeta';

type Quiz = QuizSummary;

/** Subtle breathing pulse so a static "starts in" countdown still reads as "live/ticking". */
function PulsingBadge({ label }: { label: string }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.03, { duration: 900 }), -1, true);
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Badge label={label} tone="warning" />
    </Animated.View>
  );
}

export function QuizCard({ quiz }: { quiz: Quiz }) {
  const meta = getSubjectMeta(quiz.subject);
  const Icon = meta.icon;

  return (
    <Card tone="white" className="flex-row items-center mb-3">
      <View
        className={`w-12 h-12 rounded-2xl items-center justify-center ${cardToneClasses[meta.tone]}`}
      >
        <Icon size={22} color={colors.ink} />
      </View>

      <View className="flex-1 ml-3 pr-2">
        <BodyMedium numberOfLines={1}>{quiz.title}</BodyMedium>
        <View className="flex-row items-center mt-1.5">
          <Clock size={12} color={colors.textSecondary} />
          <Caption className="ml-1 mr-3">{quiz.timeLimitMinutes} min</Caption>
          <HelpCircle size={12} color={colors.textSecondary} />
          <Caption className="ml-1">
            {quiz.totalQuestions} Q · {quiz.totalQuestions * quiz.pointsPerQuestion} pts
          </Caption>
        </View>
      </View>

      {quiz.status === 'live' && !quiz.attempted && (
        <PrimaryButton
          label="Start"
          className="pl-3.5 pr-1 py-1"
          onPress={() => router.push(`/(app)/quiz/instructions/${quiz.id}`)}
        />
      )}

      {quiz.status === 'live' && quiz.attempted && (
        <Pressable onPress={() => router.push(`/(app)/quiz/result/${quiz.id}`)}>
          <Badge label="Done" tone="success" />
        </Pressable>
      )}

      {quiz.status === 'upcoming' && <PulsingBadge label={startsInLabel(quiz.startAt)} />}

      {quiz.status === 'completed' && (
        <Pressable
          onPress={() => quiz.attempted && router.push(`/(app)/quiz/result/${quiz.id}`)}
        >
          <Badge label={quiz.attempted ? `${quiz.score ?? 0} pts` : 'Missed'} tone={quiz.attempted ? 'success' : 'neutral'} />
        </Pressable>
      )}
    </Card>
  );
}
