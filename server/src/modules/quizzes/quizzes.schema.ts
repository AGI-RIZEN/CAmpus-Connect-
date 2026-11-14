import { z } from 'zod';

export const quizQuestionSchema = z.object({
  text: z.string().min(1).max(500),
  options: z.array(z.string().min(1).max(200)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().max(1000).optional(),
});

export const createQuizSchema = z.object({
  title: z.string().min(3).max(200),
  subject: z.string().min(1).max(200),
  course: z.string().min(1),
  semester: z.coerce.number().int().min(1).max(8),
  timeLimitMinutes: z.coerce.number().int().min(1).max(180),
  pointsPerQuestion: z.coerce.number().int().min(1).max(1000),
  visibility: z.enum(['students', 'private']).optional().default('students'),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  questions: z.array(quizQuestionSchema).min(1).max(100),
});

export const listQuizzesQuerySchema = z.object({
  status: z.enum(['live', 'upcoming', 'completed']).optional(),
  mine: z.coerce.boolean().optional(),
});

export const submitQuizSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string(),
        selectedIndex: z.number().int().min(0).max(3).nullable(),
      })
    )
    .min(1),
});

export const leaderboardQuerySchema = z.object({
  scope: z.enum(['all', 'course', 'semester']).optional().default('all'),
  window: z.enum(['all', 'weekly']).optional().default('all'),
});
