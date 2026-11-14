import { apiRequest } from './client';

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function listNotifications(): Promise<Notification[]> {
  return apiRequest('/notifications', { auth: true });
}

export async function getUnreadCount(): Promise<number> {
  const result = await apiRequest<{ count: number }>('/notifications/unread-count', { auth: true });
  return result.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiRequest(`/notifications/${id}/read`, { method: 'POST', auth: true });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest('/notifications/read-all', { method: 'POST', auth: true });
}
