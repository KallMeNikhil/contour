import { useState } from 'react';
import type { FormEvent } from 'react';
import { createWorkspaceSchema } from '@contour/shared';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ApiError } from '../../services/api/client';

interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateWorkspaceModal({ isOpen, onClose, onCreate }: CreateWorkspaceModalProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleClose() {
    setName('');
    setError(undefined);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const result = createWorkspaceSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreate(result.data.name);
      setName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the workspace.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New workspace"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="create-workspace-form"
            isLoading={isSubmitting}
          >
            Create workspace
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
        id="create-workspace-form"
      >
        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error}
          autoFocus
          required
        />
      </form>
    </Modal>
  );
}
