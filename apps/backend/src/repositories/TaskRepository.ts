import { BaseRepository } from './BaseRepository.js';
import { Task, type TaskDoc } from '../models/Task.js';
import { POSITION_GAP } from '../services/ordering.js';
import type { Types } from 'mongoose';

export interface CreateTaskData {
  boardId: Types.ObjectId | string;
  columnId: Types.ObjectId | string;
  title: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
  position: number;
}

export interface TaskContentFields {
  title?: string;
  description?: string;
  assigneeId?: string | null;
  labelIds?: string[];
  dueDate?: string | null;
}

export class TaskRepository extends BaseRepository<TaskDoc> {
  constructor() {
    super(Task);
  }

  async create(data: CreateTaskData) {
    return Task.create(data);
  }

  async nextPosition(columnId: Types.ObjectId | string): Promise<number> {
    const last = await Task.findOne({ columnId }).sort({ position: -1 }).exec();
    return (last?.position ?? 0) + POSITION_GAP;
  }

  async listByColumn(columnId: Types.ObjectId | string) {
    return Task.find({ columnId }).sort({ position: 1 }).exec();
  }

  async listByBoard(boardId: Types.ObjectId | string) {
    return Task.find({ boardId }).sort({ position: 1 }).exec();
  }

  async findManyByIds(ids: (Types.ObjectId | string)[]) {
    if (ids.length === 0) return [];
    return Task.find({ _id: { $in: ids } }).exec();
  }

  async updateContentVersioned(id: string, expectedVersion: number, fields: TaskContentFields) {
    return Task.findOneAndUpdate(
      { _id: id, version: expectedVersion },
      { $set: fields, $inc: { version: 1 } },
      { new: true, runValidators: true },
    ).exec();
  }

  async updatePosition(
    id: string,
    fields: {
      columnId: Types.ObjectId | string;
      boardId: Types.ObjectId | string;
      position: number;
    },
  ) {
    return Task.findByIdAndUpdate(id, { $set: fields }, { new: true, runValidators: true }).exec();
  }

  async bulkSetPositions(
    updates: {
      id: Types.ObjectId | string;
      position: number;
      columnId?: Types.ObjectId;
      boardId?: Types.ObjectId;
    }[],
  ) {
    if (updates.length === 0) return;
    await Task.bulkWrite(
      updates.map((u) => ({
        updateOne: {
          filter: { _id: u.id },
          update: {
            $set: {
              position: u.position,
              ...(u.columnId !== undefined ? { columnId: u.columnId } : {}),
              ...(u.boardId !== undefined ? { boardId: u.boardId } : {}),
            },
          },
        },
      })),
    );
  }

  async deleteById(id: string) {
    return Task.findByIdAndDelete(id).exec();
  }

  async deleteByBoard(boardId: Types.ObjectId | string) {
    return Task.deleteMany({ boardId }).exec();
  }

  async deleteByColumn(columnId: Types.ObjectId | string) {
    return Task.deleteMany({ columnId }).exec();
  }
}

export const taskRepository = new TaskRepository();
