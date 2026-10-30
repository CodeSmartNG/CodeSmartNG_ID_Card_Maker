import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export const app = express();
app.set('trust proxy', 1);
/* =========================================================
   1. SECURITY + OBSERVABILITY
   ========================================================= */
app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true,
  })
);
app.use(morgan('dev'));

/* =========================================================
   2. WEBHOOK — MUST BE BEFORE express.json()
   Paystack needs the RAW body to verify HMAC signature.
   If express.json() runs first, the signature check will
   ALWAYS fail (body is already parsed/transformed).
   ========================================================= */
app.use(
  '/api/payments/webhook',
  express.raw({ type: 'application/json', limit: '1mb' })
);

/* =========================================================
   3. BODY PARSERS (all other routes)
   ========================================================= */
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   4. STATIC FILES — serve uploaded member photos & card PDFs
   Without this, uploads return URLs that 404 in the browser.
   ========================================================= */
app.use('/uploads', express.static(path.resolve('./uploads')));

/* =========================================================
   5. HEALTH CHECK
   ========================================================= */
app.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now(), env: env.NODE_ENV });
});

/* =========================================================
   6. API ROUTES (mounted exactly once)
   ========================================================= */
app.use('/api', routes);

/* =========================================================
   7. FALLBACK + ERROR HANDLING (last)
   ========================================================= */
app.use(notFound);
app.use(errorHandler);
