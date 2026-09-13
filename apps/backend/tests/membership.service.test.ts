import { describe, it, expect } from 'vitest';
import { roleAtLeast } from '../src/services/membership.service.js';

describe('membership.service - roleAtLeast', () => {
  it('owner satisfies every minimum role', () => {
    expect(roleAtLeast('owner', 'owner')).toBe(true);
    expect(roleAtLeast('owner', 'editor')).toBe(true);
    expect(roleAtLeast('owner', 'viewer')).toBe(true);
  });

  it('editor satisfies editor/viewer but not owner', () => {
    expect(roleAtLeast('editor', 'editor')).toBe(true);
    expect(roleAtLeast('editor', 'viewer')).toBe(true);
    expect(roleAtLeast('editor', 'owner')).toBe(false);
  });

  it('viewer only satisfies viewer', () => {
    expect(roleAtLeast('viewer', 'viewer')).toBe(true);
    expect(roleAtLeast('viewer', 'editor')).toBe(false);
    expect(roleAtLeast('viewer', 'owner')).toBe(false);
  });
});
