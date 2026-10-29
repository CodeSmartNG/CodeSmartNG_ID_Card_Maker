import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated');

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    req.user = {
      id: payload.sub,
      organizationId: payload.orgId,
      role: payload.role,
    };
    next();
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
});

export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  next();
};
