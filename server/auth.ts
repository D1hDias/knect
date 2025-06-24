import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'seu-jwt-secret-aqui';

export function getSession() {
  return session({
    secret: process.env.SESSION_SECRET || 'seu-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};