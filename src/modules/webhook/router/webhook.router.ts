import { Router } from 'express';
import { webhookController } from '../controller/webhook.controller';

export const webhookRouter = Router();

// Endpoint for RavaPay webhook
webhookRouter.post('/ravapay', webhookController.handleRavaPay.bind(webhookController));
