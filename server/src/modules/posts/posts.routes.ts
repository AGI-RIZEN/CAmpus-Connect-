import { Router } from 'express';
import type { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { createPostSchema, listFeedQuerySchema, addCommentSchema, reportPostSchema, moderationReasonSchema } from './posts.schema';
import * as postsService from './posts.service';

export const postsRouter = Router();

postsRouter.use(requireAuth);

postsRouter.get(
  '/mine',
  asyncHandler(async (req, res) => {
    res.json(await postsService.listMine(req.user!.id));
  })
);

postsRouter.get(
  '/admin/pending',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    res.json(await postsService.listPendingPosts());
  })
);

postsRouter.get(
  '/admin/reports',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    res.json(await postsService.listOpenReports());
  })
);

postsRouter.get(
  '/',
  validateQuery(listFeedQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listFeedQuerySchema>;
    res.json(await postsService.listFeed(req.user!, query));
  })
);

postsRouter.post(
  '/',
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await postsService.createPost(req.user!.id, req.body));
  })
);

postsRouter.post(
  '/comments/:commentId/like',
  asyncHandler(async (req, res) => {
    res.json(await postsService.toggleCommentLike(req.user!.id, req.params.commentId));
  })
);

postsRouter.post(
  '/:id/like',
  asyncHandler(async (req, res) => {
    res.json(await postsService.toggleLike(req.user!.id, req.params.id));
  })
);

postsRouter.post(
  '/:id/save',
  asyncHandler(async (req, res) => {
    res.json(await postsService.toggleSave(req.user!.id, req.params.id));
  })
);

postsRouter.get(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    res.json(await postsService.listComments(req.user!.id, req.params.id));
  })
);

postsRouter.post(
  '/:id/comments',
  validateBody(addCommentSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await postsService.addComment(req.user!.id, req.params.id, req.body.text));
  })
);

postsRouter.post(
  '/:id/report',
  validateBody(reportPostSchema),
  asyncHandler(async (req, res) => {
    await postsService.reportPost(req.user!.id, req.params.id, req.body.reason, req.body.details);
    res.json({ message: 'Report submitted' });
  })
);

postsRouter.patch(
  '/admin/:id/approve',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    res.json(await postsService.approvePost(req.params.id));
  })
);

postsRouter.patch(
  '/admin/:id/reject',
  requireRole('Admin'),
  validateBody(moderationReasonSchema),
  asyncHandler(async (req, res) => {
    res.json(await postsService.rejectPost(req.params.id, req.body.reason));
  })
);

postsRouter.patch(
  '/admin/reports/:postId/dismiss',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    await postsService.dismissReports(req.params.postId);
    res.json({ message: 'Dismissed' });
  })
);

postsRouter.patch(
  '/admin/reports/:postId/action',
  requireRole('Admin'),
  validateBody(moderationReasonSchema),
  asyncHandler(async (req, res) => {
    await postsService.actionReports(req.params.postId, req.body.reason);
    res.json({ message: 'Post removed' });
  })
);
