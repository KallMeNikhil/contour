import { BaseRepository } from './BaseRepository.js';
import { Column, type ColumnDoc } from '../models/Column.js';
import type { Types } from 'mongoose';

const POSITION_GAP = 1000;

export class ColumnRepository extends BaseRepository<ColumnDoc> {
  constructor() {
    super(Column);
  }

  async create(data: { boardId: Types.ObjectId | string; name: string; position: number }) {
    return Column.create(data);
  }

  async listByBoard(boardId: Types.ObjectId | string) {
    return Column.find({ boardId }).sort({ position: 1 }).exec();
  }

  async nextPosition(boardId: Types.ObjectId | string): Promise<number> {
    const last = await Column.findOne({ boardId }).sort({ position: -1 }).exec();
    return (last?.position ?? 0) + POSITION_GAP;
  }

  async updateName(id: string, name: string) {
    return Column.findByIdAndUpdate(id, { name }, { new: true, runValidators: true }).exec();
  }

  async findManyByIds(ids: (Types.ObjectId | string)[]) {
    if (ids.length === 0) return [];
    return Column.find({ _id: { $in: ids } }).exec();
  }

  async updatePosition(id: string, position: number) {
    return Column.findByIdAndUpdate(id, { $set: { position } }, { new: true }).exec();
  }

  async bulkSetPositions(updates: { id: Types.ObjectId | string; position: number }[]) {
    if (updates.length === 0) return;
    await Column.bulkWrite(
      updates.map((u) => ({
        updateOne: {
          filter: { _id: u.id },
          update: { $set: { position: u.position } },
        },
      })),
    );
  }

  async deleteById(id: string) {
    return Column.findByIdAndDelete(id).exec();
  }

  async deleteByBoard(boardId: Types.ObjectId | string) {
    return Column.deleteMany({ boardId }).exec();
  }
}

export const columnRepository = new ColumnRepository();
