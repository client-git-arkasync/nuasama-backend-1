import prisma from '../../../lib/prisma';
import { AppError } from '../../../utils/AppError';
import { z } from 'zod';

export const addCartItemSchema = z.object({
  menu_item_id: z.string().uuid('ID menu tidak valid'),
  qty: z.number().int().min(1).default(1),
});

export const updateCartItemSchema = z.object({
  qty: z.number().int().min(1),
});

export class CartService {
  async getCart(userId: string) {
    const items = await prisma.cart_items.findMany({
      where: { user_id: userId },
      include: {
        menu_items: {
          include: { dapur: { select: { name: true } } },
        },
      },
      orderBy: { created_at: 'asc' },
    });

    let totalPrice = 0;
    const formatted = items
      .filter(ci => ci.menu_items.stock_status === 'aktif')
      .map(ci => {
        const price = Number(ci.menu_items.price);
        const subtotal = price * ci.qty;
        totalPrice += subtotal;
        return {
          id: ci.id,
          menu_item_id: ci.menu_item_id,
          menu_name: ci.menu_items.name,
          menu_price: price,
          photo_url: ci.menu_items.photo_url || '',
          outlet_name: ci.menu_items.dapur?.name || '',
          qty: ci.qty,
          subtotal,
        };
      });

    return { items: formatted, total_price: totalPrice };
  }

  async addItem(userId: string, params: { menu_item_id: string; qty: number }) {
    const menuItem = await prisma.menuItem.findFirst({
      where: { id: params.menu_item_id, stock_status: 'aktif' },
    });
    if (!menuItem) throw new AppError('Menu tidak ditemukan atau tidak aktif', 404);

    const cartItems = await prisma.cart_items.findMany({
      where: { user_id: userId },
      include: { menu_items: true }
    });

    if (cartItems.length > 0) {
      const firstItemType = cartItems[0].menu_items.product_type;
      const isFirstAksesori = firstItemType === 'aksesori' || firstItemType === 'aksesoris';
      const isNewAksesori = menuItem.product_type === 'aksesori' || menuItem.product_type === 'aksesoris';
      
      if (isFirstAksesori !== isNewAksesori) {
        const type1 = isFirstAksesori ? 'Aksesoris' : 'F&B';
        const type2 = isNewAksesori ? 'Aksesoris' : 'F&B';
        throw new AppError(`Tidak bisa mencampur ${type1} dan ${type2} dalam satu pesanan. Selesaikan satu jenis pesanan terlebih dahulu.`, 400);
      }
    }

    const existing = cartItems.find(item => item.menu_item_id === params.menu_item_id);

    if (existing) {
      await prisma.cart_items.update({
        where: { id: existing.id },
        data: { qty: existing.qty + params.qty },
      });
    } else {
      await prisma.cart_items.create({
        data: { user_id: userId, menu_item_id: params.menu_item_id, qty: params.qty },
      });
    }
  }

  async updateItem(userId: string, cartItemId: string, qty: number) {
    const item = await prisma.cart_items.findFirst({
      where: { id: cartItemId, user_id: userId },
    });
    if (!item) throw new AppError('Item keranjang tidak ditemukan', 404);

    await prisma.cart_items.update({ where: { id: cartItemId }, data: { qty } });
  }

  async removeItem(userId: string, cartItemId: string) {
    const item = await prisma.cart_items.findFirst({
      where: { id: cartItemId, user_id: userId },
    });
    if (!item) throw new AppError('Item keranjang tidak ditemukan', 404);

    await prisma.cart_items.delete({ where: { id: cartItemId } });
  }

  async clearCart(userId: string) {
    await prisma.cart_items.deleteMany({ where: { user_id: userId } });
  }
}

export const cartService = new CartService();
