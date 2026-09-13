import { ConflictError, UnauthenticatedError } from '../errors/AppError.js';
import { userRepository } from '../repositories/UserRepository.js';
import { hashPassword, verifyPassword } from './password.service.js';
import { signAccessToken } from './jwt.service.js';
import { toPublicUser, type PublicUser } from '../dto/user.dto.js';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export async function register(input: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  const existing = await userRepository.findByEmail(input.email);
  if (existing) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await userRepository.create({
    email: input.email,
    passwordHash,
    name: input.name,
  });

  const token = signAccessToken(user._id.toString());
  return { user: toPublicUser(user), token };
}

export async function login(input: { email: string; password: string }): Promise<AuthResult> {
  const user = await userRepository.findByEmailWithPassword(input.email);

  if (!user) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) {
    throw new UnauthenticatedError('Invalid email or password');
  }

  const token = signAccessToken(user._id.toString());
  return { user: toPublicUser(user), token };
}
