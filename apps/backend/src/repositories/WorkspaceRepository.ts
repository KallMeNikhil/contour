import { BaseRepository } from './BaseRepository.js';
import { Workspace, type WorkspaceDoc } from '../models/Workspace.js';
import type { Types } from 'mongoose';

export class WorkspaceRepository extends BaseRepository<WorkspaceDoc> {
  constructor() {
    super(Workspace);
  }

  async create(data: { name: string; ownerId: Types.ObjectId | string }) {
    return Workspace.create(data);
  }

  async updateName(id: string, name: string) {
    return Workspace.findByIdAndUpdate(id, { name }, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string) {
    return Workspace.findByIdAndDelete(id).exec();
  }

  async findByIds(ids: (Types.ObjectId | string)[]) {
    return Workspace.find({ _id: { $in: ids } }).exec();
  }
}

export const workspaceRepository = new WorkspaceRepository();
