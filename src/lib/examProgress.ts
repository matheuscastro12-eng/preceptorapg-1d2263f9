/**
 * Persistência local de prova em andamento (ENAMED gerado + banco).
 * localStorage: sobrevive a fechar/reabrir aba sem latência nem migration.
 * Progresso expira em 7 dias.
 */

export interface SavedExamProgress {
  currentIndex: number;
  answers: Record<number, string>;
  revealed: number[];
  savedAt: number;
}

const EXPIRY_MS = 7 * 86400000;

/** Hash estável (djb2) — mesmo conteúdo de prova gera a mesma chave. */
export function hashStr(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function examStorageKey(seed: string): string {
  return `enamed_progress_${hashStr(seed.slice(0, 4000))}`;
}

export function loadExamProgress(key: string): SavedExamProgress | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const p = JSON.parse(raw) as SavedExamProgress;
    if (Date.now() - (p.savedAt ?? 0) > EXPIRY_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export function saveExamProgress(
  key: string,
  data: Omit<SavedExamProgress, 'savedAt'>,
): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    /* quota cheia / modo privado — ignora silenciosamente */
  }
}

export function clearExamProgress(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}
