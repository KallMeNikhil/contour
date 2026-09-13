import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('app foundation', () => {
  it('GET / returns foundation status and resolves @contour/shared', async () => {
    const app = createApp();
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('foundation');
    expect(res.body.sharedPackage).toBe('@contour/shared');
  });

  it('GET /health reports 503/degraded when MongoDB is not connected', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.db).toBe('disconnected');
  });

  it('unmatched route returns the standard 404 error envelope', async () => {
    const app = createApp();
    const res = await request(app).get('/no-such-route');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
