import { Router } from 'express';
import type { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { listUsersQuerySchema, rejectUserSchema, banUserSchema, dashboardStatsQuerySchema } from './admin.schema';
import * as adminService from './admin.service';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('Admin'));

adminRouter.get(
  '/users',
  validateQuery(listUsersQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listUsersQuerySchema>;
    const users = await adminService.listUsers(query);
    res.json(users);
  })
);

adminRouter.patch(
  '/users/:id/approve',
  asyncHandler(async (req, res) => {
    const user = await adminService.approveUser(req.params.id);
    res.json(user);
  })
);

adminRouter.patch(
  '/users/:id/reject',
  validateBody(rejectUserSchema),
  asyncHandler(async (req, res) => {
    const user = await adminService.rejectUser(req.params.id, req.body.reason);
    res.json(user);
  })
);

adminRouter.patch(
  '/users/:id/ban',
  validateBody(banUserSchema),
  asyncHandler(async (req, res) => {
    const user = await adminService.banUser(req.params.id, req.body.reason);
    res.json(user);
  })
);

adminRouter.patch(
  '/users/:id/unban',
  asyncHandler(async (req, res) => {
    const user = await adminService.unbanUser(req.params.id);
    res.json(user);
  })
);

adminRouter.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await adminService.listAdminNotifications(req.user!.id);
    res.json(notifications);
  })
);

adminRouter.get(
  '/stats',
  validateQuery(dashboardStatsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof dashboardStatsQuerySchema>;
    const stats = await adminService.getDashboardStats(query);
    res.json(stats);
  })
);
