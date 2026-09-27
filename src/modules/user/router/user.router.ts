import { Router } from 'express';
import { userController } from '../controller/user.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const userRouter = Router();

userRouter.get('/profile', authenticate, userController.getProfile.bind(userController));
userRouter.put('/profile', authenticate, userController.updateProfile.bind(userController));
