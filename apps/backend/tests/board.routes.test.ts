import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp, registerUser } from './helpers/testApp.js';

describe('boards (integration)', () => {
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

  async function createWorkspace(token: string, name = 'WS') {
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    return res.body._id as string;
  }

  it('creates a board within an authorized workspace', async () => {
    const { token } = await registerUser(app);
    const workspaceId = await createWorkspace(token);
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Sprint board' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Sprint board');
    expect(res.body.workspaceId).toBe(workspaceId);
    expect(res.body.labels).toEqual([]);
  });

  it('rejects board creation through an unauthorized workspace (non-member)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const workspaceId = await createWorkspace(ownerToken);

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ name: 'Should fail' });
    expect(res.status).toBe(403);
  });

  it('rejects board creation with a non-existent workspace id (404)', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .post('/api/v1/workspaces/507f1f77bcf86cd799439011/boards')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('retrieves the full board (board + columns + tasks) for an authorized member', async () => {
    const { token } = await registerUser(app);
    const workspaceId = await createWorkspace(token);
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board' });

    const res = await request(app)
      .get(`/api/v1/boards/${board.body._id}/full`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.board._id).toBe(board.body._id);
    expect(res.body.columns).toEqual([]);
    expect(res.body.tasks).toEqual([]);
  });

  it('rejects board retrieval through an unauthorized workspace', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const workspaceId = await createWorkspace(ownerToken);
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Board' });

    const res = await request(app)
      .get(`/api/v1/boards/${board.body._id}/full`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
  });

  it('lets an editor-role... (owner, since M3 has no invite flow yet) update the board', async () => {
    const { token } = await registerUser(app);
    const workspaceId = await createWorkspace(token);
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board' });

    const res = await request(app)
      .patch(`/api/v1/boards/${board.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed', labels: [{ name: 'Bug', color: '#ff0000' }] });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
    expect(res.body.labels).toHaveLength(1);
  });

  it('deletes a board, cascading its columns', async () => {
    const { token } = await registerUser(app);
    const workspaceId = await createWorkspace(token);
    const board = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board' });
    const column = await request(app)
      .post(`/api/v1/boards/${board.body._id}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Todo' });

    const del = await request(app)
      .delete(`/api/v1/boards/${board.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const getColumn = await request(app)
      .get(`/api/v1/columns/${column.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getColumn.status).toBe(404);
  });

  it('rejects a board created with a workspaceId belonging to another workspace from leaking cross-workspace', async () => {
    const { token } = await registerUser(app);
    const workspaceId = await createWorkspace(token);
    const otherWorkspaceId = await createWorkspace(token, 'Other');

    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board', workspaceId: otherWorkspaceId });
    expect(res.status).toBe(201);
    expect(res.body.workspaceId).toBe(workspaceId);
  });
});
