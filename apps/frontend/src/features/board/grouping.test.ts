import { describe, expect, it } from 'vitest';
import { groupTasksByColumn, sortedColumns } from './grouping';
import type { Column, Task } from '../../services/api/types';

function makeColumn(id: string, position: number): Column {
  return { _id: id, boardId: 'b1', name: id, position, createdAt: '', updatedAt: '' };
}

function makeTask(id: string, columnId: string, position: number): Task {
  return {
    _id: id,
    boardId: 'b1',
    columnId,
    title: id,
    description: '',
    assigneeId: null,
    labelIds: [],
    dueDate: null,
    position,
    version: 0,
    createdAt: '',
    updatedAt: '',
  };
}

describe('sortedColumns', () => {
  it('sorts columns ascending by position', () => {
    const columns = [makeColumn('c2', 2), makeColumn('c1', 1), makeColumn('c3', 3)];
    expect(sortedColumns(columns).map((c) => c._id)).toEqual(['c1', 'c2', 'c3']);
  });

  it('does not mutate the input array', () => {
    const columns = [makeColumn('c2', 2), makeColumn('c1', 1)];
    const original = [...columns];
    sortedColumns(columns);
    expect(columns).toEqual(original);
  });
});

describe('groupTasksByColumn', () => {
  it('groups tasks under their column id, sorted by position', () => {
    const columns = [makeColumn('c1', 1), makeColumn('c2', 2)];
    const tasks = [
      makeTask('t1', 'c1', 2000),
      makeTask('t2', 'c1', 1000),
      makeTask('t3', 'c2', 500),
    ];

    const grouped = groupTasksByColumn(columns, tasks);

    expect(grouped.get('c1')?.map((t) => t._id)).toEqual(['t2', 't1']);
    expect(grouped.get('c2')?.map((t) => t._id)).toEqual(['t3']);
  });

  it('gives every column an entry, even with no tasks', () => {
    const columns = [makeColumn('c1', 1), makeColumn('c2', 2)];
    const grouped = groupTasksByColumn(columns, []);
    expect(grouped.get('c1')).toEqual([]);
    expect(grouped.get('c2')).toEqual([]);
  });

  it('drops tasks pointing at a column not in the list', () => {
    const columns = [makeColumn('c1', 1)];
    const tasks = [makeTask('t1', 'c-orphan', 100)];
    const grouped = groupTasksByColumn(columns, tasks);
    expect(grouped.get('c1')).toEqual([]);
  });
});
