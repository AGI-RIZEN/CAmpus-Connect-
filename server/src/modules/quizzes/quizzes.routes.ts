import { Router } from 'express';
import type { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  createQuizSchema,
  listQuizzesQuerySchema,
  submitQuizSchema,
  leaderboardQuerySchema,
} from './quizzes.schema';
import * as quizzesService from './quizzes.service';

export const quizzesRouter = Router();

quizzesRouter.use(requireAuth);

// Registered before "/:id" so it is never swallowed by the id param route.
quizzesRouter.get(
  '/leaderboard',
  validateQuery(leaderboardQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof leaderboardQuerySchema>;
    res.json(await quizzesService.getLeaderboard(req.user!, query));
  })
);

quizzesRouter.get(
  '/',
  validateQuery(listQuizzesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listQuizzesQuerySchema>;
    res.json(await quizzesService.listQuizzes(req.user!, query));
  })
);

quizzesRouter.post(
  '/',
  requireRole('Teacher', 'Admin'),
  validateBody(createQuizSchema),
  asyncHandler(async (req, res) => {
    const quiz = await quizzesService.createQuiz(req.user!.id, req.body);
    res.status(201).json(quiz);
  })
);

quizzesRouter.get(
  '/:id/analytics',
  requireRole('Teacher', 'Admin'),
  asyncHandler(async (req, res) => {
    res.json(await quizzesService.getQuizAnalytics(req.params.id));
  })
);

quizzesRouter.post(
  '/:id/start',
  asyncHandler(async (req, res) => {
    res.json(await quizzesService.startAttempt(req.user!, req.params.id));
  })
);

quizzesRouter.post(
  '/:id/submit',
  validateBody(submitQuizSchema),
  asyncHandler(async (req, res) => {
    res.json(await quizzesService.submitAttempt(req.user!, req.params.id, req.body.answers));
  })
);

quizzesRouter.get(
  '/:id/result',
  asyncHandler(async (req, res) => {
    res.json(await quizzesService.getResult(req.user!, req.params.id));
  })
);

quizzesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await quizzesService.getQuiz(req.user!, req.params.id));
  })
);
