import { apiRequest } from './client';

export type QuizStatus = 'upcoming' | 'live' | 'completed';
export type QuizVisibility = 'students' | 'private';

export type QuizSummary = {
  id: string;
  title: string;
  subject: string;
  course: string;
  semester: number;
  timeLimitMinutes: number;
  pointsPerQuestion: number;
  totalQuestions: number;
  visibility: QuizVisibility;
  startAt: string;
  endAt: string;
  status: QuizStatus;
  author: { id: string; fullName: string };
  attempted: boolean;
  score: number | null;
  createdAt: string;
};

export async function listQuizzes(params: { status?: QuizStatus; mine?: boolean } = {}): Promise<QuizSummary[]> {
  const qs = new URLSearchParams();
  if (params.status) qs.set('status', params.status);
  if (params.mine) qs.set('mine', 'true');
  const query = qs.toString();
  return apiRequest(`/quizzes${query ? `?${query}` : ''}`, { auth: true });
}

export async function getQuiz(id: string): Promise<QuizSummary> {
  return apiRequest(`/quizzes/${id}`, { auth: true });
}

export type QuizQuestionDraft = {
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation?: string;
};

export async function createQuiz(input: {
  title: string;
  subject: string;
  course: string;
  semester: number;
  timeLimitMinutes: number;
  pointsPerQuestion: number;
  visibility?: QuizVisibility;
  startAt: string;
  endAt: string;
  questions: QuizQuestionDraft[];
}): Promise<QuizSummary> {
  return apiRequest('/quizzes', { method: 'POST', body: input, auth: true });
}

export type QuizAttemptQuestion = { id: string; text: string; options: string[] };

export type QuizAttemptStart = {
  attemptId: string;
  quizId: string;
  title: string;
  subject: string;
  timeLimitMinutes: number;
  pointsPerQuestion: number;
  startedAt: string;
  questions: QuizAttemptQuestion[];
};

export async function startQuizAttempt(quizId: string): Promise<QuizAttemptStart> {
  return apiRequest(`/quizzes/${quizId}/start`, { method: 'POST', auth: true });
}

export type QuizReviewItem = {
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  selectedIndex: number | null;
  isCorrect: boolean;
  pointsEarned: number;
  explanation: string | null;
};

export type QuizResult = {
  quizId: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  pointsEarned: number;
  review: QuizReviewItem[];
};

export async function submitQuizAttempt(
  quizId: string,
  answers: { questionId: string; selectedIndex: number | null; secondsRemaining?: number }[]
): Promise<QuizResult> {
  return apiRequest(`/quizzes/${quizId}/submit`, { method: 'POST', body: { answers }, auth: true });
}

export async function getQuizResult(quizId: string): Promise<QuizResult> {
  return apiRequest(`/quizzes/${quizId}/result`, { auth: true });
}

export type QuizAnalytics = {
  quizId: string;
  title: string;
  totalAudience: number;
  attemptedCount: number;
  missedCount: number;
  attemptedPct: number;
  avgScore: string;
  totalQuestions: number;
  hardestQuestions: { id: string; text: string; correctPct: number }[];
  missedStudents: { id: string; name: string; course: string | null; avatarUrl: string | null }[];
};

export async function getQuizAnalytics(id: string): Promise<QuizAnalytics> {
  return apiRequest(`/quizzes/${id}/analytics`, { auth: true });
}

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  course: string | null;
  avatarUrl: string | null;
  points: number;
};

export type Leaderboard = {
  entries: LeaderboardEntry[];
  myRank: { rank: number; points: number } | null;
};

export async function getLeaderboard(
  params: { scope?: 'all' | 'course' | 'semester'; window?: 'all' | 'weekly' } = {}
): Promise<Leaderboard> {
  const qs = new URLSearchParams();
  if (params.scope) qs.set('scope', params.scope);
  if (params.window) qs.set('window', params.window);
  const query = qs.toString();
  return apiRequest(`/quizzes/leaderboard${query ? `?${query}` : ''}`, { auth: true });
}
