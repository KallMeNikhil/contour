import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import { startTestDb, stopTestDb, clearDb, testApp, registerUser } from './helpers/testApp.js';

describe('workspaces (integration)', () => {
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

  it('creates a workspace and makes the creator its owner', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Acme');
    expect(res.body.role).toBe('owner');
  });

  it('rejects workspace creation without auth', async () => {
    const res = await request(app).post('/api/v1/workspaces').send({ name: 'Acme' });
    expect(res.status).toBe(401);
  });

  it('rejects workspace creation with a missing name', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
  });

  it('lists only workspaces the user is a member of', async () => {
    const { token: tokenA } = await registerUser(app);
    const { token: tokenB } = await registerUser(app);
    await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ name: 'A workspace' });
    await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ name: 'B workspace' });

    const res = await request(app)
      .get('/api/v1/workspaces')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('A workspace');
  });

  it('lets the owner retrieve the workspace with its member list', async () => {
    const { token } = await registerUser(app);
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Owned' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.role).toBe('owner');
    expect(res.body.members).toHaveLength(1);
  });

  it('rejects retrieval by a user who is not a member (403)', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: strangerToken } = await registerUser(app);
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Private' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${strangerToken}`);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('returns 404 for a well-formed but non-existent workspace id', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .get('/api/v1/workspaces/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 400 for a malformed workspace id', async () => {
    const { token } = await registerUser(app);
    const res = await request(app)
      .get('/api/v1/workspaces/not-an-object-id')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('lets the owner rename the workspace', async () => {
    const { token } = await registerUser(app);
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Old name' });

    const res = await request(app)
      .patch(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New name' });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('New name');
  });

  it('rejects rename by a non-owner member', async () => {
    const { token: ownerToken } = await registerUser(app);
    const { token: otherToken } = await registerUser(app);
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Guarded' });

    const res = await request(app)
      .patch(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ name: 'Hijacked' });
    expect(res.status).toBe(403);
  });

  it('lets the owner delete the workspace, cascading its boards/columns', async () => {
    const { token } = await registerUser(app);
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'To delete' });
    const board = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/boards`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Board 1' });

    const del = await request(app)
      .delete(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(del.status).toBe(204);

    const getBoard = await request(app)
      .get(`/api/v1/boards/${board.body._id}/full`)
      .set('Authorization', `Bearer ${token}`);
    expect(getBoard.status).toBe(404);
  });
});

describe('workspace membership/invites (integration, M8)', () => {
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

  it('lists the owner as the only member of a new workspace, enriched with name/email', async () => {
    const { token } = await registerUser(app, { email: 'owner@example.com', name: 'Owner Person' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}/members`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      role: 'owner',
      status: 'active',
      name: 'Owner Person',
      email: 'owner@example.com',
    });
  });

  it('embeds enriched member info on GET /workspaces/:id too', async () => {
    const { token } = await registerUser(app, { email: 'owner2@example.com', name: 'Owner Two' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme' });

    const res = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.members[0]).toMatchObject({ name: 'Owner Two', email: 'owner2@example.com' });
  });

  it('lets an owner invite an existing user, who can then accept and access the workspace', async () => {
    const { token: ownerToken } = await registerUser(app, { email: 'owner3@example.com' });
    const { token: inviteeToken } = await registerUser(app, { email: 'invitee@example.com' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme' });

    const invite = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'invitee@example.com', role: 'editor' });
    expect(invite.status).toBe(201);
    expect(invite.body.status).toBe('pending');
    expect(typeof invite.body.inviteToken).toBe('string');

    const blocked = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}/boards`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(blocked.status).toBe(403);

    const accept = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites/${invite.body.inviteToken}/accept`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(accept.status).toBe(200);
    expect(accept.body.role).toBe('editor');

    const allowed = await request(app)
      .get(`/api/v1/workspaces/${created.body._id}/boards`)
      .set('Authorization', `Bearer ${inviteeToken}`);
    expect(allowed.status).toBe(200);
  });

  it('rejects an invite for an email with no Contour account', async () => {
    const { token } = await registerUser(app, { email: 'owner4@example.com' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme' });

    const res = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'nobody@example.com', role: 'viewer' });
    expect(res.status).toBe(404);
  });

  it('rejects a duplicate invite to an already-active member', async () => {
    const { token: ownerToken } = await registerUser(app, { email: 'owner5@example.com' });
    await registerUser(app, { email: 'member5@example.com' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme' });
    await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'owner5@example.com', role: 'viewer' });

    const res = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'owner5@example.com', role: 'viewer' });
    expect(res.status).toBe(409);
  });

  it('rejects invite creation from a viewer/editor without owner-level access where required', async () => {
    const { token: ownerToken } = await registerUser(app, { email: 'owner6@example.com' });
    const { token: viewerToken } = await registerUser(app, { email: 'viewer6@example.com' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme' });
    const invite = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'viewer6@example.com', role: 'viewer' });
    await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites/${invite.body.inviteToken}/accept`)
      .set('Authorization', `Bearer ${viewerToken}`);

    const res = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({ email: 'someone-else@example.com', role: 'viewer' });
    expect(res.status).toBe(403);
  });

  it("rejects accepting another user's invite token", async () => {
    const { token: ownerToken } = await registerUser(app, { email: 'owner7@example.com' });
    const { token: intrudingToken } = await registerUser(app, { email: 'intruder@example.com' });
    await registerUser(app, { email: 'invitee7@example.com' });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme' });
    const invite = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'invitee7@example.com', role: 'viewer' });

    const res = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites/${invite.body.inviteToken}/accept`)
      .set('Authorization', `Bearer ${intrudingToken}`);
    expect(res.status).toBe(403);
  });

  it('lets the owner remove a member, but not remove themselves', async () => {
    const { token: ownerToken, userId: ownerId } = await registerUser(app, {
      email: 'owner8@example.com',
    });
    const { token: memberToken, userId: memberId } = await registerUser(app, {
      email: 'member8@example.com',
    });
    const created = await request(app)
      .post('/api/v1/workspaces')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ name: 'Acme' });
    const invite = await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ email: 'member8@example.com', role: 'editor' });
    await request(app)
      .post(`/api/v1/workspaces/${created.body._id}/invites/${invite.body.inviteToken}/accept`)
      .set('Authorization', `Bearer ${memberToken}`);

    const removeSelf = await request(app)
      .delete(`/api/v1/workspaces/${created.body._id}/members/${ownerId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(removeSelf.status).toBe(403);

    const removeMember = await request(app)
      .delete(`/api/v1/workspaces/${created.body._id}/members/${memberId}`)
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(removeMember.status).toBe(204);
  });
});
