import { z } from 'zod';

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;
const objectId = (label: string) => z.string().regex(OBJECT_ID_RE, `${label} must be a valid id`);

const titleSchema = z.string().trim().min(1, 'Task title is required').max(200);
const descriptionSchema = z.string().max(10000).optional();
const assigneeIdSchema = objectId('assigneeId').nullable().optional();
const labelIdsSchema = z.array(objectId('labelIds')).max(50).optional();

const dueDateSchema = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'dueDate must be a valid date')
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  assigneeId: assigneeIdSchema,
  labelIds: labelIdsSchema,
  dueDate: dueDateSchema,
});
export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema,
    assigneeId: assigneeIdSchema,
    labelIds: labelIdsSchema,
    dueDate: dueDateSchema,
    version: z.number().int().nonnegative('version is required'),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.description !== undefined ||
      data.assigneeId !== undefined ||
      data.labelIds !== undefined ||
      data.dueDate !== undefined,
    { message: 'At least one editable field must be provided' },
  );
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;

export const moveTaskSchema = z
  .object({
    columnId: objectId('columnId'),
    beforeTaskId: objectId('beforeTaskId').optional(),
    afterTaskId: objectId('afterTaskId').optional(),
  })
  .refine((data) => data.beforeTaskId !== data.afterTaskId || data.beforeTaskId === undefined, {
    message: 'beforeTaskId and afterTaskId must be different',
  });
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
