import crypto from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { query } from '../db';
import type { AdminJwtPayload } from '../types/express';

function unauthorized(res: Response, message = 'Unauthorized') {
  return res.status(401).json({
    error: true,
    message,
    code: 'UNAUTHORIZED',
  });
}

export function getJwtSecret(): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  return process.env.JWT_SECRET;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const [scheme, token] = req.headers.authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return unauthorized(res);
  }

  let decoded: AdminJwtPayload;

  try {
    decoded = jwt.verify(token, getJwtSecret()) as AdminJwtPayload;
    if (!decoded.id || !decoded.email || !decoded.role) {
      return unauthorized(res, 'Invalid token');
    }
  } catch {
    return unauthorized(res, 'Invalid token');
  }

  try {
    const tokenHash = hashToken(token);
    const blacklisted = await query('SELECT 1 FROM token_blacklist WHERE token_hash = $1', [tokenHash]);

    if (blacklisted.rowCount && blacklisted.rowCount > 0) {
      return unauthorized(res, 'Token revoked');
    }

    req.admin = decoded;
    req.authToken = token;
    return next();
  } catch (error) {
    return next(error);
  }
}
