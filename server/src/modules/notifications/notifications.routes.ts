import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import * as notificationsService from './notifications.service';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

notificationsRouter.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    res.json({ count: await notificationsService.getUnreadCount(req.user!.id) });
  })
);

notificationsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await notificationsService.listNotifications(req.user!.id));
  })
);

notificationsRouter.post(
  '/read-all',
  asyncHandler(async (req, res) => {
    await notificationsService.markAllRead(req.user!.id);
    res.json({ message: 'All marked read' });
  })
);

notificationsRouter.post(
  '/:id/read',
  asyncHandler(async (req, res) => {
    await notificationsService.markRead(req.user!.id, req.params.id);
    res.json({ message: 'Marked read' });
  })
);
