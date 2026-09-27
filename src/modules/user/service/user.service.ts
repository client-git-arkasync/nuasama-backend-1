import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Pengguna tidak ditemukan', 404);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number || '',
    };
  }

  async updateProfile(userId: string, params: { name?: string; phone_number?: string }) {
    const updates: any = {};
    if (params.name) updates.name = params.name;
    if (params.phone_number !== undefined) updates.phone_number = params.phone_number;

    if (Object.keys(updates).length === 0) {
      throw new AppError('Tidak ada data yang diubah', 400);
    }

    const user = await prisma.users.update({
      where: { id: userId },
      data: updates,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number || '',
    };
  }
}

export const userService = new UserService();
