import { ApiError } from '../utils/ApiError.js';

/* =========================================================
   COMPOSITE VALIDATE (body + query + params)
   ========================================================= */

export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    const fieldErrors = result.error.flatten().fieldErrors;
    throw new ApiError(422, 'Validation failed', {
      fields: fieldErrors,
      issues: result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
        code: i.code,
      })),
    });
  }

  if (result.data.body !== undefined) {
    req.body = result.data.body;
  }
  if (result.data.params !== undefined) {
    req.params = result.data.params;
  }
  if (result.data.query !== undefined) {
    for (const key of Object.keys(req.query)) {
      if (!(key in result.data.query)) delete req.query[key];
    }
    Object.assign(req.query, result.data.query);
  }

  next();
};

/* =========================================================
   FOCUSED VALIDATORS
   ========================================================= */

/** Validate ONLY the body — most common case */
export const validateBody = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ApiError(422, 'Invalid request body', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  req.body = result.data;
  next();
};

/** Validate ONLY query params */
export const validateQuery = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.query);
  if (!result.success) {
    throw new ApiError(422, 'Invalid query parameters', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  for (const key of Object.keys(req.query)) {
    if (!(key in result.data)) delete req.query[key];
  }
  Object.assign(req.query, result.data);
  next();
};

/** Validate ONLY params */
export const validateParams = (schema) => (req, _res, next) => {
  const result = schema.safeParse(req.params);
  if (!result.success) {
    throw new ApiError(422, 'Invalid URL parameters', {
      fields: result.error.flatten().fieldErrors,
    });
  }
  req.params = result.data;
  next();
};
