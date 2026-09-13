import type { ErrorCode } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api/v1';

const TOKEN_STORAGE_KEY = 'contour.token';

export class ApiError extends Error {
  readonly status: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(status: number, code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

type UnauthenticatedListener = () => void;
let unauthenticatedListener: UnauthenticatedListener | null = null;
export function onUnauthenticated(listener: UnauthenticatedListener): void {
  unauthenticatedListener = listener;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;

  skipAuth?: boolean;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, skipAuth = false } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!skipAuth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    void 0;
  }

  if (!response.ok) {
    const envelopeError = (
      payload as { error?: { code?: ErrorCode; message?: string; details?: unknown } }
    )?.error;
    const code = envelopeError?.code ?? 'INTERNAL_ERROR';
    const message = envelopeError?.message ?? `Request failed with status ${response.status}`;
    if (response.status === 401) {
      unauthenticatedListener?.();
    }
    throw new ApiError(response.status, code, message, envelopeError?.details);
  }

  return payload as T;
}
