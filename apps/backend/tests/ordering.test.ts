import { describe, it, expect } from 'vitest';
import {
  computePosition,
  rebalancedPositions,
  POSITION_GAP,
  REBALANCE_THRESHOLD,
} from '../src/services/ordering.js';

describe('ordering: computePosition', () => {
  it('empty column: no neighbors -> initial gap position', () => {
    const { position, needsRebalance } = computePosition({});
    expect(position).toBe(POSITION_GAP);
    expect(needsRebalance).toBe(false);
  });

  it('single task in column, inserting after it (append)', () => {
    const { position, needsRebalance } = computePosition({ before: 1000 });
    expect(position).toBe(2000);
    expect(needsRebalance).toBe(false);
  });

  it('insert before the first task', () => {
    const { position, needsRebalance } = computePosition({ after: 1000 });
    expect(position).toBe(500);
    expect(needsRebalance).toBe(false);
  });

  it('insert between two tasks (midpoint)', () => {
    const { position, needsRebalance } = computePosition({ before: 1000, after: 2000 });
    expect(position).toBe(1500);
    expect(needsRebalance).toBe(false);
  });

  it('insert after the last task always grows monotonically, never needs rebalance', () => {
    const first = computePosition({ before: 0 });
    const second = computePosition({ before: first.position });
    expect(second.position).toBeGreaterThan(first.position);
    expect(first.needsRebalance).toBe(false);
    expect(second.needsRebalance).toBe(false);
  });

  it('narrowing gaps eventually cross the rebalance threshold', () => {
    const before = 1000;
    const after = 1000 + REBALANCE_THRESHOLD * 1.5;
    const first = computePosition({ before, after });
    expect(first.needsRebalance).toBe(false);

    const second = computePosition({ before: first.position, after });
    expect(after - first.position).toBeLessThan(REBALANCE_THRESHOLD);
    expect(second.needsRebalance).toBe(true);
  });

  it('insert-before-first flags rebalance once the neighbor is already near zero', () => {
    const result = computePosition({ after: REBALANCE_THRESHOLD });
    expect(result.needsRebalance).toBe(true);
  });

  it('stable ordering: midpoint always lies strictly between neighbors', () => {
    const { position } = computePosition({ before: 100, after: 300 });
    expect(position).toBeGreaterThan(100);
    expect(position).toBeLessThan(300);
  });
});

describe('ordering: rebalancedPositions', () => {
  it('empty sequence', () => {
    expect(rebalancedPositions(0)).toEqual([]);
  });

  it('single item', () => {
    expect(rebalancedPositions(1)).toEqual([POSITION_GAP]);
  });

  it('assigns evenly-spaced, strictly increasing positions preserving order', () => {
    const positions = rebalancedPositions(5);
    expect(positions).toEqual([1000, 2000, 3000, 4000, 5000]);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i]).toBeGreaterThan(positions[i - 1]);
    }
  });

  it('produces gaps well above the rebalance threshold', () => {
    const positions = rebalancedPositions(10);
    for (let i = 1; i < positions.length; i++) {
      expect(positions[i] - positions[i - 1]).toBeGreaterThan(REBALANCE_THRESHOLD * 1000);
    }
  });
});
