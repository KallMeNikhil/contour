import type { Column } from '../../services/api/types';

interface ColumnSwitcherProps {
  columns: Column[];
  activeColumnId: string | null;
  onSelect: (columnId: string) => void;
}

export function ColumnSwitcher({ columns, activeColumnId, onSelect }: ColumnSwitcherProps) {
  return (
    <div
      role="tablist"
      aria-label="Columns"
      className="flex shrink-0 gap-1 overflow-x-auto border-b border-border-default bg-surface/70 px-2 py-1.5 backdrop-blur-sm"
    >
      {columns.map((column) => {
        const isActive = column._id === activeColumnId;
        return (
          <button
            key={column._id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(column._id)}
            className={`min-h-[44px] shrink-0 rounded-md px-3 text-body-medium transition-colors duration-micro ${
              isActive
                ? 'bg-accent-soft text-accent'
                : 'text-secondary hover:bg-surface-hover hover:text-primary'
            }`}
          >
            {column.name}
          </button>
        );
      })}
    </div>
  );
}
