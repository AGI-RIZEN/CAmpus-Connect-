import { apiRequest } from './client';
import { setTokens, clearTokens, getRefreshToken } from './token-storage';

export type UserRole = 'Student' | 'Teacher' | 'Admin';
export type UserStatus = 'PendingApproval' | 'Active' | 'Rejected' | 'Banned';

export type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  course: string | null;
  semester: number | null;
  isEmailVerified: boolean;
  avatarUrl: string | null;
  points: number;
};

type TokenPair = { accessToken: string; refreshToken: string };

export async function signup(input: {
  fullName: string;
  email: string;
  password: string;
  course: string;
  semester: number;
  role: 'Student' | 'Teacher';
  agreedToTerms: boolean;
}): Promise<{ userId: string; avatarUploadToken: string }> {
  return apiRequest('/auth/signup', { method: 'POST', body: input });
}

export async function verifyOtp(userId: string, code: string): Promise<TokenPair & { user: AuthUser }> {
  const result = await apiRequest<TokenPair & { user: AuthUser }>('/auth/otp/verify', {
    method: 'POST',
    body: { userId, code },
  });
  await setTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function resendOtp(userId: string): Promise<void> {
  await apiRequest('/auth/otp/resend', { method: 'POST', body: { userId } });
}

export async function login(email: string, password: string): Promise<TokenPair & { user: AuthUser }> {
  const result = await apiRequest<TokenPair & { user: AuthUser }>('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
  await setTokens(result.accessToken, result.refreshToken);
  return result;
}

export async function getStatus(): Promise<AuthUser> {
  return apiRequest('/auth/me/status', { method: 'GET', auth: true });
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    try {
      await apiRequest('/auth/logout', { method: 'POST', body: { refreshToken }, auth: true });
    } catch {
      // best-effort server-side revoke — clear local tokens regardless
    }
  }
  await clearTokens();
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest('/auth/password/forgot', { method: 'POST', body: { email } });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiRequest('/auth/password/reset', { method: 'POST', body: { token, newPassword } });
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  await apiRequest('/auth/password/change', {
    method: 'POST',
    body: { oldPassword, newPassword },
    auth: true,
  });
}
