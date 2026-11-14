import type { Quiz, QuizQuestion, Role } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { ApiError } from '../../middleware/errorHandler';

type Requester = { id: string; role: Role };
type QuizStatus = 'upcoming' | 'live' | 'completed';

type QuizWithRelations = Quiz & {
  questions: QuizQuestion[];
  author: { id: string; fullName: string };
};

function computeStatus(startAt: Date, endAt: Date, now = new Date()): QuizStatus {
  if (now < startAt) return 'upcoming';
  if (now > endAt) return 'completed';
  return 'live';
}

function publicQuiz(quiz: QuizWithRelations, extra: { attempted: boolean; score: number | null }) {
  return {
    id: quiz.id,
    title: quiz.title,
    subject: quiz.subject,
    course: quiz.course,
    semester: quiz.semester,
    timeLimitMinutes: quiz.timeLimitMinutes,
    pointsPerQuestion: quiz.pointsPerQuestion,
    totalQuestions: quiz.questions.length,
    visibility: quiz.visibility,
    startAt: quiz.startAt,
    endAt: quiz.endAt,
    status: computeStatus(quiz.startAt, quiz.endAt),
    author: { id: quiz.author.id, fullName: quiz.author.fullName },
    attempted: extra.attempted,
    score: extra.score,
    createdAt: quiz.createdAt,
  };
}

export async function createQuiz(
  authorId: string,
  input: {
    title: string;
    subject: string;
    course: string;
    semester: number;
    timeLimitMinutes: number;
    pointsPerQuestion: number;
    visibility?: 'students' | 'private';
    startAt: string;
    endAt: string;
    questions: { text: string; options: string[]; correctIndex: number; explanation?: string }[];
  }
) {
  const quiz = await prisma.quiz.create({
    data: {
      title: input.title,
      subject: input.subject,
      course: input.course,
      semester: input.semester,
      authorId,
      timeLimitMinutes: input.timeLimitMinutes,
      pointsPerQuestion: input.pointsPerQuestion,
      visibility: input.visibility ?? 'students',
      startAt: new Date(input.startAt),
      endAt: new Date(input.endAt),
      questions: {
        create: input.questions.map((q, i) => ({
          text: q.text,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          position: i,
        })),
      },
    },
    include: { questions: true, author: { select: { id: true, fullName: true } } },
  });

  return publicQuiz(quiz, { attempted: false, score: null });
}

export async function listQuizzes(
  requester: Requester,
  params: { status?: QuizStatus; mine?: boolean }
) {
  const where: Record<string, unknown> = {};

  if (params.mine) {
    where.authorId = requester.id;
  } else if (requester.role === 'Student') {
    const student = await prisma.user.findUnique({
      where: { id: requester.id },
      select: { course: true, semester: true },
    });
    where.course = student?.course ?? '__none__';
    where.semester = student?.semester ?? -1;
  }

  const quizzes = await prisma.quiz.findMany({
    where,
    include: {
      questions: true,
      author: { select: { id: true, fullName: true } },
      attempts: { where: { userId: requester.id } },
    },
    orderBy: { startAt: 'desc' },
  });

  const withStatus = quizzes.map((q) => {
    const attempt = q.attempts[0];
    return publicQuiz(q, { attempted: !!attempt?.submittedAt, score: attempt?.score ?? null });
  });

  return params.status ? withStatus.filter((q) => q.status === params.status) : withStatus;
}

export async function getQuiz(requester: Requester, id: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { questions: true, author: { select: { id: true, fullName: true } } },
  });
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId: id, userId: requester.id } },
  });

  return publicQuiz(quiz, { attempted: !!attempt?.submittedAt, score: attempt?.score ?? null });
}

