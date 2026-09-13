import { InlineEditableText } from '../../components/InlineEditableText';
import type { Board, Column, Task } from '../../services/api/types';

interface BoardHeaderProps {
  board: Board;
  columns: Column[];
  tasks: Task[];
  canEdit: boolean;
  onRename: (name: string) => Promise<void>;
}

export function BoardHeader({ board, columns, tasks, canEdit, onRename }: BoardHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-5">
      <h1 className="min-w-0 flex-1">
        <InlineEditableText
          value={board.name}
          onSave={onRename}
          canEdit={canEdit}
          maxLength={80}
          ariaLabel="Board name"
          className="font-display text-display-lg text-primary"
        />
      </h1>
      <span className="shrink-0 font-data text-data text-muted">
        {columns.length} column{columns.length === 1 ? '' : 's'} · {tasks.length} task
        {tasks.length === 1 ? '' : 's'}
      </span>
    </div>
  );
}
