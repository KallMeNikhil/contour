import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as workspacesApi from '../../services/api/workspaces';

export const workspaceKeys = {
  list: ['workspaces'] as const,
  detail: (id: string) => ['workspaces', id] as const,
  boards: (id: string) => ['workspaces', id, 'boards'] as const,
  members: (id: string) => ['workspaces', id, 'members'] as const,
};

export function useWorkspaces() {
  return useQuery({ queryKey: workspaceKeys.list, queryFn: workspacesApi.listWorkspaces });
}

export function useWorkspace(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? workspaceKeys.detail(workspaceId)
      : ['workspaces', 'detail', 'disabled'],
    queryFn: () => workspacesApi.getWorkspace(workspaceId as string),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspacesApi.createWorkspace(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.list });
    },
  });
}

export function useBoards(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId ? workspaceKeys.boards(workspaceId) : ['boards', 'disabled'],
    queryFn: () => workspacesApi.listBoards(workspaceId as string),
    enabled: !!workspaceId,
  });
}

export function useCreateBoard(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspacesApi.createBoard(workspaceId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.boards(workspaceId) });
    },
  });
}

export function useMembers(workspaceId: string | undefined) {
  return useQuery({
    queryKey: workspaceId
      ? workspaceKeys.members(workspaceId)
      : ['workspaces', 'members', 'disabled'],
    queryFn: () => workspacesApi.listMembers(workspaceId as string),
    enabled: !!workspaceId,
  });
}

export function useInviteMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, role }: { email: string; role: 'editor' | 'viewer' }) =>
      workspacesApi.inviteMember(workspaceId, email, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => workspacesApi.removeMember(workspaceId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) });
    },
  });
}
