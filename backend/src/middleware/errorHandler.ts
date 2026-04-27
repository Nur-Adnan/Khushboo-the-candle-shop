import type { NextFunction, Request, Response } from 'express';
import { logger } from '../services/logger';

export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'SERVER_ERROR';

export class AppError extends Error {
  statusCode: number;
  code: AppErrorCode;

  constructor(statusCode: number, message: string, code: AppErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    error: true,
    message: 'Resource not found',
    code: 'NOT_FOUND',
  });
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  if (error instanceof AppError) {
    logger.warn(
      {
        error: {
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
        },
        req: {
          method: req.method,
          path: req.path,
        },
      },
      'Handled application error',
    );

    return res.status(error.statusCode).json({
      error: true,
      message: error.message,
      code: error.code,
    });
  }

  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(
    {
      error: {
        message: err.message,
        stack: err.stack,
      },
      req: {
        method: req.method,
        path: req.path,
      },
    },
    'Unhandled server error',
  );

  return res.status(500).json({
    error: true,
    message: 'Something went wrong',
    code: 'SERVER_ERROR',
  });
}
