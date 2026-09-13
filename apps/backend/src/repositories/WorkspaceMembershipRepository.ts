import { BaseRepository } from './BaseRepository.js';
import { WorkspaceMembership, type WorkspaceMembershipDoc } from '../models/WorkspaceMembership.js';
import type { Types } from 'mongoose';

export class WorkspaceMembershipRepository extends BaseRepository<WorkspaceMembershipDoc> {
  constructor() {
    super(WorkspaceMembership);
  }

  async create(data: {
    workspaceId: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    role: 'owner' | 'editor' | 'viewer';
    status?: 'active' | 'pending';
    inviteToken?: string;
  }) {
    return WorkspaceMembership.create({ status: 'active', ...data });
  }

  async findActive(workspaceId: Types.ObjectId | string, userId: Types.ObjectId | string) {
    return WorkspaceMembership.findOne({ workspaceId, userId, status: 'active' }).exec();
  }

  async findAny(workspaceId: Types.ObjectId | string, userId: Types.ObjectId | string) {
    return WorkspaceMembership.findOne({ workspaceId, userId }).exec();
  }

  async findByInviteToken(inviteToken: string) {
    return WorkspaceMembership.findOne({ inviteToken, status: 'pending' }).exec();
  }

  async listActiveForUser(userId: Types.ObjectId | string) {
    return WorkspaceMembership.find({ userId, status: 'active' }).exec();
  }

  async listActiveForWorkspaceWithUser(workspaceId: Types.ObjectId | string) {
    return WorkspaceMembership.find({ workspaceId, status: 'active' })
      .populate('userId', 'name email')
      .exec();
  }

  async listAllForWorkspaceWithUser(workspaceId: Types.ObjectId | string) {
    return WorkspaceMembership.find({ workspaceId, status: { $in: ['active', 'pending'] } })
      .populate('userId', 'name email')
      .exec();
  }

  async deleteByWorkspace(workspaceId: Types.ObjectId | string) {
    return WorkspaceMembership.deleteMany({ workspaceId }).exec();
  }

  async deleteOne(workspaceId: Types.ObjectId | string, userId: Types.ObjectId | string) {
    return WorkspaceMembership.deleteOne({ workspaceId, userId }).exec();
  }
}

export const workspaceMembershipRepository = new WorkspaceMembershipRepository();
