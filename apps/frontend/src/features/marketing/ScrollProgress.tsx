import { useEffect, useRef } from 'react';

/**
 * A 2px progress hairline under the nav bar, filling as the visitor scrolls
 * through the homepage. Reads scroll position via rAF-throttled listener so
 * it never runs more than once per frame.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const ticking = useRef(false);

  useEffect(() => {
    function update() {
      ticking.current = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const ratio = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${ratio})`;
      }
    }

    function onScroll() {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[2px] bg-transparent"
      aria-hidden="true"
    >
      <div
        ref={barRef}
        className="h-full origin-left bg-accent"
        style={{ transform: 'scaleX(0)', transition: 'transform 80ms linear' }}
      />
    </div>
  );
}
