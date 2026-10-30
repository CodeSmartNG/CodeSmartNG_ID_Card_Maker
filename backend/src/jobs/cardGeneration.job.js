import { logger } from '../config/logger.js';

// Stub version - no Redis or BullMQ required for testing
export const enqueueCardGeneration = async (cardId) => {
  logger.info({ cardId }, '✅ [STUB] Card generation enqueued (PDF generation disabled for now)');
  return { id: `card:${cardId}` };
};

export const startCardGenerationWorker = () => {
  logger.info('✅ [STUB] Card generation worker started (Redis not required)');
};
