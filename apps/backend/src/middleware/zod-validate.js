import { ApiError } from '../lib/ApiError.js';
import { ZodError } from 'zod';

export const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas?.parse) {
      req.body = schemas.parse(req.body);
      return next();
    }

    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }

    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }

    if (schemas.query) {
      req.validatedQuery = schemas.query.parse(req.query);
    }
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return next(
        ApiError.badRequest(
          'Validation failed',
          err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        ),
      );
    }

    next(err);
  }
};
