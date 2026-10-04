import { Router } from 'express';
import { voucherController } from '../controller/voucher.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const voucherRouter = Router();

// Semua route butuh login
voucherRouter.get('/', authenticate, voucherController.getActiveVouchers.bind(voucherController));
voucherRouter.get('/my', authenticate, voucherController.getMyVouchers.bind(voucherController));
voucherRouter.post('/claim', authenticate, voucherController.claimVoucher.bind(voucherController));
