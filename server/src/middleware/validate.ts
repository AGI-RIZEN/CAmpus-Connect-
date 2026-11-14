import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ApiError(400, message));
    }
    req.body = result.data;
    next();
  };
}

/**
 * Validates req.query and stashes the parsed result on req.validatedQuery — express's own
 * `req.query` type (ParsedQs) can't carry our narrower, validated shape.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      return next(new ApiError(400, message));
    }
    req.validatedQuery = result.data;
    next();
  };
}
