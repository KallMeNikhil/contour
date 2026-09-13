import { Router } from 'express';
import { updateColumnSchema, moveColumnSchema, createTaskSchema } from '@contour/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireColumnRole } from '../middleware/authz.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getColumnHandler,
  updateColumnHandler,
  moveColumnHandler,
  deleteColumnHandler,
} from '../controllers/column.controller.js';
import { createTaskHandler } from '../controllers/task.controller.js';

export const columnRouter = Router();

columnRouter.use(requireAuth);

columnRouter.get('/:id', requireColumnRole('viewer'), asyncHandler(getColumnHandler));
columnRouter.patch(
  '/:id',
  requireColumnRole('editor'),
  validateBody(updateColumnSchema),
  asyncHandler(updateColumnHandler),
);

columnRouter.patch(
  '/:id/move',
  requireColumnRole('editor'),
  validateBody(moveColumnSchema),
  asyncHandler(moveColumnHandler),
);

columnRouter.delete('/:id', requireColumnRole('editor'), asyncHandler(deleteColumnHandler));

columnRouter.post(
  '/:id/tasks',
  requireColumnRole('editor'),
  validateBody(createTaskSchema),
  asyncHandler(createTaskHandler),
);
