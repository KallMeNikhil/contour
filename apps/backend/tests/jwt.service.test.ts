import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { signAccessToken, verifyAccessToken } from '../src/services/jwt.service.js';

describe('jwt.service', () => {
  it('signs a token that verifies back to the same user id', () => {
    const token = signAccessToken('507f1f77bcf86cd799439011');
    const payload = verifyAccessToken(token);
    expect(payload.sub).toBe('507f1f77bcf86cd799439011');
  });

  it('rejects a malformed token', () => {
    expect(() => verifyAccessToken('not-a-real-token')).toThrow(jwt.JsonWebTokenError);
  });

  it('rejects a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ sub: 'someone' }, 'a-completely-different-secret');
    expect(() => verifyAccessToken(foreignToken)).toThrow(jwt.JsonWebTokenError);
  });

  it('rejects an already-expired token', () => {
    const expired = jwt.sign({ sub: 'someone' }, process.env.JWT_SECRET as string, {
      expiresIn: -10,
    });
    expect(() => verifyAccessToken(expired)).toThrow(jwt.TokenExpiredError);
  });

  it('rejects a token with no sub claim', () => {
    const noSub = jwt.sign({ foo: 'bar' }, process.env.JWT_SECRET as string);
    expect(() => verifyAccessToken(noSub)).toThrow(jwt.JsonWebTokenError);
  });
});
