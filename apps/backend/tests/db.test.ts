import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB, isDBConnected, getDBReadyState } from '../src/config/db.js';
import { createApp } from '../src/app.js';

describe('db connection lifecycle (integration)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
  });

  afterAll(async () => {
    await disconnectDB();
    await mongod?.stop();
  });

  it('reports disconnected before connecting', () => {
    expect(isDBConnected()).toBe(false);
    expect(getDBReadyState()).toBe(0);
  });

  it('connects successfully to the in-memory MongoDB instance', async () => {
    await connectDB(mongod.getUri());
    expect(isDBConnected()).toBe(true);
    expect(getDBReadyState()).toBe(1);
  });

  it('GET /health reports 200/ok once connected', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.db).toBe('connected');
  });

  it('disconnects cleanly', async () => {
    await disconnectDB();
    expect(isDBConnected()).toBe(false);
  });

  it('rejects connecting to an unreachable host within the timeout', async () => {
    await expect(
      connectDB('mongodb://127.0.0.1:1/does-not-exist', { serverSelectionTimeoutMS: 500 }),
    ).rejects.toThrow();
  });
});
