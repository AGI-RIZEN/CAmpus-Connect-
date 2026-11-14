import { Router } from 'express';
import type { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createNoticeSchema, listNoticesQuerySchema } from './notices.schema';
import * as noticesService from './notices.service';

export const noticesRouter = Router();

noticesRouter.use(requireAuth);

noticesRouter.get(
  '/',
  validateQuery(listNoticesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listNoticesQuerySchema>;
    const notices = await noticesService.listNotices(req.user!, query);
    res.json(notices);
  })
);

noticesRouter.post(
  '/',
  requireRole('Admin', 'Teacher'),
  validateBody(createNoticeSchema),
  asyncHandler(async (req, res) => {
    const notice = await noticesService.createNotice(req.user!.id, req.body);
    res.status(201).json(notice);
  })
);

noticesRouter.get(
  '/:id/analytics',
  requireRole('Admin', 'Teacher'),
  asyncHandler(async (req, res) => {
    const analytics = await noticesService.getNoticeAnalytics(req.params.id);
    res.json(analytics);
  })
);

noticesRouter.post(
  '/:id/remind/:studentId',
  requireRole('Admin', 'Teacher'),
  asyncHandler(async (req, res) => {
    await noticesService.remindStudent(req.params.id, req.params.studentId);
    res.json({ message: 'Reminder sent' });
  })
);

noticesRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const notice = await noticesService.getNotice(req.user!, req.params.id);
    res.json(notice);
  })
);

noticesRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await noticesService.markNoticeRead(req.user!.id, req.params.id);
    res.json({ message: 'Marked as read' });
  })
);
