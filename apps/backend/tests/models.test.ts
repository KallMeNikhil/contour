import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  User,
  Workspace,
  WorkspaceMembership,
  Board,
  Column,
  Task,
  Activity,
} from '../src/models/index.js';

describe('model schema foundation (integration)', () => {
  let mongod: MongoMemoryServer;

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await connectDB(mongod.getUri());
  });

  afterAll(async () => {
    await disconnectDB();
    await mongod?.stop();
  });

  beforeEach(async () => {
    const { collections } = mongoose.connection;
    await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
  });

  it('creates a valid User and enforces unique email', async () => {
    await User.create({ email: 'a@example.com', passwordHash: 'hash', name: 'Ada' });
    await expect(
      User.create({ email: 'A@example.com', passwordHash: 'hash2', name: 'Ada 2' }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('lowercases email on save', async () => {
    const user = await User.create({
      email: 'MixedCase@Example.com',
      passwordHash: 'h',
      name: 'X',
    });
    expect(user.email).toBe('mixedcase@example.com');
  });

  it('rejects a Workspace without a name', async () => {
    const owner = await User.create({ email: 'o@example.com', passwordHash: 'h', name: 'Owner' });
    await expect(Workspace.create({ ownerId: owner._id })).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('enforces one WorkspaceMembership per (workspaceId, userId)', async () => {
    const user = await User.create({ email: 'm@example.com', passwordHash: 'h', name: 'M' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    await WorkspaceMembership.create({
      workspaceId: workspace._id,
      userId: user._id,
      role: 'owner',
    });
    await expect(
      WorkspaceMembership.create({ workspaceId: workspace._id, userId: user._id, role: 'editor' }),
    ).rejects.toMatchObject({ code: 11000 });
  });

  it('rejects an invalid WorkspaceMembership role', async () => {
    const user = await User.create({ email: 'r@example.com', passwordHash: 'h', name: 'R' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    await expect(
      WorkspaceMembership.create({
        workspaceId: workspace._id,
        userId: user._id,
        role: 'superadmin',
      }),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('creates a Board with embedded labels', async () => {
    const user = await User.create({ email: 'b@example.com', passwordHash: 'h', name: 'B' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    const board = await Board.create({
      workspaceId: workspace._id,
      name: 'Board 1',
      labels: [{ name: 'Bug', color: '#ff0000' }],
    });
    expect(board.labels).toHaveLength(1);
    expect(board.labels[0].name).toBe('Bug');
  });

  it('rejects a Column without a position', async () => {
    const user = await User.create({ email: 'c@example.com', passwordHash: 'h', name: 'C' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    const board = await Board.create({ workspaceId: workspace._id, name: 'Board' });
    await expect(Column.create({ boardId: board._id, name: 'Backlog' })).rejects.toThrow(
      mongoose.Error.ValidationError,
    );
  });

  it('creates a Task with denormalized boardId, default version 0', async () => {
    const user = await User.create({ email: 't@example.com', passwordHash: 'h', name: 'T' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    const board = await Board.create({ workspaceId: workspace._id, name: 'Board' });
    const column = await Column.create({ boardId: board._id, name: 'Todo', position: 1000 });
    const task = await Task.create({
      boardId: board._id,
      columnId: column._id,
      title: 'Write tests',
      position: 1000,
    });
    expect(task.boardId.toString()).toBe(board._id.toString());
    expect(task.version).toBe(0);
  });

  it('rejects a Task title over 200 chars', async () => {
    const user = await User.create({ email: 't2@example.com', passwordHash: 'h', name: 'T2' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    const board = await Board.create({ workspaceId: workspace._id, name: 'Board' });
    const column = await Column.create({ boardId: board._id, name: 'Todo', position: 1000 });
    await expect(
      Task.create({
        boardId: board._id,
        columnId: column._id,
        title: 'x'.repeat(201),
        position: 1000,
      }),
    ).rejects.toThrow(mongoose.Error.ValidationError);
  });

  it('creates an Activity entry with only createdAt (no updatedAt)', async () => {
    const user = await User.create({ email: 'act@example.com', passwordHash: 'h', name: 'Act' });
    const workspace = await Workspace.create({ name: 'W', ownerId: user._id });
    const board = await Board.create({ workspaceId: workspace._id, name: 'Board' });
    const activity = await Activity.create({
      workspaceId: workspace._id,
      boardId: board._id,
      actorId: user._id,
      type: 'task.created',
      metadata: { taskId: '507f1f77bcf86cd799439011' },
    });
    expect(activity.createdAt).toBeInstanceOf(Date);
    expect((activity as unknown as { updatedAt?: Date }).updatedAt).toBeUndefined();
  });
});
