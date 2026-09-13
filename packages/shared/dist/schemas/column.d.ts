import { z } from 'zod';
export declare const createColumnSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export declare const updateColumnSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export declare const moveColumnSchema: z.ZodEffects<z.ZodObject<{
    beforeColumnId: z.ZodOptional<z.ZodString>;
    afterColumnId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    beforeColumnId?: string | undefined;
    afterColumnId?: string | undefined;
}, {
    beforeColumnId?: string | undefined;
    afterColumnId?: string | undefined;
}>, {
    beforeColumnId?: string | undefined;
    afterColumnId?: string | undefined;
}, {
    beforeColumnId?: string | undefined;
    afterColumnId?: string | undefined;
}>;
export type MoveColumnInput = z.infer<typeof moveColumnSchema>;
//# sourceMappingURL=column.d.ts.map