import type { Model, Types, HydratedDocument } from 'mongoose';

export class BaseRepository<T> {
  constructor(protected readonly model: Model<T>) {}

  async findById(id: string | Types.ObjectId): Promise<HydratedDocument<T> | null> {
    return this.model.findById(id).exec();
  }

  async existsById(id: string | Types.ObjectId): Promise<boolean> {
    const doc = await this.model.exists({ _id: id }).exec();
    return doc !== null;
  }
}
