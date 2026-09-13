import { describe, it, expect, vi, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import mongoose from 'mongoose';
import { ZodError, z } from 'zod';
import { errorHandler, notFoundHandler } from '../src/middleware/errorHandler.js';
import {
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InvariantViolationError,
} from '../src/errors/AppError.js';

function appWithThrow(fn: () => never) {
  const app = express();
  app.get('/boom', (_req, _res) => fn());
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

describe('errorHandler', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    [new ValidationError('bad input'), 400, 'VALIDATION_ERROR'],
    [new UnauthenticatedError(), 401, 'UNAUTHENTICATED'],
    [new ForbiddenError(), 403, 'FORBIDDEN'],
    [new NotFoundError('nope'), 404, 'NOT_FOUND'],
    [new ConflictError('conflict'), 409, 'CONFLICT'],
    [new InvariantViolationError('invariant'), 422, 'INVARIANT_VIOLATION'],
  ] as const)('maps %o to %i / %s', async (error, status, code) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(
      appWithThrow(() => {
        throw error;
      }),
    ).get('/boom');
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
    expect(res.body.error.message).toBeTruthy();
  });

  it('unmatched routes produce a 404 NOT_FOUND envelope', async () => {
    const app = express();
    app.use(notFoundHandler);
    app.use(errorHandler);
    const res = await request(app).get('/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('converts a ZodError into a 400 VALIDATION_ERROR with issue details', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const schema = z.object({ title: z.string() });
    const app = appWithThrow(() => {
      const result = schema.safeParse({});
      throw result.error as ZodError;
    });
    const res = await request(app).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(Array.isArray(res.body.error.details)).toBe(true);
  });

  it('converts a Mongoose ValidationError into a 400 VALIDATION_ERROR', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new mongoose.Error.ValidationError();
    err.errors.title = new mongoose.Error.ValidatorError({
      message: 'title is required',
      path: 'title',
    });
    const res = await request(
      appWithThrow(() => {
        throw err;
      }),
    ).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('converts a Mongoose CastError (bad ObjectId) into a 400', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = new mongoose.Error.CastError('ObjectId', 'not-an-id', 'boardId');
    const res = await request(
      appWithThrow(() => {
        throw err;
      }),
    ).get('/boom');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('converts a Mongo duplicate-key error into a 409 CONFLICT', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const err = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
    const res = await request(
      appWithThrow(() => {
        throw err;
      }),
    ).get('/boom');
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('sanitizes unknown errors to a generic 500 in production, without leaking the message', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const res = await request(
        appWithThrow(() => {
          throw new Error('super secret internal detail');
        }),
      ).get('/boom');
      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('INTERNAL_ERROR');
      expect(res.body.error.message).not.toContain('super secret internal detail');
    } finally {
      process.env.NODE_ENV = original;
    }
  });

  it('logs unexpected errors server-side', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await request(
      appWithThrow(() => {
        throw new Error('boom');
      }),
    ).get('/boom');
    expect(spy).toHaveBeenCalled();
  });

  it('converts a malformed JSON body into a 400 VALIDATION_ERROR, not a 500', async () => {
    const app = express();
    app.use(express.json());
    app.post('/echo', (req, res) => res.json(req.body));
    app.use(notFoundHandler);
    app.use(errorHandler);

    const res = await request(app)
      .post('/echo')
      .set('Content-Type', 'application/json')
      .send('{not valid json');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('still sanitizes a non-body-parser SyntaxError as a generic 500 (not misclassified as 400)', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(
      appWithThrow(() => {
        throw new SyntaxError('unrelated syntax error');
      }),
    ).get('/boom');
    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe('INTERNAL_ERROR');
  });
});
