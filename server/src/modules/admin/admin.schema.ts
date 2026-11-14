import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  search: z.string().trim().min(1).max(200).optional(),
  role: z.enum(['Student', 'Teacher', 'Admin']).optional(),
  status: z.enum(['PendingApproval', 'Active', 'Rejected', 'Banned']).optional(),
  activeToday: z.coerce.boolean().optional(),
});

export const rejectUserSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const banUserSchema = z.object({
  reason: z.string().min(3).max(500),
});

export const dashboardStatsQuerySchema = z.object({
  course: z.string().trim().min(1).max(100).optional(),
  semester: z.coerce.number().int().min(1).max(12).optional(),
  dateRange: z.enum(['Today', 'This Week', 'This Month', 'This Semester']).optional(),
});
