import { Request, Response, NextFunction } from 'express';
import { menuService } from '../service/menu.service';
import { menuListQuerySchema } from '../menu';
import { AppError } from '../../../utils/AppError';

export class MenuController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const queryResult = menuListQuerySchema.safeParse(req.query);
      
      if (!queryResult.success) {
        throw new AppError('Invalid query parameters', 400);
      }

      const result = await menuService.getAll(queryResult.data);
      
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      
      if (!id) {
        throw new AppError('ID menu tidak valid', 400);
      }

      const result = await menuService.getById(id);
      
      if (!result) {
        throw new AppError('Menu tidak ditemukan', 404);
      }

      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const menuController = new MenuController();
