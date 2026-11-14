import { apiRequest } from './client';

export async function registerPushToken(token: string): Promise<void> {
  await apiRequest('/users/me/push-token', { method: 'PATCH', body: { token }, auth: true });
}
