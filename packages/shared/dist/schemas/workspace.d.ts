import { z } from 'zod';
export declare const workspaceRoleSchema: z.ZodEnum<["owner", "editor", "viewer"]>;
export type WorkspaceRole = z.infer<typeof workspaceRoleSchema>;
export declare const createWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export declare const updateWorkspaceSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export declare const inviteMemberSchema: z.ZodObject<{
    email: z.ZodString;
    role: z.ZodEnum<["editor", "viewer"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "editor" | "viewer";
}, {
    email: string;
    role: "editor" | "viewer";
}>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
//# sourceMappingURL=workspace.d.ts.map