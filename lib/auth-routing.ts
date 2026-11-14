import type { AuthUser } from './api/auth';

/** Where to send a user right after login/OTP-verify, based on their real role+status. */
export function routeForUser(user: AuthUser): string {
  if (user.status === 'Banned') return '/(auth)/banned';
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
