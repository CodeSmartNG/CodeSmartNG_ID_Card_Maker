import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CLIENT_URL: z.string().url(),
  PAYSTACK_SECRET_KEY: z.string(),
  PAYSTACK_WEBHOOK_SECRET: z.string(),
  STORAGE_DRIVER: z.enum(['local', 's3', 'cloudinary']).default('local'),
  STORAGE_BUCKET: z.string().optional(),
  STORAGE_KEY: z.string().optional(),
  STORAGE_SECRET: z.string().optional(),
  EMAIL_HOST: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional(),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('❌ Invalid environment:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
