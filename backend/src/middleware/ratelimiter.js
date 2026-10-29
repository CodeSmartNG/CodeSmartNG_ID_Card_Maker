// backend/src/middleware/rateLimiter.js
import rateLimit from 'express-rate-limit';

// 1. Auth Rate Limiter (Login/Register)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: { message: 'Too many auth attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Public Verification Rate Limiter (Scanning QR codes)
export const verifyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per minute
  message: { message: 'Too many verification requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Payment Rate Limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Too many payment attempts, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});
