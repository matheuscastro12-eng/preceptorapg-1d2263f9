-- Atualiza o template de trial pra refletir os 3 dias corretos (era 7).
-- Troca tambem o identificador de 'ultimo_dia_d7' pra 'ultimo_dia_trial'
-- pra evitar confusao futura — e mantem row com dados atualizados.

-- 1) Atualiza conteudo: subject, preview, body, label, description
UPDATE public.crm_email_templates
SET
  label = 'Ultimo dia trial',
  subject = 'Seu teste de 3 dias termina hoje — nao perca o acesso',
  preview = 'O trial expira hoje. Continue de onde parou.',
  description = 'Disparado no 3o (ultimo) dia do teste gratis',
  body_html = '<p style="font-size:16px;color:#333">Ola, <strong>{{nome}}</strong>!</p>' ||
    '<p style="color:#555;line-height:1.6"><strong>Hoje</strong> e o ultimo dia do seu teste de 3 dias. Nao deixe seu progresso se perder — escolha um plano pra continuar com tudo liberado.</p>' ||
    '<div style="text-align:center;margin:24px 0"><a href="https://thepreceptor.com.br/pricing" style="background:#C9A84C;color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:bold">Ver planos</a></div>' ||
    '<p style="color:#888;font-size:13px">Qualquer duvida, responda este email.</p>',
  updated_at = NOW()
WHERE trigger_name = 'ultimo_dia_d7';
