import { useState } from 'react';
import type { FormEvent } from 'react';
import { inviteMemberSchema } from '@contour/shared';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ApiError } from '../../services/api/client';
import type { WorkspaceInviteResult } from '../../services/api/types';

interface InviteMemberModalProps {
  isOpen: boolean;
  workspaceId: string;
  onClose: () => void;
  onInvite: (email: string, role: 'editor' | 'viewer') => Promise<WorkspaceInviteResult>;
}

export function InviteMemberModal({
  isOpen,
  workspaceId,
  onClose,
  onInvite,
}: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  function handleClose() {
    setEmail('');
    setRole('editor');
    setError(undefined);
    setInviteLink(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = inviteMemberSchema.safeParse({ email, role });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setIsSubmitting(true);
    setError(undefined);
    try {
      const invite = await onInvite(result.data.email, result.data.role);
      const link = `${window.location.origin}/invites/${workspaceId}/${invite.inviteToken}`;
      setInviteLink(link);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send the invite.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Invite a member"
      footer={
        inviteLink ? (
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        ) : (
          <>
            <Button variant="ghost" onClick={handleClose} type="button">
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              form="invite-member-form"
              isLoading={isSubmitting}
            >
              Send invite
            </Button>
          </>
        )
      }
    >
      {inviteLink ? (
        <div className="flex flex-col gap-3">
          <p className="text-body text-secondary">
            Invite created. Share this link with them - it signs them in to accept:
          </p>
          <div className="flex items-center gap-2 rounded-md border border-border-default bg-surface-raised px-3 py-2">
            <code className="flex-1 truncate text-meta text-primary">{inviteLink}</code>
            <Button
              size="sm"
              variant="secondary"
              type="button"
              onClick={() => void navigator.clipboard.writeText(inviteLink)}
            >
              Copy
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
          id="invite-member-form"
        >
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
            autoFocus
            required
            helperText="They need an existing Contour account - invite links don't send email."
          />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="invite-role" className="text-meta font-medium text-secondary">
              Role
            </label>
            <select
              id="invite-role"
              value={role}
              onChange={(e) => setRole(e.target.value as 'editor' | 'viewer')}
              className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-body text-primary transition-colors duration-micro focus-visible:border-accent focus-visible:outline-none"
            >
              <option value="editor">Editor - can create and edit boards/tasks</option>
              <option value="viewer">Viewer - read-only</option>
            </select>
          </div>
        </form>
      )}
    </Modal>
  );
}
