import bcrypt from "bcryptjs";

import User from "../models/User.js";
import { createError } from "../utils/errors.js";
import { signToken } from "../utils/jwt.js";

const sanitizeUser = (userDoc) => {
  const json = userDoc.toJSON();
  const { passwordHash, ...rest } = json;
  return rest;
};

const SALT_ROUNDS = 10;

export const registerUser = async ({ firstName, lastName, email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw createError("El correo ya está registrado", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken({ userId: user.id, role: user.role });

  return { user: sanitizeUser(user), token };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    throw createError("Credenciales inválidas", 401);
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    throw createError("Credenciales inválidas", 401);
  }

  const token = signToken({ userId: user.id, role: user.role });

  return { user: sanitizeUser(user), token };
};

export const getProfile = async ({ userId }) => {
  const user = await User.findById(userId);
  if (!user) {
    throw createError("Usuario no encontrado", 404);
  }

  return sanitizeUser(user);
};
