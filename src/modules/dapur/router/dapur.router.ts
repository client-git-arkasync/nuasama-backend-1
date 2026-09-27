import { Router } from 'express';

export const dapurRouter = Router();

dapurRouter.get('/', (req, res) => {
  res.json({ message: 'Dapur route' });
});
