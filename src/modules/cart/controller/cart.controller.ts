import { Request, Response, NextFunction } from 'express';
import { cartService, addCartItemSchema, updateCartItemSchema } from '../service/cart.service';
import { AppError } from '../../../utils/AppError';

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await cartService.getCart(req.user.userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const result = addCartItemSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid: ' + result.error.errors[0].message, 400);
      await cartService.addItem(req.user.userId, result.data);
      res.status(200).json({ status: 'success', message: 'Item berhasil ditambahkan ke keranjang' });
    } catch (err) { next(err); }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const result = updateCartItemSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Qty tidak valid', 400);
      await cartService.updateItem(req.user.userId, req.params.id, result.data.qty);
      res.status(200).json({ status: 'success', message: 'Keranjang berhasil diperbarui' });
    } catch (err) { next(err); }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      await cartService.removeItem(req.user.userId, req.params.id);
      res.status(200).json({ status: 'success', message: 'Item berhasil dihapus dari keranjang' });
    } catch (err) { next(err); }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      await cartService.clearCart(req.user.userId);
      res.status(200).json({ status: 'success', message: 'Keranjang berhasil dikosongkan' });
    } catch (err) { next(err); }
  }
}

export const cartController = new CartController();
