import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';
import { RavaPayClient } from '../../../lib/ravapay';

export const createOrderSchema = z.object({
  order_type: z.enum(['dine_in', 'take_away']),
  dine_in_date: z.string().optional(),
  dine_in_time: z.string().optional(),
  items: z.array(z.object({
    menu_item_id: z.string().uuid(),
    qty: z.number().int().min(1),
  })).optional(),
});

export const uploadProofSchema = z.object({});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export class OrderService {
  private static STATIC_QRIS_URL = process.env.STATIC_QRIS_URL || '';

  async createOrder(userId: string, params: CreateOrderInput) {
    // Check phone number
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user) throw new AppError('Pengguna tidak ditemukan', 404);
    if (!user.phone_number) throw new AppError('Nomor telepon wajib dilengkapi sebelum checkout', 422);

    // Validate dine-in
    if (params.order_type === 'dine_in') {
      if (!params.dine_in_date || !params.dine_in_time) {
        throw new AppError('Tanggal dan jam kedatangan wajib diisi untuk Dine In', 400);
      }
      const dineDate = new Date(params.dine_in_date);
      const today = new Date(); today.setHours(0,0,0,0);
      if (dineDate < today) throw new AppError('Tanggal kedatangan tidak valid atau sudah berlalu', 400);
    }

    // Get cart items or payload items
    let cartItems: Array<{ menu_item_id: string; qty: number; price: number; name: string }> = [];

    if (params.items && params.items.length > 0) {
      for (const reqItem of params.items) {
        const mi = await prisma.menuItem.findFirst({
          where: { id: reqItem.menu_item_id, stock_status: 'aktif' },
        });
        if (mi) cartItems.push({ menu_item_id: mi.id, qty: reqItem.qty, price: Number(mi.price), name: mi.name });
      }
    } else {
      const dbCart = await prisma.cart_items.findMany({
        where: { user_id: userId },
      });
      const menuIds = dbCart.map(ci => ci.menu_item_id);
      const activeMenus = await prisma.menuItem.findMany({
        where: { id: { in: menuIds }, stock_status: 'aktif' },
      });
      const activeMenuMap = new Map(activeMenus.map(m => [m.id, m]));
      cartItems = dbCart
        .filter(ci => activeMenuMap.has(ci.menu_item_id))
        .map(ci => {
          const mi = activeMenuMap.get(ci.menu_item_id)!;
          return {
            menu_item_id: ci.menu_item_id,
            qty: ci.qty,
            price: Number(mi.price),
            name: mi.name,
          };
        });
    }

    if (cartItems.length === 0) throw new AppError('Keranjang belanja kosong', 400);

    const total = cartItems.reduce((sum, ci) => sum + ci.price * ci.qty, 0);

    // Transaction: create order + order_items + clear cart
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          user_id: userId,
          order_type: params.order_type,
          dine_in_date: params.dine_in_date ? new Date(params.dine_in_date) : null,
          dine_in_time: params.dine_in_time || null,
          total_price: total,
          status: 'menunggu_pembayaran',
        },
      });

      await tx.order_items.createMany({
        data: cartItems.map(ci => ({
          order_id: newOrder.id,
          menu_item_id: ci.menu_item_id,
          qty: ci.qty,
          price_at_order: ci.price,
        })),
      });

      // Clear cart
      await tx.cart_items.deleteMany({ where: { user_id: userId } });

      return newOrder;
    });

    // Async: generate QRIS via RavaPay and save transaction ID
    if (process.env.RAVAPAY_API_KEY) {
      // fire and forget (don't await)
      RavaPayClient.createQRIS(total, `Order #${order.id.slice(0, 8)}`)
        .then(async (qris) => {
          await prisma.orders.update({
            where: { id: order.id },
            data: {
              ravapay_transaction_id: qris.transaction_id,
              ravapay_qr_url: qris.qr_url,
            },
          });
          console.log(`[RavaPay] QRIS dibuat untuk order ${order.id}: ${qris.transaction_id}`);
        })
        .catch(err => {
          console.error(`[RavaPay] Gagal membuat QRIS untuk order ${order.id}:`, err.message);
        });
    }

    return this.buildOrderResponse(order.id);
  }

  async getPaymentInfo(userId: string, orderId: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_id: userId },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    return {
      order_id: order.id,
      total_price: Number(order.total_price),
      qris_url: order.ravapay_qr_url || OrderService.STATIC_QRIS_URL,
      transaction_id: order.ravapay_transaction_id || '',
      status: order.status,
    };
  }

  async getOrderStatus(userId: string, orderId: string) {
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_id: userId },
      select: { id: true, status: true },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    return { id: order.id, status: order.status };
  }

  async getOrderById(userId: string, orderId: string) {
    const order = await prisma.orders.findFirst({ where: { id: orderId, user_id: userId } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);
    return this.buildOrderResponse(order.id);
  }

  async getCustomerOrders(userId: string) {
    const orders = await prisma.orders.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    const result = await Promise.all(orders.map(o => this.buildOrderResponse(o.id)));
    return { orders: result, total: result.length };
  }

  async uploadPaymentProof(userId: string, orderId: string, proofUrl: string) {
    const order = await prisma.orders.findFirst({ where: { id: orderId, user_id: userId } });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    const doneStatuses = ['diproses', 'siap', 'selesai'];
    if (doneStatuses.includes(order.status)) {
      throw new AppError('Pesanan ini sudah diverifikasi dan tidak dapat mengubah bukti pembayaran', 400);
    }

    await prisma.orders.update({
      where: { id: orderId },
      data: { payment_proof_url: proofUrl, status: 'menunggu_verifikasi' },
    });
  }

  private async buildOrderResponse(orderId: string) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        order_items: {
          include: { menu_items: { select: { name: true, photo_url: true } } },
        },
      },
    });
    if (!order) throw new AppError('Pesanan tidak ditemukan', 404);

    return {
      id: order.id,
      order_type: order.order_type,
      status: order.status,
      total_price: Number(order.total_price),
      dine_in_date: order.dine_in_date ? order.dine_in_date.toISOString().split('T')[0] : null,
      dine_in_time: order.dine_in_time,
      payment_proof_url: order.payment_proof_url || '',
      created_at: order.created_at,
      items: order.order_items.map(oi => ({
        menu_item_id: oi.menu_item_id,
        menu_name: oi.menu_items.name,
        qty: oi.qty,
        price_at_order: Number(oi.price_at_order),
        subtotal: Number(oi.price_at_order) * oi.qty,
      })),
    };
  }
}

export const orderService = new OrderService();
