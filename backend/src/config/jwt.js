import jwt from "jsonwebtoken";
import logger from "../utils/logger.js";

const requireSecret = (key, fallback) => {
  const value = process.env[key] || fallback;
  if (!value) {
    throw new Error(`${key} is not set. Please configure it in your environment.`);
  }
  if (!process.env[key] && fallback) {
    logger.warn(`${key} not provided. Using fallback value for development.`);
  }
  return value;
};

export const generateAccessToken = (userId, role) => {
  const secret = requireSecret("JWT_SECRET");
  return jwt.sign({ id: userId, role }, secret, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

export const generateRefreshToken = (userId) => {
  const secret = requireSecret("JWT_REFRESH_SECRET");
  return jwt.sign({ id: userId }, secret, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "30d",
  });
};

export const verifyAccessToken = (token) => {
  try {
    const secret = requireSecret("JWT_SECRET");
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const secret = requireSecret("JWT_REFRESH_SECRET");
    return jwt.verify(token, secret);
  } catch (error) {
    throw new Error("Invalid or expired refresh token");
  }
};

export const generatePasswordResetToken = () => {
  const secret = requireSecret("JWT_SECRET");
  return jwt.sign({ type: "password-reset" }, secret, {
    expiresIn: "1h",
  });
};
