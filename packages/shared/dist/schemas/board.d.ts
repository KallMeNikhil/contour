import { z } from 'zod';
export declare const createBoardSchema: z.ZodObject<{
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
}, {
    name: string;
}>;
export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export declare const updateBoardSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    labels: z.ZodOptional<z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        color: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
        color: string;
    }, {
        name: string;
        color: string;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    labels?: {
        name: string;
        color: string;
    }[] | undefined;
}, {
    name?: string | undefined;
    labels?: {
        name: string;
        color: string;
    }[] | undefined;
}>, {
    name?: string | undefined;
    labels?: {
        name: string;
        color: string;
    }[] | undefined;
}, {
    name?: string | undefined;
    labels?: {
        name: string;
        color: string;
    }[] | undefined;
}>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
//# sourceMappingURL=board.d.ts.map