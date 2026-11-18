import type { AuthUser } from './api/auth';

type Route = string | { pathname: string; params?: Record<string, string> };

/** Where to send a user right after login/OTP-verify, based on their real role+status.
 *  Banned carries the admin's real reason through as a route param so /(auth)/banned can show
 *  it instead of falling back to its generic placeholder text. */
export function routeForUser(user: AuthUser): Route {
  if (user.status === 'Banned') {
    return { pathname: '/(auth)/banned', params: user.bannedReason ? { reason: user.bannedReason } : {} };
  }
  if (user.status === 'PendingApproval') return '/(auth)/waiting-approval';
  if (user.status === 'Rejected') return '/(auth)/login';

  switch (user.role) {
    case 'Teacher':
      return '/(teacher)/home';
    case 'Admin':
      return '/(admin)/dashboard';
    default:
      return '/(app)/home';
  }
}
