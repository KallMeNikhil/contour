import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp, registerUser } from './helpers/testApp.js';
import { WorkspaceMembership } from '../src/models/WorkspaceMembership.js';
import { Task } from '../src/models/Task.js';

describe('tasks (integration)', () => {
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

  function auth(token: string) {
    return { Authorization: `Bearer ${token}` };
  }

  async function setupColumn(token: string) {
    const ws = await request(app).post('/api/v1/workspaces').set(auth(token)).send({ name: 'WS' });
    const board = await request(app)
      .post(`/api/v1/workspaces/${ws.body._id}/boards`)
      .set(auth(token))
      .send({ name: 'Board' });
    const column = await request(app)
      .post(`/api/v1/boards/${board.body._id}/columns`)
      .set(auth(token))
      .send({ name: 'Backlog' });
    return {
      workspaceId: ws.body._id as string,
      boardId: board.body._id as string,
      columnId: column.body._id as string,
    };
  }

  async function createTask(token: string, columnId: string, title = 'Task') {
    return request(app).post(`/api/v1/columns/${columnId}/tasks`).set(auth(token)).send({ title });
  }

  it('creates a task with a server-generated position and version 0', async () => {
    const { token } = await registerUser(app);
    const { columnId, boardId } = await setupColumn(token);

    const res = await createTask(token, columnId, 'First task');
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('First task');
    expect(res.body.columnId).toBe(columnId);
    expect(res.body.boardId).toBe(boardId);
    expect(res.body.version).toBe(0);
    expect(typeof res.body.position).toBe('number');
  });

  it('appends successive tasks in the same column with increasing positions', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);

    const t1 = await createTask(token, columnId, 'A');
    const t2 = await createTask(token, columnId, 'B');
    const t3 = await createTask(token, columnId, 'C');

    expect(t2.body.position).toBeGreaterThan(t1.body.position);
    expect(t3.body.position).toBeGreaterThan(t2.body.position);
  });

  it('rejects task creation with an empty title (validation)', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(token))
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('rejects task creation on a non-existent column (404)', async () => {
    const { token } = await registerUser(app);
    await setupColumn(token);
    const res = await request(app)
      .post('/api/v1/columns/507f1f77bcf86cd799439011/tasks')
      .set(auth(token))
      .send({ title: 'X' });
    expect(res.status).toBe(404);
  });

  it('rejects task creation by a non-member (403)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const { columnId } = await setupColumn(ownerToken);
    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(strangerToken))
      .send({ title: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('viewer cannot create, update, move, or delete a task', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: viewerToken, userId: viewerId } = await registerUser(app);
    const { workspaceId, columnId } = await setupColumn(ownerToken);
    await WorkspaceMembership.create({
      workspaceId,
      userId: viewerId,
      role: 'viewer',
      status: 'active',
    });

    const create = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(viewerToken))
      .send({ title: 'Nope' });
    expect(create.status).toBe(403);

    const task = await createTask(ownerToken, columnId, 'Real task');

    const update = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}`)
      .set(auth(viewerToken))
      .send({ title: 'Hijacked', version: 0 });
    expect(update.status).toBe(403);

    const move = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(viewerToken))
      .send({ columnId });
    expect(move.status).toBe(403);

    const del = await request(app).delete(`/api/v1/tasks/${task.body._id}`).set(auth(viewerToken));
    expect(del.status).toBe(403);
  });

  it('updates task content fields and increments version', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Original');

    const res = await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: 'Updated', description: 'desc', version: 0 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Updated');
    expect(res.body.description).toBe('desc');
    expect(res.body.version).toBe(1);
  });

  it('deletes a task', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Doomed');

    const del = await request(app).delete(`/api/v1/tasks/${created.body._id}`).set(auth(token));
    expect(del.status).toBe(204);

    const stillThere = await Task.findById(created.body._id);
    expect(stillThere).toBeNull();
  });

  it('404s deleting an already-deleted task', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Doomed');
    await request(app).delete(`/api/v1/tasks/${created.body._id}`).set(auth(token));

    const res = await request(app).delete(`/api/v1/tasks/${created.body._id}`).set(auth(token));
    expect(res.status).toBe(404);
  });

  it('rejects assigning a task to a user outside the workspace', async () => {
    const { token } = await registerUser(app);
    const { userId: outsiderId } = await registerUser(app);
    const { columnId } = await setupColumn(token);

    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(token))
      .send({ title: 'Task', assigneeId: outsiderId });
    expect(res.status).toBe(422);
  });

  it('allows assigning a task to an active workspace member', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { userId: memberId } = await registerUser(app);
    const { workspaceId, columnId } = await setupColumn(ownerToken);
    await WorkspaceMembership.create({
      workspaceId,
      userId: memberId,
      role: 'editor',
      status: 'active',
    });

    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(ownerToken))
      .send({ title: 'Task', assigneeId: memberId });
    expect(res.status).toBe(201);
    expect(res.body.assigneeId).toBe(memberId);
  });

  it('rejects labels that do not belong to the parent board', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const fakeLabelId = '507f1f77bcf86cd799439011';

    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(token))
      .send({ title: 'Task', labelIds: [fakeLabelId] });
    expect(res.status).toBe(422);
  });

  it('accepts a label that belongs to the parent board', async () => {
    const { token } = await registerUser(app);
    const { boardId, columnId } = await setupColumn(token);
    const boardWithLabel = await request(app)
      .patch(`/api/v1/boards/${boardId}`)
      .set(auth(token))
      .send({ labels: [{ name: 'Bug', color: '#ff0000' }] });
    const labelId = boardWithLabel.body.labels[0]._id as string;

    const res = await request(app)
      .post(`/api/v1/columns/${columnId}/tasks`)
      .set(auth(token))
      .send({ title: 'Task', labelIds: [labelId] });
    expect(res.status).toBe(201);
    expect(res.body.labelIds).toEqual([labelId]);
  });

  it('version conflict: a stale content update is rejected with 409 and does not overwrite', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Shared task');

    const clientA = await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: "A's title", version: 0 });
    expect(clientA.status).toBe(200);
    expect(clientA.body.version).toBe(1);

    const clientB = await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: "B's title", version: 0 });
    expect(clientB.status).toBe(409);
    expect(clientB.body.error.code).toBe('CONFLICT');

    const stored = await Task.findById(created.body._id);
    expect(stored?.title).toBe("A's title");
    expect(stored?.version).toBe(1);
  });

  it('a matching version succeeds even after a prior update raised the version', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Task');

    await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: 'v1', version: 0 });

    const res = await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: 'v2', version: 1 });
    expect(res.status).toBe(200);
    expect(res.body.version).toBe(2);
  });

  it('404s a content update on a task that no longer exists', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const created = await createTask(token, columnId, 'Task');
    await request(app).delete(`/api/v1/tasks/${created.body._id}`).set(auth(token));

    const res = await request(app)
      .patch(`/api/v1/tasks/${created.body._id}`)
      .set(auth(token))
      .send({ title: 'Ghost', version: 0 });
    expect(res.status).toBe(404);
  });

  it('moves a task within the same column between two neighbors', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const a = await createTask(token, columnId, 'A');
    const b = await createTask(token, columnId, 'B');
    const c = await createTask(token, columnId, 'C');

    const res = await request(app)
      .patch(`/api/v1/tasks/${c.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: a.body._id, afterTaskId: b.body._id });
    expect(res.status).toBe(200);
    expect(res.body.position).toBeGreaterThan(a.body.position);
    expect(res.body.position).toBeLessThan(b.body.position);

    const stored = await Task.find({ columnId }).sort({ position: 1 }).exec();
    expect(stored.map((t) => t.title)).toEqual(['A', 'C', 'B']);
  });

  it('moves a task to the beginning and to the end of a column', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const a = await createTask(token, columnId, 'A');
    const b = await createTask(token, columnId, 'B');

    const toFront = await request(app)
      .patch(`/api/v1/tasks/${b.body._id}/move`)
      .set(auth(token))
      .send({ columnId, afterTaskId: a.body._id });
    expect(toFront.status).toBe(200);
    expect(toFront.body.position).toBeLessThan(a.body.position);

    const toEnd = await request(app)
      .patch(`/api/v1/tasks/${b.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: a.body._id });
    expect(toEnd.status).toBe(200);
    expect(toEnd.body.position).toBeGreaterThan(a.body.position);
  });

  it('moves a task into an empty column', async () => {
    const { token } = await registerUser(app);
    const { boardId, columnId } = await setupColumn(token);
    const otherColumn = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set(auth(token))
      .send({ name: 'Done' });
    const task = await createTask(token, columnId, 'Task');

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId: otherColumn.body._id });
    expect(res.status).toBe(200);
    expect(res.body.columnId).toBe(otherColumn.body._id);
    expect(typeof res.body.position).toBe('number');
  });

  it('moves a task across columns on the same board', async () => {
    const { token } = await registerUser(app);
    const { boardId, columnId } = await setupColumn(token);
    const otherColumn = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set(auth(token))
      .send({ name: 'In Progress' });
    const target = await createTask(token, otherColumn.body._id, 'Target');
    const task = await createTask(token, columnId, 'Task');

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId: otherColumn.body._id, beforeTaskId: target.body._id });
    expect(res.status).toBe(200);
    expect(res.body.columnId).toBe(otherColumn.body._id);
    expect(res.body.boardId).toBe(boardId);
    expect(res.body.position).toBeGreaterThan(target.body.position);
  });

  it('rejects moving a task to a column on a different board (422 INVARIANT_VIOLATION)', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const task = await createTask(token, columnId, 'Task');

    const ws2 = await request(app)
      .post('/api/v1/workspaces')
      .set(auth(token))
      .send({ name: 'WS2' });
    const board2 = await request(app)
      .post(`/api/v1/workspaces/${ws2.body._id}/boards`)
      .set(auth(token))
      .send({ name: 'Board2' });
    const foreignColumn = await request(app)
      .post(`/api/v1/boards/${board2.body._id}/columns`)
      .set(auth(token))
      .send({ name: 'Foreign' });

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId: foreignColumn.body._id });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('INVARIANT_VIOLATION');

    const stored = await Task.findById(task.body._id);
    expect(stored?.columnId.toString()).toBe(columnId);
  });

  it('rejects a move to a non-existent target column (404)', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const task = await createTask(token, columnId, 'Task');
    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId: '507f1f77bcf86cd799439011' });
    expect(res.status).toBe(404);
  });

  it('rejects neighbor IDs that belong to a different column', async () => {
    const { token } = await registerUser(app);
    const { boardId, columnId } = await setupColumn(token);
    const otherColumn = await request(app)
      .post(`/api/v1/boards/${boardId}/columns`)
      .set(auth(token))
      .send({ name: 'Other' });
    const strayNeighbor = await createTask(token, otherColumn.body._id, 'Stray');
    const task = await createTask(token, columnId, 'Task');

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: strayNeighbor.body._id });
    expect(res.status).toBe(422);
  });

  it('rejects using the moving task itself as its own neighbor', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const task = await createTask(token, columnId, 'Task');

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: task.body._id });
    expect(res.status).toBe(400);
  });

  it('rejects incoherent before/after neighbor ordering', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const a = await createTask(token, columnId, 'A');
    const b = await createTask(token, columnId, 'B');
    const c = await createTask(token, columnId, 'C');

    const res = await request(app)
      .patch(`/api/v1/tasks/${c.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: b.body._id, afterTaskId: a.body._id });
    expect(res.status).toBe(422);
  });

  it('move does not require or check version (last-write-wins, §14/§36)', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const a = await createTask(token, columnId, 'A');
    const task = await createTask(token, columnId, 'Task');

    const move1 = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId, afterTaskId: a.body._id });
    expect(move1.status).toBe(200);

    const move2 = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: a.body._id });
    expect(move2.status).toBe(200);

    const stored = await Task.findById(task.body._id);
    expect(stored?.position).toBeGreaterThan(a.body.position);
    expect(stored?.version).toBe(0);
  });

  it('rejects moving a task through an unauthorized workspace', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const { columnId } = await setupColumn(ownerToken);
    const task = await createTask(ownerToken, columnId, 'Task');

    const res = await request(app)
      .patch(`/api/v1/tasks/${task.body._id}/move`)
      .set(auth(strangerToken))
      .send({ columnId });
    expect(res.status).toBe(403);
  });

  it('rebalances a column once repeated midpoint inserts collapse the gap', async () => {
    const { token } = await registerUser(app);
    const { columnId } = await setupColumn(token);
    const a = await createTask(token, columnId, 'A');
    const b = await createTask(token, columnId, 'B');

    let leftId = a.body._id as string;
    const rightId = b.body._id as string;
    let rebalanceObserved = false;

    for (let i = 0; i < 30 && !rebalanceObserved; i++) {
      const created = await createTask(token, columnId, `mid-${i}`);
      const moved = await request(app)
        .patch(`/api/v1/tasks/${created.body._id}/move`)
        .set(auth(token))
        .send({ columnId, beforeTaskId: leftId, afterTaskId: rightId });
      expect(moved.status).toBe(200);

      const siblings = await Task.find({ columnId }).sort({ position: 1 }).exec();
      const gaps = siblings.slice(1).map((t, idx) => t.position - siblings[idx].position);
      if (Math.min(...gaps) > 1) {
        rebalanceObserved = true;
      }
      leftId = created.body._id;
    }

    expect(rebalanceObserved).toBe(true);

    const finalOrder = await Task.find({ columnId }).sort({ position: 1 }).exec();
    for (let i = 1; i < finalOrder.length; i++) {
      expect(finalOrder[i].position).toBeGreaterThan(finalOrder[i - 1].position);
    }
    const ids = finalOrder.map((t) => t._id.toString());
    expect(ids).toContain(a.body._id);
    expect(ids).toContain(b.body._id);

    const afterRebalance = await createTask(token, columnId, 'post-rebalance');
    const finalMove = await request(app)
      .patch(`/api/v1/tasks/${afterRebalance.body._id}/move`)
      .set(auth(token))
      .send({ columnId, beforeTaskId: a.body._id });
    expect(finalMove.status).toBe(200);
  });
});
