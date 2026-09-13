import { Router } from 'express';
import { updateBoardSchema, createColumnSchema } from '@contour/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireBoardRole } from '../middleware/authz.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  getBoardFullHandler,
  updateBoardHandler,
  deleteBoardHandler,
} from '../controllers/board.controller.js';
import { createColumnHandler } from '../controllers/column.controller.js';

export const boardRouter = Router();

boardRouter.use(requireAuth);

boardRouter.get('/:id/full', requireBoardRole('viewer'), asyncHandler(getBoardFullHandler));
boardRouter.patch(
  '/:id',
  requireBoardRole('editor'),
  validateBody(updateBoardSchema),
  asyncHandler(updateBoardHandler),
);
boardRouter.delete('/:id', requireBoardRole('editor'), asyncHandler(deleteBoardHandler));

boardRouter.post(
  '/:id/columns',
  requireBoardRole('editor'),
  validateBody(createColumnSchema),
  asyncHandler(createColumnHandler),
);
