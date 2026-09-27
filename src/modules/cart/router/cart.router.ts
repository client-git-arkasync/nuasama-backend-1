import { Router } from 'express';
import { cartController } from '../controller/cart.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const cartRouter = Router();

cartRouter.get('/', authenticate, cartController.getCart.bind(cartController));
cartRouter.post('/', authenticate, cartController.addItem.bind(cartController));
cartRouter.patch('/:id', authenticate, cartController.updateItem.bind(cartController)); // frontend uses PATCH
cartRouter.delete('/:id', authenticate, cartController.removeItem.bind(cartController));
cartRouter.delete('/clear', authenticate, cartController.clearCart.bind(cartController));
