import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Check, Clock } from 'lucide-react-native';
import { Screen } from '@/components/ui/Screen';
import { Header } from '@/components/ui/Header';
import { Card } from '@/components/ui/Card';
import { H2, Body, BodyMedium, Caption } from '@/components/ui/Text';
import { PrimaryButton } from '@/components/ui/Button';
import { Reveal } from '@/components/ui/Reveal';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { haptic } from '@/lib/haptics';
import { colors } from '@/lib/theme';
import { getQuiz, type QuizSummary } from '@/lib/api/quizzes';
import { ApiRequestError } from '@/lib/api/client';
import { getSubjectMeta } from '@/components/screens/quiz/subjectMeta';

const RULES = [
  'You get one attempt only — make it count.',
  'The timer starts the moment you begin and it will not pause.',
  'The quiz auto-submits the moment time runs out.',
  'You cannot go back to a previous question once answered.',
];

export default function QuizInstructionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const toast = useToast();
  const [quiz, setQuiz] = useState<QuizSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setQuiz(await getQuiz(id));
      } catch (err) {
        const message = err instanceof ApiRequestError ? err.message : 'Could not load this quiz';
        toast(message, 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading || !quiz) {
    return (
      <Screen>
        <Header title="Quiz Instructions" />
        <Skeleton height={80} radius={28} className="mb-4" />
        <Skeleton height={90} radius={20} />
      </Screen>
    );
  }

  const meta = getSubjectMeta(quiz.subject);
  const Icon = meta.icon;

  const start = () => {
    if (quiz.attempted) {
      toast("You've already completed this quiz", 'info');
      return;
    }
    haptic.heavy();
    router.push(`/(app)/quiz/question/${quiz.id}`);
  };

  return (
    <Screen>
      <Header title="Quiz Instructions" />

      <Card tone={meta.tone} className="flex-row items-center mt-2">
        <View className="w-12 h-12 rounded-full bg-white/60 dark:bg-black/15 items-center justify-center">
          <Icon size={22} color={colors.ink} />
        </View>
        <View className="ml-3 flex-1">
          <Caption>{quiz.subject}</Caption>
          <H2 className="mt-0.5" numberOfLines={1}>
            {quiz.title}
          </H2>
        </View>
      </Card>

      <View className="flex-row flex-wrap -mx-1.5 mt-4">
        <View className="w-1/3 px-1.5">
          <Card tone="white" className="items-center py-4">
            <Clock size={18} color={colors.primary} />
            <Caption className="mt-1.5">{quiz.timeLimitMinutes} min</Caption>
          </Card>
        </View>
        <View className="w-1/3 px-1.5">
          <Card tone="white" className="items-center py-4">
            <BodyMedium>{quiz.totalQuestions}</BodyMedium>
            <Caption className="mt-1">Questions</Caption>
          </Card>
        </View>
        <View className="w-1/3 px-1.5">
          <Card tone="white" className="items-center py-4">
            <BodyMedium>{quiz.totalQuestions * quiz.pointsPerQuestion}</BodyMedium>
            <Caption className="mt-1">Points</Caption>
          </Card>
        </View>
      </View>

      <Caption className="mt-7 mb-3">RULES OF THE GAME</Caption>
      <View>
        {RULES.map((rule, i) => (
          <Reveal key={i} index={i}>
            <View className="flex-row items-start mb-4">
              <View className="w-7 h-7 rounded-full bg-card-lavender dark:bg-card-lavender-dark items-center justify-center mr-3 mt-0.5">
                <Check size={14} color={colors.primary} />
              </View>
              <Body className="flex-1">{rule}</Body>
            </View>
          </Reveal>
        ))}
      </View>

      <PrimaryButton
        label={quiz.attempted ? 'Already Completed' : 'Start Quiz'}
        disabled={quiz.attempted}
        className="mt-4 mb-6"
        onPress={start}
      />
    </Screen>
  );
}
