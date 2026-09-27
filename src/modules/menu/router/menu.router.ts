import { Router } from 'express';

export const menuRouter = Router();

menuRouter.get('/', (req, res) => {
  res.json({ message: 'Menu route' });
});
