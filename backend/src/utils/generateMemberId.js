import { prisma } from '../config/database.js';

export const generateMemberId = async (organizationId) => {
  // 1. Get org slug for prefix
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: { slug: true },
  });
  
  const prefix = org.slug.toUpperCase().slice(0, 6);
  const year = new Date().getFullYear();

  // 2. Count existing members for this org this year
  const count = await prisma.member.count({
    where: { organizationId },
  });

  // 3. Format: ACMEC-2025-0001
  const seq = String(count + 1).padStart(4, '0');
  return `${prefix}-${year}-${seq}`;
};
