import type { Request, Response } from 'express';
import { UnauthenticatedError } from '../errors/AppError.js';
import * as workspaceService from '../services/workspace.service.js';
import * as membershipService from '../services/membership.service.js';
import { workspaceMembershipRepository } from '../repositories/WorkspaceMembershipRepository.js';
import type { UserDoc } from '../models/User.js';
import type { HydratedDocument, Types } from 'mongoose';

function userId(req: Request): string {
  if (!req.user) throw new UnauthenticatedError();
  return req.user.id;
}

export async function listWorkspacesHandler(req: Request, res: Response): Promise<void> {
  const results = await workspaceService.listWorkspacesForUser(userId(req));
  res.json(results.map(({ workspace, role }) => ({ ...workspace.toJSON(), role })));
}

export async function createWorkspaceHandler(req: Request, res: Response): Promise<void> {
  const workspace = await workspaceService.createWorkspace(userId(req), req.body.name);
  res.status(201).json({ ...workspace.toJSON(), role: 'owner' });
}

export async function getWorkspaceHandler(req: Request, res: Response): Promise<void> {
  const workspace = await workspaceService.getWorkspaceById(req.params.id);
  const members = await workspaceMembershipRepository.listActiveForWorkspaceWithUser(req.params.id);
  res.json({
    ...workspace.toJSON(),
    role: req.membership?.role,

    members: members.map((m) => {
      const user = m.userId as unknown as HydratedDocument<UserDoc> | Types.ObjectId;
      const populated = user && typeof user === 'object' && 'email' in user ? user : null;
      return {
        userId: populated ? populated._id.toString() : (m.userId as Types.ObjectId).toString(),
        role: m.role,
        name: populated?.name ?? null,
        email: populated?.email ?? null,
      };
    }),
  });
}

export async function listMembersHandler(req: Request, res: Response): Promise<void> {
  const members = await membershipService.listMembers(req.params.id);
  res.json(members);
}

export async function inviteMemberHandler(req: Request, res: Response): Promise<void> {
  const { membership, inviteToken } = await membershipService.inviteMember(
    req.params.id,
    req.body.email,
    req.body.role,
  );

  res.status(201).json({
    userId: membership.userId.toString(),
    role: membership.role,
    status: membership.status,
    inviteToken,
  });
}

export async function acceptInviteHandler(req: Request, res: Response): Promise<void> {
  const membership = await membershipService.acceptInvite(req.params.token, userId(req));
  res.json({
    workspaceId: membership.workspaceId.toString(),
    role: membership.role,
    status: membership.status,
  });
}

export async function removeMemberHandler(req: Request, res: Response): Promise<void> {
  await membershipService.removeMember(req.params.id, req.params.userId);
  res.status(204).send();
}

export async function updateWorkspaceHandler(req: Request, res: Response): Promise<void> {
  const workspace = await workspaceService.updateWorkspace(req.params.id, req.body.name);
  res.json(workspace);
}

export async function deleteWorkspaceHandler(req: Request, res: Response): Promise<void> {
  await workspaceService.deleteWorkspace(req.params.id);
  res.status(204).send();
}
