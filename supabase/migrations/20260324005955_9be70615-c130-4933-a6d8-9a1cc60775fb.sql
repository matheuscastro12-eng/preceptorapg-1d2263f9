
-- CRM Leads: cada usuário/lead do funil
CREATE TABLE public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  email text NOT NULL,
  full_name text,
  phone text,
  source text DEFAULT 'organic',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  funnel_stage text NOT NULL DEFAULT 'signup',
  trial_started_at timestamptz,
  converted_at timestamptz,
  churned_at timestamptz,
  plan_type text,
  monthly_value numeric,
  tags text[] DEFAULT '{}',
  notes text,
  assigned_to text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CRM Funnel Events: cada mudança de estágio
CREATE TABLE public.crm_funnel_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.crm_leads(id) ON DELETE CASCADE NOT NULL,
  user_id uuid,
  event_type text NOT NULL,
  from_stage text,
  to_stage text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CRM Referrals: links de indicação
CREATE TABLE public.crm_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id uuid NOT NULL,
  referral_code text NOT NULL UNIQUE,
  referred_email text,
  referred_user_id uuid,
  status text NOT NULL DEFAULT 'pending',
  reward_type text,
  reward_applied_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- CRM Health Scores: score de engajamento
CREATE TABLE public.crm_health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  logins_last_7d integer DEFAULT 0,
  generations_last_7d integer DEFAULT 0,
  flashcards_reviewed_last_7d integer DEFAULT 0,
  days_since_last_activity integer DEFAULT 0,
  risk_level text DEFAULT 'healthy',
  calculated_at timestamptz NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_crm_leads_updated_at
  BEFORE UPDATE ON public.crm_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_funnel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_health_scores ENABLE ROW LEVEL SECURITY;

-- RLS: Admins only
CREATE POLICY "Admins can manage crm_leads" ON public.crm_leads FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_funnel_events" ON public.crm_funnel_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage crm_referrals" ON public.crm_referrals FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own referrals" ON public.crm_referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

CREATE POLICY "Admins can manage crm_health_scores" ON public.crm_health_scores FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own health score" ON public.crm_health_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
