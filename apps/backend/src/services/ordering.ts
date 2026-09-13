export const POSITION_GAP = 1000;

export const REBALANCE_THRESHOLD = 0.0001;

export interface PositionNeighbors {
  before?: number;

  after?: number;
}

export interface PositionResult {
  position: number;

  needsRebalance: boolean;
}

export function computePosition({ before, after }: PositionNeighbors): PositionResult {
  if (before === undefined && after === undefined) {
    return { position: POSITION_GAP, needsRebalance: false };
  }

  if (before === undefined) {
    const position = after! / 2;
    return { position, needsRebalance: after! - position < REBALANCE_THRESHOLD };
  }

  if (after === undefined) {
    return { position: before + POSITION_GAP, needsRebalance: false };
  }

  const gap = after - before;
  const position = before + gap / 2;
  return { position, needsRebalance: gap < REBALANCE_THRESHOLD };
}

export function rebalancedPositions(count: number, gap = POSITION_GAP): number[] {
  return Array.from({ length: count }, (_, i) => (i + 1) * gap);
}
