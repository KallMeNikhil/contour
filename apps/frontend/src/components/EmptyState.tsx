import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface/60 px-6 py-12 text-center">
      {icon}
      <p className="font-display text-display-sm text-primary">{title}</p>
      {description && <p className="max-w-sm text-body text-secondary">{description}</p>}
      {action && (
        <Button variant="secondary" size="sm" className="mt-3" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  fullPage?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  description,
  onRetry,
  fullPage,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-lg border border-danger/30 bg-surface px-6 py-10 text-center shadow-sm ${
        fullPage ? 'mx-auto mt-16 max-w-md' : ''
      }`}
      role="alert"
    >
      <AlertTriangle className="h-5 w-5 text-danger" aria-hidden="true" />
      <p className="text-body-medium text-primary">{title}</p>
      {description && <p className="max-w-sm text-meta text-secondary">{description}</p>}
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-2" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
