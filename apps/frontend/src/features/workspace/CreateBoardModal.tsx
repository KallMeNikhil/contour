import { useState } from 'react';
import type { FormEvent } from 'react';
import { createBoardSchema } from '@contour/shared';
import { Modal } from '../../components/Modal';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { ApiError } from '../../services/api/client';

interface CreateBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export function CreateBoardModal({ isOpen, onClose, onCreate }: CreateBoardModalProps) {
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
    const result = createBoardSchema.safeParse({ name });
    if (!result.success) {
      setError(result.error.issues[0]?.message);
      return;
    }
    setIsSubmitting(true);
    try {
      await onCreate(result.data.name);
      setName('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the board.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="New board"
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} type="button">
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="create-board-form" isLoading={isSubmitting}>
            Create board
          </Button>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
        id="create-board-form"
      >
        <Input
          label="Board name"
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
