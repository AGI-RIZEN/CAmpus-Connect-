import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody } from '../../middleware/validate';
import { registerPushTokenSchema } from './users.schema';
import * as usersService from './users.service';

export const usersRouter = Router();

usersRouter.use(requireAuth);

usersRouter.patch(
  '/me/push-token',
  validateBody(registerPushTokenSchema),
  asyncHandler(async (req, res) => {
    await usersService.setPushToken(req.user!.id, req.body.token);
    res.json({ message: 'Push token saved' });
  })
);
