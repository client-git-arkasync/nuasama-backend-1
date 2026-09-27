import axios from 'axios';
import { AppError } from '../utils/AppError';

const RAVA_PAY_BASE_URL = 'https://api.ravapay.site';
const API_KEY = process.env.RAVAPAY_API_KEY || '';
const PROVIDER = process.env.RAVAPAY_PROVIDER || 'sandbox';

export interface RavaPayQRISResponse {
  provider: string;
  transaction_id: string;
  amount: number;
  status: string;
  qr_string: string;
  qr_url: string;
  created_at: string;
  expired_at: string;
}

export interface RavaPayStatusResponse {
  provider: string;
  transaction_id: string;
  amount: number;
  status: string; // pending | success | expired | cancel
  payment_reference: string | null;
  created_at: string;
  expired_at: string;
}

export class RavaPayClient {
  static async createQRIS(amount: number, description: string): Promise<RavaPayQRISResponse> {
    if (!API_KEY) {
      throw new Error('RavaPay API key is not configured');
    }

    try {
      const res = await axios.post(
        `${RAVA_PAY_BASE_URL}/create`,
        {
          provider: PROVIDER,
          amount: Math.round(amount),
          description,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': API_KEY,
          },
          timeout: 15000,
        }
      );

      const { success, data, message } = res.data;
      if (!success) {
        throw new Error(message || 'Failed to create QRIS');
      }

      return data as RavaPayQRISResponse;
    } catch (err: any) {
      console.error('[RavaPay] Failed to create QRIS:', err.response?.data || err.message);
      throw err;
    }
  }

  static async getTransactionStatus(transactionId: string): Promise<RavaPayStatusResponse> {
    if (!API_KEY) {
      throw new Error('RavaPay API key is not configured');
    }

    try {
      const res = await axios.get(`${RAVA_PAY_BASE_URL}/transactions/${transactionId}`, {
        headers: {
          'x-api-key': API_KEY,
        },
        timeout: 15000,
      });

      const { success, data, message } = res.data;
      if (!success) {
        throw new Error(message || 'Failed to get transaction status');
      }

      return data as RavaPayStatusResponse;
    } catch (err: any) {
      console.error('[RavaPay] Failed to get transaction status:', err.response?.data || err.message);
      throw err;
    }
  }
}
