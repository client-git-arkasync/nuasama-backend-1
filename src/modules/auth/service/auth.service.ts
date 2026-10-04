import prisma from '../../../lib/prisma';
import bcrypt from 'bcrypt';
import { signToken } from '../../../utils/jwt';
import { RegisterInput, LoginInput } from '../auth';
import { AppError } from '../../../utils/AppError';

export class AuthService {
  async register(params: RegisterInput) {
    const existing = await prisma.users.findUnique({
      where: { email: params.email.toLowerCase() },
    });
    if (existing) {
      throw new AppError('Email sudah terdaftar, silakan login', 409);
    }

    const hash = await bcrypt.hash(params.password, 10);

    const user = await prisma.users.create({
      data: {
        name: params.name,
        email: params.email.toLowerCase(),
        password_hash: hash,
        phone_number: params.phone_number || null,
        role: 'pelanggan',
      },
    });

    const token = signToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number || '',
        createdAt: user.created_at,
        nuasamaPoint: user.nuasama_point,
      },
    };
  }

  async login(params: LoginInput) {
    const user = await prisma.users.findUnique({
      where: { email: params.email.toLowerCase() },
    });
    if (!user) {
      throw new AppError('Email atau password salah', 401);
    }
    if (!user.password_hash) {
      throw new AppError('Akun ini terdaftar via Google, silakan login dengan Google', 401);
    }

    const match = await bcrypt.compare(params.password, user.password_hash);
    if (!match) {
      throw new AppError('Email atau password salah', 401);
    }

    const token = signToken(user.id, user.role);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phone_number || '',
        createdAt: user.created_at,
        nuasamaPoint: user.nuasama_point,
      },
    };
  }

  async getMe(userId: string) {
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 401);
    }
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phone_number || '',
      createdAt: user.created_at,
      nuasamaPoint: user.nuasama_point,
    };
  }
}

export const authService = new AuthService();
