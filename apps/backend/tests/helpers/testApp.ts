import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../../src/config/db.js';
import { createApp } from '../../src/app.js';

export async function startTestDb(): Promise<MongoMemoryServer> {
  const mongod = await MongoMemoryServer.create();
  await connectDB(mongod.getUri());
  return mongod;
}

export async function stopTestDb(mongod: MongoMemoryServer | undefined): Promise<void> {
  await disconnectDB();
  await mongod?.stop();
}

export async function clearDb(): Promise<void> {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export function testApp() {
  return createApp();
}

let counter = 0;

export async function registerUser(
  app: ReturnType<typeof testApp>,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  counter += 1;
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: overrides.email ?? `user${counter}@example.com`,
      password: overrides.password ?? 'password123',
      name: overrides.name ?? `User ${counter}`,
    });
  return { token: res.body.token as string, userId: res.body.user.id as string, res };
}
