import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import { generateMemberId } from '../utils/generateMemberId.js';

/* ────────────── LIST ────────────── */
export const listMembers = async ({ organizationId, page, limit, search }) => {
  const skip = (page - 1) * limit;

  const where = {
    organizationId,
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { memberNumber: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const [data, total] = await Promise.all([
    prisma.member.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.member.count({ where }),
  ]);

  return {
    data,
    meta: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

/* ────────────── GET ONE ────────────── */
export const getMember = async ({ id, organizationId }) => {
  const member = await prisma.member.findFirst({
    where: { id, organizationId },
  });
  if (!member) throw new ApiError(404, 'Member not found');
  return member;
};

/* ────────────── CREATE ────────────── */
export const createMember = async ({ data, organizationId }) => {
  // Check for duplicate email within the same org (optional)
  if (data.email) {
    const exists = await prisma.member.findFirst({
      where: { email: data.email, organizationId },
    });
    if (exists) throw new ApiError(409, 'A member with this email already exists');
  }

  // Generate the next sequential member number for this org
  const memberNumber = await generateMemberId(organizationId);

  const member = await prisma.member.create({
    data: {
      ...data,
      memberNumber,
      organizationId,
    },
  });

  return member;
};

/* ────────────── UPDATE ────────────── */
export const updateMember = async ({ id, data, organizationId }) => {
  // Ensure member exists and belongs to this org
  const existing = await prisma.member.findFirst({
    where: { id, organizationId },
  });
  if (!existing) throw new ApiError(404, 'Member not found');

  // Check email uniqueness if changed
  if (data.email && data.email !== existing.email) {
    const emailTaken = await prisma.member.findFirst({
      where: { email: data.email, organizationId, id: { not: id } },
    });
    if (emailTaken) throw new ApiError(409, 'Email already in use by another member');
  }

  return prisma.member.update({
    where: { id },
    data,
  });
};

/* ────────────── DELETE ────────────── */
export const deleteMember = async ({ id, organizationId }) => {
  const existing = await prisma.member.findFirst({
    where: { id, organizationId },
  });
  if (!existing) throw new ApiError(404, 'Member not found');

  // Note: Cascade deletes on IDCard will handle any attached cards
  await prisma.member.delete({ where: { id } });
};

/* ────────────── UPLOAD PHOTO ────────────── */
export const updateMemberPhoto = async ({ id, organizationId, photoUrl }) => {
  const existing = await prisma.member.findFirst({
    where: { id, organizationId },
  });
  if (!existing) throw new ApiError(404, 'Member not found');

  return prisma.member.update({
    where: { id },
    data: { photoUrl },
  });
};
