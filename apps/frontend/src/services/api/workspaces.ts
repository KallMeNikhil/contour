import { apiRequest } from './client';
import type {
  Board,
  WorkspaceDetail,
  WorkspaceWithRole,
  WorkspaceMember,
  WorkspaceInviteResult,
  WorkspaceRole,
} from './types';

export function listWorkspaces(): Promise<WorkspaceWithRole[]> {
  return apiRequest<WorkspaceWithRole[]>('/workspaces');
}

export function createWorkspace(name: string): Promise<WorkspaceWithRole> {
  return apiRequest<WorkspaceWithRole>('/workspaces', { method: 'POST', body: { name } });
}

export function getWorkspace(workspaceId: string): Promise<WorkspaceDetail> {
  return apiRequest<WorkspaceDetail>(`/workspaces/${workspaceId}`);
}

export function listBoards(workspaceId: string): Promise<Board[]> {
  return apiRequest<Board[]>(`/workspaces/${workspaceId}/boards`);
}

export function createBoard(workspaceId: string, name: string): Promise<Board> {
  return apiRequest<Board>(`/workspaces/${workspaceId}/boards`, { method: 'POST', body: { name } });
}

export function listMembers(workspaceId: string): Promise<WorkspaceMember[]> {
  return apiRequest<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`);
}

export function inviteMember(
  workspaceId: string,
  email: string,
  role: Exclude<WorkspaceRole, 'owner'>,
): Promise<WorkspaceInviteResult> {
  return apiRequest<WorkspaceInviteResult>(`/workspaces/${workspaceId}/invites`, {
    method: 'POST',
    body: { email, role },
  });
}

export function acceptInvite(
  workspaceId: string,
  inviteToken: string,
): Promise<{ workspaceId: string; role: WorkspaceRole; status: 'active' }> {
  return apiRequest(`/workspaces/${workspaceId}/invites/${inviteToken}/accept`, { method: 'POST' });
}

export function removeMember(workspaceId: string, userId: string): Promise<void> {
  return apiRequest<void>(`/workspaces/${workspaceId}/members/${userId}`, { method: 'DELETE' });
}
