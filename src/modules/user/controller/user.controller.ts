import { Request, Response, NextFunction } from 'express';
import { userService } from '../service/user.service';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  phone_number: z.string().optional(),
});

export class UserController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await userService.getProfile(req.user.userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const result = updateProfileSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid: ' + result.error.errors[0].message, 400);
      const data = await userService.updateProfile(req.user.userId, result.data);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }
}

export const userController = new UserController();
