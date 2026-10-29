import { Worker } from 'bullmq';
import { redisConnection } from '../queue/index.js';
import { prisma } from '../config/database.js';
import { generateCardPdf } from '../services/cardGenerator.js';
import { uploadCardPdf } from '../services/storageService.js';
import { emailService } from '../services/emailService.js';
import { logger } from '../config/logger.js';

const processor = async (job) => {
  const { cardId } = job.data;
  logger.info({ cardId, attempt: job.attemptsMade + 1 }, 'Generating card');

  const card = await prisma.iDCard.findUnique({
    where: { id: cardId
