import { describe, expect, it } from 'vitest';
import {
  withoutTask,
  neighborsForInsertion,
  buildColumnOrder,
  moveWithinOrder,
  resolveMovePayload,
} from './ordering';

describe('withoutTask', () => {
  it('removes the given id from the list', () => {
    expect(withoutTask(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
  });

  it('is a no-op when the id is absent', () => {
    expect(withoutTask(['a', 'b'], 'zzz')).toEqual(['a', 'b']);
  });

  it('handles an empty list', () => {
    expect(withoutTask([], 'a')).toEqual([]);
  });
});

describe('neighborsForInsertion', () => {
  it('returns no neighbors for an empty column (only item)', () => {
    expect(neighborsForInsertion([], 0)).toEqual({
      beforeTaskId: undefined,
      afterTaskId: undefined,
    });
  });

  it('returns only an afterTaskId when inserting first', () => {
    expect(neighborsForInsertion(['b', 'c'], 0)).toEqual({
      beforeTaskId: undefined,
      afterTaskId: 'b',
    });
  });

  it('returns only a beforeTaskId when inserting last', () => {
    expect(neighborsForInsertion(['a', 'b'], 2)).toEqual({
      beforeTaskId: 'b',
      afterTaskId: undefined,
    });
  });

  it('returns both neighbors for a middle insertion', () => {
    expect(neighborsForInsertion(['a', 'b', 'c'], 1)).toEqual({
      beforeTaskId: 'a',
      afterTaskId: 'b',
    });
  });

  it('clamps a negative index to the start', () => {
    expect(neighborsForInsertion(['a', 'b'], -5)).toEqual({
      beforeTaskId: undefined,
      afterTaskId: 'a',
    });
  });

  it('clamps an out-of-range index to the end', () => {
    expect(neighborsForInsertion(['a', 'b'], 99)).toEqual({
      beforeTaskId: 'b',
      afterTaskId: undefined,
    });
  });
});

describe('buildColumnOrder', () => {
  it('builds an id-only map from grouped tasks', () => {
    const tasksByColumn = new Map([
      ['col-1', [{ _id: 't1' }, { _id: 't2' }]],
      ['col-2', [] as { _id: string }[]],
    ]);
    expect(buildColumnOrder(tasksByColumn)).toEqual({ 'col-1': ['t1', 't2'], 'col-2': [] });
  });
});

describe('moveWithinOrder', () => {
  const base = { 'col-1': ['a', 'b', 'c'], 'col-2': ['x', 'y'] };

  it('moves a task upward within the same column', () => {
    const result = moveWithinOrder(base, 'c', 'col-1', 'col-1', 0);
    expect(result['col-1']).toEqual(['c', 'a', 'b']);
  });

  it('moves a task downward within the same column', () => {
    const result = moveWithinOrder(base, 'a', 'col-1', 'col-1', 2);
    expect(result['col-1']).toEqual(['b', 'c', 'a']);
  });

  it('moves a task to the first position within its column', () => {
    const result = moveWithinOrder(base, 'c', 'col-1', 'col-1', 0);
    expect(result['col-1'][0]).toBe('c');
  });

  it('moves a task to the last position within its column', () => {
    const result = moveWithinOrder(base, 'a', 'col-1', 'col-1', 99);
    expect(result['col-1']).toEqual(['b', 'c', 'a']);
  });

  it('drops a task between two others in the same column', () => {
    const result = moveWithinOrder(base, 'a', 'col-1', 'col-1', 1);
    expect(result['col-1']).toEqual(['b', 'a', 'c']);
  });

  it('moves a task into another populated column', () => {
    const result = moveWithinOrder(base, 'b', 'col-1', 'col-2', 1);
    expect(result['col-1']).toEqual(['a', 'c']);
    expect(result['col-2']).toEqual(['x', 'b', 'y']);
  });

  it('moves a task into an empty column', () => {
    const withEmpty = { 'col-1': ['a', 'b'], 'col-2': [] };
    const result = moveWithinOrder(withEmpty, 'a', 'col-1', 'col-2', 0);
    expect(result['col-1']).toEqual(['b']);
    expect(result['col-2']).toEqual(['a']);
  });

  it('moves a task from a populated column back to an empty-after-removal source', () => {
    const single = { 'col-1': ['a'], 'col-2': ['x'] };
    const result = moveWithinOrder(single, 'a', 'col-1', 'col-2', 1);
    expect(result['col-1']).toEqual([]);
    expect(result['col-2']).toEqual(['x', 'a']);
  });

  it('moving a task back into its original column at the same index is a no-op ordering-wise', () => {
    const result = moveWithinOrder(base, 'b', 'col-1', 'col-1', 1);
    expect(result['col-1']).toEqual(['a', 'b', 'c']);
  });

  it('never leaves the dragged task duplicated or acting as its own neighbor', () => {
    const result = moveWithinOrder(base, 'b', 'col-1', 'col-1', 0);
    const occurrences = result['col-1'].filter((id) => id === 'b').length;
    expect(occurrences).toBe(1);
    expect(result['col-1'][0]).toBe('b');

    expect(result['col-1'][1]).not.toBe('b');
  });

  it('is idempotent when the source column key is missing', () => {
    const result = moveWithinOrder({ 'col-2': ['x'] }, 'a', 'col-1', 'col-2', 1);
    expect(result['col-1']).toEqual([]);
    expect(result['col-2']).toEqual(['x', 'a']);
  });
});

describe('resolveMovePayload', () => {
  it('resolves an empty-column drop to no neighbors', () => {
    const order = { 'col-2': ['t1'] };
    expect(resolveMovePayload(order, 't1', 'col-2')).toEqual({ columnId: 'col-2' });
  });

  it('resolves a first-position drop', () => {
    const order = { 'col-1': ['t1', 'a', 'b'] };
    expect(resolveMovePayload(order, 't1', 'col-1')).toEqual({
      columnId: 'col-1',
      afterTaskId: 'a',
    });
  });

  it('resolves a last-position drop', () => {
    const order = { 'col-1': ['a', 'b', 't1'] };
    expect(resolveMovePayload(order, 't1', 'col-1')).toEqual({
      columnId: 'col-1',
      beforeTaskId: 'b',
    });
  });

  it('resolves a middle drop', () => {
    const order = { 'col-1': ['a', 't1', 'b'] };
    expect(resolveMovePayload(order, 't1', 'col-1')).toEqual({
      columnId: 'col-1',
      beforeTaskId: 'a',
      afterTaskId: 'b',
    });
  });

  it('falls back to appending when the task is absent from the target order', () => {
    const order = { 'col-1': ['a', 'b'] };
    expect(resolveMovePayload(order, 'missing', 'col-1')).toEqual({
      columnId: 'col-1',
      beforeTaskId: 'b',
    });
  });
});
