interface SkeletonBlockProps {
  className?: string;
}

export function SkeletonBlock({ className = '' }: SkeletonBlockProps) {
  return (
    <div
      className={`animate-skeleton rounded-md bg-border-default/70 ${className}`}
      aria-hidden="true"
    />
  );
}
