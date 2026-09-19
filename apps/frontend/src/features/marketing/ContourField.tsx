/**
 * A quiet atmospheric accent behind the hero: a small family of concentric,
 * off-center arcs that extend the same "contour line" language as the
 * product's own mark (see ContourMark in AppShell.tsx). It never becomes a
 * decorative "blob" or gradient wash - each stroke is the same thin
 * hairline the rest of the app already uses for structure, just at a
 * much larger scale and near-invisible opacity.
 */
export function ContourField() {
  return (
    <svg
      className="pointer-events-none absolute right-[-10%] top-[-12%] h-[640px] w-[640px] text-primary/[0.05] sm:h-[820px] sm:w-[820px]"
      viewBox="0 0 800 800"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="560" cy="260" r="120" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="560" cy="260" r="200" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="560" cy="260" r="290" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="560" cy="260" r="390" stroke="var(--accent)" strokeWidth="1.5" opacity="0.55" />
    </svg>
  );
}
