import { useEffect, useRef, useState } from 'react';

/**
 * Retorna [ref, inView] — inView fica true quando o elemento entra na viewport.
 * Por padrão fica true permanentemente após primeira entrada (triggerOnce=true).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit & { triggerOnce?: boolean } = {}
) {
  const { triggerOnce = true, rootMargin = '0px 0px -80px 0px', threshold = 0.1, ...rest } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) observer.disconnect();
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { rootMargin, threshold, ...rest }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, threshold, triggerOnce]);

  return [ref, inView] as const;
}
