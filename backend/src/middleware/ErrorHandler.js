import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }
  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ message: 'Internal server error' });
};

export const notFound = (req, res) =>
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
