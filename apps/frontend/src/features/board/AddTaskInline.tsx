import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface AddTaskInlineProps {
  onCreate: (title: string) => Promise<void>;
}

export function AddTaskInline({ onCreate }: AddTaskInlineProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setTitle('');
    } catch {
      setError("Couldn't add the task. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-1.5 rounded px-2 py-1.5 text-left text-meta font-semibold text-secondary transition-colors duration-micro hover:bg-surface hover:text-trail"
      >
        <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      <input
        autoFocus
        value={title}
        disabled={isSubmitting}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => {
          if (!title.trim()) setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setTitle('');
            setIsEditing(false);
          }
        }}
        placeholder="Task title"
        aria-label="New task title"
        className="w-full rounded-md border border-border-strong bg-surface px-2.5 py-1.5 text-body text-primary placeholder:text-muted transition-colors duration-micro focus-visible:border-accent focus-visible:outline-none"
        maxLength={200}
      />
      {error && <p className="text-meta text-danger">{error}</p>}
    </form>
  );
}
