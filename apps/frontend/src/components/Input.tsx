import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface FieldChrome {
  label: string;
  hideLabel?: boolean;
  error?: string;
  helperText?: string;
}

const fieldBase =
  'w-full rounded-md border bg-surface px-3 py-2 text-body text-primary placeholder:text-muted transition-colors duration-micro focus-visible:outline-none focus-visible:border-accent disabled:bg-disabled-bg disabled:text-disabled-text';

function chromeClasses(hasError: boolean): string {
  return hasError ? 'border-danger' : 'border-border-strong hover:border-primary/30';
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement>, FieldChrome {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hideLabel, error, helperText, id, className = '', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'text-body-medium text-secondary'}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        className={`${fieldBase} ${chromeClasses(!!error)} ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {helperText && !error && (
        <p id={helperId} className="text-meta text-secondary">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-meta text-danger">
          {error}
        </p>
      )}
    </div>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement>, FieldChrome {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hideLabel, error, helperText, id, className = '', ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={hideLabel ? 'sr-only' : 'text-body-medium text-secondary'}
      >
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        className={`${fieldBase} resize-y ${chromeClasses(!!error)} ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
        {...props}
      />
      {helperText && !error && (
        <p id={helperId} className="text-meta text-secondary">
          {helperText}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-meta text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
