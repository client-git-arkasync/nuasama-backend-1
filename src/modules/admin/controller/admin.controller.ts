import { Request, Response, NextFunction } from 'express';
import {
  adminService,
  verifyPaymentSchema,
  updateOrderStatusSchema,
  createMenuItemSchema,
  updateMenuItemSchema,
  historyQuerySchema,
  updateSettingsSchema,
  voucherSchema,
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
      if (!req.file) throw new AppError('File foto wajib diunggah', 400);
      
      const { uploadBufferToCloudinary } = await import('../../../lib/cloudinary');
      const photo_url = await uploadBufferToCloudinary(req.file.buffer, 'nuasama/menu-photos');
      
      await adminService.uploadMenuPhoto(req.params.id, photo_url);
      res.status(200).json({ status: 'success', message: 'Foto menu berhasil diunggah' });
    } catch (err) { next(err); }
  }

  async scanAndComplete(req: Request, res: Response, next: NextFunction) {
    try {
      const { displayId } = req.params;
      const data = await adminService.scanAndComplete(displayId);
      res.status(200).json({ status: 'success', message: 'Pesanan berhasil diselesaikan via scan', data });
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

  // ---- Settings ----

  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getSettings();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = updateSettingsSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid: ' + result.error.errors[0].message, 400);
      const data = await adminService.updateSettings(result.data.ppn, result.data.use_ppn);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  // ---- Aksesori Tipe ----

  async getAksesoriTipe(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getAksesoriTipe();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async createAksesoriTipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) throw new AppError('Nama tipe wajib diisi', 400);
      const data = await adminService.createAksesoriTipe(name.trim());
      res.status(201).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async updateAksesoriTipe(req: Request, res: Response, next: NextFunction) {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) throw new AppError('Nama tipe wajib diisi', 400);
      const data = await adminService.updateAksesoriTipe(req.params.id, name.trim());
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async deleteAksesoriTipe(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteAksesoriTipe(req.params.id);
      res.status(200).json({ status: 'success', message: 'Tipe berhasil dihapus' });
    } catch (err) { next(err); }
  }

  // ---- Vouchers ----

  async getVouchers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getVouchers();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async createVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const result = voucherSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data voucher tidak valid: ' + result.error.errors[0].message, 400);
      const data = await adminService.createVoucher(result.data);
      res.status(201).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async updateVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      const result = voucherSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data voucher tidak valid: ' + result.error.errors[0].message, 400);
      const data = await adminService.updateVoucher(req.params.id, result.data);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async toggleVoucherStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.toggleVoucherStatus(req.params.id);
      res.status(200).json({ status: 'success', message: 'Status voucher berhasil diubah', data });
    } catch (err) { next(err); }
  }

  async deleteVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteVoucher(req.params.id);
      res.status(200).json({ status: 'success', message: 'Voucher berhasil dihapus' });
    } catch (err) { next(err); }
  }
}

export const adminController = new AdminController();
