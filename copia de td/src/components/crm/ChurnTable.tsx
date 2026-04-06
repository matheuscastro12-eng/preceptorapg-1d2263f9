import type { CrmChurnPrediction } from "@/lib/crm/types";
import { RISK_LEVEL_COLORS, HEALTH_ZONE_COLORS } from "@/lib/crm/types";
import { AlertTriangle, Mail, MessageSquare, Phone, CheckCircle } from "lucide-react";

interface ChurnTableProps {
  predictions: CrmChurnPrediction[];
}

const SIGNAL_LABELS: Record<string, string> = {
  no_login_7days: "Sem login ha 7d",
  login_down_50pct: "Logins -50%",
  zero_questions_5days: "Sem questoes 5d",
  three_emails_unopened: "3 e-mails ignorados",
  card_declined: "Cartao recusado",
  visited_cancellation: "Acessou cancelamento",
  downgrade_intent: "Tentou fazer downgrade",
  health_score_below_40: "Health score < 40",
  streak_broken: "Streak quebrado",
};

const RISK_LABELS: Record<string, string> = {
  low: "Baixo",
  medium: "Medio",
  high: "Alto",
  critical: "Critico",
};

const INTERVENTION_ICONS: Record<string, React.ElementType> = {
  email_personalizado: Mail,
  push_whatsapp_mentoria: MessageSquare,
  desconto_30pct_call: Phone,
};

export default function ChurnTable({ predictions }: ChurnTableProps) {
  if (predictions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        <CheckCircle className="w-10 h-10 mb-3 text-green-500" />
        <p className="font-medium">Nenhum risco de churn detectado</p>
        <p className="text-sm">Todos os alunos estao engajados</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Aluno</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Probabilidade</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Risco</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Health Score</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Sinais</th>
            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Intervencao</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {predictions.map((p) => {
            const riskColor = RISK_LEVEL_COLORS[p.risk_level];
            const healthColor = p.health_zone ? HEALTH_ZONE_COLORS[p.health_zone] : "#6b7280";
            const InterventionIcon = p.intervention_type ? INTERVENTION_ICONS[p.intervention_type] ?? AlertTriangle : AlertTriangle;

            return (
              <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="py-3 px-4">
                  <div>
                    <p className="font-medium text-white text-sm">{p.nome ?? "—"}</p>
                    <p className="text-xs text-gray-500">{p.email}</p>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${p.churn_probability * 100}%`, backgroundColor: riskColor }} />
                    </div>
                    <span className="font-bold text-sm" style={{ color: riskColor }}>{Math.round(p.churn_probability * 100)}%</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: `${riskColor}20`, color: riskColor, border: `1px solid ${riskColor}40` }}>
                    {RISK_LABELS[p.risk_level]}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: healthColor }}>{p.health_score ?? "—"}</span>
                    {p.questoes_7d !== undefined && <span className="text-xs text-gray-500">({p.questoes_7d} q/7d)</span>}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {(p.signals ?? []).slice(0, 3).map((signal) => (
                      <span key={signal} className="px-1.5 py-0.5 bg-red-900/30 text-red-400 text-xs rounded border border-red-800/30">
                        {SIGNAL_LABELS[signal] ?? signal}
                      </span>
                    ))}
                    {(p.signals ?? []).length > 3 && (
                      <span className="px-1.5 py-0.5 bg-gray-800 text-gray-400 text-xs rounded">+{(p.signals ?? []).length - 3}</span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1.5">
                    <InterventionIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">
                      {p.intervention_sent ? <span className="text-green-400">Enviada</span> : p.intervention_type?.replace(/_/g, " ") ?? "—"}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
