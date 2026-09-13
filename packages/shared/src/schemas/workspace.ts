import { z } from 'zod';

export const workspaceRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required').max(80),
});
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(1, 'Workspace name is required').max(80),
});
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;

export const inviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email('A valid email is required'),
  role: z.enum(['editor', 'viewer']),
});
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
