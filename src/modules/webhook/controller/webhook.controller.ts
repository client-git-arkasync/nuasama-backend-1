import { Request, Response, NextFunction } from 'express';
import prisma from '../../../lib/prisma';
import crypto from 'crypto';

export class WebhookController {
  async handleRavaPay(req: Request, res: Response, next: NextFunction) {
    try {
      // Verifikasi HMAC-SHA256 signature jika WEBHOOK_SECRET dikonfigurasi
      const webhookSecret = process.env.RAVAPAY_WEBHOOK_SECRET;
      if (webhookSecret) {
        const signature = req.headers['x-ravapay-signature'] as string;
        if (signature) {
          const rawBody = (req as any).rawBody || JSON.stringify(req.body);
          const expected = crypto
            .createHmac('sha256', webhookSecret)
            .update(rawBody)
            .digest('hex');
          const sigBuf = Buffer.from(signature, 'hex');
          const expBuf = Buffer.from(expected, 'hex');
          if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            console.warn('[Webhook] Invalid signature — request rejected');
            res.status(401).json({ error: 'Invalid signature' });
            return;
          }
        }
      }

      console.log('[Webhook] Received RavaPay webhook:', JSON.stringify(req.body));

      // RavaPay payload format: { event: "payment.success", data: { transaction_id, status, ... } }
      // Also supports flat format as fallback: { transaction_id, status }
      let transaction_id: string;
      let eventStatus: string;

      if (req.body.event && req.body.data) {
        transaction_id = req.body.data.transaction_id;
        eventStatus = req.body.data.status || req.body.event;
      } else {
        transaction_id = req.body.transaction_id;
        eventStatus = req.body.status;
      }

      if (!transaction_id) {
        res.status(400).json({ error: 'Missing transaction_id in payload' });
        return;
      }

      // Cari pesanan berdasarkan transaction_id
      const order = await prisma.orders.findFirst({
        where: { ravapay_transaction_id: transaction_id },
      });

      if (!order) {
        console.warn(`[Webhook] Order with transaction_id ${transaction_id} not found.`);
        // Return 200 agar RavaPay tidak retry terus
        res.status(200).json({ message: 'Order not found, ignored' });
        return;
      }

      // Tentukan status berdasarkan event/status
      const isSuccess = eventStatus === 'success' || eventStatus === 'paid' || req.body.event === 'payment.success';
      const isFailed = ['expired', 'failed', 'cancel'].includes(eventStatus)
        || req.body.event === 'payment.expired' || req.body.event === 'payment.cancel';

      if (isSuccess) {
        const points = Math.floor(Number(order.total_price) / 10000);
        await prisma.$transaction(async (tx) => {
          await tx.orders.update({
            where: { id: order.id },
            data: { status: 'diproses' },
          });
          if (points > 0) {
            await tx.users.update({
              where: { id: order.user_id },
              data: { nuasama_point: { increment: points } },
            });
          }
        });
        console.log(`[Webhook] ✅ Order ${order.id} marked as diproses (payment success). Awarded ${points} points.`);
      } else if (isFailed) {
        await prisma.orders.update({
          where: { id: order.id },
          data: { status: 'ditolak' },
        });
        console.log(`[Webhook] ❌ Order ${order.id} marked as ditolak (${eventStatus})`);
      } else {
        console.log(`[Webhook] ℹ️ Unhandled event/status: ${req.body.event} / ${eventStatus}`);
      }

      res.status(200).json({ message: 'Webhook processed successfully' });
    } catch (err) {
      console.error('[Webhook] Error handling RavaPay webhook:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export const webhookController = new WebhookController();
