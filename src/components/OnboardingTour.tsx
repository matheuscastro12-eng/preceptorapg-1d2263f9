import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export interface TourStep {
  target: string; // CSS selector
  title: string;
  description: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTourProps {
  steps: TourStep[];
  tourKey: string; // localStorage key to track completion
  onComplete?: () => void;
}

const OnboardingTour = ({ steps, tourKey, onComplete }: OnboardingTourProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasCompletedTour = localStorage.getItem(`tour_${tourKey}`);
    if (!hasCompletedTour && steps.length > 0) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => setIsVisible(true), 500);
      return () => clearTimeout(timer);
    }
  }, [tourKey, steps.length]);

  useEffect(() => {
    if (!isVisible || !steps[currentStep]) return;

    const updatePosition = () => {
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isVisible, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(`tour_${tourKey}`, 'true');
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    localStorage.setItem(`tour_${tourKey}`, 'true');
    setIsVisible(false);
  };

  if (!isVisible || !targetRect) return null;

  const step = steps[currentStep];
  const placement = step.placement || 'bottom';

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  const padding = 16;
  const tooltipWidth = 320;
  
  switch (placement) {
    case 'bottom':
      tooltipStyle = {
        top: targetRect.bottom + padding,
        left: Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, padding),
          window.innerWidth - tooltipWidth - padding
        ),
      };
      break;
    case 'top':
      tooltipStyle = {
        bottom: window.innerHeight - targetRect.top + padding,
        left: Math.min(
          Math.max(targetRect.left + targetRect.width / 2 - tooltipWidth / 2, padding),
          window.innerWidth - tooltipWidth - padding
        ),
      };
      break;
    case 'right':
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2 - 60,
        left: targetRect.right + padding,
      };
      break;
    case 'left':
      tooltipStyle = {
        top: targetRect.top + targetRect.height / 2 - 60,
        right: window.innerWidth - targetRect.left + padding,
      };
      break;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9998] bg-background/80 backdrop-blur-sm"
            onClick={handleSkip}
          />

          {/* Spotlight on target */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed z-[9999] pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
              borderRadius: '12px',
            }}
          />

          {/* Target highlight ring */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed z-[9999] pointer-events-none rounded-xl ring-2 ring-primary ring-offset-2 ring-offset-background"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="fixed z-[10000] w-80 rounded-2xl border border-border/50 bg-card p-5 shadow-2xl"
            style={tooltipStyle}
          >
            {/* Close button */}
            <button
              onClick={handleSkip}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Passo {currentStep + 1} de {steps.length}
                </p>
                <h3 className="font-semibold text-foreground">{step.title}</h3>
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
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStep
                      ? 'w-4 bg-primary'
                      : i < currentStep
                      ? 'w-1.5 bg-primary/50'
                      : 'w-1.5 bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>

              <Button
                size="sm"
                onClick={handleNext}
                className="gap-1 bg-primary hover:bg-primary/90"
              >
                {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default OnboardingTour;
