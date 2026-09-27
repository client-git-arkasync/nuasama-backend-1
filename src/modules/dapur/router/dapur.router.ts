import { Router } from 'express';
import { dapurController } from '../controller/dapur.controller';
import { authenticate, authorizeAdmin } from '../../../middleware/auth.middleware';

export const dapurRouter = Router();

dapurRouter.get('/', dapurController.getAll.bind(dapurController));
dapurRouter.get('/:id', dapurController.getById.bind(dapurController));
dapurRouter.post('/', authenticate, authorizeAdmin, dapurController.create.bind(dapurController));
dapurRouter.put('/:id', authenticate, authorizeAdmin, dapurController.update.bind(dapurController));
dapurRouter.delete('/:id', authenticate, authorizeAdmin, dapurController.delete.bind(dapurController));
