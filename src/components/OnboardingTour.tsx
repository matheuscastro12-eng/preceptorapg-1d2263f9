import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface TourStep {
  target: string;
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  tourKey: string;
  onComplete?: () => void;
}

const PADDING = 10;
const GAP = 14;

const OnboardingTour = ({ steps, tourKey, onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Responsive tooltip width
  const getTooltipWidth = () => Math.min(320, window.innerWidth - 32);

  useEffect(() => {
    const done = localStorage.getItem(`tour_${tourKey}`);
    if (!done && steps.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps.length]);

  const measureTarget = useCallback(() => {
    if (!isVisible || !steps[currentStep]) {
      setReady(false);
      return;
    }

    const el = document.querySelector(steps[currentStep].target);
    if (!el) {
      setRect(null);
      setReady(true);
      return;
    }

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      setReady(true);
      return;
    }

    setRect(r);
    setReady(true);

    const inView = r.top >= 0 && r.bottom <= window.innerHeight;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        if (r2.width > 0 && r2.height > 0) setRect(r2);
      }, 400);
    }
  }, [currentStep, isVisible, steps]);

  useEffect(() => {
    measureTarget();
    const onUpdate = () => requestAnimationFrame(measureTarget);
    window.addEventListener('resize', onUpdate);
    window.addEventListener('scroll', onUpdate, true);
    return () => {
      window.removeEventListener('resize', onUpdate);
      window.removeEventListener('scroll', onUpdate, true);
    };
  }, [measureTarget]);

  const finish = () => {
    localStorage.setItem(`tour_${tourKey}`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const next = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
    else finish();
  };

  const prev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (!isVisible || !ready) return null;

  const step = steps[currentStep];
  const hasTarget = rect !== null && rect.width > 0;
  const tooltipW = getTooltipWidth();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Spotlight clip-path
  const clipPath = hasTarget
    ? `polygon(
        0% 0%, 0% 100%,
        ${Math.max(0, rect!.left - PADDING)}px 100%,
        ${Math.max(0, rect!.left - PADDING)}px ${Math.max(0, rect!.top - PADDING)}px,
        ${Math.min(vw, rect!.right + PADDING)}px ${Math.max(0, rect!.top - PADDING)}px,
        ${Math.min(vw, rect!.right + PADDING)}px ${Math.min(vh, rect!.bottom + PADDING)}px,
        ${Math.max(0, rect!.left - PADDING)}px ${Math.min(vh, rect!.bottom + PADDING)}px,
        ${Math.max(0, rect!.left - PADDING)}px 100%,
        100% 100%, 100% 0%
      )`
    : undefined;

  // Tooltip position — smart placement that always stays on screen
  const calcTooltipPos = (): React.CSSProperties => {
    if (!hasTarget) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const r = rect!;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 200;
    const placement = step.placement || 'bottom';

    // Available space in each direction
    const spaceBelow = vh - r.bottom - GAP;
    const spaceAbove = r.top - GAP;
    const spaceRight = vw - r.right - GAP;
    const spaceLeft = r.left - GAP;

    // Determine best vertical placement
    let top: number | undefined;
    let usedPlacement = placement;

    if (placement === 'bottom' || placement === 'top') {
      if (placement === 'bottom' && spaceBelow >= tooltipH) {
        top = r.bottom + GAP;
      } else if (placement === 'top' && spaceAbove >= tooltipH) {
        top = r.top - tooltipH - GAP;
      } else if (spaceBelow >= spaceAbove) {
        top = r.bottom + GAP;
        usedPlacement = 'bottom';
      } else {
        top = Math.max(PADDING, r.top - tooltipH - GAP);
        usedPlacement = 'top';
      }

      // Horizontal: center on target, clamp to viewport
      const idealLeft = r.left + r.width / 2 - tooltipW / 2;
      const left = Math.max(PADDING, Math.min(idealLeft, vw - tooltipW - PADDING));
      return { top, left };
    }

    // Left/right placement
    if (placement === 'right' && spaceRight >= tooltipW) {
      top = Math.max(PADDING, Math.min(r.top + r.height / 2 - tooltipH / 2, vh - tooltipH - PADDING));
      return { top, left: r.right + GAP };
    }
    if (placement === 'left' && spaceLeft >= tooltipW) {
      top = Math.max(PADDING, Math.min(r.top + r.height / 2 - tooltipH / 2, vh - tooltipH - PADDING));
      return { top, left: r.left - tooltipW - GAP };
    }

    // Fallback: place below, centered
    top = Math.max(PADDING, Math.min(r.bottom + GAP, vh - tooltipH - PADDING));
    const left = Math.max(PADDING, Math.min(r.left + r.width / 2 - tooltipW / 2, vw - tooltipW - PADDING));
    return { top, left };
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay with spotlight hole */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9990]"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.65)',
              clipPath,
            }}
            onClick={finish}
          />

          {/* Highlight ring around target */}
          {hasTarget && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed z-[9991] pointer-events-none rounded-xl"
              style={{
                top: rect!.top - PADDING,
                left: rect!.left - PADDING,
                width: rect!.width + PADDING * 2,
                height: rect!.height + PADDING * 2,
                boxShadow: '0 0 0 3px hsl(var(--primary) / 0.6), 0 0 24px 4px hsl(var(--primary) / 0.15)',
              }}
            />
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] rounded-2xl border border-border/60 bg-card shadow-2xl"
            style={{ width: tooltipW, maxWidth: `calc(100vw - 32px)`, ...calcTooltipPos() }}
          >
            <div className="p-4 sm:p-5">
              {/* Close */}
              <button
                onClick={finish}
                className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2.5 mb-3">
                <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                    Passo {currentStep + 1} de {steps.length}
                  </p>
                  <h3 className="font-semibold text-foreground text-sm leading-tight">{step.title}</h3>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {step.description}
              </p>

              {/* Progress dots */}
              <div className="flex justify-center gap-1.5 mb-4">
                {steps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep
                        ? 'w-5 bg-primary'
                        : i < currentStep
                        ? 'w-1.5 bg-primary/40'
                        : 'w-1.5 bg-muted-foreground/20'
                    }`}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prev}
                  disabled={currentStep === 0}
                  className="gap-1 text-xs h-8"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Anterior
                </Button>

                <Button
                  size="sm"
                  onClick={next}
                  className="gap-1 text-xs h-8 bg-primary hover:bg-primary/90"
                >
                  {currentStep === steps.length - 1 ? 'Concluir' : 'Proximo'}
                  {currentStep < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
