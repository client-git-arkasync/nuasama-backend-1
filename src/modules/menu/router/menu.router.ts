import { Router } from 'express';
import { menuController } from '../controller/menu.controller';

export const menuRouter = Router();

menuRouter.get('/', menuController.getAll.bind(menuController));
menuRouter.get('/:id', menuController.getById.bind(menuController));
