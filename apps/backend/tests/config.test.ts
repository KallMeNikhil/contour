import { describe, it, expect } from 'vitest';
import { loadEnv, ConfigValidationError } from '../src/config/env.js';

const validJwtSecret = 'a'.repeat(32);

describe('config/env', () => {
  it('parses a valid, fully-specified environment', () => {
    const config = loadEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      MONGO_URI: 'mongodb://localhost:27017/contour',
      CORS_ORIGIN: 'https://contour.app',
      JWT_SECRET: validJwtSecret,
      JWT_EXPIRES_IN: '1d',
    });
    expect(config).toEqual({
      NODE_ENV: 'production',
      PORT: 8080,
      MONGO_URI: 'mongodb://localhost:27017/contour',
      CORS_ORIGIN: 'https://contour.app',
      JWT_SECRET: validJwtSecret,
      JWT_EXPIRES_IN: '1d',
    });
  });

  it('applies defaults for NODE_ENV, PORT, CORS_ORIGIN, and JWT_EXPIRES_IN', () => {
    const config = loadEnv({
      MONGO_URI: 'mongodb://localhost:27017/contour',
      JWT_SECRET: validJwtSecret,
    });
    expect(config.NODE_ENV).toBe('development');
    expect(config.PORT).toBe(4000);
    expect(config.CORS_ORIGIN).toBe('http://localhost:5173');
    expect(config.JWT_EXPIRES_IN).toBe('7d');
  });

  it('coerces a numeric PORT string', () => {
    const config = loadEnv({
      MONGO_URI: 'mongodb://x/y',
      PORT: '5001',
      JWT_SECRET: validJwtSecret,
    });
    expect(config.PORT).toBe(5001);
  });

  it('fails fast when MONGO_URI is missing', () => {
    expect(() => loadEnv({ JWT_SECRET: validJwtSecret })).toThrow(ConfigValidationError);
  });

  it('fails fast when MONGO_URI is an empty string', () => {
    expect(() => loadEnv({ MONGO_URI: '', JWT_SECRET: validJwtSecret })).toThrow(
      ConfigValidationError,
    );
  });

  it('fails fast on an invalid NODE_ENV value', () => {
    expect(() =>
      loadEnv({ MONGO_URI: 'mongodb://x/y', NODE_ENV: 'staging', JWT_SECRET: validJwtSecret }),
    ).toThrow(ConfigValidationError);
  });

  it('fails fast on a non-numeric PORT', () => {
    expect(() =>
      loadEnv({ MONGO_URI: 'mongodb://x/y', PORT: 'not-a-number', JWT_SECRET: validJwtSecret }),
    ).toThrow(ConfigValidationError);
  });

  it('fails fast when JWT_SECRET is missing', () => {
    expect(() => loadEnv({ MONGO_URI: 'mongodb://x/y' })).toThrow(ConfigValidationError);
  });

  it('fails fast when JWT_SECRET is shorter than 32 characters', () => {
    expect(() => loadEnv({ MONGO_URI: 'mongodb://x/y', JWT_SECRET: 'too-short' })).toThrow(
      ConfigValidationError,
    );
  });

  it('error message lists every invalid field', () => {
    try {
      loadEnv({ NODE_ENV: 'bogus', PORT: 'nope' });
      expect.unreachable();
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigValidationError);
      const e = err as ConfigValidationError;
      expect(e.details.some((d) => d.includes('MONGO_URI'))).toBe(true);
      expect(e.details.some((d) => d.includes('NODE_ENV'))).toBe(true);
      expect(e.details.some((d) => d.includes('PORT'))).toBe(true);
      expect(e.details.some((d) => d.includes('JWT_SECRET'))).toBe(true);
    }
  });
});
