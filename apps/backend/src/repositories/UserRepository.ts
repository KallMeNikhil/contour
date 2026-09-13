import { BaseRepository } from './BaseRepository.js';
import { User, type UserDoc } from '../models/User.js';
import type { HydratedDocument } from 'mongoose';

export class UserRepository extends BaseRepository<UserDoc> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<HydratedDocument<UserDoc> | null> {
    return User.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<HydratedDocument<UserDoc> | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+passwordHash').exec();
  }

  async create(data: { email: string; passwordHash: string; name: string }) {
    return User.create(data);
  }
}

export const userRepository = new UserRepository();
