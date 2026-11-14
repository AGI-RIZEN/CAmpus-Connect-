import crypto from 'crypto';
import { redis } from '../../config/redis';

export const OTP_TTL_SECONDS = 300; // 5 minutes
export const OTP_RESEND_COOLDOWN_SECONDS = 60; // matches the app's 60s countdown

const otpKey = (userId: string) => `otp:${userId}`;
const cooldownKey = (userId: string) => `otp:resend:${userId}`;

export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

export async function setOtp(userId: string, code: string) {
  await redis.set(otpKey(userId), code, 'EX', OTP_TTL_SECONDS);
}

export async function verifyOtp(userId: string, code: string): Promise<boolean> {
  const stored = await redis.get(otpKey(userId));
  if (!stored || stored !== code) return false;
  await redis.del(otpKey(userId));
  return true;
}

export async function getResendCooldownRemaining(userId: string): Promise<number> {
  const ttl = await redis.ttl(cooldownKey(userId));
  return ttl > 0 ? ttl : 0;
}

export async function startResendCooldown(userId: string) {
  await redis.set(cooldownKey(userId), '1', 'EX', OTP_RESEND_COOLDOWN_SECONDS);
}
