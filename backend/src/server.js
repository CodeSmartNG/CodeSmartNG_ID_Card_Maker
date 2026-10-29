// backend/src/server.js
import { app } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

const PORT = env.PORT || 10000; // Render defaults to 10000 if PORT is not set

const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  server.close(() => {
    process.exit(1);
  });
});
