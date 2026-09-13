import { Router } from 'express';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  createBoardSchema,
  inviteMemberSchema,
} from '@contour/shared';
import { requireAuth } from '../middleware/auth.middleware.js';
import { requireWorkspaceRole } from '../middleware/authz.middleware.js';
import { validateBody } from '../middleware/validate.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import {
  listWorkspacesHandler,
  createWorkspaceHandler,
  getWorkspaceHandler,
  updateWorkspaceHandler,
  deleteWorkspaceHandler,
  listMembersHandler,
  inviteMemberHandler,
  acceptInviteHandler,
  removeMemberHandler,
} from '../controllers/workspace.controller.js';
import { listBoardsHandler, createBoardHandler } from '../controllers/board.controller.js';

export const workspaceRouter = Router();

workspaceRouter.use(requireAuth);

workspaceRouter.get('/', asyncHandler(listWorkspacesHandler));
workspaceRouter.post(
  '/',
  validateBody(createWorkspaceSchema),
  asyncHandler(createWorkspaceHandler),
);

workspaceRouter.get('/:id', requireWorkspaceRole('viewer'), asyncHandler(getWorkspaceHandler));
workspaceRouter.patch(
  '/:id',
  requireWorkspaceRole('owner'),
  validateBody(updateWorkspaceSchema),
  asyncHandler(updateWorkspaceHandler),
);
workspaceRouter.delete('/:id', requireWorkspaceRole('owner'), asyncHandler(deleteWorkspaceHandler));

workspaceRouter.get(
  '/:id/members',
  requireWorkspaceRole('viewer'),
  asyncHandler(listMembersHandler),
);
workspaceRouter.post(
  '/:id/invites',
  requireWorkspaceRole('editor'),
  validateBody(inviteMemberSchema),
  asyncHandler(inviteMemberHandler),
);

workspaceRouter.post('/:id/invites/:token/accept', asyncHandler(acceptInviteHandler));
workspaceRouter.delete(
  '/:id/members/:userId',
  requireWorkspaceRole('owner'),
  asyncHandler(removeMemberHandler),
);

workspaceRouter.get('/:id/boards', requireWorkspaceRole('viewer'), asyncHandler(listBoardsHandler));
workspaceRouter.post(
  '/:id/boards',
  requireWorkspaceRole('editor'),
  validateBody(createBoardSchema),
  asyncHandler(createBoardHandler),
);
