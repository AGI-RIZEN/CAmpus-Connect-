import { apiRequest } from './client';
import type { UserRole, UserStatus } from './auth';

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  course: string | null;
  semester: number | null;
  department: string | null;
  avatarUrl: string | null;
  rejectedReason: string | null;
  bannedReason: string | null;
  createdAt: string;
};

export async function listUsers(
  params: { search?: string; role?: UserRole; status?: UserStatus; activeToday?: boolean } = {}
): Promise<AdminUser[]> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.role) qs.set('role', params.role);
  if (params.status) qs.set('status', params.status);
  if (params.activeToday) qs.set('activeToday', 'true');
  const query = qs.toString();
  return apiRequest(`/admin/users${query ? `?${query}` : ''}`, { auth: true });
}

export async function banUser(id: string, reason: string): Promise<AdminUser> {
  return apiRequest(`/admin/users/${id}/ban`, { method: 'PATCH', body: { reason }, auth: true });
}

export async function unbanUser(id: string): Promise<AdminUser> {
  return apiRequest(`/admin/users/${id}/unban`, { method: 'PATCH', auth: true });
}

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  return apiRequest('/admin/notifications', { auth: true });
}

export type AdminDashboardStats = {
  totalStudents: number;
  pendingApprovals: number;
  activeToday: number;
  bannedUsers: number;
  /** Distinct active-user count per day, oldest to newest, last entry is today. */
  activeUsersWeek: number[];
  readRates: { label: string; pct: number }[];
  quizAttempted: number;
  quizMissed: number;
  topPosts: { id: string; author: string; avatarUrl: string | null; likes: number; comments: number }[];
};

export type DashboardStatsFilters = {
  course?: string;
  semester?: number;
  dateRange?: 'Today' | 'This Week' | 'This Month' | 'This Semester';
};

export async function getDashboardStats(filters: DashboardStatsFilters = {}): Promise<AdminDashboardStats> {
  const qs = new URLSearchParams();
  if (filters.course) qs.set('course', filters.course);
  if (filters.semester) qs.set('semester', String(filters.semester));
  if (filters.dateRange) qs.set('dateRange', filters.dateRange);
  const query = qs.toString();
  return apiRequest(`/admin/stats${query ? `?${query}` : ''}`, { auth: true });
}

export type SignupCodeRole = 'Student' | 'Teacher' | 'Alumni';

export type SignupCode = {
  id: string;
  code: string;
  role: SignupCodeRole;
  note: string | null;
  used: boolean;
  usedByName: string | null;
  usedAt: string | null;
  createdAt: string;
};

export async function generateSignupCodes(params: {
  role: SignupCodeRole;
  count: number;
  note?: string;
}): Promise<SignupCode[]> {
  return apiRequest('/admin/signup-codes', { method: 'POST', body: params, auth: true });
}

export async function listSignupCodes(params: { role?: SignupCodeRole; used?: boolean } = {}): Promise<SignupCode[]> {
  const qs = new URLSearchParams();
  if (params.role) qs.set('role', params.role);
  if (params.used !== undefined) qs.set('used', String(params.used));
  const query = qs.toString();
  return apiRequest(`/admin/signup-codes${query ? `?${query}` : ''}`, { auth: true });
}
