import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';

export class VoucherController {
  // List semua voucher aktif (untuk halaman katalog voucher)
  async getActiveVouchers(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;

      const vouchers = await prisma.vouchers.findMany({
        where: { is_active: true },
        orderBy: { point_cost: 'asc' },
      });

      // Ambil voucher yang sudah dimiliki user ini (belum dipakai)
      const owned = userId
        ? await prisma.user_vouchers.findMany({
            where: { user_id: userId, is_used: false },
            select: { voucher_id: true },
          })
        : [];
      const ownedIds = new Set(owned.map((o) => o.voucher_id));

      const mapped = vouchers.map((v) => ({
        id: v.id,
        code: v.code,
        discount_amount: Number(v.discount_amount),
        applicable_product: v.applicable_product,
        applicable_order_type: v.applicable_order_type,
        min_purchase: Number(v.min_purchase),
        point_cost: v.point_cost,
        is_owned: ownedIds.has(v.id),
      }));

      res.status(200).json({ status: 'success', data: mapped });
    } catch (err) {
      next(err);
    }
  }

  // Tukarkan poin untuk klaim voucher
  async claimVoucher(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const userId = req.user.userId;
      const { voucher_id } = req.body;

      if (!voucher_id) throw new AppError('voucher_id wajib diisi', 400);

      const voucher = await prisma.vouchers.findUnique({ where: { id: voucher_id } });
      if (!voucher || !voucher.is_active) throw new AppError('Voucher tidak tersedia', 404);

      // Cek apakah user sudah punya voucher ini yang belum dipakai
      const alreadyOwned = await prisma.user_vouchers.findFirst({
        where: { user_id: userId, voucher_id, is_used: false },
      });
      if (alreadyOwned) throw new AppError('Anda sudah memiliki voucher ini', 400);

      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User tidak ditemukan', 404);

      if (user.nuasama_point < voucher.point_cost) {
        throw new AppError(
          `Poin Anda tidak cukup. Dibutuhkan ${voucher.point_cost} poin, Anda memiliki ${user.nuasama_point} poin`,
          400
        );
      }

      await prisma.$transaction(async (tx) => {
        // Kurangi poin user
        await tx.users.update({
          where: { id: userId },
          data: { nuasama_point: { decrement: voucher.point_cost } },
        });
        // Tambahkan voucher ke milik user
        await tx.user_vouchers.create({
          data: { user_id: userId, voucher_id },
        });
      });

      res.status(200).json({
        status: 'success',
        message: `Voucher "${voucher.code}" berhasil diklaim! ${voucher.point_cost} poin telah dipotong.`,
        data: { remaining_point: user.nuasama_point - voucher.point_cost },
      });
    } catch (err) {
      next(err);
    }
  }

  // List voucher yang dimiliki user (untuk pilihan saat checkout)
  async getMyVouchers(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new AppError('Tidak terautentikasi', 401);
      const userId = req.user.userId;

      const userVouchers = await prisma.user_vouchers.findMany({
        where: { user_id: userId, is_used: false },
        include: { vouchers: true },
        orderBy: { claimed_at: 'desc' },
      });

      const data = userVouchers.map((uv) => ({
        user_voucher_id: uv.id,
        voucher_id: uv.voucher_id,
        code: uv.vouchers.code,
        discount_amount: Number(uv.vouchers.discount_amount),
        applicable_product: uv.vouchers.applicable_product,
        applicable_order_type: uv.vouchers.applicable_order_type,
        min_purchase: Number(uv.vouchers.min_purchase),
        claimed_at: uv.claimed_at,
      }));

      res.status(200).json({ status: 'success', data });
    } catch (err) {
      next(err);
    }
  }
}

export const voucherController = new VoucherController();
