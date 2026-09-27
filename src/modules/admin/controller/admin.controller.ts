import { Request, Response, NextFunction } from 'express';
import {
  adminService,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  historyQuerySchema,
} from '../service/admin.service';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

const ordersQuerySchema = z.object({
  status: z.string().optional().default(''),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

const allMenuQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  dapur_id: z.string().optional(),
  stock_status: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export class AdminController {
  // ---- Pesanan ----

  async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const q = ordersQuerySchema.parse(req.query);
      const data = await adminService.getOrders(q.status, q.page, q.limit);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getOrderById(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const result = verifyPaymentSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Action wajib diisi: disetujui atau ditolak', 400);

      // Validasi alasan penolakan wajib jika ditolak
      const isRejected = result.data.action === 'ditolak' || result.data.action === 'reject';
      if (isRejected && !result.data.rejection_reason) {
        throw new AppError('Alasan penolakan wajib diisi jika bukti pembayaran ditolak', 400);
      }

      await adminService.verifyPayment(req.user.userId, req.params.id, result.data);

      const msg = isRejected
        ? 'Bukti pembayaran ditolak, notifikasi telah dikirim ke pelanggan'
        : 'Bukti pembayaran berhasil disetujui, pesanan sedang diproses';
      res.status(200).json({ status: 'success', message: msg });
    } catch (err) { next(err); }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = updateOrderStatusSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Status wajib diisi: diproses, siap, atau selesai', 400);
      await adminService.updateOrderStatus(req.params.id, result.data.status);
      res.status(200).json({ status: 'success', message: 'Status pesanan berhasil diperbarui' });
    } catch (err) { next(err); }
  }

  async getDineInBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getDineInBookings();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  // ---- Menu ----

  async getAllMenu(req: Request, res: Response, next: NextFunction) {
    try {
      const q = allMenuQuerySchema.parse(req.query);
      const data = await adminService.getAllMenu(q);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async createMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = createMenuItemSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Nama, harga, kategori, dan nama outlet wajib diisi', 400);
      const data = await adminService.createMenuItem(result.data);
      res.status(201).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async updateMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = updateMenuItemSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid: ' + result.error.errors[0].message, 400);
      const data = await adminService.updateMenuItem(req.params.id, result.data);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async deleteMenuItem(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteMenuItem(req.params.id);
      res.status(200).json({ status: 'success', message: 'Menu berhasil dihapus' });
    } catch (err) { next(err); }
  }

  async toggleMenuStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.toggleMenuStatus(req.params.id);
      res.status(200).json({ status: 'success', message: 'Status menu berhasil diubah', data });
    } catch (err) { next(err); }
  }

  async uploadMenuPhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const { photo_url } = req.body;
      if (!photo_url) throw new AppError('File foto wajib diunggah (kirim photo_url dari Cloudinary)', 400);
      await adminService.uploadMenuPhoto(req.params.id, photo_url);
      res.status(200).json({ status: 'success', message: 'Foto menu berhasil diunggah' });
    } catch (err) { next(err); }
  }

  // ---- History ----

  async getOrderHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = historyQuerySchema.safeParse(req.query);
      if (!result.success) throw new AppError('Query tidak valid', 400);
      const { customer_name, date, order_type, page, limit } = result.data;
      const data = await adminService.getOrderHistory({ customer_name, date, order_type, page, limit });
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }
}

export const adminController = new AdminController();
