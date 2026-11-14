import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/prisma';
import { ApiError } from './errorHandler';
import type { Role } from '@prisma/client';

interface AccessTokenPayload {
  sub: string;
  role: Role;
}

/**
 * Verifies the JWT, then re-checks the account's CURRENT status in the database before letting
 * the request through. This is deliberately not a pure stateless-JWT check: a 15-minute access
 * token issued before an admin bans the account must stop working immediately, not just once it
 * expires — an in-memory JWT claim can't know about a ban that happened after it was signed.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Missing or malformed Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();

  let payload: AccessTokenPayload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch {
    return next(new ApiError(401, 'Invalid or expired access token'));
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, status: true },
    });

    if (!user) return next(new ApiError(401, 'Account not found'));
    if (user.status === 'Banned') return next(new ApiError(403, 'This account has been banned'));
    if (user.status === 'Rejected') return next(new ApiError(403, 'This account was rejected'));

    req.user = { id: user.id, role: user.role, status: user.status };
    next();
  } catch (err) {
    next(err);
  }
}
