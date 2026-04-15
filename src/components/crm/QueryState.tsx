import { AlertCircle, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReactNode } from "react";

interface ErrorStateProps {
  error?: Error | null;
  onRetry?: () => void;
  className?: string;
}

/** Card de erro reutilizavel com botao de retry. */
export function ErrorState({ error, onRetry, className = "" }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center bg-gray-900/40 border border-red-900/30 rounded-xl ${className}`}>
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mb-3">
        <AlertCircle className="w-5 h-5 text-red-400" />
      </div>
      <p className="text-sm font-semibold text-white mb-1">Erro ao carregar dados</p>
      <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
        {error?.message || "Nao foi possivel se comunicar com o servidor. Tente novamente em instantes."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/** Empty state amigavel pra listas sem dados. */
export function EmptyState({ icon, title, description, action, className = "" }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-6 text-center ${className}`}>
      {icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 mb-3 text-gray-500">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-white mb-1">{title}</p>
      {description && <p className="text-xs text-gray-500 max-w-sm mx-auto">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Skeleton pra card de metrica (KPI). */
export function MetricCardSkeleton() {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 space-y-2">
      <Skeleton className="h-3 w-24 bg-gray-800" />
      <Skeleton className="h-8 w-32 bg-gray-800" />
      <Skeleton className="h-2 w-16 bg-gray-800" />
    </div>
  );
}

/** Grid de skeletons pra uma linha de KPIs. */
export function MetricRowSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 ${count >= 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"} gap-3 md:gap-4`}>
      {Array.from({ length: count }).map((_, i) => <MetricCardSkeleton key={i} />)}
    </div>
  );
}

/** Skeleton de tabela (n linhas x m colunas aproximado). */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-3 border-b border-gray-800">
        <Skeleton className="h-4 w-40 bg-gray-800" />
      </div>
      <div className="divide-y divide-gray-800/50">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-3 flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full bg-gray-800 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-1/3 bg-gray-800" />
              <Skeleton className="h-2 w-1/2 bg-gray-800" />
            </div>
            <Skeleton className="h-5 w-16 bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}
