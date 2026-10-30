import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';

export const verifyCard = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const card = await prisma.iDCard.findUnique({
    where: { verificationId: id },
    include: {
      member: {
        select: {
          firstName: true,
          lastName: true,
          memberNumber: true,
          position: true,
          department: true,
          photoUrl: true,
        },
      },
      organization: {
        select: {
          name: true,
          logoUrl: true,
        },
      },
    },
  });

  if (!card) throw new ApiError(404, 'Invalid ID Card. Not found in our system.');
  if (card.status === 'REVOKED') throw new ApiError(403, 'This ID card has been revoked and is no longer valid.');

  res.json({
    status: 'VALID',
    card: {
      cardNumber: card.cardNumber,
      status: card.status,
      issuedAt: card.issuedAt,
      expiresAt: card.expiresAt,
    },
    member: card.member,
    organization: card.organization,
  });
});
