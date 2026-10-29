import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request against a Zod schema.
 * - Replaces req.body / req.params with PARSED values (coercion + stripping apply).
 * - Patches req.query via Object.assign (Express 4 forbids reassignment).
 * - Throws 422 via errorHandler — no inline res, keeps responses consistent.
 */
export const validate = (schema) => (req, _res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    // Surface flat field errors + original issues for debugging
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

  // ✅ Replace — Zod strips unknown keys, so this also sanitizes input
  if (result.data.body !== undefined) {
    req.body = result.data.body;
  }
  if (result.data.params !== undefined) {
    req.params = result.data.params;
  }

  // ✅ Express 4: req.query is a getter — reassignment is silently ignored.
  //    Must mutate in place.
  if (result.data.query !== undefined) {
    // Clear out any keys not present in the parsed result (defense-in-depth)
    for (const key of Object.keys(req.query)) {
      if (!(key in result.data.query)) delete req.query[key];
    }
    Object.assign(req.query, result.data.query);
  }

  next();
};
