import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user.id,
      orgId: user.organizationId,
      role: user.role,
      email: user.email,
    },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES }
  );

export const signRefreshToken = (user) =>
  jwt.sign(
    { sub: user.id, orgId: user.organizationId },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.JWT_REFRESH_EXPIRES }
  );

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);
