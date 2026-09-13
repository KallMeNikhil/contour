import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Button, IconButton } from '../../components/Button';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { ErrorState } from '../../components/EmptyState';
import { InviteMemberModal } from './InviteMemberModal';
import { useInviteMember, useMembers, useRemoveMember } from './hooks';
import { useToast } from '../../state/toast';
import { ApiError } from '../../services/api/client';
import type { WorkspaceRole } from '../../services/api/types';

interface WorkspaceMembersPanelProps {
  workspaceId: string;
  currentUserRole: WorkspaceRole | undefined;
  ownerId: string;
}

export function WorkspaceMembersPanel({
  workspaceId,
  currentUserRole,
  ownerId,
}: WorkspaceMembersPanelProps) {
  const { data: members, isLoading, isError, refetch } = useMembers(workspaceId);
  const inviteMember = useInviteMember(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const { showToast } = useToast();
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  const canManage = currentUserRole === 'owner' || currentUserRole === 'editor';
  const canRemove = currentUserRole === 'owner';

  async function handleRemove(userId: string, label: string) {
    try {
      await removeMember.mutateAsync(userId);
      showToast(`Removed ${label} from the workspace.`);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not remove that member.', {
        tone: 'error',
      });
    }
  }

  return (
    <section aria-labelledby="members-heading" className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 id="members-heading" className="font-display text-display-sm text-primary">
          Members
        </h2>
        {canManage && (
          <Button size="sm" variant="secondary" onClick={() => setIsInviteOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" aria-hidden="true" />
            Invite
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-12 rounded-md" />
          <SkeletonBlock className="h-12 rounded-md" />
        </div>
      )}

      {isError && (
        <ErrorState description="Couldn't load workspace members." onRetry={() => refetch()} />
      )}

      {!isLoading && !isError && members && (
        <ul className="flex flex-col divide-y divide-border-default overflow-hidden rounded-lg border border-border-default bg-surface shadow-xs">
          {members.map((member) => (
            <li
              key={member.userId}
              className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-micro hover:bg-surface-hover"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-body-medium text-primary">
                  {member.name ?? member.email ?? `Member ${member.userId.slice(-4)}`}
                </span>
                <span className="text-meta text-muted">
                  {member.role}
                  {member.status === 'pending' ? ' · invite pending' : ''}
                </span>
              </div>
              {canRemove && member.userId !== ownerId && (
                <IconButton
                  label={`Remove ${member.name ?? member.email ?? 'member'}`}
                  onClick={() =>
                    void handleRemove(member.userId, member.name ?? member.email ?? 'member')
                  }
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </IconButton>
              )}
            </li>
          ))}
        </ul>
      )}

      <InviteMemberModal
        isOpen={isInviteOpen}
        workspaceId={workspaceId}
        onClose={() => setIsInviteOpen(false)}
        onInvite={(email, role) => inviteMember.mutateAsync({ email, role })}
      />
    </section>
  );
}
