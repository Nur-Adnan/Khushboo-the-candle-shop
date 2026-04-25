import type { JwtPayload } from 'jsonwebtoken';

export type AdminJwtPayload = JwtPayload & {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
};

declare global {
  namespace Express {
    interface Request {
      admin?: AdminJwtPayload;
      authToken?: string;
    }
  }
}
