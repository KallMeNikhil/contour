import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { IconButton, Button } from './Button';
import type { ToastOptions } from '../state/toast';

interface ToastProps extends ToastOptions {
  message: string;
  onDismiss: () => void;
  onAction?: () => void;
}

const toneStyles: Record<NonNullable<ToastOptions['tone']>, string> = {
  default: 'border-border-strong',
  error: 'border-danger/60',
  success: 'border-success/60',
};

const toneIcon: Record<NonNullable<ToastOptions['tone']>, JSX.Element> = {
  default: <Info className="h-4 w-4 text-info" aria-hidden="true" />,
  error: <AlertCircle className="h-4 w-4 text-danger" aria-hidden="true" />,
  success: <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />,
};

export function Toast({ message, tone = 'default', actionLabel, onAction, onDismiss }: ToastProps) {
  return (
    <div
      className={`animate-fade-in-up pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border bg-surface-elevated px-4 py-3.5 shadow-lg ${toneStyles[tone]}`}
    >
      {toneIcon[tone]}
      <p className="flex-1 text-body text-primary">{message}</p>
      {actionLabel && onAction && (
        <Button variant="ghost" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      <IconButton label="Dismiss notification" size="sm" onClick={onDismiss}>
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </IconButton>
    </div>
  );
}
