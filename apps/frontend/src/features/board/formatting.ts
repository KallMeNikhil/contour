import type { PublicUser, WorkspaceMemberSummary } from '../../services/api/types';

export function resolveMemberLabel(
  userId: string,
  currentUser: PublicUser | null,
  members: WorkspaceMemberSummary[] = [],
): string {
  if (currentUser && userId === currentUser.id) return `${currentUser.name} (you)`;
  const member = members.find((m) => m.userId === userId);
  if (member?.name) return member.name;
  if (member?.email) return member.email;
  return `Member ${userId.slice(-4)}`;
}

export function resolveAssigneeLabel(
  assigneeId: string | null,
  currentUser: PublicUser | null,
  members: WorkspaceMemberSummary[],
): string {
  if (!assigneeId) return 'Unassigned';
  const isMember = members.some((m) => m.userId === assigneeId);
  if (!isMember) return 'Unassigned';
  return resolveMemberLabel(assigneeId, currentUser, members);
}

export function formatDueDate(dueDate: string | null): {
  text: string;
  tone: 'muted' | 'warning' | 'danger';
} {
  if (!dueDate) return { text: '', tone: 'muted' };
  const date = new Date(dueDate);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((date.getTime() - startOfToday.getTime()) / 86_400_000);

  const text = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  if (diffDays < 0) return { text, tone: 'danger' };
  if (diffDays <= 2) return { text, tone: 'warning' };
  return { text, tone: 'muted' };
}
