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
  // 1. Check for duplicate email within the same org
  if (data.email) {
    const exists = await prisma.member.findFirst({
      where: { email: data.email, organizationId },
    });
    if (exists) throw new ApiError(409, 'A member with this email already exists');
  }

  // 2. Retry up to 3 times if member number collision occurs
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const memberNumber = await generateMemberId(organizationId);

      const member = await prisma.member.create({
        data: {
          ...data,
          memberNumber,
          organizationId,
        },
      });

      return member;
    } catch (err) {
      // P2002 = unique constraint violation (member number already exists)
      if (err.code === 'P2002') {
        lastError = err;
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      throw err;
    }
  }

  throw new ApiError(500, 'Failed to generate a unique member ID. Please try again.');
};

/* ────────────── BULK CREATE (CSV Import) ────────────── */
export const bulkCreateMembers = async ({ data, organizationId }) => {
  // 1. Get org prefix for member numbers
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });

  const prefix = (org?.slug || 'ORG').toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  // 2. Find the highest existing member number this year so we know where to start
  const lastMember = await prisma.member.findFirst({
    where: { organizationId, memberNumber: { startsWith: pattern } },
    orderBy: { memberNumber: 'desc' },
    select: { memberNumber: true },
  });

  let nextSeq = 1;
  if (lastMember) {
    const lastSeq = parseInt(lastMember.memberNumber.replace(pattern, ''), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  // 3. Prepare the data
  const membersToCreate = [];
  const errors = [];

  for (const row of data) {
    if (!row.firstName || !row.lastName) {
      errors.push(`Skipped: Missing name for row starting with ${row.email || 'unknown email'}`);
      continue;
    }

    const memberNumber = `${pattern}${String(nextSeq).padStart(4, '0')}`;
    nextSeq++;

    membersToCreate.push({
      firstName: row.firstName.trim(),
      lastName: row.lastName.trim(),
      email: row.email?.trim() || null, // Convert empty strings to null
      phone: row.phone?.trim() || null,
      position: row.position?.trim() || null,
      department: row.department?.trim() || null,
      address: row.address?.trim() || null,
      tin: row.tin?.trim() || null,
      nin: row.nin?.trim() || null,
      memberNumber,
      organizationId,
    });
  }

  // 4. Insert all members at once
  let successCount = 0;
  if (membersToCreate.length > 0) {
    try {
      // skipDuplicates prevents errors if the exact same memberNumber is somehow generated
      const result = await prisma.member.createMany({
        data: membersToCreate,
        skipDuplicates: true, 
      });
      successCount = result.count;
    } catch (err) {
      console.error('Bulk Insert Error:', err);
      throw new ApiError(500, 'Failed to insert members into the database.');
    }
  }

  return { 
    successCount, 
    skippedCount: data.length - successCount,
    errors 
  };
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
