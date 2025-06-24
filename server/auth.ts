import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import session from 'express-session';
import type { Express, RequestHandler } from 'express';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-jwt-secret';
const SESSION_SECRET = process.env.SESSION_SECRET || 'fallback-session-secret';

// Declare module for session types
declare module 'express-session' {
  interface SessionData {
    user?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }
}

export function getSession() {
  return session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  });
}

export async function setupAuth(app: Express) {
  app.use(getSession());
  
  // Login endpoint
  app.post('/api/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // TODO: Implementar validação real com banco de dados
      // Por enquanto, vamos simular um usuário
      if (email && password) {
        const user = { id: '1', email, firstName: 'Usuario', lastName: 'Teste' };
        req.session.user = user;
        res.json(user);
      } else {
        res.status(401).json({ message: 'Credenciais inválidas' });
      }
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  });

  // Register endpoint (futuro)
  app.post('/api/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email e senha são obrigatórios' });
      }

      // TODO: Implementar registro real
      res.status(501).json({ message: 'Registro ainda não implementado' });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Erro no servidor' });
    }
  });

  // Logout endpoint
  app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Erro ao fazer logout' });
      }
      res.json({ message: 'Logout realizado' });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.session?.user) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};