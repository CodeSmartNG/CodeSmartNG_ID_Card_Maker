import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { prisma } from '../config/database.js';
// import { generateCardPreview } from '../services/cardGenerator.js'; // 👈 Commented out
import { randomBytes } from 'crypto';

/* ────────────── CREATE DRAFT ────────────── */
export const createCard = asyncHandler(async (req, res) => {
  const { memberId, template } = req.body;
  const organizationId = req.user.organizationId;

  if (!memberId) throw new ApiError(400, 'Member ID is required');

  // Verify member exists and belongs to this org
  const member = await prisma.member.findFirst({
    where: { id: memberId, organizationId },
  });
  if (!member) throw new ApiError(404, 'Member not found');

  // If org template changed, update it
  if (template) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: { template },
    });
  }

  // Create a DRAFT card
  const cardNumber = `CRD-${new Date().getFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;
  const verificationId = randomBytes(16).toString('hex');

  const card = await prisma.iDCard.create({
  data: {
    cardNumber,
    verificationId,
    status: 'DRAFT',
    memberId,
    organizationId,
    // 👇 ADD THIS LINE
    expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 2)),
  },
  include: { member: true },
});

/* ────────────── PREVIEW PDF ────────────── */
export const previewCard = asyncHandler(async (req, res) => {
  // Since we are using pdf-lib now, we don't have a live HTML preview.
  // We will just return a success message to prevent the server from crashing.
  res.json({ 
    message: 'Preview is not supported with pdf-lib. The PDF will be generated upon payment.' 
  });
});
