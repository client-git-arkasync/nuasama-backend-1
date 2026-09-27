import { Router } from 'express';
import { orderController } from '../controller/order.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const orderRouter = Router();

orderRouter.post('/', authenticate, orderController.createOrder.bind(orderController));
orderRouter.get('/', authenticate, orderController.getCustomerOrders.bind(orderController));
orderRouter.get('/:id', authenticate, orderController.getOrderById.bind(orderController));
orderRouter.get('/:id/payment-info', authenticate, orderController.getPaymentInfo.bind(orderController));
orderRouter.post('/:id/payment-proof', authenticate, orderController.uploadPaymentProof.bind(orderController));
orderRouter.get('/:id/status', authenticate, orderController.getOrderStatus.bind(orderController));
