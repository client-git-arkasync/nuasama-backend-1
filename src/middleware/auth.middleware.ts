import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { AppError } from '../utils/AppError';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  // Support token via Authorization header OR ?token= query param (needed for <img src> browser requests)
  const authHeader = req.headers.authorization;
  const queryToken = req.query.token as string | undefined;

  const raw = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : queryToken;

  if (!raw) {
    return next(new AppError('Token tidak ditemukan, silakan login', 401));
  }

  try {
    const payload = verifyToken(raw);
    req.user = payload;
    next();
  } catch {
    return next(new AppError('Token tidak valid atau sudah kedaluwarsa', 401));
  }
};

export const authorizeAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Akses ditolak, hanya admin yang diizinkan', 403));
  }
  next();
};
