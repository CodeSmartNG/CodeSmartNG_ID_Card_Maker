import { ApiError } from '../utils/ApiError.js';
import { logger } from '../config/logger.js';

export const errorHandler = (err, req, res, next) => {
  // If it's one of our known API errors (like 404, 401)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // If it's a Prisma known error (like unique constraint violation)
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: 'A record with this value already exists.',
    });
  }

  // Log unhandled errors
  logger.error({ err }, 'Unhandled error');

  res.status(500).json({ message: 'Internal server error' });
};

export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};
