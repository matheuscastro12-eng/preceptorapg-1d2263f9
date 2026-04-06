// ============================================================
// PRECEPTOR CRM — TypeScript Types
// ============================================================

export type LeadStatus =
  | "visitor"
  | "signup"
  | "active_trial"
  | "engaged"
  | "subscriber"
  | "churned"
  | "win_back";

export type HealthZone = "healthy" | "attention" | "risk" | "critical";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type AutomationType = "email" | "push" | "whatsapp" | "in_app";
export type DeliveryStatus = "pending" | "sent" | "delivered" | "opened" | "clicked" | "failed" | "bounced";
export type Produto = "preceptormed" | "preceptorjus" | "preceptorenem";

export type AutomationTrigger =
  | "boas_vindas"
  | "ativacao_d1"
  | "engajamento_d3"
  | "social_proof_d5"
  | "oferta_d6"
  | "ultimo_dia_d7"
  | "win_back_d14"
  | "health_alert"
  | "churn_prevention"
  | "referral_nudge"
  | "upsell_cross"
  | "reativacao";

export interface CrmLead {
  id: string;
  user_id: string | null;
  email: string;
  nome: string | null;
  telefone: string | null;
  lead_score: number;
  status: LeadStatus;
  produto_interesse: Produto;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  referral_code: string | null;
  landing_page: string | null;
  fase_medica: string | null;
  especialidade: string | null;
  faculdade: string | null;
  total_sessions: number;
  last_activity_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  converted_at: string | null;
  churned_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmFunnelEvent {
  id: string;
  lead_id: string;
  user_id: string | null;
  from_stage: LeadStatus | null;
  to_stage: LeadStatus;
  trigger_type: AutomationTrigger | null;
  trigger_source: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CrmHealthScore {
  id: string;
  user_id: string;
  lead_id: string | null;
  score: number;
  zone: HealthZone;
  pts_frequencia: number;
  pts_desempenho: number;
  pts_engajamento: number;
  pts_tendencia: number;
  questoes_7d: number;
  questoes_30d: number;
  acertos_pct: number;
  dias_ativos_14d: number;
  dias_ativos_30d: number;
  features_usadas: number;
  streak_atual: number;
  score_semana_anterior: number;
  variacao_score: number;
  produto: Produto;
  calculado_em: string;
  created_at: string;
}

export interface CrmChurnPrediction {
  id: string;
  user_id: string;
  lead_id: string | null;
  churn_probability: number;
  risk_level: RiskLevel;
  signals: string[];
  intervention_sent: boolean;
  intervention_type: string | null;
  intervention_at: string | null;
  intervention_result: string | null;
  outcome: string | null;
  outcome_at: string | null;
  prediction_window: number;
  valid_until: string;
  produto: Produto;
  created_at: string;
  updated_at: string;
  // Joins
  email?: string;
  nome?: string;
  health_score?: number;
  health_zone?: HealthZone;
  questoes_7d?: number;
  dias_ativos_14d?: number;
}

export interface CrmAutomationLog {
  id: string;
  lead_id: string | null;
  user_id: string | null;
  automation_type: AutomationType;
  trigger_name: AutomationTrigger;
  trigger_reason: string | null;
  template_id: string | null;
  template_name: string | null;
  channel: AutomationType;
  status: DeliveryStatus;
  error_message: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  failed_at: string | null;
  metadata: Record<string, unknown>;
  produto: Produto;
  created_at: string;
}

export interface CrmReferral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  status: "pending" | "converted" | "rewarded";
  tier: "bronze" | "silver" | "gold" | "diamond" | "elite";
  total_referrals: number;
  reward_type: string | null;
  reward_value: number | null;
  reward_applied: boolean;
  produto: Produto;
  created_at: string;
}

export interface FunnelKpis {
  produto: Produto;
  visitors: number;
  signups: number;
  active_trials: number;
  engaged: number;
  subscribers: number;
  churned: number;
  visitor_to_signup_pct: number;
  trial_to_engaged_pct: number;
  engaged_to_subscriber_pct: number;
}

export interface HealthDistribution {
  produto: Produto;
  zone: HealthZone;
  total: number;
  avg_score: number;
  avg_questoes_7d: number;
  avg_acertos_pct: number;
}

export interface AutomationPerformance {
  trigger_name: AutomationTrigger;
  automation_type: AutomationType;
  produto: Produto;
  total_sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  failed: number;
  open_rate_pct: number;
  click_rate_pct: number;
}

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  visitor: "Visitante",
  signup: "Cadastrado",
  active_trial: "Trial Ativo",
  engaged: "Engajado",
  subscriber: "Assinante",
  churned: "Churned",
  win_back: "Win-back",
};

export const HEALTH_ZONE_LABELS: Record<HealthZone, string> = {
  healthy: "Saudavel",
  attention: "Atencao",
  risk: "Risco",
  critical: "Critico",
};

export const HEALTH_ZONE_COLORS: Record<HealthZone, string> = {
  healthy: "#16a34a",
  attention: "#ca8a04",
  risk: "#ea580c",
  critical: "#dc2626",
};

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  low: "#16a34a",
  medium: "#ca8a04",
  high: "#ea580c",
  critical: "#dc2626",
};

export const AUTOMATION_TRIGGER_LABELS: Record<AutomationTrigger, string> = {
  boas_vindas: "Boas-vindas",
  ativacao_d1: "Ativacao D+1",
  engajamento_d3: "Engajamento D+3",
  social_proof_d5: "Prova Social D+5",
  oferta_d6: "Oferta 20% D+6",
  ultimo_dia_d7: "Ultimo Dia D+7",
  win_back_d14: "Win-back D+14",
  health_alert: "Alerta de Saude",
  churn_prevention: "Prevencao de Churn",
  referral_nudge: "Indicacao",
  upsell_cross: "Upsell Cross",
  reativacao: "Reativacao",
};

export const PRODUTO_LABELS: Record<Produto, string> = {
  preceptormed: "PreceptorMED",
  preceptorjus: "PreceptorJUS",
  preceptorenem: "PreceptorENEM",
};

export const PRODUTO_COLORS: Record<Produto, string> = {
  preceptormed: "#1B5E3B",
  preceptorjus: "#1A237E",
  preceptorenem: "#6A1B9A",
};
