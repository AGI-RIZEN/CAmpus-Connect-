import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { User, Asset } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { redis } from '../../config/redis';
import { sendMail } from '../../config/mailer';
import { ApiError } from '../../middleware/errorHandler';
import {
  issueTokenPair,
  consumeRefreshToken,
  revokeRefreshToken,
  revokeAllRefreshTokensForUser,
  signAvatarUploadToken,
} from './auth.tokens';
import { generateOtp, setOtp, verifyOtp, getResendCooldownRemaining, startResendCooldown } from './auth.otp';

const RESET_TTL_SECONDS = 30 * 60; // 30 minutes
const withAvatar = { include: { avatarAsset: true } } as const;

/** Emails are case-insensitive everywhere a human types one — normalize once, consistently. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: User & { avatarAsset?: Asset | null }) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    status: user.status,
    course: user.course,
    semester: user.semester,
    isEmailVerified: user.isEmailVerified,
    avatarUrl: user.avatarAsset?.secureUrl ?? null,
    points: user.points,
    agreedToTermsAt: user.agreedToTermsAt,
  };
}

/** Best-effort — a failure here should never block signup itself. */
async function notifyAdminsOfNewSignup(user: {
  fullName: string;
  role: string;
  course: string | null;
  semester: number | null;
}) {
  try {
    const admins = await prisma.user.findMany({ where: { role: 'Admin' }, select: { id: true } });
    if (admins.length === 0) return;
    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: 'user_applied',
        title: 'New account application',
        body: `${user.fullName} (${user.role}) applied — ${user.course}, Sem ${user.semester}`,
      })),
    });
  } catch (err) {
    console.error('[notifications] failed to notify admins of new signup (non-fatal):', (err as Error).message);
  }
}

/** Always logs the OTP (so signup/testing works with zero email setup), then best-effort emails it. */
async function deliverOtp(user: { email: string; fullName: string }, code: string) {
  console.log(`[otp] ${user.email} -> ${code}`);
  try {
    await sendMail({ to: user.email, template: 'otp-verify', data: { fullName: user.fullName, code } });
  } catch (err) {
    console.error('[mailer] failed to send OTP email (non-fatal):', (err as Error).message);
  }
}

export async function signup(input: {
  fullName: string;
  email: string;
  password: string;
  course: string;
  semester: number;
  role: 'Student' | 'Teacher';
  agreedToTerms: boolean;
}) {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // The route's zod schema already rejects agreedToTerms !== true before this ever runs, but
  // guard here too — this function shouldn't trust that every future caller goes through that
  // route, and the whole point of this field is to have a real, trustworthy consent record.
  if (!input.agreedToTerms) {
    throw new ApiError(400, 'You must agree to the Terms and Conditions');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email,
      passwordHash,
      course: input.course,
      semester: input.semester,
      role: input.role,
      agreedToTermsAt: new Date(),
    },
  });

  const code = generateOtp();
  await setOtp(user.id, code);
  await deliverOtp(user, code);
  await notifyAdminsOfNewSignup(user);

  // Scoped, short-lived token proving "this client is the one that just created this account" —
  // the only thing that's allowed to attach a profile photo before the account has a real
  // session. Prevents anyone who merely observes/guesses the userId from doing the same.
  const avatarUploadToken = signAvatarUploadToken(user.id);

  return { userId: user.id, avatarUploadToken };
}

export async function verifyOtpAndIssueTokens(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Account not found');

  const ok = await verifyOtp(userId, code);
  if (!ok) throw new ApiError(400, 'Invalid or expired code');

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
    ...withAvatar,
  });

  const tokens = await issueTokenPair(updated.id, updated.role);
  return { ...tokens, user: publicUser(updated) };
}

export async function resendOtp(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Account not found');

  const remaining = await getResendCooldownRemaining(userId);
  if (remaining > 0) {
    throw new ApiError(429, `Please wait ${remaining}s before requesting another code`);
  }

  const code = generateOtp();
  await setOtp(userId, code);
  await startResendCooldown(userId);
  await deliverOtp(user, code);
}

export async function login(rawEmail: string, password: string) {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({ where: { email }, ...withAvatar });
  if (!user) throw new ApiError(401, 'Invalid email or password');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Invalid email or password');

  if (user.status === 'Banned') {
    throw new ApiError(403, user.bannedReason ? `Account banned: ${user.bannedReason}` : 'Your account has been banned');
  }
  if (user.status === 'Rejected') {
    throw new ApiError(
      403,
      user.rejectedReason ? `Registration rejected: ${user.rejectedReason}` : 'Your registration was rejected'
    );
  }

  const tokens = await issueTokenPair(user.id, user.role);
  return { ...tokens, user: publicUser(user) };
}

export async function getStatus(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, ...withAvatar });
  if (!user) throw new ApiError(404, 'Account not found');
  return publicUser(user);
}

export async function refresh(refreshToken: string) {
  const userId = await consumeRefreshToken(refreshToken);
  if (!userId) throw new ApiError(401, 'Invalid or expired refresh token');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, 'Account not found');

  // A ban/rejection after the refresh token was issued must stop it from minting new access
  // tokens — don't just rely on requireAuth catching it on the next protected request.
  if (user.status === 'Banned' || user.status === 'Rejected') {
    await revokeAllRefreshTokensForUser(userId);
    throw new ApiError(403, 'This account no longer has access');
  }

  return issueTokenPair(user.id, user.role);
}

export async function logout(refreshToken: string) {
  await revokeRefreshToken(refreshToken);
}

export async function forgotPassword(rawEmail: string) {
  const email = normalizeEmail(rawEmail);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    // Don't reveal whether the email exists — caller always gets the same generic response.
    return;
  }

  const token = crypto.randomBytes(32).toString('hex');
  await redis.set(`reset:${token}`, user.id, 'EX', RESET_TTL_SECONDS);

  console.log(`[password-reset] ${user.email} -> token ${token}`);
  try {
    await sendMail({
      to: user.email,
      template: 'password-reset',
      data: {
        fullName: user.fullName,
        resetToken: token,
        resetUrl: `campusconnect://reset-password?token=${token}`,
      },
    });
  } catch (err) {
    console.error('[mailer] failed to send reset email (non-fatal):', (err as Error).message);
  }
}

export async function resetPassword(token: string, newPassword: string) {
  const userId = await redis.get(`reset:${token}`);
  if (!userId) throw new ApiError(400, 'Invalid or expired reset token');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await redis.del(`reset:${token}`);
  // A password reset likely means the old one leaked — every existing session (including one
  // an attacker may be holding) must stop working, not just future logins use the new password.
  await revokeAllRefreshTokensForUser(userId);
}

export async function changePassword(userId: string, oldPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, 'Account not found');

  const valid = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!valid) throw new ApiError(401, 'Current password is incorrect');

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await revokeAllRefreshTokensForUser(userId);
}
