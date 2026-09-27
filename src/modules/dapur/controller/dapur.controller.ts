import { Request, Response, NextFunction } from 'express';
import { dapurService } from '../service/dapur.service';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

const createSchema = z.object({ name: z.string().min(2) });
const updateSchema = z.object({ name: z.string().min(2).optional() });

export class DapurController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dapurService.getAll();
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await dapurService.getById(req.params.id);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const result = createSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Nama dapur wajib diisi', 400);
      const data = await dapurService.create(result.data.name);
      res.status(201).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const result = updateSchema.safeParse(req.body);
      if (!result.success) throw new AppError('Data tidak valid', 400);
      const data = await dapurService.update(req.params.id, result.data);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const { logo_url } = req.body;
      if (!logo_url) throw new AppError('URL logo wajib diisi', 400);
      const data = await dapurService.uploadLogo(req.params.id, logo_url);
      res.status(200).json({ status: 'success', data });
    } catch (err) { next(err); }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await dapurService.delete(req.params.id);
      res.status(200).json({ status: 'success', message: 'Dapur berhasil dihapus' });
    } catch (err) { next(err); }
  }
}

export const dapurController = new DapurController();
