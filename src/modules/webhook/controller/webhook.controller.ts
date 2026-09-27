import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';

export class WebhookController {
  async handleRavaPay(req: Request, res: Response, next: NextFunction) {
    try {
      // Dalam implementasi nyata, sangat disarankan untuk memverifikasi signature webhook
      // const signature = req.headers['x-callback-token'];

      console.log('[Webhook] Received RavaPay webhook:', req.body);
      const { transaction_id, status } = req.body;

      if (!transaction_id || !status) {
        res.status(400).json({ error: 'Invalid payload' });
        return;
      }

      // Cari pesanan berdasarkan transaction_id
      const order = await prisma.orders.findFirst({
        where: { ravapay_transaction_id: transaction_id },
      });

      if (!order) {
        console.warn(`[Webhook] Order with transaction_id ${transaction_id} not found.`);
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      // Update status pesanan
      if (status === 'success' || status === 'paid') {
        await prisma.orders.update({
          where: { id: order.id },
          data: { status: 'diproses' },
        });
        console.log(`[Webhook] Order ${order.id} marked as diproses`);
      } else if (status === 'expired' || status === 'failed' || status === 'cancel') {
        await prisma.orders.update({
          where: { id: order.id },
          data: { status: 'ditolak' },
        });
        console.log(`[Webhook] Order ${order.id} marked as ditolak`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (err) {
      console.error('[Webhook] Error handling RavaPay webhook:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const webhookController = new WebhookController();
