import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthenticatedError } from '../errors/AppError.js';
import { verifyAccessToken } from '../services/jwt.service.js';

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    next(new UnauthenticatedError('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    next(new UnauthenticatedError('Missing bearer token'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      next(new UnauthenticatedError('Token expired'));
      return;
    }
    if (err instanceof jwt.JsonWebTokenError) {
      next(new UnauthenticatedError('Invalid token'));
      return;
    }
    next(err);
  }
}
