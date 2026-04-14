-- Configuracoes globais de branding dos emails (header + footer).
-- Uma linha unica (singleton) — qualquer template pode ser editado,
-- mas a moldura e compartilhada.

CREATE TABLE IF NOT EXISTS public.crm_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  logo_url TEXT,
  logo_text TEXT DEFAULT 'PreceptorMED',
  header_bg TEXT DEFAULT '#1B5E3B',
  header_text_color TEXT DEFAULT '#C9A84C',
  footer_text TEXT DEFAULT 'Preceptor Group © 2026 · Voce recebeu este email por ser assinante do PreceptorMED',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

ALTER TABLE public.crm_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm_email_settings" ON public.crm_email_settings
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed com valores atuais (so insere se tabela vazia)
INSERT INTO public.crm_email_settings (logo_text, header_bg, header_text_color, footer_text)
SELECT 'PreceptorMED', '#1B5E3B', '#C9A84C',
       'Preceptor Group © 2026 · Voce recebeu este email por ser assinante do PreceptorMED'
WHERE NOT EXISTS (SELECT 1 FROM public.crm_email_settings);
