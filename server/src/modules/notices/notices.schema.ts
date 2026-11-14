import { z } from 'zod';

export const createNoticeSchema = z.object({
  title: z.string().min(3).max(200),
  body: z.string().min(1).max(5000),
  category: z.enum(['Urgent', 'Exam', 'Event', 'General']),
  pinned: z.boolean().optional().default(false),
  targetCourse: z.string().min(1).optional(),
  targetSemester: z.coerce.number().int().min(1).max(8).optional(),
  attachmentAssetId: z.string().optional(),
});

export const listNoticesQuerySchema = z.object({
  category: z.enum(['Urgent', 'Exam', 'Event', 'General']).optional(),
  mine: z.coerce.boolean().optional(),
});
