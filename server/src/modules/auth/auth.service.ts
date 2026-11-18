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
    currentStreak: user.currentStreak,
    agreedToTermsAt: user.agreedToTermsAt,
    bannedReason: user.bannedReason,
    rejectedReason: user.rejectedReason,
  };
}

function startOfDayMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * Touches the daily streak at most once per calendar day. Same day as the last touch: no-op
 * (so hammering /auth/me/status — it fires on every app launch — never double-counts one day).
 * Exactly one calendar day later: streak+1. Any bigger gap, or no prior activity at all: reset
 * to 1. Returns just the two touched fields, merged back onto the caller's already-fetched user
 * (which has `avatarAsset` included) rather than replacing it — `prisma.user.update()`'s own
 * return value wouldn't carry that relation, which would otherwise make `avatarUrl` go null.
 */
async function touchStreak(user: User): Promise<Pick<User, 'currentStreak' | 'lastActiveAt'>> {
  const now = new Date();

  if (!user.lastActiveAt) {
    return prisma.user.update({
      where: { id: user.id },
      data: { currentStreak: 1, lastActiveAt: now },
      select: { currentStreak: true, lastActiveAt: true },
    });
  }

  const dayDiff = Math.round((startOfDayMs(now) - startOfDayMs(user.lastActiveAt)) / 86_400_000);
  if (dayDiff === 0) {
    return { currentStreak: user.currentStreak, lastActiveAt: user.lastActiveAt };
  }

  const nextStreak = dayDiff === 1 ? user.currentStreak + 1 : 1;
  return prisma.user.update({
    where: { id: user.id },
    data: { currentStreak: nextStreak, lastActiveAt: now },
    select: { currentStreak: true, lastActiveAt: true },
  });
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
  role: 'Student' | 'Teacher' | 'Alumni';
  agreedToTerms: boolean;
  signupCode: string;
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

  const normalizedCode = input.signupCode.trim().toUpperCase();
  const passwordHash = await bcrypt.hash(input.password, 10);

  // Validates + redeems the signup code and creates the account in one DB transaction. The
  // redemption itself uses a conditional `updateMany` (not a plain `update`) keyed on
  // `usedByUserId: null` rather than trusting the row we just read a moment earlier — if its
  // `count` comes back 0, someone else redeemed this exact code in that gap, and throwing here
  // rolls back the whole transaction, including the user row this same call already created.
  // A valid, unused code *is* the verification — signups no longer sit in a manual-approval
  // queue, they go straight to Active.
  const user = await prisma.$transaction(async (tx) => {
    const signupCode = await tx.signupCode.findUnique({ where: { code: normalizedCode } });
    if (!signupCode) throw new ApiError(400, 'Invalid signup code');
    if (signupCode.role !== input.role) {
      throw new ApiError(400, `This code is for ${signupCode.role} signups, not ${input.role}`);
    }
    if (signupCode.usedByUserId) throw new ApiError(400, 'This signup code has already been used');

    const created = await tx.user.create({
      data: {
        fullName: input.fullName,
        email,
        passwordHash,
        course: input.course,
        semester: input.semester,
        role: input.role,
        status: 'Active',
        agreedToTermsAt: new Date(),
      },
    });

    const redeemed = await tx.signupCode.updateMany({
      where: { id: signupCode.id, usedByUserId: null },
      data: { usedByUserId: created.id, usedAt: new Date() },
    });
    if (redeemed.count !== 1) {
      throw new ApiError(400, 'This signup code has already been used');
    }

    return created;
  });

  const otpCode = generateOtp();
  await setOtp(user.id, otpCode);
  await deliverOtp(user, otpCode);
  // No admin-signup notification here anymore — a valid code already proves affiliation, so
  // there's nothing left for an admin to review/approve for this account.

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
    throw new ApiError(403, `Account banned: ${user.bannedReason ?? 'No reason given'}`);
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
  const streak = await touchStreak(user);
  return publicUser({ ...user, ...streak });
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
