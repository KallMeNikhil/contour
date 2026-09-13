function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const dim = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-8 w-8 text-meta';
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground ring-1 ring-inset ring-white/10`}
      title={name}
      aria-hidden="true"
    >
      {initialsOf(name)}
    </span>
  );
}
