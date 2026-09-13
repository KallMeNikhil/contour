import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  hideLabel?: boolean;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hideLabel, error, id, className = '', children, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const errorId = error ? `${selectId}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={hideLabel ? 'sr-only' : 'text-body-medium text-secondary'}
      >
        {label}
      </label>
      <select
        ref={ref}
        id={selectId}
        className={`w-full rounded-md border bg-surface px-3 py-2 text-body text-primary transition-colors duration-micro focus-visible:border-accent focus-visible:outline-none disabled:bg-disabled-bg disabled:text-disabled-text ${
          error ? 'border-danger' : 'border-border-strong hover:border-primary/30'
        } ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={errorId}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} className="text-meta text-danger">
          {error}
        </p>
      )}
    </div>
  );
});
