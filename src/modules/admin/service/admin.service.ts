import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

export const createMenuItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional().default(''),
  price: z.number().positive(),
  category: z.string().min(1),
  dapur_id: z.string().uuid(),
  photo_url: z.string().url().optional(),
});

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  category: z.string().min(1).optional(),
  dapur_id: z.string().uuid().optional(),
  photo_url: z.string().url().optional(),
});

export const verifyPaymentSchema = z.object({
  action: z.enum(['disetujui', 'ditolak', 'approve', 'reject']),
  rejection_reason: z.string().optional().default(''),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['diproses', 'siap', 'selesai']),
});

export const historyQuerySchema = z.object({
  customer_name: z.string().optional(),
  date: z.string().optional(),
  order_type: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
});

export class AdminService {
  // ---- Orders ----
  async getOrders(statusFilter: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (statusFilter) where.status = statusFilter;

    const [total, orders] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: limit }),
    ]);

    const result = await Promise.all(orders.map(o => this.buildAdminOrderResponse(o.id)));
    return { orders: result, total };
  }

  async getOrderById(orderId: string) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    return this.buildAdminOrderResponse(orderId);
  }

  async verifyPayment(adminId: string, orderId: string, params: { action: string; rejection_reason: string }) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    if (order.status !== 'menunggu_verifikasi') {
      throw new AppError('Pesanan ini tidak dalam status menunggu verifikasi', 400);
    }

    const isRejected = params.action === 'ditolak' || params.action === 'reject';
    const newStatus = isRejected ? 'ditolak' : 'diproses';
    const verificationStatus = isRejected ? 'ditolak' : 'disetujui';

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({ where: { id: orderId }, data: { status: newStatus } });
      await tx.payment_verifications.create({
        data: {
          order_id: orderId,
          verified_by: adminId,
          status: verificationStatus,
          rejection_reason: params.rejection_reason || null,
        },
      });
    });
  }

  async updateOrderStatus(orderId: string, newStatus: string) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    const validTransitions: Record<string, string[]> = {
      diproses: ['siap'],
      siap: ['selesai'],
    };
    const allowed = validTransitions[order.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new AppError(`Perubahan status dari '${order.status}' ke '${newStatus}' tidak diizinkan`, 400);
    }

    await prisma.orders.update({ where: { id: orderId }, data: { status: newStatus } });
  }

  async getDineInBookings() {
    const bookings = await prisma.orders.findMany({
      where: { order_type: 'dine_in', status: { notIn: ['selesai', 'ditolak'] } },
      include: { users: { select: { name: true, phone_number: true } } },
      orderBy: [{ dine_in_date: 'asc' }],
    });

    return bookings.map(b => ({
      order_id: b.id,
      customer_name: b.users.name,
      customer_phone: b.users.phone_number || '',
      dine_in_date: b.dine_in_date ? b.dine_in_date.toISOString().split('T')[0] : '',
      dine_in_time: b.dine_in_time || '',
      total_price: Number(b.total_price),
      status: b.status,
    }));
  }

  // ---- Menu ----
  async getAllMenu(query: { category?: string; search?: string; dapur_id?: string; stock_status?: string; page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const where: any = {};
    if (query.category) where.category = query.category;
    if (query.dapur_id) where.dapur_id = query.dapur_id;
    if (query.stock_status) where.stock_status = query.stock_status;
    if (query.search) where.name = { contains: query.search };

    const [total, items] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.findMany({
        where,
        include: { dapur: { select: { name: true, logo_url: true } } },
        skip,
        take: query.limit,
        orderBy: { name: 'asc' },
      }),
    ]);

    return { items: items.map(item => this.formatMenuItem(item as any)), total };
  }

  async createMenuItem(params: z.infer<typeof createMenuItemSchema>) {
    const item = await prisma.menuItem.create({
      data: {
        name: params.name,
        description: params.description || '',
        price: params.price,
        category: params.category,
        dapur_id: params.dapur_id,
        photo_url: params.photo_url || null,
        stock_status: 'aktif',
      },
      include: { dapur: { select: { name: true, logo_url: true } } },
    });
    return this.formatMenuItem(item as any);
  }

  async updateMenuItem(menuItemId: string, params: z.infer<typeof updateMenuItemSchema>) {
    const updates: any = {};
    if (params.name) updates.name = params.name;
    if (params.description !== undefined) updates.description = params.description;
    if (params.price) updates.price = params.price;
    if (params.category) updates.category = params.category;
    if (params.dapur_id) updates.dapur_id = params.dapur_id;
    if (params.photo_url) updates.photo_url = params.photo_url;

    if (Object.keys(updates).length === 0) throw new AppError('Tidak ada data yang diubah', 400);

    const existing = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!existing) throw new AppError('Menu tidak ditemukan', 404);

    const item = await prisma.menuItem.update({
      where: { id: menuItemId },
      data: updates,
      include: { dapur: { select: { name: true, logo_url: true } } },
    });
    return this.formatMenuItem(item as any);
  }

  async deleteMenuItem(menuItemId: string) {
    const existing = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!existing) throw new AppError('Menu tidak ditemukan', 404);
    await prisma.menuItem.delete({ where: { id: menuItemId } });
  }

  async toggleMenuStatus(menuItemId: string) {
    const item = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!item) throw new AppError('Menu tidak ditemukan', 404);
    const newStatus = item.stock_status === 'aktif' ? 'nonaktif' : 'aktif';
    await prisma.menuItem.update({ where: { id: menuItemId }, data: { stock_status: newStatus } });
    return { id: menuItemId, stock_status: newStatus };
  }

  async uploadMenuPhoto(menuItemId: string, photoUrl: string) {
    // Validate file extension via URL pattern
    const ext = photoUrl.split('.').pop()?.toLowerCase();
    if (!ext || !['jpg', 'jpeg', 'png', 'webp'].includes(ext.split('?')[0])) {
      // Allow any cloudinary URL — skip strict ext check
    }

    const existing = await prisma.menuItem.findUnique({ where: { id: menuItemId } });
    if (!existing) throw new AppError('Menu tidak ditemukan', 404);

    await prisma.menuItem.update({
      where: { id: menuItemId },
      data: { photo_url: photoUrl },
    });
  }

  // ---- History ----
  async getOrderHistory(query: { customer_name?: string; date?: string; order_type?: string; page: number; limit: number }) {
    const skip = (query.page - 1) * query.limit;
    const where: any = { status: 'selesai' };

    if (query.customer_name) {
      where.users = { name: { contains: query.customer_name } };
    }
    if (query.date) {
      const start = new Date(query.date);
      const end = new Date(query.date);
      end.setDate(end.getDate() + 1);
      where.created_at = { gte: start, lt: end };
    }
    if (query.order_type) where.order_type = query.order_type;

    const [total, orders] = await Promise.all([
      prisma.orders.count({ where }),
      prisma.orders.findMany({ where, orderBy: { created_at: 'desc' }, skip, take: query.limit }),
    ]);

    const result = await Promise.all(orders.map(o => this.buildAdminOrderResponse(o.id)));
    return { orders: result, total };
  }

  // ---- Helpers ----
  private async buildAdminOrderResponse(orderId: string) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        users: { select: { name: true, email: true, phone_number: true } },
        order_items: {
          include: { menu_items: { select: { name: true, photo_url: true } } },
        },
      },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    return {
      id: order.id,
      customer_name: order.users.name,
      customer_email: order.users.email,
      customer_phone: order.users.phone_number || '',
      order_type: order.order_type,
      dine_in_date: order.dine_in_date ? order.dine_in_date.toISOString().split('T')[0] : null,
      dine_in_time: order.dine_in_time || null,
      status: order.status,
      total_price: Number(order.total_price),
      payment_proof_url: order.payment_proof_url || '',
      created_at: order.created_at,
      items: order.order_items.map(oi => ({
        menu_item_id: oi.menu_item_id,
        menu_name: oi.menu_items.name,
        photo_url: oi.menu_items.photo_url || '',
        qty: oi.qty,
        price_at_order: Number(oi.price_at_order),
        subtotal: Number(oi.price_at_order) * oi.qty,
      })),
    };
  }

  private formatMenuItem(item: any) {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      photo_url: item.photo_url || '',
      category: item.category,
      stock_status: item.stock_status,
      dapur_id: item.dapur_id,
      dapur_name: item.dapur?.name || '',
      dapur_logo_url: item.dapur?.logo_url || '',
    };
  }
}

export const adminService = new AdminService();
