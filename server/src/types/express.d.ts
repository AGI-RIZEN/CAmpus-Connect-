import type { Role, UserStatus } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
        status: UserStatus;
      };
      /** Set by middleware/validate.ts's validateQuery — the zod-parsed, typed query params. */
      validatedQuery?: unknown;
    }
  }
}

export {};
