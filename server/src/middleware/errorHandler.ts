import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { env } from '../config/env';

export class ApiError extends Error {
  statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'ApiError';
  }
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }
  if (err instanceof MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large — max 15MB.' : err.message;
    res.status(413).json({ error: message });
    return;
  }
  console.error(err);
  res.status(500).json({
    error: 'Internal server error',
    ...(env.NODE_ENV === 'development' && err instanceof Error ? { detail: err.message } : {}),
  });
}
