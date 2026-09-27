import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';

export class DapurService {
  async getAll() {
    const dapurs = await prisma.dapur.findMany({ orderBy: { name: 'asc' } });
    return { items: dapurs.map(d => ({ id: d.id, name: d.name, logoUrl: d.logo_url || '' })) };
  }

  async getById(id: string) {
    const dapur = await prisma.dapur.findUnique({ where: { id } });
    if (!dapur) throw new AppError('Dapur tidak ditemukan', 404);
    return { id: dapur.id, name: dapur.name, logoUrl: dapur.logo_url || '' };
  }

  async create(name: string) {
    const dapur = await prisma.dapur.create({ data: { name } });
    return { id: dapur.id, name: dapur.name, logoUrl: dapur.logo_url || '' };
  }

  async update(id: string, params: { name?: string }) {
    if (!params.name) throw new AppError('Tidak ada data yang diubah', 400);
    const existing = await prisma.dapur.findUnique({ where: { id } });
    if (!existing) throw new AppError('Dapur tidak ditemukan', 404);

    const updated = await prisma.dapur.update({ where: { id }, data: { name: params.name } });
    return { id: updated.id, name: updated.name, logoUrl: updated.logo_url || '' };
  }

  async uploadLogo(id: string, logoUrl: string) {
    const existing = await prisma.dapur.findUnique({ where: { id } });
    if (!existing) throw new AppError('Dapur tidak ditemukan', 404);

    const updated = await prisma.dapur.update({ where: { id }, data: { logo_url: logoUrl } });
    return { id: updated.id, name: updated.name, logoUrl: updated.logo_url || '' };
  }

  async delete(id: string) {
    const menuCount = await prisma.menuItem.count({ where: { dapur_id: id } });
    if (menuCount > 0) throw new AppError('Tidak dapat menghapus dapur ini karena masih memiliki menu', 400);

    const existing = await prisma.dapur.findUnique({ where: { id } });
    if (!existing) throw new AppError('Dapur tidak ditemukan', 404);

    await prisma.dapur.delete({ where: { id } });
  }
}

export const dapurService = new DapurService();
