import { useState, useEffect, useCallback } from 'react';
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
const TOOLTIP_W = 320;
const TOOLTIP_H_EST = 200;

const OnboardingTour = ({ steps, tourKey, onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [ready, setReady] = useState(false);

  // Check if tour was already completed
  useEffect(() => {
    const done = localStorage.getItem(`tour_${tourKey}`);
    if (!done && steps.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 800);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps.length]);

  // Find and measure the target element
  const measureTarget = useCallback(() => {
    if (!isVisible || !steps[currentStep]) {
      setReady(false);
      return;
    }

    const el = document.querySelector(steps[currentStep].target);
    if (!el) {
      // Element not found — skip this step
      setRect(null);
      setReady(true);
      return;
    }

    const r = el.getBoundingClientRect();

    // Ignore elements that are hidden or have no dimensions
    if (r.width === 0 && r.height === 0) {
      setRect(null);
      setReady(true);
      return;
    }

    setRect(r);
    setReady(true);

    // Scroll into view if needed
    const inView = r.top >= 0 && r.bottom <= window.innerHeight;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Re-measure after scroll
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        if (r2.width > 0 && r2.height > 0) setRect(r2);
      }, 400);
    }
  }, [currentStep, isVisible, steps]);

  useEffect(() => {
    measureTarget();
    window.addEventListener('resize', measureTarget);
    window.addEventListener('scroll', measureTarget, true);
    return () => {
      window.removeEventListener('resize', measureTarget);
      window.removeEventListener('scroll', measureTarget, true);
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

  // If target not found, still show tooltip centered
  const hasTarget = rect !== null && rect.width > 0;

  // Spotlight clip-path: a full-screen rect with a rectangular hole
  const clipPath = hasTarget
    ? `polygon(
        0% 0%, 0% 100%,
        ${rect!.left - PADDING}px 100%,
        ${rect!.left - PADDING}px ${rect!.top - PADDING}px,
        ${rect!.right + PADDING}px ${rect!.top - PADDING}px,
        ${rect!.right + PADDING}px ${rect!.bottom + PADDING}px,
        ${rect!.left - PADDING}px ${rect!.bottom + PADDING}px,
        ${rect!.left - PADDING}px 100%,
        100% 100%, 100% 0%
      )`
    : undefined;

  // Tooltip position
  const calcTooltipPos = (): React.CSSProperties => {
    if (!hasTarget) {
      // Center on screen
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const r = rect!;
    const placement = step.placement || 'bottom';
    const gap = 14;

    // Calculate base position
    let top: number | undefined;
    let left: number | undefined;
    let bottom: number | undefined;

    switch (placement) {
      case 'bottom':
        top = r.bottom + gap;
        left = Math.max(PADDING, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING));
        // If tooltip would go off bottom, flip to top
        if (top + TOOLTIP_H_EST > window.innerHeight) {
          top = undefined;
          bottom = window.innerHeight - r.top + gap;
        }
        break;
      case 'top':
        bottom = window.innerHeight - r.top + gap;
        left = Math.max(PADDING, Math.min(r.left + r.width / 2 - TOOLTIP_W / 2, window.innerWidth - TOOLTIP_W - PADDING));
        // If tooltip would go off top, flip to bottom
        if (window.innerHeight - bottom - TOOLTIP_H_EST < 0) {
          bottom = undefined;
          top = r.bottom + gap;
        }
        break;
      case 'right':
        top = Math.max(PADDING, r.top + r.height / 2 - TOOLTIP_H_EST / 2);
        left = r.right + gap;
        // If off right edge, flip to left
        if (left + TOOLTIP_W > window.innerWidth) {
          left = Math.max(PADDING, r.left - TOOLTIP_W - gap);
        }
        break;
      case 'left':
        top = Math.max(PADDING, r.top + r.height / 2 - TOOLTIP_H_EST / 2);
        left = Math.max(PADDING, r.left - TOOLTIP_W - gap);
        // If off left edge, flip to right
        if (left < PADDING) {
          left = r.right + gap;
        }
        break;
    }

    return { top, left, bottom };
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
            key={currentStep}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            className="fixed z-[9999] rounded-2xl border border-border/60 bg-card shadow-2xl"
            style={{ width: TOOLTIP_W, ...calcTooltipPos() }}
          >
            <div className="p-5">
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
                  {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
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
