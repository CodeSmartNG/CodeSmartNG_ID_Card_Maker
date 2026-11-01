import { prisma } from '../config/database.js';

export const generateMemberId = async (organizationId) => {
  // 1. Get org slug for prefix
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });

  const prefix = (org?.slug || 'ORG').toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();
  const pattern = `${prefix}-${year}-`;

  // 2. Find the last member number created this year (max, not count!)
  const lastMember = await prisma.member.findFirst({
    where: {
      organizationId,
      memberNumber: { startsWith: pattern },
    },
    orderBy: { memberNumber: 'desc' },
    select: { memberNumber: true },
  });

  // 3. Calculate the next sequence
  let nextSeq = 1;
  if (lastMember) {
    const lastSeq = parseInt(lastMember.memberNumber.replace(pattern, ''), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  return `${pattern}${String(nextSeq).padStart(4, '0')}`;
};
