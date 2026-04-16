import { ReactNode, useEffect, useRef, useState } from 'react';

interface ParallaxProps {
  children: ReactNode;
  /** quanto mais alto, mais forte o parallax (max ~0.3 pra ficar sutil) */
  speed?: number;
  className?: string;
}

/**
 * Aplica parallax sutil em scroll — elemento se move mais lento que o viewport.
 * Respeita prefers-reduced-motion.
 */
export default function Parallax({ children, speed = 0.15, className = '' }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const update = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const windowH = window.innerHeight;
      const elCenter = rect.top + rect.height / 2;
      const viewportCenter = windowH / 2;
      const delta = elCenter - viewportCenter;
      setOffset(-delta * speed);
      rafRef.current = 0;
    };

    const onScroll = () => {
      if (rafRef.current) return;
      rafRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translate3d(0, ${offset}px, 0)`,
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}
