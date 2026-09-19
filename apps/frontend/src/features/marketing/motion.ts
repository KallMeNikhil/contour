import { useEffect, useRef, useState } from 'react';

/**
 * Tracks the user's `prefers-reduced-motion` setting live, so decorative
 * motion can be skipped entirely rather than just shortened.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window === 'undefined'
      ? false
      : window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/**
 * True only for devices with an accurate pointer (mouse/trackpad). Touch
 * devices and coarse pointers should never receive hover-only interaction
 * such as magnetic buttons or pointer-glow effects.
 */
export function useFinePointer(): boolean {
  const [fine, setFine] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(pointer: fine)').matches,
  );

  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)');
    const handler = (event: MediaQueryListEvent) => setFine(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  return fine;
}

/** True once the viewport is at least `minWidth` pixels wide. */
export function useMinWidth(minWidth: number): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? true : window.matchMedia(`(min-width: ${minWidth}px)`).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${minWidth}px)`);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [minWidth]);

  return matches;
}

interface UseInViewOptions {
  /** Fraction of the element that must be visible before it counts as "in view". */
  threshold?: number;
  /** Only ever fire once; stays true after the first intersection. */
  once?: boolean;
  rootMargin?: string;
}

/**
 * Reports whether an element is in the viewport, via IntersectionObserver.
 * Used to drive scroll-reveal choreography without a scroll listener.
 */
export function useInView<T extends HTMLElement>(
  options: UseInViewOptions = {},
): [React.RefObject<T>, boolean] {
  const { threshold = 0.2, once = true, rootMargin = '0px 0px -10% 0px' } = options;
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, once, rootMargin]);

  return [ref, inView];
}
