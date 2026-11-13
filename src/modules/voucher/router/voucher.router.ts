import { Router } from 'express';
import { voucherController } from '../controller/voucher.controller';
import { authenticate, optionalAuthenticate } from '../../../middleware/auth.middleware';

export const voucherRouter = Router();

// Katalog voucher publik (opsional login agar guest tetap bisa lihat daftar promo)
voucherRouter.get('/', optionalAuthenticate, voucherController.getActiveVouchers.bind(voucherController));
voucherRouter.get('/my', authenticate, voucherController.getMyVouchers.bind(voucherController));
voucherRouter.post('/claim', authenticate, voucherController.claimVoucher.bind(voucherController));
