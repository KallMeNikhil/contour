import { describe, expect, it } from 'vitest';
import { formatDueDate, resolveAssigneeLabel, resolveMemberLabel } from './formatting';
import type { PublicUser, WorkspaceMemberSummary } from '../../services/api/types';

const currentUser: PublicUser = { id: 'u1', email: 'a@b.com', name: 'Ada Lovelace', createdAt: '' };
const members: WorkspaceMemberSummary[] = [
  { userId: 'u1', role: 'owner', name: 'Ada Lovelace', email: 'a@b.com' },
  { userId: 'u2', role: 'editor', name: 'Grace Hopper', email: 'g@h.com' },
  { userId: 'u3', role: 'viewer', name: null, email: null },
];

describe('resolveMemberLabel', () => {
  it('labels the signed-in user as "you"', () => {
    expect(resolveMemberLabel('u1', currentUser, members)).toBe('Ada Lovelace (you)');
  });

  it("resolves another member's real name now that the backend populates it (M8 fix)", () => {
    expect(resolveMemberLabel('u2', currentUser, members)).toBe('Grace Hopper');
  });

  it('falls back to email when a member has no name', () => {
    const noName = [{ userId: 'u4', role: 'viewer' as const, name: null, email: 'x@y.com' }];
    expect(resolveMemberLabel('u4', currentUser, noName)).toBe('x@y.com');
  });

  it('falls back to a shortened id when neither name nor email is available', () => {
    expect(resolveMemberLabel('u3', currentUser, members)).toBe('Member u3');
  });
});

describe('resolveAssigneeLabel', () => {
  it('returns Unassigned when there is no assignee', () => {
    expect(resolveAssigneeLabel(null, currentUser, members)).toBe('Unassigned');
  });

  it('returns Unassigned when the assignee is not an active member', () => {
    expect(resolveAssigneeLabel('u-gone', currentUser, members)).toBe('Unassigned');
  });

  it('resolves an active assignee', () => {
    expect(resolveAssigneeLabel('u1', currentUser, members)).toBe('Ada Lovelace (you)');
  });
});

describe('formatDueDate', () => {
  it('marks a past date as danger', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(formatDueDate(past.toISOString()).tone).toBe('danger');
  });

  it('marks a date within 2 days as warning', () => {
    const soon = new Date();
    soon.setDate(soon.getDate() + 1);
    expect(formatDueDate(soon.toISOString()).tone).toBe('warning');
  });

  it('marks a far-future date as muted', () => {
    const later = new Date();
    later.setDate(later.getDate() + 30);
    expect(formatDueDate(later.toISOString()).tone).toBe('muted');
  });

  it('returns an empty string for no due date', () => {
    expect(formatDueDate(null)).toEqual({ text: '', tone: 'muted' });
  });
});
