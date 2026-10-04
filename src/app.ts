import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';

import { authRouter } from './modules/auth/router/auth.router';
import { userRouter } from './modules/user/router/user.router';
import { adminRouter } from './modules/admin/router/admin.router';
import { cartRouter } from './modules/cart/router/cart.router';
import { dapurRouter } from './modules/dapur/router/dapur.router';
import { menuRouter } from './modules/menu/router/menu.router';
import { orderRouter } from './modules/order/router/order.router';
import { webhookRouter } from './modules/webhook/router/webhook.router';
import { voucherRouter } from './modules/voucher/router/voucher.router';

const app: Application = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ALLOWED_ORIGINS,
  credentials: true,
}));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Nuasama API Running' });
});

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes Registration
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/dapur', dapurRouter);
app.use('/api/menu', menuRouter);
app.use('/api/orders', orderRouter);
app.use('/api/webhooks', webhookRouter);
app.use('/api/vouchers', voucherRouter);

app.get('/api/settings', async (req: Request, res: Response, next: import('express').NextFunction) => {
  try {
    const { adminService } = await import('./modules/admin/service/admin.service');
    const settings = await adminService.getSettings();
    res.status(200).json({ status: 'success', data: settings });
  } catch (err) { next(err); }
});

// Error Handling (must be the last middleware)
app.use(errorHandler);

export default app;
