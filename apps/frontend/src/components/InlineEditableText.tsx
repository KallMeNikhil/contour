import { useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';

interface InlineEditableTextProps {
  value: string;
  onSave: (next: string) => Promise<void>;
  canEdit: boolean;
  maxLength: number;
  className?: string;
  ariaLabel: string;
}

export function InlineEditableText({
  value,
  onSave,
  canEdit,
  maxLength,
  className = '',
  ariaLabel,
}: InlineEditableTextProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!canEdit) {
    return <span className={className}>{value}</span>;
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => {
          setDraft(value);
          setIsEditing(true);
        }}
        className={`${className} rounded text-left transition-colors duration-micro hover:bg-surface-hover`}
        aria-label={`${ariaLabel}: ${value}. Click to rename.`}
      >
        {value}
      </button>
    );
  }

  async function commit() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === value) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await onSave(trimmed);
    } finally {
      setIsSaving(false);
      setIsEditing(false);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      inputRef.current?.blur();
    } else if (e.key === 'Escape') {
      setDraft(value);
      setIsEditing(false);
    }
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      value={draft}
      disabled={isSaving}
      maxLength={maxLength}
      aria-label={ariaLabel}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      className={`${className} rounded-md border border-accent bg-surface px-1.5 focus-visible:outline-none`}
    />
  );
}
