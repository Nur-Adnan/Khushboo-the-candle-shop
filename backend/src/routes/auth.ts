import bcrypt from 'bcrypt';
import { Router } from 'express';
import jwt, { type SignOptions } from 'jsonwebtoken';

import { query } from '../db';
import { getJwtSecret, hashToken, requireAuth } from '../middleware/auth';
import { loginLimiter } from '../middleware/rateLimit';

type AdminRow = {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'super_admin';
};

const router = Router();
const invalidCredentials = {
  error: true,
  message: 'Invalid email or password',
  code: 'UNAUTHORIZED',
};

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: unknown; password?: unknown };

    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
      return res.status(400).json({
        error: true,
        message: 'Email and password are required',
        code: 'VALIDATION_ERROR',
      });
    }

    const result = await query<AdminRow>(
      'SELECT id, email, password_hash, role FROM admin_users WHERE email = $1 LIMIT 1',
      [email.toLowerCase().trim()],
    );
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json(invalidCredentials);
    }

    const passwordMatches = await bcrypt.compare(password, admin.password_hash);

    if (!passwordMatches) {
      return res.status(401).json(invalidCredentials);
    }

    const expiresIn = (process.env.JWT_EXPIRES_IN ?? '24h') as SignOptions['expiresIn'];
    const token = jwt.sign(
      { id: admin.id, email: admin.email, role: admin.role },
      getJwtSecret(),
      { expiresIn },
    );
    const decoded = jwt.decode(token) as { exp?: number } | null;
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000).toISOString() : null;

    return res.json({ token, expiresAt });
  } catch (error) {
    return next(error);
  }
});

router.post('/logout', requireAuth, async (req, res, next) => {
  try {
    if (!req.authToken || !req.admin?.exp) {
      return res.status(400).json({
        error: true,
        message: 'Invalid token',
        code: 'VALIDATION_ERROR',
      });
    }

    await query(
      `INSERT INTO token_blacklist (token_hash, expires_at)
       VALUES ($1, $2)
       ON CONFLICT (token_hash) DO NOTHING`,
      [hashToken(req.authToken), new Date(req.admin.exp * 1000).toISOString()],
    );

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export { router as authRouter };
