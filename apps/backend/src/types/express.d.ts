import type { HydratedDocument } from 'mongoose';
import type { BoardDoc } from '../models/Board.js';
import type { ColumnDoc } from '../models/Column.js';
import type { TaskDoc } from '../models/Task.js';
import type { WorkspaceMembershipDoc } from '../models/WorkspaceMembership.js';

declare global {
  namespace Express {
    interface Request {
      user?: { id: string };

      membership?: HydratedDocument<WorkspaceMembershipDoc>;
      workspaceId?: string;
      board?: HydratedDocument<BoardDoc>;
      column?: HydratedDocument<ColumnDoc>;

      task?: HydratedDocument<TaskDoc>;
    }
  }
}

export {};
