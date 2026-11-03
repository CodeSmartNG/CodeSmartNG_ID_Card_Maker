import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';

export const getStaff = async (organizationId) => {
  return prisma.user.findMany({
    where: { organizationId },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const createStaff = async ({ name, email, password, role, organizationId }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'A user with this email already exists');

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role, // 'ADMIN' or 'STAFF'
      organizationId,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return user;
};

export const deleteStaff = async ({ id, organizationId, currentUserId }) => {
  if (id === currentUserId) {
    throw new ApiError(400, 'You cannot delete your own account');
  }

  const user = await prisma.user.findFirst({
    where: { id, organizationId },
  });
  if (!user) throw new ApiError(404, 'Staff member not found');
  
  if (user.role === 'ADMIN') {
    // Optional: Prevent deleting the last admin
    const adminCount = await prisma.user.count({
      where: { organizationId, role: 'ADMIN' },
    });
    if (adminCount <= 1) throw new ApiError(400, 'Cannot delete the only Admin account');
  }

  await prisma.user.delete({ where: { id } });
  return { success: true };
};
