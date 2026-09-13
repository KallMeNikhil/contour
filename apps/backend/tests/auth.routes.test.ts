import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp } from './helpers/testApp.js';

describe('auth (integration)', () => {
  let mongod: MongoMemoryServer;
  const app = testApp();

  beforeAll(async () => {
    mongod = await startTestDb();
  });
  afterAll(async () => {
    await stopTestDb(mongod);
  });
  beforeEach(async () => {
    await clearDb();
  });

  it('registers a new user and returns a token + sanitized user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'a@example.com', password: 'password123', name: 'Ada' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('a@example.com');
    expect(res.body.user.name).toBe('Ada');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejects duplicate registration with the same email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', name: 'A' });
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'dup@example.com', password: 'password123', name: 'B' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('rejects registration with a short password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'short@example.com', password: '123', name: 'A' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects registration with a missing name', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'noname@example.com', password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('logs in with correct credentials', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.com', password: 'password123', name: 'L' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects login with a wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'wrongpw@example.com', password: 'password123', name: 'L' });
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpw@example.com', password: 'nope-nope-nope' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects login for a non-existent email with the same generic error', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a protected request with no Authorization header', async () => {
    const res = await request(app).get('/api/v1/workspaces');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects a protected request with a malformed token', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('rejects a protected request with a well-formed but invalid-signature token', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces')
      .set(
        'Authorization',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ4In0.invalidsignature',
      );
    expect(res.status).toBe(401);
  });
});
