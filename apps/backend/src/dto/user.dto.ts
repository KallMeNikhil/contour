import type { HydratedDocument } from 'mongoose';
import type { UserDoc } from '../models/User.js';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export function toPublicUser(user: HydratedDocument<UserDoc>): PublicUser {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  };
}