export async function startAttempt(requester: Requester, quizId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { orderBy: { position: 'asc' } } },
  });
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  let attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId, userId: requester.id } },
  });
  if (attempt?.submittedAt) throw new ApiError(409, 'You have already completed this quiz');
  if (!attempt) {
    attempt = await prisma.quizAttempt.create({ data: { quizId, userId: requester.id } });
  }

  return {
    attemptId: attempt.id,
    quizId: quiz.id,
    title: quiz.title,
    subject: quiz.subject,
    timeLimitMinutes: quiz.timeLimitMinutes,
    pointsPerQuestion: quiz.pointsPerQuestion,
    startedAt: attempt.startedAt,
    questions: quiz.questions.map((q) => ({ id: q.id, text: q.text, options: q.options })),
  };
}

export async function submitAttempt(
  requester: Requester,
  quizId: string,
  answers: { questionId: string; selectedIndex: number | null }[]
) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId, userId: requester.id } },
  });
  if (!attempt) throw new ApiError(400, 'Start the quiz before submitting');
  if (attempt.submittedAt) throw new ApiError(409, 'You have already submitted this quiz');

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) throw new ApiError(404, 'Quiz not found');
  const questionMap = new Map(quiz.questions.map((q) => [q.id, q]));

  let correctCount = 0;
  const answerRows = answers
    .filter((a) => questionMap.has(a.questionId))
    .map((a) => {
      const question = questionMap.get(a.questionId)!;
      const isCorrect = a.selectedIndex !== null && a.selectedIndex === question.correctIndex;
      if (isCorrect) correctCount++;
      return { attemptId: attempt.id, questionId: a.questionId, selectedIndex: a.selectedIndex, isCorrect };
    });

  const score = correctCount * quiz.pointsPerQuestion;

  await prisma.$transaction([
    prisma.quizAnswer.createMany({ data: answerRows }),
    prisma.quizAttempt.update({ where: { id: attempt.id }, data: { submittedAt: new Date(), score } }),
    prisma.user.update({ where: { id: requester.id }, data: { points: { increment: score } } }),
  ]);

  const review = quiz.questions.map((q) => {
    const ans = answerRows.find((a) => a.questionId === q.id);
    return {
      questionId: q.id,
      text: q.text,
      options: q.options,
      correctIndex: q.correctIndex,
      selectedIndex: ans?.selectedIndex ?? null,
      isCorrect: ans?.isCorrect ?? false,
      explanation: q.explanation,
    };
  });

  return {
    quizId,
    totalQuestions: quiz.questions.length,
    correctCount,
    wrongCount: quiz.questions.length - correctCount,
    pointsEarned: score,
    review,
  };
}

export async function getResult(requester: Requester, quizId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { quizId_userId: { quizId, userId: requester.id } },
    include: { answers: { include: { question: true } } },
  });
  if (!attempt || !attempt.submittedAt) throw new ApiError(404, 'No submitted attempt found for this quiz');

  const review = attempt.answers.map((a) => ({
    questionId: a.questionId,
    text: a.question.text,
    options: a.question.options,
    correctIndex: a.question.correctIndex,
    selectedIndex: a.selectedIndex,
    isCorrect: a.isCorrect ?? false,
    explanation: a.question.explanation,
  }));

  const correctCount = review.filter((r) => r.isCorrect).length;

  return {
    quizId,
    totalQuestions: review.length,
    correctCount,
    wrongCount: review.length - correctCount,
    pointsEarned: attempt.score ?? 0,
    review,
  };
}

