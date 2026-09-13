import type { ReactNode } from 'react';

export const LABEL_COLORS = {
  clay: '#A8524F',
  moss: '#4F7A5C',
  ochre: '#A8527E',
  slate: '#45647F',
  plum: '#7A5A88',
  stone: '#6F7586',
} as const;

export type LabelColorName = keyof typeof LABEL_COLORS;

export const LABEL_COLOR_NAMES = Object.keys(LABEL_COLORS) as LabelColorName[];

interface ChipProps {
  children: ReactNode;

  color?: LabelColorName | string;
  onRemove?: () => void;
  removeLabel?: string;
}

export function resolveLabelColor(color?: string): string {
  if (!color) return '#6F7586';
  if (color in LABEL_COLORS) return LABEL_COLORS[color as LabelColorName];
  return color;
}

export function Chip({ children, color, onRemove, removeLabel }: ChipProps) {
  const hex = resolveLabelColor(color);
  return (
    <span
      className="inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 text-meta font-medium"
      style={{ backgroundColor: `${hex}20`, borderColor: `${hex}80`, color: hex }}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={removeLabel ?? 'Remove'}
          className="ml-0.5 rounded-sm hover:opacity-70 focus-visible:outline-none"
          style={{ color: hex }}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function NeutralChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-border-default bg-surface-raised px-1.5 py-0.5 text-meta font-medium text-secondary">
      {children}
    </span>
  );
}
