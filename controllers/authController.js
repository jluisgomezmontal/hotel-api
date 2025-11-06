import { registerUser, loginUser, getProfile } from "../services/authService.js";

export const register = async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

export const profile = async (req, res, next) => {
  try {
    const user = await getProfile({ userId: req.user?.userId });
    return res.status(200).json({ user });
  } catch (error) {
    next(error);
  }
};
