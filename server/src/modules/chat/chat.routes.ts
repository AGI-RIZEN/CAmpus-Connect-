import { Router } from 'express';
import type { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/roleGuard';
import { asyncHandler } from '../../middleware/asyncHandler';
import { validateBody, validateQuery } from '../../middleware/validate';
import { sendMessageSchema, createPollSchema, createGroupSchema, listMessagesQuerySchema, voteSchema } from './chat.schema';
import * as chatService from './chat.service';

export const chatRouter = Router();

chatRouter.use(requireAuth);

chatRouter.get(
  '/groups',
  asyncHandler(async (req, res) => {
    res.json(await chatService.listMyGroups(req.user!.id));
  })
);

chatRouter.get(
  '/admin/groups',
  requireRole('Admin'),
  asyncHandler(async (req, res) => {
    res.json(await chatService.listAllGroups());
  })
);

chatRouter.post(
  '/admin/groups',
  requireRole('Admin'),
  validateBody(createGroupSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await chatService.createGroup(req.user!.id, req.body));
  })
);

chatRouter.get(
  '/groups/:id',
  asyncHandler(async (req, res) => {
    res.json(await chatService.getGroupMeta(req.user!.id, req.params.id));
  })
);

chatRouter.post(
  '/groups/:id/read',
  asyncHandler(async (req, res) => {
    await chatService.markGroupRead(req.user!.id, req.params.id);
    res.json({ message: 'Marked read' });
  })
);

chatRouter.get(
  '/groups/:id/messages',
  validateQuery(listMessagesQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.validatedQuery as z.infer<typeof listMessagesQuerySchema>;
    res.json(await chatService.listMessages(req.user!.id, req.params.id, query));
  })
);

chatRouter.post(
  '/groups/:id/messages',
  validateBody(sendMessageSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await chatService.sendMessage(req.user!.id, req.params.id, req.body));
  })
);

chatRouter.get(
  '/groups/:id/files',
  asyncHandler(async (req, res) => {
    res.json(await chatService.listGroupFiles(req.user!.id, req.params.id));
  })
);

chatRouter.post(
  '/groups/:id/polls',
  validateBody(createPollSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await chatService.createPoll(req.user!.id, req.params.id, req.body));
  })
);

chatRouter.post(
  '/polls/:pollId/vote',
  validateBody(voteSchema),
  asyncHandler(async (req, res) => {
    res.json(await chatService.votePoll(req.user!.id, req.params.pollId, req.body.optionId));
  })
);
