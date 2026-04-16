import { useEffect, useState } from 'react';

/**
 * Barra dourada fina no topo que indica progresso de scroll da página.
 */
export default function ScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      const scrollTop = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const pct = height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0;
      setProgress(pct);
      raf = 0;
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[60] h-0.5 pointer-events-none"
      style={{ transform: 'translateZ(0)' }}
    >
      <div
        className="h-full origin-left"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, rgb(var(--brand-gold)) 0%, rgb(var(--brand-primary)) 100%)',
          transition: 'width 80ms linear',
        }}
      />
    </div>
  );
}
