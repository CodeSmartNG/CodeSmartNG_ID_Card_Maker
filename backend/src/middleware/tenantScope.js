import { ApiError } from '../utils/ApiError.js';

export const tenantScope = (req, res, next) => {
  if (!req.user?.organizationId) {
    throw new ApiError(403, 'No organization context');
  }
  req.tenantFilter = { organizationId: req.user.organizationId };
  next();
};
