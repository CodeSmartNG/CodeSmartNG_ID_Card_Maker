import axios from 'axios';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const client = axios.create({
  baseURL: 'https://api.paystack.co',
  timeout: 15_000,
  headers: {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

/* ---------- initialize ---------- */
const initialize = async ({ email, amount, reference, callback_url, metadata }) => {
  try {
    const { data } = await client.post('/transaction/initialize', {
      email,
      amount, // kobo
      reference,
      callback_url,
      metadata,
      channels: ['card', 'bank', 'ussd', 'bank_transfer'],
    });

    if (!data.status) {
      throw new ApiError(502, data.message || 'Paystack initialize failed');
    }
    return data.data;
  } catch (err) {
    const message =
      err.response?.data?.message || err.message || 'Paystack initialization failed';
    throw new ApiError(502, message);
  }
};

/* ---------- verify ---------- */
const verify = async (reference) => {
  try {
    const { data } = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);
    if (!data.status) {
      throw new ApiError(502, data.message || 'Paystack verify failed');
    }
    return data.data; // { status, amount, currency, reference, paid_at, ... }
  } catch (err) {
    const message = err.response?.data?.message || err.message || 'Paystack verify failed';
    throw new ApiError(502, message);
  }
};

/* ---------- refund (admin action) ---------- */
const refund = async ({ reference, amount }) => {
  const { data } = await client.post('/refund', {
    transaction: reference,
    ...(amount && { amount }),
  });
  if (!data.status) throw new ApiError(502, data.message || 'Refund failed');
  return data.data;
};

export const paystackService = { initialize, verify, refund };
