import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp, registerUser } from './helpers/testApp.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';
import { Column } from '../src/models/Column.js';

describe('columns (integration)', () => {
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

  async function setupBoard(token: string) {
    const ws = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WS' });
    const board = await request(app)
      .post(`/api/v1/workspaces/${ws.body._id}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board' });
    return { workspaceId: ws.body._id as string, boardId: board.body._id as string };
  }

  it('creates a column within an authorized board with an incrementing position', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);

    const c1 = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Backlog' });
    const c2 = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Done' });

    expect(c1.status).toBe(201);
    expect(c2.status).toBe(201);
    expect(c2.body.position).toBeGreaterThan(c1.body.position);
    expect(c1.body.boardId).toBe(boardId);
  });

  it('rejects column creation through an unauthorized board (non-member)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const { boardId } = await setupBoard(ownerToken);

    const res = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({ name: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('rejects column creation on a non-existent board (404)', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .post('/api/v1/boards/507f1f77bcf86cd799439011/columns')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'X' });
    expect(res.status).toBe(404);
  });

  it('retrieves a column through correct board/workspace authorization', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const created = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Backlog' });

    const res = await request(app)
      .get(`/api/v1/columns/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Backlog');
  });

  it('rejects cross-workspace column access by a non-member', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const { boardId } = await setupBoard(ownerToken);
    const created = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Backlog' });

    const res = await request(app)
      .get(`/api/v1/columns/${created.body._id}`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
  });

  it('updates (renames) a column', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const created = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Old' });

    const res = await request(app)
      .patch(`/api/v1/columns/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New');
  });

  it('rejects an invalid (empty) column name on create', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const res = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '' });
    expect(res.status).toBe(400);
  });

  it('deletes a column', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const created = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Doomed' });

    const del = await request(app)
      .delete(`/api/v1/columns/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/api/v1/columns/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(get.status).toBe(404);
  });

  async function createColumn(token: string, boardId: string, name: string) {
    return request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
  }

  it('moves a column within the board between two neighbors', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const a = await createColumn(token, boardId, 'A');
    const b = await createColumn(token, boardId, 'B');
    const c = await createColumn(token, boardId, 'C');

    const res = await request(app)
      .patch(`/api/v1/columns/${c.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ beforeColumnId: a.body._id, afterColumnId: b.body._id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(a.body.position);
    expect(res.body.position).toBeLessThan(b.body.position);

    const stored = await Column.find({ boardId }).sort({ position: 1 }).exec();
    expect(stored.map((col) => col.name)).toEqual(['A', 'C', 'B']);
  });

  it('moves a column to the front and to the end of the board', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const a = await createColumn(token, boardId, 'A');
    const b = await createColumn(token, boardId, 'B');

    const toFront = await request(app)
      .patch(`/api/v1/columns/${b.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ afterColumnId: a.body._id });
    expect(toFront.status).toBe(200);
    expect(toFront.body.position).toBeLessThan(a.body.position);

    const toEnd = await request(app)
      .patch(`/api/v1/columns/${b.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ beforeColumnId: a.body._id });
    expect(toEnd.status).toBe(200);
    expect(toEnd.body.position).toBeGreaterThan(a.body.position);
  });

  it('reorders a single remaining column as a no-op-safe append (empty-neighbor case)', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const only = await createColumn(token, boardId, 'Only');

    const res = await request(app)
      .patch(`/api/v1/columns/${only.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(200);
    expect(typeof res.body.position).toBe('number');
  });

  it('rejects a neighbor column that belongs to a different board (422 INVARIANT_VIOLATION)', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const column = await createColumn(token, boardId, 'Mine');

    const ws2 = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'WS2' });
    const board2 = await request(app)
      .post(`/api/v1/workspaces/${ws2.body._id}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board2' });
    const foreignColumn = await createColumn(token, board2.body._id, 'Foreign');

    const res = await request(app)
      .patch(`/api/v1/columns/${column.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ afterColumnId: foreignColumn.body._id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVARIANT_VIOLATION');

    const stored = await Column.findById(column.body._id);
    expect(stored?.position).toBe(column.body.position);
  });

  it('rejects using the moving column itself as its own neighbor', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const column = await createColumn(token, boardId, 'Solo');

    const res = await request(app)
      .patch(`/api/v1/columns/${column.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ beforeColumnId: column.body._id });
    expect(res.status).toBe(400);
  });

  it('rejects incoherent before/after neighbor ordering', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const a = await createColumn(token, boardId, 'A');
    const b = await createColumn(token, boardId, 'B');
    const c = await createColumn(token, boardId, 'C');

    const res = await request(app)
      .patch(`/api/v1/columns/${c.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ beforeColumnId: b.body._id, afterColumnId: a.body._id });
    expect(res.status).toBe(422);
  });

  it('move does not require or check a version field (last-write-wins, mirrors task moves)', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const a = await createColumn(token, boardId, 'A');
    const moving = await createColumn(token, boardId, 'Moving');

    const move1 = await request(app)
      .patch(`/api/v1/columns/${moving.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ afterColumnId: a.body._id });
    expect(move1.status).toBe(200);

    const move2 = await request(app)
      .patch(`/api/v1/columns/${moving.body._id}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ beforeColumnId: a.body._id });
    expect(move2.status).toBe(200);

    const stored = await Column.findById(moving.body._id);
    expect(stored?.position).toBeGreaterThan(a.body.position);
  });

  it('viewer cannot move a column (403)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: viewerToken, userId: viewerId } = await registerUser(app);
    const { workspaceId, boardId } = await setupBoard(ownerToken);
    await WorkspaceMembership.create({
      workspaceId,
      userId: viewerId,
      role: 'viewer',
      status: 'active',
    });
    const column = await createColumn(ownerToken, boardId, 'Backlog');

    const res = await request(app)
      .patch(`/api/v1/columns/${column.body._id}/move`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('rejects moving a column through an unauthorized workspace (non-member, 403)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const { boardId } = await setupBoard(ownerToken);
    const column = await createColumn(ownerToken, boardId, 'Backlog');

    const res = await request(app)
      .patch(`/api/v1/columns/${column.body._id}/move`)
      .set('Authorization', `Bearer ${strangerToken}`)
      .send({});
    expect(res.status).toBe(403);
  });

  it('rejects a move for a non-existent column (404)', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .patch('/api/v1/columns/507f1f77bcf86cd799439011/move')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(404);
  });

  it('rebalances the board column order once repeated midpoint inserts collapse the gap', async () => {
    const { token } = await registerUser(app);
    const { boardId } = await setupBoard(token);
    const a = await createColumn(token, boardId, 'A');
    const b = await createColumn(token, boardId, 'B');

    let leftId = a.body._id as string;
    const rightId = b.body._id as string;
    let rebalanceObserved = false;

    for (let i = 0; i < 30 && !rebalanceObserved; i++) {
      const created = await createColumn(token, boardId, `mid-${i}`);
      const moved = await request(app)
        .patch(`/api/v1/columns/${created.body._id}/move`)
        .set('Authorization', `Bearer ${token}`)
        .send({ beforeColumnId: leftId, afterColumnId: rightId });
      expect(moved.status).toBe(200);

      const siblings = await Column.find({ boardId }).sort({ position: 1 }).exec();
      const gaps = siblings.slice(1).map((c, idx) => c.position - siblings[idx].position);
      if (Math.min(...gaps) > 1) {
        rebalanceObserved = true;
      }
      leftId = created.body._id;
    }

    expect(rebalanceObserved).toBe(true);

    const finalOrder = await Column.find({ boardId }).sort({ position: 1 }).exec();
    for (let i = 1; i < finalOrder.length; i++) {
      expect(finalOrder[i].position).toBeGreaterThan(finalOrder[i - 1].position);
    }
    const ids = finalOrder.map((c) => c._id.toString());
    expect(ids).toContain(a.body._id);
    expect(ids).toContain(b.body._id);
  });
});
