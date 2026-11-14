import { z } from 'zod';

export const sendMessageSchema = z
  .object({
    text: z.string().max(2000).optional(),
    assetId: z.string().optional(),
  })
  .refine((v) => !!(v.text?.trim() || v.assetId), {
    message: 'Message needs text or an attachment',
  });

export const createPollSchema = z.object({
  question: z.string().min(1).max(300),
  options: z.array(z.string().min(1).max(100)).min(2).max(6),
  closesInHours: z.coerce.number().int().min(1).max(168).optional(),
});

export const voteSchema = z.object({
  optionId: z.string().min(1),
});

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  memberIds: z.array(z.string()).min(1),
  iconAssetId: z.string().optional(),
});

export const listMessagesQuerySchema = z.object({
  before: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});
