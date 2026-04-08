import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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

const PADDING = 12;
const GAP = 16;

const OnboardingTour = ({ steps, tourKey, onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const getTooltipWidth = () => Math.min(300, window.innerWidth - 40);

  useEffect(() => {
    const done = localStorage.getItem(`tour_${tourKey}`);
    if (!done && steps.length > 0) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps.length]);

  const measure = useCallback(() => {
    if (!isVisible || !steps[currentStep]) return;

    const el = document.querySelector(steps[currentStep].target) as HTMLElement | null;
    if (!el) {
      setPos(null);
      return;
    }

    // Use offsetTop/offsetLeft to get position relative to offsetParent chain
    // This avoids issues with CSS transforms affecting getBoundingClientRect
    const rect = el.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    setPos({
      top: rect.top + scrollY,
      left: rect.left + scrollX,
      width: rect.width,
      height: rect.height,
    });

    // Scroll into view
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!inView) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => {
        const r2 = el.getBoundingClientRect();
        setPos({
          top: r2.top + window.scrollY,
          left: r2.left + window.scrollX,
          width: r2.width,
          height: r2.height,
        });
      }, 500);
    }
  }, [currentStep, isVisible, steps]);

  useEffect(() => {
    if (!isVisible) return;
    measure();
    const timers = [100, 300, 600, 1000, 1500].map(ms => setTimeout(measure, ms));
    const onScroll = () => requestAnimationFrame(measure);
    window.addEventListener('resize', onScroll);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', onScroll);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [measure, isVisible]);

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

  if (!isVisible) return null;

  const step = steps[currentStep];
  const hasTarget = pos !== null && pos.width > 0;
  const tooltipW = getTooltipWidth();

  // Calculate tooltip position below or above the target
  const getTooltipStyle = (): React.CSSProperties => {
    if (!hasTarget) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const viewportTop = window.scrollY;
    const viewportBottom = viewportTop + window.innerHeight;
    const targetBottom = pos!.top + pos!.height;
    const targetCenterX = pos!.left + pos!.width / 2;
    const tooltipH = tooltipRef.current?.offsetHeight ?? 220;

    // Try below first
    let top = targetBottom + GAP;
    const spaceBelow = viewportBottom - targetBottom - GAP;
    const spaceAbove = pos!.top - viewportTop - GAP;

    if (spaceBelow < tooltipH && spaceAbove > tooltipH) {
      top = pos!.top - tooltipH - GAP;
    }

    // Horizontal: center on target, clamp to viewport
    let left = targetCenterX - tooltipW / 2;
    left = Math.max(window.scrollX + 20, Math.min(left, window.scrollX + window.innerWidth - tooltipW - 20));

    return { position: 'absolute' as const, top, left };
  };

  const overlay = (
    <>
      {/* Full-screen dark overlay */}
      <div
        className="fixed inset-0 z-[9990] transition-opacity duration-300"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={finish}
      />

      {/* Spotlight — cut out hole for the target */}
      {hasTarget && (
        <div
          className="fixed z-[9991] pointer-events-none rounded-2xl transition-all duration-300"
          style={{
            top: pos!.top - window.scrollY - PADDING,
            left: pos!.left - window.scrollX - PADDING,
            width: pos!.width + PADDING * 2,
            height: pos!.height + PADDING * 2,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 0 3px rgba(0, 109, 91, 0.5)',
            background: 'transparent',
          }}
        />
      )}

      {/* Tooltip */}
      <AnimatePresence mode="wait">
        <motion.div
          ref={tooltipRef}
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="z-[9999] rounded-2xl border border-slate-200 bg-white shadow-2xl"
          style={{ width: tooltipW, ...getTooltipStyle() }}
        >
          <div className="p-5">
            {/* Close */}
            <button
              onClick={finish}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4 text-slate-400" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-9 w-9 rounded-xl bg-[#006D5B]/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-[#006D5B]" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                  Passo {currentStep + 1} de {steps.length}
                </p>
                <h3 className="font-bold text-slate-800 text-sm leading-tight">{step.title}</h3>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-slate-500 leading-relaxed mb-5">
              {step.description}
            </p>

            {/* Progress dots */}
            <div className="flex justify-center gap-1.5 mb-4">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? 'w-6 bg-[#006D5B]'
                      : i < currentStep
                      ? 'w-1.5 bg-[#006D5B]/40'
                      : 'w-1.5 bg-slate-200'
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
                className="gap-1 text-xs h-9 text-slate-500"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Anterior
              </Button>

              <Button
                size="sm"
                onClick={next}
                className="gap-1 text-xs h-9 bg-[#006D5B] hover:bg-[#005344] text-white"
              >
                {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );

  return createPortal(overlay, document.body);
};

export default OnboardingTour;
