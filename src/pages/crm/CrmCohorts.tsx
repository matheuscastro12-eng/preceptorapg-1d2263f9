import { useEffect, useMemo, useState } from "react";
import { Users, Info } from "lucide-react";
import { supabase } from "@/lib/crm/supabase";
import { ErrorState, EmptyState } from "@/components/crm/QueryState";
import { Skeleton } from "@/components/ui/skeleton";
import ExportButton from "@/components/crm/ExportButton";

interface CohortCell {
  cohort: string;        // "2026-03"
  monthOffset: number;   // 0, 1, 2, ...
  retained: number;
}

interface CohortRow {
  cohort: string;
  size: number;
  cells: (number | null)[]; // retention percent por month offset
  counts: (number | null)[]; // users retidos (valor absoluto)
}

// Monthly format helper
const fmtMonth = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

function colorFor(pct: number | null): string {
  if (pct === null) return "bg-gray-900/20";
  if (pct >= 80) return "bg-green-600/70 text-white";
  if (pct >= 60) return "bg-green-500/50 text-white";
  if (pct >= 40) return "bg-yellow-500/50 text-gray-900";
  if (pct >= 20) return "bg-orange-500/50 text-gray-900";
  return "bg-red-500/40 text-white";
}

export default function CrmCohorts() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<Error | null>(null);
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [nMonths] = useState(6); // quantos meses forward cada cohort mostra

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      // Busca profiles com user_id + atividade (generation_logs)
      // Agrupa profiles por mes de created_at. Pra cada coorte, ve quantos
      // tiveram atividade em cada mes subsequente.
      const sinceCutoff = new Date(Date.now() - 12 * 30 * 86400000).toISOString();

      const [profilesRes, logsRes] = await Promise.all([
        supabase.from("profiles").select("user_id, created_at").gte("created_at", sinceCutoff),
        supabase.from("generation_logs").select("user_id, created_at").gte("created_at", sinceCutoff).limit(50000),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (logsRes.error) throw logsRes.error;

      // Mapa user_id -> cohort (mes de signup)
      const userToCohort = new Map<string, string>();
      for (const p of profilesRes.data ?? []) {
        userToCohort.set(p.user_id, fmtMonth(new Date(p.created_at)));
      }

      // Mapa cohort -> Set de users que tiveram atividade no month offset X
      // Estrutura: cohort -> monthOffset -> Set<user_id>
      const matrix = new Map<string, Map<number, Set<string>>>();
      const cohortSizes = new Map<string, Set<string>>();

      // Popula coortes com seus usuarios (signup no mes 0)
      for (const [userId, cohort] of userToCohort.entries()) {
        if (!cohortSizes.has(cohort)) cohortSizes.set(cohort, new Set());
        cohortSizes.get(cohort)!.add(userId);

        if (!matrix.has(cohort)) matrix.set(cohort, new Map());
        // Mes 0 = retido por default (eles estao na coorte)
        if (!matrix.get(cohort)!.has(0)) matrix.get(cohort)!.set(0, new Set());
        matrix.get(cohort)!.get(0)!.add(userId);
      }

      // Pra cada log, atribui ao month offset vs data de signup
      for (const log of logsRes.data ?? []) {
        const cohort = userToCohort.get(log.user_id);
        if (!cohort) continue;
        const cohortDate = new Date(cohort + "-01T00:00:00.000Z");
        const logDate = new Date(log.created_at);
        const offset =
          (logDate.getUTCFullYear() - cohortDate.getUTCFullYear()) * 12 +
          (logDate.getUTCMonth() - cohortDate.getUTCMonth());
        if (offset < 0 || offset > nMonths) continue;

        const m = matrix.get(cohort)!;
        if (!m.has(offset)) m.set(offset, new Set());
        m.get(offset)!.add(log.user_id);
      }

      // Converte pra rows ordenados por cohort desc (mais recentes em cima)
      const sortedCohorts = Array.from(cohortSizes.keys()).sort().reverse();
      const nowCohort = fmtMonth(new Date());

      const built: CohortRow[] = sortedCohorts.map((cohort) => {
        const size = cohortSizes.get(cohort)!.size;
        const cells: (number | null)[] = [];
        const counts: (number | null)[] = [];
        const cohortDate = new Date(cohort + "-01T00:00:00.000Z");

        for (let off = 0; off <= nMonths; off++) {
          // Se o mes alvo ainda nao aconteceu, celula fica null
          const target = new Date(cohortDate);
          target.setUTCMonth(target.getUTCMonth() + off);
          const targetMonth = fmtMonth(target);
          if (targetMonth > nowCohort) {
            cells.push(null);
            counts.push(null);
            continue;
          }
          const retained = matrix.get(cohort)?.get(off)?.size ?? 0;
          const pct = size > 0 ? Math.round((retained / size) * 100) : 0;
          cells.push(pct);
          counts.push(retained);
        }

        return { cohort, size, cells, counts };
      });

      setRows(built);
    } catch (e) {
      setErr(e as Error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totals = useMemo(() => {
    const totalUsers = rows.reduce((s, r) => s + r.size, 0);
    const avgMonth1 = rows.length === 0 ? 0 :
      Math.round(rows.reduce((s, r) => s + (r.cells[1] ?? 0), 0) / rows.length);
    const avgMonth3 = rows.length === 0 ? 0 :
      Math.round(rows.reduce((s, r) => s + (r.cells[3] ?? 0), 0) / rows.length);
    return { totalUsers, avgMonth1, avgMonth3 };
  }, [rows]);

  if (err) {
    return <div className="p-4 md:p-6"><ErrorState error={err} onRetry={load} /></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6 max-w-[1400px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Cohort Analysis</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">
            Retencao por mes de cadastro — mostra % de usuarios que continuaram ativos nos meses seguintes
          </p>
        </div>
        <ExportButton
          data={rows.map((r) => ({
            cohort: r.cohort,
            size: r.size,
            ...Object.fromEntries(r.cells.map((v, i) => [`mes_${i}`, v === null ? "" : `${v}%`])),
          }))}
          filename="cohorts"
        />
      </div>

      {/* Explicacao */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-200">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          <strong>Como ler:</strong> cada linha e uma coorte (usuarios que se cadastraram no mesmo mes).
          Colunas sao meses apos cadastro. Celula = % desses usuarios que ainda tinham atividade no mes N.
          Ex: "Mes 3 = 40%" significa que 40% dos usuarios da coorte estavam ativos no terceiro mes.
        </div>
      </div>

      {/* KPIs */}
      {!loading && rows.length > 0 && (
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total de usuarios</p>
            <p className="text-2xl font-bold text-white">{totals.totalUsers}</p>
            <p className="text-[11px] text-gray-600 mt-0.5">em {rows.length} coortes</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Retencao media M1</p>
            <p className={`text-2xl font-bold ${totals.avgMonth1 >= 40 ? "text-green-400" : "text-yellow-400"}`}>{totals.avgMonth1}%</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Benchmark SaaS: 30-50%</p>
          </div>
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Retencao media M3</p>
            <p className={`text-2xl font-bold ${totals.avgMonth3 >= 20 ? "text-green-400" : "text-yellow-400"}`}>{totals.avgMonth3}%</p>
            <p className="text-[11px] text-gray-600 mt-0.5">Benchmark SaaS: 15-30%</p>
          </div>
        </div>
      )}

      {/* Heatmap */}
      {loading ? (
        <Skeleton className="h-96 w-full bg-gray-800 rounded-xl" />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="Sem dados de coorte ainda"
          description="Assim que tiver usuarios cadastrados nos ultimos 12 meses com atividade, o heatmap aparece aqui."
        />
      ) : (
        <div className="bg-gray-900/80 border border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-900/80 border-b border-gray-800">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider sticky left-0 bg-gray-900/80">Coorte</th>
                  <th className="text-left py-3 px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tamanho</th>
                  {Array.from({ length: nMonths + 1 }).map((_, i) => (
                    <th key={i} className="text-center py-3 px-3 text-xs font-bold text-gray-400 uppercase tracking-wider">M{i}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/40">
                {rows.map((r) => (
                  <tr key={r.cohort} className="hover:bg-gray-800/20">
                    <td className="py-2.5 px-4 text-sm font-semibold text-white sticky left-0 bg-gray-900/90">{r.cohort}</td>
                    <td className="py-2.5 px-4 text-sm text-gray-300">{r.size}</td>
                    {r.cells.map((pct, i) => (
                      <td key={i} className="px-2 py-1">
                        <div
                          className={`min-w-[54px] h-10 rounded flex flex-col items-center justify-center text-xs font-bold ${colorFor(pct)}`}
                          title={r.counts[i] !== null ? `${r.counts[i]} de ${r.size} usuarios` : "Mes ainda nao aconteceu"}
                        >
                          {pct === null ? <span className="text-gray-600">—</span> : <span>{pct}%</span>}
                          {pct !== null && (
                            <span className="text-[9px] font-normal opacity-70">{r.counts[i]}</span>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-800/40 flex items-center gap-3 flex-wrap text-[10px]">
            <span className="text-gray-500 uppercase font-bold tracking-wider">Legenda:</span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-600/70" /><span className="text-gray-400">≥80%</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-green-500/50" /><span className="text-gray-400">60-79%</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-yellow-500/50" /><span className="text-gray-400">40-59%</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-orange-500/50" /><span className="text-gray-400">20-39%</span></span>
            <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-red-500/40" /><span className="text-gray-400">&lt;20%</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
