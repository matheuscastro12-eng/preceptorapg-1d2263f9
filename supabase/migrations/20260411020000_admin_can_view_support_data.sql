-- ============================================================
-- Permitir que admins (user_roles.role='admin') leiam todos os
-- feedbacks, NPS, CSAT, conversas e mensagens de suporte para
-- popular o painel /admin/crm-mkt/suporte.
--
-- A migration original 20260409120000 só criou policies
-- "auth.uid() = user_id" — sem isso, o admin via supabaseCrm
-- enxergava só os próprios dados (basicamente nada).
-- ============================================================

-- support_feedback
CREATE POLICY "Admins can view all support feedback"
  ON public.support_feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all support feedback"
  ON public.support_feedback FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- nps_responses
CREATE POLICY "Admins can view all NPS responses"
  ON public.nps_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- csat_responses
CREATE POLICY "Admins can view all CSAT responses"
  ON public.csat_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- support_conversations
CREATE POLICY "Admins can view all support conversations"
  ON public.support_conversations FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- support_messages
CREATE POLICY "Admins can view all support messages"
  ON public.support_messages FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- support_feedback_summaries (gerados pela edge function via service_role)
-- Admins precisam ler para o painel; a policy original era USING (false)
DROP POLICY IF EXISTS "No client access to feedback summaries" ON public.support_feedback_summaries;

CREATE POLICY "Admins can view feedback summaries"
  ON public.support_feedback_summaries FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
