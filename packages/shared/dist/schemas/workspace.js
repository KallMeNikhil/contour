import { z } from 'zod';
export const workspaceRoleSchema = z.enum(['owner', 'editor', 'viewer']);
export const createWorkspaceSchema = z.object({
    name: z.string().trim().min(1, 'Workspace name is required').max(80),
});
export const updateWorkspaceSchema = z.object({
    name: z.string().trim().min(1, 'Workspace name is required').max(80),
});
export const inviteMemberSchema = z.object({
    email: z.string().trim().toLowerCase().email('A valid email is required'),
    role: z.enum(['editor', 'viewer']),
});
//# sourceMappingURL=workspace.js.map