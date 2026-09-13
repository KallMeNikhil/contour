import { apiRequest } from './client';
import type { AuthResult } from './types';

export interface RegisterPayload {
  email: string;
  password: string;
  name: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export function register(payload: RegisterPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/register', {
    method: 'POST',
    body: payload,
    skipAuth: true,
  });
}

export function login(payload: LoginPayload): Promise<AuthResult> {
  return apiRequest<AuthResult>('/auth/login', { method: 'POST', body: payload, skipAuth: true });
}
