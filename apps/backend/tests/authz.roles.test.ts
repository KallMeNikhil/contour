import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp, registerUser } from './helpers/testApp.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';

describe('workspace role boundaries (integration)', () => {
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

  async function setupWorkspaceWithMember(role: 'editor' | 'viewer') {
    const { token: ownerToken } = await registerUser(app);
    const { token: memberToken, userId: memberId } = await registerUser(app);
    const ws = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'WS' });
    await WorkspaceMembership.create({
      workspaceId: ws.body._id,
      userId: memberId,
      role,
      status: 'active',
    });
    return { ownerToken, memberToken, workspaceId: ws.body._id as string };
  }

  it('editor can create a board', async () => {
    const { memberToken, workspaceId } = await setupWorkspaceWithMember('editor');
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Editor board' });
    expect(res.status).toBe(201);
  });

  it('viewer cannot create a board', async () => {
    const { memberToken, workspaceId } = await setupWorkspaceWithMember('viewer');
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should fail' });
    expect(res.status).toBe(403);
  });

  it('viewer can read the workspace and its boards', async () => {
    const { memberToken, workspaceId } = await setupWorkspaceWithMember('viewer');
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(res.status).toBe(200);
  });

  it('editor cannot rename or delete the workspace (owner-only)', async () => {
    const { memberToken, workspaceId } = await setupWorkspaceWithMember('editor');
    const rename = await request(app)
      .patch(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Renamed by editor' });
    expect(rename.status).toBe(403);

    const del = await request(app)
      .delete(`/api/v1/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(del.status).toBe(403);
  });

  it('viewer cannot create a column on a board in their workspace', async () => {
    const { ownerToken, memberToken, workspaceId } = await setupWorkspaceWithMember('viewer');
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Board' });

    const res = await request(app)
      .post(`/api/v1/boards/${board.body._id}/columns`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Should fail' });
    expect(res.status).toBe(403);
  });

  it('viewer can read a column but not update it', async () => {
    const { ownerToken, memberToken, workspaceId } = await setupWorkspaceWithMember('viewer');
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Board' });
    const column = await request(app)
      .post(`/api/v1/boards/${board.body._id}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Backlog' });

    const read = await request(app)
      .get(`/api/v1/columns/${column.body._id}`)
      .set('Authorization', `Bearer ${memberToken}`);
    expect(read.status).toBe(200);

    const update = await request(app)
      .patch(`/api/v1/columns/${column.body._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ name: 'Hijacked' });
    expect(update.status).toBe(403);
  });
});
