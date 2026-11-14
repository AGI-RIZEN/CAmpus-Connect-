import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../../config/env';
import { redis } from '../../config/redis';

function parseDurationToSeconds(input: string): number {
  const match = /^(\d+)([smhd])$/.exec(input);
  if (!match) throw new Error(`Invalid duration string: "${input}" (expected e.g. "15m", "30d")`);
  const value = Number(match[1]);
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return value * multipliers[match[2] as keyof typeof multipliers];
}

const REFRESH_TTL_SECONDS = parseDurationToSeconds(env.JWT_REFRESH_EXPIRES_IN);
const PRE_AUTH_TTL_SECONDS = 15 * 60; // 15 minutes — long enough to finish the signup flow

const refreshKey = (token: string) => `refresh:${token}`;
const userRefreshSetKey = (userId: string) => `user-refresh:${userId}`;

export function signAccessToken(userId: string, role: Role): string {
  // jsonwebtoken's `expiresIn` type only accepts its own literal-string union; our value is a
  // validated-but-plain `string` from env, so a cast is the pragmatic choice here.
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export async function issueRefreshToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(40).toString('hex');
  await redis.set(refreshKey(token), userId, 'EX', REFRESH_TTL_SECONDS);
  // Tracked separately so a ban / password change can revoke every outstanding session for this
  // user, not just the one token being used right now.
  await redis.sadd(userRefreshSetKey(userId), token);
  return token;
}

export async function consumeRefreshToken(token: string): Promise<string | null> {
  const userId = await redis.get(refreshKey(token));
  if (!userId) return null;
  await redis.del(refreshKey(token));
  await redis.srem(userRefreshSetKey(userId), token);
  return userId;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  const userId = await redis.get(refreshKey(token));
  await redis.del(refreshKey(token));
  if (userId) await redis.srem(userRefreshSetKey(userId), token);
}

/** Revokes every refresh token this user currently holds — used on ban/reject/password change. */
export async function revokeAllRefreshTokensForUser(userId: string): Promise<void> {
  const tokens = await redis.smembers(userRefreshSetKey(userId));
  if (tokens.length > 0) {
    await redis.del(...tokens.map(refreshKey));
  }
  await redis.del(userRefreshSetKey(userId));
}

export async function issueTokenPair(userId: string, role: Role) {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = await issueRefreshToken(userId);
  return { accessToken, refreshToken };
}

// ---------------------------------------------------------------------------
// Pre-auth tokens — proves "I am the client that just called /auth/signup" for the one
// narrow action (uploading an avatar) that needs to happen before any real session exists.
// ---------------------------------------------------------------------------

interface PreAuthPayload {
  sub: string;
  scope: 'avatar-upload';
}

export function signAvatarUploadToken(userId: string): string {
  return jwt.sign({ sub: userId, scope: 'avatar-upload' } satisfies PreAuthPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: PRE_AUTH_TTL_SECONDS,
  });
}

/** Returns the userId this token was scoped to, or null if it's missing/invalid/wrong scope. */
export function verifyAvatarUploadToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as PreAuthPayload;
    if (payload.scope !== 'avatar-upload') return null;
    return payload.sub;
  } catch {
    return null;
  }
}
