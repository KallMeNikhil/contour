import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold tracking-[-0.005em] transition-all duration-micro ease-settle disabled:cursor-not-allowed disabled:bg-disabled-bg disabled:text-disabled-text disabled:border-disabled-bg disabled:shadow-none active:translate-y-px';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-foreground border border-accent shadow-xs hover:bg-accent-hover hover:shadow-sm',
  secondary:
    'bg-surface text-primary border border-border-strong shadow-xs hover:bg-surface-hover hover:border-primary/20',
  ghost:
    'bg-transparent text-secondary border border-transparent hover:bg-surface-hover hover:text-primary',
  danger:
    'bg-surface text-danger border border-danger/50 shadow-xs hover:bg-danger hover:text-white hover:border-danger',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'text-meta px-2.5 py-1.5',
  md: 'text-body-medium px-3.5 py-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', isLoading, disabled, className = '', children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  size?: ButtonSize;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, size = 'md', className = '', children, ...props },
  ref,
) {
  const dim = size === 'sm' ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      className={`inline-flex ${dim} items-center justify-center rounded-md text-secondary transition-colors duration-micro hover:bg-surface-hover hover:text-primary disabled:cursor-not-allowed disabled:text-disabled-text ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
