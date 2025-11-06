import { verifyToken } from "../utils/jwt.js";
import { createError } from "../utils/errors.js";

const extractToken = (req) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.split(" ")[1];
  return token || null;
};

export const authenticate = (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      throw createError("No autenticado", 401);
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    const status = error.statusCode || error.status || 401;
    next(createError(error.message || "Autenticación inválida", status));
  }
};

export const optionallyAuthenticate = (req, _res, next) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    next(createError("Autenticación inválida", 401));
  }
};
