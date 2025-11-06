import { createError } from "../utils/errors.js";

export const validateRequest = (schema) => (req, _res, next) => {
  try {
    
    const parsed = schema.parse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });
    
    req.body = parsed.body ?? req.body;
    req.params = parsed.params ?? req.params;
    req.query = parsed.query ?? req.query;
    next();
  } catch (error) {
    if (error?.errors) {
      const details = error.errors.map((err) => ({
        path: err.path.join('.'),
        message: err.message,
      }));
      return next(createError("Validación fallida", 400, details));
    }

    return next(createError("Error de validación", 400));
  }
};
