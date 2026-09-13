import { workspaceRepository } from '../repositories/WorkspaceRepository.js';
import { workspaceMembershipRepository } from '../repositories/WorkspaceMembershipRepository.js';
import { boardRepository } from '../repositories/BoardRepository.js';
import { columnRepository } from '../repositories/ColumnRepository.js';
import { Task } from '../models/Task.js';
import { NotFoundError } from '../errors/AppError.js';
import type { HydratedDocument } from 'mongoose';
import type { WorkspaceDoc } from '../models/Workspace.js';

export async function createWorkspace(userId: string, name: string) {
  const workspace = await workspaceRepository.create({ name, ownerId: userId });
  try {
    await workspaceMembershipRepository.create({
      workspaceId: workspace._id,
      userId,
      role: 'owner',
    });
  } catch (err) {
    await workspaceRepository.deleteById(workspace._id.toString());
    throw err;
  }
  return workspace;
}

export async function listWorkspacesForUser(userId: string) {
  const memberships = await workspaceMembershipRepository.listActiveForUser(userId);
  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = await workspaceRepository.findByIds(workspaceIds);
  const roleByWorkspaceId = new Map(memberships.map((m) => [m.workspaceId.toString(), m.role]));
  return workspaces.map((w) => ({
    workspace: w,
    role: roleByWorkspaceId.get(w._id.toString()),
  }));
}

export async function getWorkspaceById(
  workspaceId: string,
): Promise<HydratedDocument<WorkspaceDoc>> {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError('Workspace not found');
  return workspace;
}

export async function updateWorkspace(workspaceId: string, name: string) {
  const updated = await workspaceRepository.updateName(workspaceId, name);
  if (!updated) throw new NotFoundError('Workspace not found');
  return updated;
}

export async function deleteWorkspace(workspaceId: string): Promise<void> {
  const boards = await boardRepository.listByWorkspace(workspaceId);
  for (const board of boards) {
    await Task.deleteMany({ boardId: board._id }).exec();
    await columnRepository.deleteByBoard(board._id);
  }
  await Promise.all(boards.map((b) => boardRepository.deleteById(b._id.toString())));
  await workspaceMembershipRepository.deleteByWorkspace(workspaceId);
  const deleted = await workspaceRepository.deleteById(workspaceId);
  if (!deleted) throw new NotFoundError('Workspace not found');
}
