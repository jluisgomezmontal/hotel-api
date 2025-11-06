import { AppError } from "../utils/errors.js";

export const errorHandler = (err, _req, res, _next) => {
  const isOperational = err instanceof AppError;
  const statusCode = err.statusCode || 500;
  const message = err.message || "Error interno del servidor";

  if (!isOperational) {
    console.error("Unexpected error:", err);
  }

  res.status(statusCode).json({
    message,
    ...(err.details ? { details: err.details } : {}),
  });
};
