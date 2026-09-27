import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';

// Import routers
import { authRouter } from './modules/auth/router/auth.router';
import { userRouter } from './modules/user/router/user.router';
import { adminRouter } from './modules/admin/router/admin.router';
import { cartRouter } from './modules/cart/router/cart.router';
import { dapurRouter } from './modules/dapur/router/dapur.router';
import { menuRouter } from './modules/menu/router/menu.router';
import { orderRouter } from './modules/order/router/order.router';

const app: Application = express();

// Global Middlewares
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Routes Registration
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/admins', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/dapur', dapurRouter);
app.use('/api/menus', menuRouter);
app.use('/api/orders', orderRouter);

// Error Handling (must be the last middleware)
app.use(errorHandler);

export default app;
