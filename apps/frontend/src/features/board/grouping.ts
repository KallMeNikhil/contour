import type { Column, Task } from '../../services/api/types';

export function groupTasksByColumn(columns: Column[], tasks: Task[]): Map<string, Task[]> {
  const byColumn = new Map<string, Task[]>();
  for (const column of columns) {
    byColumn.set(column._id, []);
  }
  for (const task of tasks) {
    const list = byColumn.get(task.columnId);
    if (list) list.push(task);
  }
  for (const list of byColumn.values()) {
    list.sort((a, b) => a.position - b.position);
  }
  return byColumn;
}

export function sortedColumns(columns: Column[]): Column[] {
  return [...columns].sort((a, b) => a.position - b.position);
}
