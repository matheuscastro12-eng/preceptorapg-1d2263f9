-- ============================================================
-- SISTEMA DE SUPORTE + FEEDBACK + NPS + CSAT
-- Criado em 2026-04-09 para o PreceptorMED
-- ============================================================

-- ------------------------------------------------------------
-- 1. CONVERSAS DE SUPORTE (IA)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  subject TEXT,
  escalated_to_email BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own support conversations"
  ON public.support_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own support conversations"
  ON public.support_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own support conversations"
  ON public.support_conversations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_conversations_user_id
  ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_support_conversations_status
  ON public.support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_support_conversations_created_at
  ON public.support_conversations(created_at DESC);

CREATE TRIGGER update_support_conversations_updated_at
  BEFORE UPDATE ON public.support_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 2. MENSAGENS DO SUPORTE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages from their own conversations"
  ON public.support_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create messages in their own conversations"
  ON public.support_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_messages_conversation_id
  ON public.support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_support_messages_created_at
  ON public.support_messages(created_at);

-- ------------------------------------------------------------
-- 3. FEEDBACKS DE MELHORIA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN (
    'general', 'bug', 'improvement', 'feature_request', 'ui_ux', 'content', 'performance', 'other'
  )),
  title TEXT,
  content TEXT NOT NULL,
  page_url TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'in_progress', 'done', 'declined')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own feedback"
  ON public.support_feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own feedback"
  ON public.support_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_support_feedback_user_id
  ON public.support_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_support_feedback_category
  ON public.support_feedback(category);
CREATE INDEX IF NOT EXISTS idx_support_feedback_status
  ON public.support_feedback(status);
CREATE INDEX IF NOT EXISTS idx_support_feedback_created_at
  ON public.support_feedback(created_at DESC);

CREATE TRIGGER update_support_feedback_updated_at
  BEFORE UPDATE ON public.support_feedback
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 4. RESPOSTAS NPS (0-10)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nps_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score SMALLINT NOT NULL CHECK (score >= 0 AND score <= 10),
  category TEXT GENERATED ALWAYS AS (
    CASE
      WHEN score >= 9 THEN 'promoter'
      WHEN score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nps_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own NPS responses"
  ON public.nps_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own NPS responses"
  ON public.nps_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nps_responses_user_id
  ON public.nps_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_responses_created_at
  ON public.nps_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nps_responses_category
  ON public.nps_responses(category);

-- ------------------------------------------------------------
-- 5. RESPOSTAS CSAT (1-5)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.csat_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.support_conversations(id) ON DELETE SET NULL,
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  resolved BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.csat_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own CSAT responses"
  ON public.csat_responses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own CSAT responses"
  ON public.csat_responses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_csat_responses_user_id
  ON public.csat_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_csat_responses_conversation_id
  ON public.csat_responses(conversation_id);
CREATE INDEX IF NOT EXISTS idx_csat_responses_created_at
  ON public.csat_responses(created_at DESC);

-- ------------------------------------------------------------
-- 6. RASTREIO DE PROMPTS NPS (para nao mostrar o modal todo dia)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nps_prompt_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  dismissed BOOLEAN NOT NULL DEFAULT false,
  responded BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.nps_prompt_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own NPS prompts"
  ON public.nps_prompt_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own NPS prompts"
  ON public.nps_prompt_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own NPS prompts"
  ON public.nps_prompt_log FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_nps_prompt_log_user_id
  ON public.nps_prompt_log(user_id);
CREATE INDEX IF NOT EXISTS idx_nps_prompt_log_shown_at
  ON public.nps_prompt_log(shown_at DESC);

-- ------------------------------------------------------------
-- 7. CACHE DE RESUMOS DE FEEDBACK GERADOS PELA IA
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.support_feedback_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  total_feedbacks INTEGER NOT NULL DEFAULT 0,
  top_themes JSONB NOT NULL DEFAULT '[]'::jsonb,
  executive_summary TEXT NOT NULL,
  detailed_summary TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.support_feedback_summaries ENABLE ROW LEVEL SECURITY;

-- apenas service role escreve; leitura por admins via edge function
CREATE POLICY "No client access to feedback summaries"
  ON public.support_feedback_summaries FOR SELECT
  USING (false);

CREATE INDEX IF NOT EXISTS idx_support_feedback_summaries_generated_at
  ON public.support_feedback_summaries(generated_at DESC);
