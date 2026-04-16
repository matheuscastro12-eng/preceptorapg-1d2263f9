import { ReactNode, CSSProperties } from 'react';
import { useInView } from '@/hooks/useInView';

interface RevealProps {
  children: ReactNode;
  /** delay em ms */
  delay?: number;
  /** direção do movimento */
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  /** distância do movimento em px */
  distance?: number;
  /** duração em ms */
  duration?: number;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  style?: CSSProperties;
}

/**
 * Wrapper que revela filhos com fade+slide quando entra na viewport.
 * Usa IntersectionObserver + CSS (sem JS animation frame loop).
 */
export default function Reveal({
  children,
  delay = 0,
  direction = 'up',
  distance = 24,
  duration = 700,
  className = '',
  as: Tag = 'div',
  style,
}: RevealProps) {
  const [ref, inView] = useInView<HTMLDivElement>();

  const translate = !inView
    ? direction === 'up'
      ? `translate3d(0, ${distance}px, 0)`
      : direction === 'down'
      ? `translate3d(0, -${distance}px, 0)`
      : direction === 'left'
      ? `translate3d(${distance}px, 0, 0)`
      : direction === 'right'
      ? `translate3d(-${distance}px, 0, 0)`
      : 'translate3d(0, 0, 0)'
    : 'translate3d(0, 0, 0)';

  return (
    // @ts-expect-error — dynamic Tag com ref genérico
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: translate,
        transition: `opacity ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        willChange: inView ? 'auto' : 'transform, opacity',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
