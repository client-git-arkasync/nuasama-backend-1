import prisma from '../../../lib/prisma';

export async function rollbackOrderItemsAndVoucher(tx: any, orderId: string) {
  const order = await tx.orders.findUnique({
    where: { id: orderId },
    include: {
      order_items: {
        include: { menu_items: true },
      },
    },
  });

  if (!order) return;

  // 1. Kembalikan stok item yang menggunakan stok
  for (const item of order.order_items) {
    if (item.menu_items && item.menu_items.use_stock) {
      await tx.menuItem.update({
        where: { id: item.menu_item_id },
        data: { stock_quantity: { increment: item.qty } },
      });
    }
  }

  // 2. Kembalikan voucher yang terpakai jika ada
  if (order.user_voucher_id) {
    await tx.user_vouchers.update({
      where: { id: order.user_voucher_id },
      data: { is_used: false, used_at: null },
    });
  }
}
