import { describe, expect, it } from 'vitest';
import { moveColumnWithinOrder, resolveColumnMovePayload } from './columnOrdering';

describe('moveColumnWithinOrder', () => {
  it('moves a column from the front to the end', () => {
    expect(moveColumnWithinOrder(['a', 'b', 'c'], 'a', 2)).toEqual(['b', 'c', 'a']);
  });

  it('moves a column from the end to the front', () => {
    expect(moveColumnWithinOrder(['a', 'b', 'c'], 'c', 0)).toEqual(['c', 'a', 'b']);
  });

  it('swaps two adjacent columns', () => {
    expect(moveColumnWithinOrder(['a', 'b'], 'b', 0)).toEqual(['b', 'a']);
  });

  it('is a no-op when dropped back in the same spot', () => {
    expect(moveColumnWithinOrder(['a', 'b', 'c'], 'b', 1)).toEqual(['a', 'b', 'c']);
  });

  it('clamps an out-of-range index', () => {
    expect(moveColumnWithinOrder(['a', 'b', 'c'], 'a', 99)).toEqual(['b', 'c', 'a']);
    expect(moveColumnWithinOrder(['a', 'b', 'c'], 'c', -5)).toEqual(['c', 'a', 'b']);
  });

  it('handles a single-column board', () => {
    expect(moveColumnWithinOrder(['only'], 'only', 0)).toEqual(['only']);
  });
});

describe('resolveColumnMovePayload', () => {
  it('resolves neighbors for a column moved to the middle', () => {
    expect(resolveColumnMovePayload(['a', 'c', 'b'], 'c')).toEqual({
      beforeColumnId: 'a',
      afterColumnId: 'b',
    });
  });

  it('resolves an undefined beforeColumnId for a column moved to the front', () => {
    expect(resolveColumnMovePayload(['b', 'a'], 'b')).toEqual({
      beforeColumnId: undefined,
      afterColumnId: 'a',
    });
  });

  it('resolves an undefined afterColumnId for a column moved to the end', () => {
    expect(resolveColumnMovePayload(['a', 'b'], 'b')).toEqual({
      beforeColumnId: 'a',
      afterColumnId: undefined,
    });
  });

  it('resolves no neighbors for the only column on the board', () => {
    expect(resolveColumnMovePayload(['only'], 'only')).toEqual({
      beforeColumnId: undefined,
      afterColumnId: undefined,
    });
  });
});
