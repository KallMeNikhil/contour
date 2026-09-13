import { BaseRepository } from './BaseRepository.js';
import { Board, type BoardDoc } from '../models/Board.js';
import type { Types } from 'mongoose';

export class BoardRepository extends BaseRepository<BoardDoc> {
  constructor() {
    super(Board);
  }

  async create(data: { workspaceId: Types.ObjectId | string; name: string }) {
    return Board.create(data);
  }

  async listByWorkspace(workspaceId: Types.ObjectId | string) {
    return Board.find({ workspaceId }).sort({ createdAt: 1 }).exec();
  }

  async updateFields(
    id: string,
    fields: Partial<{ name: string; labels: { name: string; color: string }[] }>,
  ) {
    return Board.findByIdAndUpdate(id, fields, { new: true, runValidators: true }).exec();
  }

  async deleteById(id: string) {
    return Board.findByIdAndDelete(id).exec();
  }
}

export const boardRepository = new BoardRepository();
