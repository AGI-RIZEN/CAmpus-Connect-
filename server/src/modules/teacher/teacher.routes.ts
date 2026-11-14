import { Router } from 'express';

export const teacherRouter = Router();

teacherRouter.all('*', (_req, res) => {
  res.status(501).json({ message: 'teacher module not implemented yet (Phase 1)' });
});
