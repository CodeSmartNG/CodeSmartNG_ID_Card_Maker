// app.js — ORDER IS CRITICAL
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import routes from './routes/index.js';

export const app = express();

// 1. Security + observability
app.use(helmet());
app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
app.use(morgan('dev'));

// 2. Webhook MUST be registered BEFORE express.json()
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  (req, res, next) => {
    // attach controller here — bypassing router so we control body parsing
    import('./controllers/payment.controller.js')
      .then(({ paystackWebhook }) => paystackWebhook(req, res))
      .catch(next);
  }
);

// 3. Global parsers for everything else
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// 4. Routes (webhook NOT included here — already handled above)
app.get('/health', (_, res) => res.json({ ok: true, ts: Date.now() }));
app.use('/api', routes);

app.use(notFound);
app.use(errorHandler);
