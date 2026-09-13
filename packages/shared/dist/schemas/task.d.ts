import { z } from 'zod';
export declare const createTaskSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    labelIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>;
}, "strip", z.ZodTypeAny, {
    title: string;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}, {
    title: string;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export declare const updateTaskSchema: z.ZodEffects<z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    assigneeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    labelIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dueDate: z.ZodOptional<z.ZodNullable<z.ZodEffects<z.ZodString, string, string>>>;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    version: number;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}, {
    version: number;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}>, {
    version: number;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}, {
    version: number;
    assigneeId?: string | null | undefined;
    labelIds?: string[] | undefined;
    title?: string | undefined;
    description?: string | undefined;
    dueDate?: string | null | undefined;
}>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export declare const moveTaskSchema: z.ZodEffects<z.ZodObject<{
    columnId: z.ZodString;
    beforeTaskId: z.ZodOptional<z.ZodString>;
    afterTaskId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    columnId: string;
    beforeTaskId?: string | undefined;
    afterTaskId?: string | undefined;
}, {
    columnId: string;
    beforeTaskId?: string | undefined;
    afterTaskId?: string | undefined;
}>, {
    columnId: string;
    beforeTaskId?: string | undefined;
    afterTaskId?: string | undefined;
}, {
    columnId: string;
    beforeTaskId?: string | undefined;
    afterTaskId?: string | undefined;
}>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
//# sourceMappingURL=task.d.ts.map