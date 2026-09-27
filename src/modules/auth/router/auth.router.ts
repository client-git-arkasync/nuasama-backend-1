import { Router } from 'express';
import { authController } from '../controller/auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const authRouter = Router();

authRouter.post('/register', authController.register.bind(authController));
authRouter.post('/login', authController.login.bind(authController));
authRouter.post('/google', authController.loginWithGoogle.bind(authController));
authRouter.post('/logout', authController.logout.bind(authController));
authRouter.get('/me', authenticate, authController.me.bind(authController));
