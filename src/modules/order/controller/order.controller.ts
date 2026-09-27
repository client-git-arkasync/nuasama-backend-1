import { Request, Response, NextFunction } from 'express';
import { orderService, createOrderSchema } from '../service/order.service';
import { AppError } from '../../../utils/AppError';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const result = createOrderSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid: ' + result.error.errors[0].message, 400);
      const data = await orderService.createOrder(req.user.userId, result.data);
      res.status(201).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getPaymentInfo(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await orderService.getPaymentInfo(req.user.userId, req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async uploadPaymentProof(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      // For now accept proof_url in body (Cloudinary handled by frontend)
      const { proof_url } = req.body;
      if (!proof_url) throw new AppError('URL bukti pembayaran wajib diisi', 400);
      await orderService.uploadPaymentProof(req.user.userId, req.params.id, proof_url);
      res.status(200).json({ status: 'success', message: 'Bukti pembayaran berhasil diunggah' });
    } catch (err) { next(err); }
  }

  async getOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await orderService.getOrderStatus(req.user.userId, req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await orderService.getOrderById(req.user.userId, req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getCustomerOrders(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const data = await orderService.getCustomerOrders(req.user.userId);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }
}

export const orderController = new OrderController();
