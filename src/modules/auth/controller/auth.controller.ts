import { Request, Response, NextFunction } from 'express';
import { authService } from '../service/auth.service';
import { registerSchema, loginSchema } from '../auth';
import { AppError } from '../../../utils/AppError';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = registerSchema.safeParse(req.body);
      if (!result.success) {
        throw new AppError('Data tidak lengkap atau tidak valid: ' + result.error.errors[0].message, 400);
      }
      const data = await authService.register(result.data);
      res.status(201).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        throw new AppError('Email dan password wajib diisi', 400);
      }
      const data = await authService.login(result.data);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      throw new AppError('Google login belum dikonfigurasi, hubungi administrator', 501);
    } catch (err) {
      next(err);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await authService.getMe(req.user.userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      // JWT is stateless on backend, we just send OK for frontend to clear its local storage/cookies
      res.status(200).json({ status: 'success', message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
