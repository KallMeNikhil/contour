import jwt from 'jsonwebtoken';
import { getConfig } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  const config = getConfig();
  return jwt.sign({ sub: userId } satisfies AccessTokenPayload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const config = getConfig();
  const decoded = jwt.verify(token, config.JWT_SECRET);
  if (typeof decoded !== 'object' || decoded === null || typeof decoded.sub !== 'string') {
    throw new jwt.JsonWebTokenError('Malformed token payload');
  }
  return { sub: decoded.sub };
}
