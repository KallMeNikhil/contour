import { z } from 'zod';

export const createBoardSchema = z.object({
  name: z.string().trim().min(1, 'Board name is required').max(80),
});
export type CreateBoardInput = z.infer<typeof createBoardSchema>;

const labelInputSchema = z.object({
  name: z.string().trim().min(1).max(40),
  color: z.string().trim().min(1).max(20),
});

export const updateBoardSchema = z
  .object({
    name: z.string().trim().min(1, 'Board name is required').max(80).optional(),
    labels: z.array(labelInputSchema).max(50).optional(),
  })
  .refine((data) => data.name !== undefined || data.labels !== undefined, {
    message: 'At least one of name or labels must be provided',
  });
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;