export async function getQuizAnalytics(quizId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) throw new ApiError(404, 'Quiz not found');

  const audienceWhere = {
    role: 'Student' as const,
    status: 'Active' as const,
    course: quiz.course,
    semester: quiz.semester,
  };

  const [totalAudience, attempts, missedStudents] = await Promise.all([
    prisma.user.count({ where: audienceWhere }),
    prisma.quizAttempt.findMany({
      where: { quizId, submittedAt: { not: null } },
      include: { answers: true },
    }),
    prisma.user.findMany({
      where: { ...audienceWhere, quizAttempts: { none: { quizId, submittedAt: { not: null } } } },
      select: { id: true, fullName: true, course: true, avatarAsset: { select: { secureUrl: true } } },
      take: 100,
    }),
  ]);

  const attemptedCount = attempts.length;
  const missedCount = Math.max(totalAudience - attemptedCount, 0);
  const avgScoreRaw = attemptedCount > 0 ? attempts.reduce((sum, a) => sum + (a.score ?? 0), 0) / attemptedCount : 0;
  const maxScore = quiz.questions.length * quiz.pointsPerQuestion;

  const questionStats = quiz.questions.map((q) => {
    const relevantAnswers = attempts.flatMap((a) => a.answers.filter((ans) => ans.questionId === q.id));
    const correct = relevantAnswers.filter((a) => a.isCorrect).length;
    const correctPct = relevantAnswers.length > 0 ? Math.round((correct / relevantAnswers.length) * 100) : 0;
    return { id: q.id, text: q.text, correctPct };
  });
  const hardestQuestions = [...questionStats].sort((a, b) => a.correctPct - b.correctPct).slice(0, 5);

  return {
    quizId: quiz.id,
    title: quiz.title,
    totalAudience,
    attemptedCount,
    missedCount,
    attemptedPct: totalAudience > 0 ? Math.round((attemptedCount / totalAudience) * 100) : 0,
    avgScore: `${avgScoreRaw.toFixed(1)}/${maxScore}`,
    totalQuestions: quiz.questions.length,
    hardestQuestions,
    missedStudents: missedStudents.map((u) => ({
      id: u.id,
      name: u.fullName,
      course: u.course,
      avatarUrl: u.avatarAsset?.secureUrl ?? null,
    })),
  };
}

type LeaderboardUser = { id: string; name: string; course: string | null; avatarUrl: string | null; points: number };

function buildLeaderboardResponse(requesterId: string, ranked: LeaderboardUser[]) {
  const entries = ranked.map((r, i) => ({ rank: i + 1, ...r }));
  const myEntry = entries.find((e) => e.id === requesterId) ?? null;
  return { entries, myRank: myEntry ? { rank: myEntry.rank, points: myEntry.points } : null };
}

export async function getLeaderboard(
  requester: Requester,
  params: { scope: 'all' | 'course' | 'semester'; window: 'all' | 'weekly' }
) {
  let courseFilter: string | undefined;
  let semesterFilter: number | undefined;

  if (params.scope === 'course' || params.scope === 'semester') {
    const me = await prisma.user.findUnique({
      where: { id: requester.id },
      select: { course: true, semester: true },
    });
    courseFilter = me?.course ?? undefined;
    if (params.scope === 'semester') semesterFilter = me?.semester ?? undefined;
  }

  if (params.window === 'weekly') {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const userWhere: Record<string, unknown> = { role: 'Student' };
    if (courseFilter) userWhere.course = courseFilter;
    if (semesterFilter) userWhere.semester = semesterFilter;

    const attempts = await prisma.quizAttempt.findMany({
      where: { submittedAt: { gte: since }, user: userWhere },
      include: { user: { select: { id: true, fullName: true, course: true, avatarAsset: { select: { secureUrl: true } } } } },
    });

    const totals = new Map<string, LeaderboardUser>();
    for (const a of attempts) {
      const cur = totals.get(a.userId) ?? {
        id: a.user.id,
        name: a.user.fullName,
        course: a.user.course,
        avatarUrl: a.user.avatarAsset?.secureUrl ?? null,
        points: 0,
      };
      cur.points += a.score ?? 0;
      totals.set(a.userId, cur);
    }
    const ranked = [...totals.values()].sort((a, b) => b.points - a.points);
    return buildLeaderboardResponse(requester.id, ranked);
  }

  const where: Record<string, unknown> = { role: 'Student' };
  if (courseFilter) where.course = courseFilter;
  if (semesterFilter) where.semester = semesterFilter;

  const users = await prisma.user.findMany({
    where,
    select: { id: true, fullName: true, course: true, points: true, avatarAsset: { select: { secureUrl: true } } },
    orderBy: { points: 'desc' },
    take: 100,
  });

  return buildLeaderboardResponse(
    requester.id,
    users.map((u) => ({ id: u.id, name: u.fullName, course: u.course, avatarUrl: u.avatarAsset?.secureUrl ?? null, points: u.points }))
  );
}
