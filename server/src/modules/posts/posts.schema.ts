import { z } from 'zod';

export const createPostSchema = z
  .object({
    caption: z.string().max(2000).optional().default(''),
    imageAssetIds: z.array(z.string()).max(5).optional().default([]),
  })
  .refine((v) => v.caption.trim().length > 0 || v.imageAssetIds.length > 0, {
    message: 'Add a caption or at least one photo',
  });

export const listFeedQuerySchema = z.object({
  scope: z.enum(['forYou', 'popular', 'myCourse']).optional().default('forYou'),
});

export const addCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

export const reportPostSchema = z.object({
  reason: z.enum(['Spam', 'Inappropriate', 'Harassment', 'Other']),
  details: z.string().max(1000).optional(),
});

export const moderationReasonSchema = z.object({
  reason: z.string().min(3).max(500),
});
