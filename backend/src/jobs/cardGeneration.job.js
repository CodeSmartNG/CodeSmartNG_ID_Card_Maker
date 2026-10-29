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
    where: { id: cardId },
    include: { member: true, organization: true },
  });

  if (!card) throw new Error(`Card ${cardId} not found`);
  if (card.status === 'GENERATED') {
    logger.info({ cardId }, 'Card already generated, skipping');
    return;
  }

  // Render PDF
  const { buffer } = await generateCardPdf({
    card,
    member: card.member,
    organization: card.organization,
    templateName: card.organization.template || 'classic',
  });

  // Upload
  const pdfUrl = await uploadCardPdf(buffer, card.id);

  // Persist
  await prisma.iDCard.update({
    where: { id: card.id },
    data: {
      status: 'GENERATED',
      pdfUrl,
      issuedAt: card.issuedAt || new Date(),
      expiresAt:
        card.expiresAt ||
        new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
    },
  });

  logger.info({ cardId, pdfUrl }, 'Card generated');

  // Email member (optional — only if member.email exists)
  if (card.member.email) {
    await emailService
      .sendCardReady({
        to: card.member.email,
        memberName: `${card.member.firstName} ${card.member.lastName}`,
        organizationName: card.organization.name,
        cardNumber: card.cardNumber,
        downloadUrl: pdfUrl,
      })
      .catch((e) => logger.warn({ err: e }, 'Email send failed'));
  }

  return { pdfUrl };
};

export const startCardGenerationWorker = () => {
  const worker = new Worker('card-generation', processor, {
    connection: redisConnection,
    concurrency: 2, // Puppeteer is memory-heavy
  });

  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'Job completed'));
  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'Job failed'));

  logger.info('Card generation worker started');
  return worker;
};

/* ---------- helper used by payment controller ---------- */
import { cardGenerationQueue } from '../queue/index.js';

export const enqueueCardGeneration = async (cardId) => {
  await cardGenerationQueue.add('generate', { cardId }, { jobId: `card:${cardId}` });
};
