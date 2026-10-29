import rateLimit from 'express-rate-limit';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10,                  // 10 attempts per IP per window
  message: { message: 'Too many auth attempts, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const verifyRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many verification requests' },
});
