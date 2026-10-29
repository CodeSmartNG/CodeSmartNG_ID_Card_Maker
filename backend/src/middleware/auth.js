import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { env } from '../config/env.js';

/* =========================================================
   AUTH — REQUIRE VALID ACCESS TOKEN
   ========================================================= */

export const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw new ApiError(401, 'Not authenticated');

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'], // ✅ prevent alg=none / alg confusion
    });
  } catch (err) {
    // Distinguish expired vs. malformed — helps frontend decide whether to refresh
    if (err?.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Access token expired');
    }
    throw new ApiError(401, 'Invalid or expired token');
  }

  // ✅ Guard against forged / incomplete payloads
  if (!payload?.sub || !payload?.orgId || !payload?.role) {
    throw new ApiError(401, 'Malformed token payload');
  }

  req.user = {
    id: payload.sub,
    organizationId: payload.orgId,
    role: payload.role,
    email: payload.email || null,
  };

  next();
});

/* =========================================================
   AUTH — OPTIONAL (attaches user if present, never blocks)
   Use for endpoints that behave differently when logged in
   (e.g., /verify/:id showing extra info to admins).
   ========================================================= */

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ['HS256'],
    });
    if (payload?.sub && payload?.orgId && payload?.role) {
      req.user = {
        id: payload.sub,
        organizationId: payload.orgId,
        role: payload.role,
        email: payload.email || null,
      };
    }
  } catch {
    // Swallow — treat as anonymous
  }
  next();
});

/* =========================================================
   ROLE GUARD — REQUIRE AT LEAST ONE OF THE GIVEN ROLES
   ========================================================= */

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) {
    throw new ApiError(401, 'Not authenticated');
  }
  if (!roles.includes(req.user.role)) {
    throw new ApiError(403, 'Insufficient permissions');
  }
  next();
};

/* =========================================================
   ROLE SHORTCUTS  (optional — saves boilerplate at call sites)
   ========================================================= */

export const requireAdmin = requireRole('ADMIN');
export const requireStaff = requireRole('ADMIN', 'STAFF'); // staff includes admin

/* =========================================================
   TENANT GUARD — REQUIRE ORG CONTEXT
   Attaches req.tenantFilter for downstream queries.
   ========================================================= */

export const requireTenant = (req, _res, next) => {
  if (!req.user?.organizationId) {
    throw new ApiError(403, 'No organization context');
  }
  req.tenantFilter = { organizationId: req.user.organizationId };
  next();
};

/* =========================================================
   SELF-ORG GUARD — PREVENT CROSS-TENANT ID ACCESS
   Use on resources with `:orgId` param (e.g. /organizations/:orgId).
   ========================================================= */

export const requireOwnOrg = (req, _res, next) => {
  const { orgId } = req.params;
  if (!orgId || orgId !== req.user?.organizationId) {
    throw new ApiError(403, 'Forbidden — cross-organization access');
  }
  next();
};

/* =========================================================
   ROLE CHECK HELPER (for controllers needing logic branches)
   ========================================================= */

export const hasRole = (user, ...roles) => Boolean(user && roles.includes(user.role));

export const isAdmin = (user) => hasRole(user, 'ADMIN');
