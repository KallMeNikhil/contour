export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthResult {
  user: PublicUser;
  token: string;
}

export interface Workspace {
  _id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceWithRole extends Workspace {
  role: WorkspaceRole;
}

export interface WorkspaceMemberSummary {
  userId: string;
  role: WorkspaceRole;

  name: string | null;
  email: string | null;
}

export interface WorkspaceMember extends WorkspaceMemberSummary {
  status: 'active' | 'pending';
}

export interface WorkspaceInviteResult {
  userId: string;
  role: WorkspaceRole;
  status: 'pending';
  inviteToken: string;
}

export interface WorkspaceDetail extends Workspace {
  role?: WorkspaceRole;
  members: WorkspaceMemberSummary[];
}

export interface BoardLabel {
  _id: string;
  name: string;
  color: string;
}

export interface Board {
  _id: string;
  workspaceId: string;
  name: string;
  labels: BoardLabel[];
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  boardId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  boardId: string;
  columnId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  labelIds: string[];
  dueDate: string | null;
  position: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface BoardFull {
  board: Board;
  columns: Column[];
  tasks: Task[];
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'INVARIANT_VIOLATION'
  | 'INTERNAL_ERROR'
  | 'NETWORK_ERROR';

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
