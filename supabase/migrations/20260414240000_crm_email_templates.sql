-- Tabela de templates de email editaveis pelo time de marketing.
-- trigger_name e a chave unica; o crm-automations engine le daqui.

CREATE TABLE IF NOT EXISTS public.crm_email_templates (
  trigger_name TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  subject TEXT NOT NULL,
  preview TEXT,
  body_html TEXT NOT NULL,
  description TEXT,
  variables JSONB DEFAULT '["nome"]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID
);

ALTER TABLE public.crm_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage crm_email_templates" ON public.crm_email_templates
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed dos 13 templates atuais (usa {{nome}} como variavel substituivel)
INSERT INTO public.crm_email_templates (trigger_name, label, subject, preview, body_html, description) VALUES
('boas_vindas', 'Boas-vindas',
 'Bem-vindo ao PreceptorMED! Veja como comecar',
 'Sua jornada para a residencia comeca agora',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Seja bem-vindo ao PreceptorMED. Sua jornada para a residencia comeca agora.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br" style="background:#1B5E3B;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Comecar agora</a></div>',
 'Enviado apos cadastro'),

('ativacao_d1', 'Ativacao D+1',
 'Voce ja respondeu sua primeira questao?',
 '1 questao por dia ja faz diferenca. Veja como',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Ja respondeu sua primeira questao? 1 por dia ja faz diferenca.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/enamed" style="background:#1B5E3B;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Responder agora</a></div>',
 '1 dia apos cadastro se ainda nao respondeu nada'),

('engajamento_d3', 'Engajamento D+3',
 '3 recursos que poucos estudantes conhecem no PreceptorMED',
 'Voce esta usando apenas 20% da plataforma',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">A maioria dos alunos usa so 20% da plataforma. Vou te mostrar 3 recursos que mudam o jogo: fechamentos IA, flashcards SM-2, e mentor cientifico.</p>',
 '3 dias apos cadastro'),

('social_proof_d5', 'Social proof D+5',
 'Como Joao passou em Clinica Medica com 92% usando o Preceptor',
 'Depoimento real de quem passou na residencia',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Depoimento real: Joao, 26, passou em Clinica Medica no HC-USP com 92% de acerto usando o PreceptorMED.</p>',
 '5 dias apos cadastro'),

('oferta_d6', 'Oferta D+6',
 'Oferta especial: 20% OFF so para voce — expira amanha',
 'Voce tem 24h para garantir seu desconto',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Voce tem 24h para garantir 20% OFF no plano anual. Nao perde.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/pricing" style="background:#C9A84C;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Aproveitar 20% OFF</a></div>',
 '6 dias apos cadastro (pre-vencimento trial)'),

('ultimo_dia_d7', 'Ultimo dia trial',
 'Ultimo dia do seu trial — nao perca o acesso',
 'Seu trial expira hoje. Continue de onde parou',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6"><strong>Hoje</strong> e o ultimo dia do seu trial. Nao deixe seu progresso se perder.</p>',
 '7 dias apos cadastro'),

('win_back_d14', 'Win-back',
 'Saudades? Temos novidades esperando por voce',
 'Voltamos com atualizacoes e um presente especial',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Sentimos sua falta. Temos novidades + um presente quando voce voltar.</p>',
 '14 dias sem atividade apos churn'),

('health_alert', 'Health Alert',
 'Seu progresso esta em risco — vamos recuperar juntos?',
 'Detectamos uma queda no seu ritmo de estudos',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Detectamos queda no seu ritmo. Vamos retomar juntos? Escolhe 1 PBL pra hoje e eu te acompanho.</p>',
 'Disparado quando health score cai abaixo de 40'),

('churn_prevention', 'Churn Prevention',
 'Ei, sentimos sua falta — temos algo para voce',
 'Uma oferta especial para te manter no caminho',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Sentimos sua falta. Preparamos uma oferta especial pra te trazer de volta.</p>',
 'Disparado pelo motor de churn-prediction'),

('referral_nudge', 'Referral nudge',
 'Indique um amigo e ganhe 1 mes gratis',
 'Seu link exclusivo de indicacao esta esperando',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Indique 1 amigo e ganhe 1 mes gratis. Link exclusivo no seu painel.</p>',
 'Campanha de indicacao'),

('upsell_cross', 'Upsell PreceptorENEM',
 'Voce sabia que tem o PreceptorENEM?',
 'Expanda seus estudos para alem da residencia',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Voce sabia que tambem temos o PreceptorENEM? Perfeito pra quem esta na faculdade.</p>',
 'Cross-sell para estudantes de graduacao'),

('reativacao', 'Reativacao',
 'Volta! 50% OFF no plano anual — so este mes',
 'Ultima chance antes do proximo ENAMED',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Volta pra gente. 50% OFF no plano anual so este mes — ultima chance antes do proximo ENAMED.</p>',
 'Campanha de reativacao de churned'),

('inadimplencia_d1', 'Inadimplencia D+1',
 'Ops! Seu pagamento nao foi processado',
 'Regularize para continuar seus estudos sem interrupcao',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p><p style="color:#555;line-height:1.6">Seu ultimo pagamento nao foi processado. Pode ser cartao expirado, limite ou dados desatualizados.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/subscription" style="background:#1B5E3B;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Atualizar pagamento</a></div><p style="color:#888;font-size:13px">Se ja regularizou, desconsidere.</p>',
 '1 dia apos falha de pagamento'),

('inadimplencia_d5', 'Inadimplencia D+5',
 'Aviso importante: seu acesso sera suspenso em 48h',
 'Atualize seus dados de pagamento para evitar a suspensao',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>,</p><p style="color:#555;line-height:1.6">Pagamento pendente ha <strong>5 dias</strong>. Em <strong>48h</strong> seu acesso sera <span style="color:#dc2626;font-weight:bold">suspenso</span>.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/subscription" style="background:#dc2626;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Regularizar agora</a></div>',
 '5 dias apos falha'),

('inadimplencia_d10', 'Inadimplencia D+10',
 'Ultima chance: 20% OFF para regularizar sua assinatura',
 'Oferta exclusiva por tempo limitado para manter seu acesso',
 '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>,</p><p style="color:#555;line-height:1.6">Ultima tentativa. Oferta exclusiva: <strong>20% OFF</strong> na renovacao.</p><div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/subscription" style="background:#1B5E3B;color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:bold">Regularizar com 20% OFF</a></div><p style="color:#dc2626;font-size:13px;text-align:center"><strong>Atencao:</strong> apos 15 dias cancela automaticamente.</p>',
 '10 dias apos falha — ultima tentativa')
ON CONFLICT (trigger_name) DO NOTHING;
