import { apiRequest } from './client';

export type NoticeCategory = 'Urgent' | 'Exam' | 'Event' | 'General';

export type Notice = {
  id: string;
  title: string;
  preview: string;
  body: string;
  category: NoticeCategory;
  pinned: boolean;
  targetCourse: string | null;
  targetSemester: number | null;
  author: { id: string; fullName: string; avatarUrl: string | null };
  attachment: { name: string; url: string; bytes: number } | null;
  createdAt: string;
  unread: boolean;
};

export async function listNotices(params: { category?: NoticeCategory; mine?: boolean } = {}): Promise<Notice[]> {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.mine) qs.set('mine', 'true');
  const query = qs.toString();
  return apiRequest(`/notices${query ? `?${query}` : ''}`, { auth: true });
}

export async function getNotice(id: string): Promise<Notice> {
  return apiRequest(`/notices/${id}`, { auth: true });
}

export async function markNoticeRead(id: string): Promise<void> {
  await apiRequest(`/notices/${id}/read`, { method: 'POST', auth: true });
}

export async function createNotice(input: {
  title: string;
  body: string;
  category: NoticeCategory;
  pinned?: boolean;
  targetCourse?: string;
  targetSemester?: number;
  attachmentAssetId?: string;
}): Promise<Notice> {
  return apiRequest('/notices', { method: 'POST', body: input, auth: true });
}

export type NoticeAnalytics = {
  noticeId: string;
  title: string;
  totalAudience: number;
  readCount: number;
  unreadCount: number;
  readPct: number;
  unreadStudents: { id: string; name: string; course: string | null; avatarUrl: string | null }[];
};

export async function getNoticeAnalytics(id: string): Promise<NoticeAnalytics> {
  return apiRequest(`/notices/${id}/analytics`, { auth: true });
}

export async function remindStudent(noticeId: string, studentId: string): Promise<void> {
  await apiRequest(`/notices/${noticeId}/remind/${studentId}`, { method: 'POST', auth: true });
}
