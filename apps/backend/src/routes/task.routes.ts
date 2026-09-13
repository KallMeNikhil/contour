import { Router } from 'express';
import { updateTaskSchema, moveTaskSchema } from '@contour/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireTaskRole } from '../middleware/authz.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  updateTaskHandler,
  moveTaskHandler,
  deleteTaskHandler,
} from '../controllers/task.controller.js';

export const taskRouter = Router();

taskRouter.use(requireAuth);

taskRouter.patch(
  '/:id',
  requireTaskRole('editor'),
  validateBody(updateTaskSchema),
  asyncHandler(updateTaskHandler),
);

taskRouter.patch(
  '/:id/move',
  requireTaskRole('editor'),
  validateBody(moveTaskSchema),
  asyncHandler(moveTaskHandler),
);

taskRouter.delete('/:id', requireTaskRole('editor'), asyncHandler(deleteTaskHandler));
