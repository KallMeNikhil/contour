import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import mongoose from 'mongoose';
import { AppError, NotFoundError, type ErrorCode } from '../errors/AppError.js';

interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

function envelope(code: ErrorCode, message: string, details?: unknown): ErrorEnvelope {
  return details === undefined
    ? { error: { code, message } }
    : { error: { code, message, details } };
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route matches ${req.method} ${req.originalUrl}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';

  if (err instanceof AppError) {
    if (err.statusCode >= 500) console.error('[error]', err);
    res.status(err.statusCode).json(envelope(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json(envelope('VALIDATION_ERROR', 'Validation failed', err.issues));
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    res.status(400).json(envelope('VALIDATION_ERROR', 'Validation failed', details));
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json(envelope('VALIDATION_ERROR', `Invalid ${err.path}`));
    return;
  }

  if (isBodyParserSyntaxError(err)) {
    res.status(400).json(envelope('VALIDATION_ERROR', 'Malformed JSON in request body'));
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    res.status(409).json(envelope('CONFLICT', 'Resource already exists'));
    return;
  }

  console.error('[error] unhandled:', err);
  res
    .status(500)
    .json(envelope('INTERNAL_ERROR', isProd ? 'Internal server error' : errorMessage(err)));
};

function isBodyParserSyntaxError(err: unknown): boolean {
  return (
    err instanceof SyntaxError &&
    'status' in err &&
    (err as { status?: unknown }).status === 400 &&
    'type' in err &&
    (err as { type?: unknown }).type === 'entity.parse.failed'
  );
}

function isMongoDuplicateKeyError(err: unknown): err is { code: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 11000
  );
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Internal server error';
}
