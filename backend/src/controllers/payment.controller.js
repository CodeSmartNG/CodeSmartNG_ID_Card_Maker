import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { paystackService } from '../services/paystackService.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const initializePayment = asyncHandler(async (req, res) => {
  const { cardId } = req.body;
  const card = await prisma.iDCard.findFirst({
    where: { id: cardId, organizationId: req.user.organizationId },
    include: { member: true },
  });
  if (!card) throw new ApiError(404, 'Card not found');
  if (card.status === 'PAID' || card.status === 'GENERATED') {
    throw new ApiError(400, 'Card already paid');
  }

  const reference = `CSNG-${card.id.slice(-8)}-${Date.now()}`;
  const amount = 250000; // ₦2,500 in kobo

  await prisma.payment.create({
    data: {
      reference,
      amount,
      cardId: card.id,
      organizationId: req.user.organizationId,
    },
  });

  const init = await paystackService.initialize({
    email: req.user.email,
    amount,
    reference,
    callback_url: `${env.CLIENT_URL}/payment/success?ref=${reference}`,
    metadata: { cardId: card.id },
  });

  res.json({ authorizationUrl: init.authorization_url, reference });
});

export const paystackWebhook = asyncHandler(async (req, res) => {
  const hash = crypto
    .createHmac('sha512', env.PAYSTACK_SECRET_KEY)
    .update(req.body)
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    return res.status(401).send('Invalid signature');
  }

  const event = JSON.parse(req.body.toString());
  if (event.event === 'charge.success') {
    const { reference } = event.data;
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (payment && payment.status !== 'SUCCESS') {
      await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: { status: 'SUCCESS', paidAt: new Date() },
        }),
        prisma.iDCard.update({
          where: { id: payment.cardId },
          data: { status: 'PAID' },
        }),
      ]);
      // Enqueue card generation job here
    }
  }

  res.sendStatus(200);
});
