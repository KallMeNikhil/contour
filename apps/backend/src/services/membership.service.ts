import crypto from 'node:crypto';
import { ForbiddenError, NotFoundError, ConflictError } from '../errors/AppError.js';
import { workspaceMembershipRepository } from '../repositories/WorkspaceMembershipRepository.js';
import { workspaceRepository } from '../repositories/WorkspaceRepository.js';
import { userRepository } from '../repositories/UserRepository.js';
import type { HydratedDocument, Types } from 'mongoose';
import type { WorkspaceMembershipDoc } from '../models/WorkspaceMembership.js';
import type { UserDoc } from '../models/User.js';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

const ROLE_RANK: Record<WorkspaceRole, number> = { viewer: 0, editor: 1, owner: 2 };

export function roleAtLeast(role: WorkspaceRole, minRole: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minRole];
}

export async function assertWorkspaceRole(
  userId: string,
  workspaceId: Types.ObjectId | string,
  minRole: WorkspaceRole,
): Promise<HydratedDocument<WorkspaceMembershipDoc>> {
  const workspace = await workspaceRepository.findById(workspaceId as string);
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }

  const membership = await workspaceMembershipRepository.findActive(workspaceId, userId);
  if (!membership) {
    throw new ForbiddenError('You are not a member of this workspace');
  }
  if (!roleAtLeast(membership.role as WorkspaceRole, minRole)) {
    throw new ForbiddenError('You do not have permission to perform this action');
  }
  return membership;
}

export async function listMembers(workspaceId: string) {
  const memberships = await workspaceMembershipRepository.listAllForWorkspaceWithUser(workspaceId);
  return memberships.map((m) => {
    const user = m.userId as unknown as HydratedDocument<UserDoc> | Types.ObjectId;
    const populated = user && typeof user === 'object' && 'email' in user ? user : null;
    return {
      userId: populated ? populated._id.toString() : (m.userId as Types.ObjectId).toString(),
      role: m.role,
      status: m.status,
      name: populated?.name ?? null,
      email: populated?.email ?? null,
    };
  });
}

export async function inviteMember(
  workspaceId: string,
  email: string,
  role: 'editor' | 'viewer',
): Promise<{ membership: HydratedDocument<WorkspaceMembershipDoc>; inviteToken: string }> {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError('Workspace not found');

  const invitedUser = await userRepository.findByEmail(email);
  if (!invitedUser) {
    throw new NotFoundError('No Contour account exists for that email address');
  }

  const existing = await workspaceMembershipRepository.findAny(workspaceId, invitedUser._id);
  if (existing) {
    throw new ConflictError(
      existing.status === 'active'
        ? 'This user is already a member of the workspace'
        : 'This user already has a pending invite to the workspace',
    );
  }

  const inviteToken = crypto.randomBytes(24).toString('hex');
  const membership = await workspaceMembershipRepository.create({
    workspaceId,
    userId: invitedUser._id,
    role,
    status: 'pending',
    inviteToken,
  });
  return { membership, inviteToken };
}

export async function acceptInvite(inviteToken: string, userId: string) {
  const membership = await workspaceMembershipRepository.findByInviteToken(inviteToken);
  if (!membership) throw new NotFoundError('This invite link is invalid or has already been used');
  if (membership.userId.toString() !== userId) {
    throw new ForbiddenError('This invite was issued to a different account');
  }
  membership.status = 'active';
  membership.inviteToken = undefined;
  await membership.save();
  return membership;
}

export async function removeMember(workspaceId: string, targetUserId: string): Promise<void> {
  const workspace = await workspaceRepository.findById(workspaceId);
  if (!workspace) throw new NotFoundError('Workspace not found');
  if (workspace.ownerId.toString() === targetUserId) {
    throw new ForbiddenError('The workspace owner cannot be removed');
  }
  const result = await workspaceMembershipRepository.deleteOne(workspaceId, targetUserId);
  if (result.deletedCount === 0) {
    throw new NotFoundError('Membership not found');
  }
}
