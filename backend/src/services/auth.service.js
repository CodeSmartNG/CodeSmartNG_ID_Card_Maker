import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../config/database.js';
import { ApiError } from '../utils/ApiError.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/generateToken.js';
import { env } from '../config/env.js';

const BCRYPT_ROUNDS = 12;

/* ---------- helpers ---------- */

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const ensureUniqueSlug = async (base) => {
  let slug = base;
  let i = 1;
  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
};

// We store refresh tokens hashed so a DB leak can't be replayed
const hashToken = (token) => createHash('sha256').update(token).digest('hex');

const persistRefreshToken = async (userId, token) => {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7d
  await prisma.refreshToken.create({
    data: { userId, token: hashToken(token), expiresAt },
  });
};

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
};

const sanitizeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  organizationId: user.organizationId,
});

/* ---------- register ---------- */

export const register = async ({ name, email, password, organizationName, phone }) => {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ApiError(409, 'Email already registered');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const slug = await ensureUniqueSlug(slugify(organizationName));

  // Create org + admin in one transaction
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: { name: organizationName, slug, phone, email },
    });
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMIN',
        organizationId: org.id,
      },
    });
    return { org, user };
  });

  const tokens = await issueTokens(result.user);

  return {
    user: { ...sanitizeUser(result.user), organization: result.org },
    ...tokens,
  };
};

/* ---------- login ---------- */

export const login = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { organization: true },
  });

  // Constant-time: always run bcrypt even if user missing (prevents user enumeration)
  const hash = user?.passwordHash ?? '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalid';
  const ok = await bcrypt.compare(password, hash);
  if (!user || !ok) throw new ApiError(401, 'Invalid credentials');

  const tokens = await issueTokens(user);

  return {
    user: { ...sanitizeUser(user), organization: user.organization },
    ...tokens,
  };
};

/* ---------- refresh (rotation) ---------- */

export const refresh = async (rawToken) => {
  if (!rawToken) throw new ApiError(401, 'Refresh token required');

  let payload;
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const hashed = hashToken(rawToken);
  const stored = await prisma.refreshToken.findUnique({ where: { token: hashed } });

  if (!stored || stored.userId !== payload.sub) {
    throw new ApiError(401, 'Refresh token not recognized');
  }
  if (stored.expiresAt < new Date()) {
    await prisma.refreshToken.delete({ where: { id: stored.id } });
    throw new ApiError(401, 'Refresh token expired');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { organization: true },
  });
  if (!user) throw new ApiError(401, 'User no longer exists');

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  const tokens = await issueTokens(user);

  return {
    user: { ...sanitizeUser(user), organization: user.organization },
    ...tokens,
  };
};

/* ---------- logout (single) ---------- */

export const logout = async (rawToken) => {
  if (!rawToken) return;
  const hashed = hashToken(rawToken);
  await prisma.refreshToken.deleteMany({ where: { token: hashed } });
};

/* ---------- logout all ---------- */

export const logoutAll = async (userId) => {
  await prisma.refreshToken.deleteMany({ where: { userId } });
};

/* ---------- me ---------- */

export const me = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });
  if (!user) throw new ApiError(404, 'User not found');
  return { ...sanitizeUser(user), organization: user.organization };
};

/* ---------- periodic cleanup (call from a job) ---------- */

export const purgeExpiredTokens = async () => {
  const { count } = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return count;
};
