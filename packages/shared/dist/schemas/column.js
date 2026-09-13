import { z } from 'zod';
export const createColumnSchema = z.object({
    name: z.string().trim().min(1, 'Column name is required').max(60),
});
export const updateColumnSchema = z.object({
    name: z.string().trim().min(1, 'Column name is required').max(60),
});
const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const objectId = (label) => z.string().regex(OBJECT_ID_RE, `${label} must be a valid id`);
export const moveColumnSchema = z
    .object({
    beforeColumnId: objectId('beforeColumnId').optional(),
    afterColumnId: objectId('afterColumnId').optional(),
})
    .refine((data) => data.beforeColumnId !== data.afterColumnId || data.beforeColumnId === undefined, { message: 'beforeColumnId and afterColumnId must be different' });
//# sourceMappingURL=column.js.map