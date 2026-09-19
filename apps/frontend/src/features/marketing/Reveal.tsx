import type { ReactNode } from 'react';
import { useReducedMotion, useInView } from './motion';

interface RevealProps {
  children: ReactNode;
  /** Stagger index within a group; each step adds ~70ms of delay. */
  index?: number;
  className?: string;
}

/**
 * The homepage's single reveal vocabulary: a short fade + 14px rise,
 * triggered once when the element enters the viewport. Every scroll
 * reveal on the page shares this timing so the motion reads as one
 * choreography rather than a different animation per section.
 */
export function Reveal({ children, index = 0, className = '' }: RevealProps) {
  const reducedMotion = useReducedMotion();
  const [ref, inView] = useInView<HTMLDivElement>({ threshold: 0.15 });

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={`${className} ${inView ? 'reveal-in' : 'reveal-out'}`}
      style={{ transitionDelay: inView ? `${Math.min(index, 6) * 70}ms` : '0ms' }}
    >
      {children}
    </div>
  );
}
