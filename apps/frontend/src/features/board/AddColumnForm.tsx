import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface AddColumnFormProps {
  onCreate: (name: string) => Promise<void>;
}

export function AddColumnForm({ onCreate }: AddColumnFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onCreate(trimmed);
      setName('');
      setIsEditing(false);
    } catch {
      setError("Couldn't add the column. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="flex h-11 w-72 shrink-0 items-center gap-1.5 self-start rounded-xl border border-dashed border-border-strong/80 px-3.5 text-body-medium text-secondary transition-colors duration-micro hover:border-trail hover:bg-surface/60 hover:text-trail"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add column
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-72 shrink-0 flex-col gap-1">
      <input
        autoFocus
        value={name}
        disabled={isSubmitting}
        onChange={(e) => setName(e.target.value)}
        onBlur={() => {
          if (!name.trim()) setIsEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setName('');
            setIsEditing(false);
          }
        }}
        placeholder="Column name"
        aria-label="New column name"
        className="w-full rounded-xl border border-border-strong bg-surface px-3.5 py-2.5 text-body text-primary shadow-xs placeholder:text-muted focus-visible:border-accent focus-visible:outline-none"
        maxLength={60}
      />
      {error && <p className="text-meta text-danger">{error}</p>}
    </form>
  );
}
