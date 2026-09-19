import { useRef } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useFinePointer, useReducedMotion } from './motion';

const PULL = 0.28;
const MAX_OFFSET = 10;

interface MagneticLinkProps {
  to: string;
  children: ReactNode;
  className: string;
}

/**
 * A link that leans gently toward the pointer on hover, and settles back
 * with a spring-like ease on leave. Reserved for the single primary CTA -
 * applying this everywhere would turn a considered detail into a gimmick.
 *
 * Disabled outright for touch/coarse pointers and reduced-motion, since
 * neither can perceive or benefit from the effect.
 */
export function MagneticLink({ to, children, className }: MagneticLinkProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const isFinePointer = useFinePointer();
  const reducedMotion = useReducedMotion();
  const active = isFinePointer && !reducedMotion;

  function handleMouseMove(event: MouseEvent<HTMLAnchorElement>) {
    if (!active || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = event.clientX - (rect.left + rect.width / 2);
    const relY = event.clientY - (rect.top + rect.height / 2);
    const x = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relX * PULL));
    const y = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, relY * PULL));
    ref.current.style.transform = `translate(${x}px, ${y}px)`;
  }

  function handleMouseLeave() {
    if (!ref.current) return;
    ref.current.style.transform = 'translate(0, 0)';
  }

  return (
    <Link
      ref={ref}
      to={to}
      className={className}
      style={{ transition: active ? 'transform 320ms cubic-bezier(0.16, 1, 0.3, 1)' : undefined }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}
