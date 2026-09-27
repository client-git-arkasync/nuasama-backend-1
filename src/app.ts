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

const app: Application = express();

// Middlewares
app.use(helmet());
// CORS: baca dari env atau fallback ke defaults
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
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

// Error Handling (must be the last middleware)
app.use(errorHandler);

export default app;
