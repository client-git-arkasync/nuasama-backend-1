import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  // SERVER
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // DATABASE
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // REDIS
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),

  // JWT
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY is required'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY is required'),
  JWT_EXPIRES_IN: z.string().default('90d'),

  // GOOGLE OAUTH
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URL: z.string().optional(),

  // STORAGE
  STORAGE_PROVIDER: z.string().default('cloudinary'),
  CLOUDINARY_URL: z.string().optional(),
  STORAGE_BASE_URL: z.string().optional(),
  STORAGE_PATH: z.string().default('./uploads'),

  // SMTP
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().optional(),

  // RATE LIMITER
  RATE_LIMIT_REQUESTS: z.string().default('10'),
  RATE_LIMIT_WINDOW: z.string().default('1m'),

  // CORS
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),

  // RAVAPAY
  RAVAPAY_API_KEY: z.string().optional(),
  RAVAPAY_PROVIDER: z.string().default('sandbox'),
  RAVAPAY_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
