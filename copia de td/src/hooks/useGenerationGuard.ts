import { useEffect, useRef, useCallback, useState } from 'react';

/**
 * Prevents page refresh/navigation during generation and enforces cooldown.
 */
export const useGenerationGuard = (generating: boolean, cooldownMs = 10000) => {
  const [cooldown, setCooldown] = useState(false);
  const cooldownRef = useRef<ReturnType<typeof setTimeout>>();

  // Block page refresh/close during generation
  useEffect(() => {
    if (!generating) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'A geração está em andamento. Se você sair, perderá o conteúdo e o custo será cobrado mesmo assim.';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [generating]);

  // Start cooldown when generation ends
  useEffect(() => {
    if (generating) return;
    // Only set cooldown if we were previously generating
    return () => {
      setCooldown(true);
      cooldownRef.current = setTimeout(() => setCooldown(false), cooldownMs);
    };
  }, [generating, cooldownMs]);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearTimeout(cooldownRef.current);
    };
  }, []);

  const canGenerate = !generating && !cooldown;

  return { canGenerate, cooldown };
};
