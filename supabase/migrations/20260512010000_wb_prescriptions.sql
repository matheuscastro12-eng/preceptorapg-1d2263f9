-- PreceptorBook: Prescrições por doença
-- Tabela wb_prescriptions: rascunho de prescrição vinculado a protocolo/doença.
-- Cada prescrição tem itens (drogas com dose/via/freq/duração) + orientações + exames.

CREATE TABLE IF NOT EXISTS public.wb_prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  titulo text NOT NULL,
  doenca text NOT NULL,
  condicao_clinica text,
  protocol_slug text, -- soft link to wb_protocols(slug), NULL se ainda não existe protocolo
  -- (FK strict removida pra permitir prescrição independente; UI faz cross-link)
  contexto text, -- 'PA', 'UPA', 'UTI', 'Enfermaria', 'Ambulatorial'
  resumo text,
  itens jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- itens: [{droga, dose, via, frequencia, duracao, obs, drug_slug?}]
  orientacoes_gerais text[],
  exames_complementares text[],
  criterios_internacao text[],
  criterios_alta text[],
  alertas text[],
  fonte text,
  fonte_url text,
  data_diretriz date,
  published boolean NOT NULL DEFAULT false,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce(titulo, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(doenca, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(condicao_clinica, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(resumo, '')), 'C')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Caso a tabela já tenha sido criada com FK em deploy anterior, removê-la
ALTER TABLE public.wb_prescriptions DROP CONSTRAINT IF EXISTS wb_prescriptions_protocol_slug_fkey;

CREATE INDEX IF NOT EXISTS idx_wb_prescriptions_search ON public.wb_prescriptions USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_wb_prescriptions_protocol ON public.wb_prescriptions(protocol_slug) WHERE protocol_slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wb_prescriptions_published ON public.wb_prescriptions(published) WHERE published = true;

ALTER TABLE public.wb_prescriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_prescriptions read published" ON public.wb_prescriptions;
CREATE POLICY "wb_prescriptions read published" ON public.wb_prescriptions
  FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "wb_prescriptions admin write" ON public.wb_prescriptions;
CREATE POLICY "wb_prescriptions admin write" ON public.wb_prescriptions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.wb_prescriptions_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_wb_prescriptions_updated_at ON public.wb_prescriptions;
CREATE TRIGGER trg_wb_prescriptions_updated_at
  BEFORE UPDATE ON public.wb_prescriptions
  FOR EACH ROW EXECUTE FUNCTION public.wb_prescriptions_set_updated_at();

-- ============================================================
-- SEED: 12 prescrições de doenças comuns / emergências
-- ============================================================

-- 1. SEPSE / CHOQUE SÉPTICO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, protocol_slug, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'sepse-pacote-1h',
  'Sepse / Choque séptico — pacote da 1ª hora',
  'Sepse',
  'Adulto com qSOFA ≥ 2 ou suspeita de sepse',
  'sepse',
  'PA / UTI',
  'Pacote da 1ª hora (Surviving Sepsis 2021): cultura → ATB amplo → cristaloide 30 mL/kg → noradrenalina se PAM <65 após volume.',
  $$[
    {"droga":"Lactato sérico + culturas (2 hemoculturas + sítio)","dose":"colher ANTES do ATB","via":"—","frequencia":"única","obs":"não atrasar ATB > 45 min para colher cultura"},
    {"droga":"Cristaloide (Ringer lactato preferido)","dose":"30 mL/kg","via":"IV","frequencia":"em 3h","duracao":"reavaliar a cada 500-1000 mL","obs":"meta: PAM ≥ 65, lactato em queda"},
    {"droga":"Piperacilina-tazobactam","dose":"4,5 g","via":"IV","frequencia":"6/6h","duracao":"7-10 dias","obs":"primeira dose em até 1h. ATB de amplo espectro empírico, ajustar conforme cultura/foco","drug_slug":"piperacilina-tazobactam"},
    {"droga":"Noradrenalina","dose":"0,05-0,5 mcg/kg/min","via":"IV BIC (acesso central)","frequencia":"contínua","obs":"iniciar se PAM <65 após cristaloide. Titular para PAM ≥ 65","drug_slug":"noradrenalina"},
    {"droga":"Vasopressina","dose":"0,03 U/min fixo","via":"IV BIC","frequencia":"contínua","obs":"adicionar se norepi > 0,25-0,5 mcg/kg/min — poupador de catecolamina","drug_slug":"vasopressina"},
    {"droga":"Hidrocortisona","dose":"50 mg","via":"IV","frequencia":"6/6h","duracao":"até desmame de vasopressor","obs":"em choque séptico refratário. Surviving Sepsis: sugestão fraca"}
  ]$$::jsonb,
  ARRAY[
    'Reavaliar perfusão a cada 1h: PAM, lactato, débito urinário (>0,5 mL/kg/h), tempo de enchimento capilar',
    'Identificar e controlar foco (cirurgia, dreno, retirar cateter) em até 6-12h',
    'Profilaxia TVP (enoxaparina 40 mg SC 1x/dia) e úlcera de estresse (pantoprazol 40 mg IV) se UTI'
  ],
  ARRAY['Hemograma','PCR','Procalcitonina','Função renal + eletrólitos','Função hepática','Gasometria + lactato','Coagulograma','EAS + urocultura','Rx tórax','TC conforme suspeita','2 hemoculturas (sítios diferentes)'],
  ARRAY['Todos pacientes com sepse devem ser hospitalizados','UTI se: choque, lactato > 4, disfunção orgânica múltipla, necessidade VM'],
  ARRAY['ATB em até 1h é meta dura — atraso aumenta mortalidade ~7%/h','Não usar HES (hidroxietilamido) — aumenta IRA','Albumina 20% pode ser usada após cristaloide se hipoalbuminemia + necessidade de ressuscitação adicional'],
  'Surviving Sepsis Campaign',
  'https://www.sccm.org/SurvivingSepsisCampaign',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. IAM COM SUPRA DE ST (STEMI)
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, protocol_slug, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'iam-supra-st',
  'IAM com supra de ST — manejo agudo',
  'Síndrome coronariana aguda',
  'Dor torácica + supra ≥ 1 mm em ≥ 2 derivações contíguas (ou novo BRE)',
  'sca-stemi',
  'PA / UTI coronariana',
  'Reperfusão é o que muda mortalidade: ICP em até 90 min (porta-balão) ou trombolítico em até 30 min se ICP > 120 min.',
  $$[
    {"droga":"AAS","dose":"300 mg (mastigar)","via":"VO","frequencia":"dose única ataque, depois 100 mg/dia","obs":"administrar IMEDIATAMENTE na suspeita"},
    {"droga":"Clopidogrel","dose":"600 mg ataque","via":"VO","frequencia":"manutenção 75 mg/dia","duracao":"12 meses","obs":"se < 75a sem alto risco sangramento; preferir ticagrelor (180 mg ataque + 90 mg 12/12h) se ICP"},
    {"droga":"Heparina não-fracionada","dose":"60 U/kg ataque (max 4000 U) + 12 U/kg/h BIC","via":"IV","frequencia":"contínua","obs":"alvo TTPa 1,5-2,5x. Alternativa: enoxaparina 30 mg IV bolus + 1 mg/kg SC 12/12h"},
    {"droga":"Morfina","dose":"2-4 mg","via":"IV","frequencia":"a cada 5-15 min se dor","obs":"apenas se dor refratária — pode atrasar absorção de antiplaquetários","drug_slug":"morfina"},
    {"droga":"Nitroglicerina","dose":"5-10 mcg/min, titular","via":"IV BIC","frequencia":"contínua","obs":"se dor + PAS > 90. CONTRAINDICADO em IAM de VD, uso de sildenafil < 24h"},
    {"droga":"Atorvastatina","dose":"80 mg","via":"VO","frequencia":"1x/dia","obs":"alta intensidade desde D1 — independente de LDL"},
    {"droga":"Beta-bloqueador (metoprolol)","dose":"25-50 mg","via":"VO","frequencia":"12/12h","obs":"iniciar nas primeiras 24h SE estável (Killip I, FC > 60, PAS > 100)"},
    {"droga":"Reperfusão — ICP primária","dose":"meta porta-balão ≤ 90 min","via":"sala de hemodinâmica","obs":"PRIMEIRA ESCOLHA. Se ICP > 120 min → trombolítico"},
    {"droga":"Tenecteplase (alternativa se ICP indisponível)","dose":"30-50 mg conforme peso","via":"IV bolus","obs":"meta porta-agulha ≤ 30 min. Contraindicado se: AVCh prévio, AVCi <3m, dissecção de aorta, sangramento ativo"}
  ]$$::jsonb,
  ARRAY[
    'Acionar hemodinâmica IMEDIATAMENTE — tempo é músculo',
    'Monitorização contínua, desfibrilador à beira do leito',
    'O2 apenas se SatO2 < 90% (hipoxemia desnecessária pode piorar)',
    'Após estabilização: BB + IECA/BRA + estatina alta intensidade + antiplaquetário duplo 12 meses'
  ],
  ARRAY['ECG seriado a cada 10 min até reperfusão','Troponina (admissão + 3h + 6h)','Hemograma','Função renal + eletrólitos','Coagulograma','Glicemia','Eco TT pós ICP'],
  ARRAY['Todo IAM com supra → UTI coronariana mínimo 24h pós-reperfusão'],
  ARRAY['Tempo é músculo: 1h de atraso = 1% perda função VE','NÃO usar AINE — aumenta mortalidade pós-IAM','NÃO usar nifedipino curta ação','Cuidado com BB em IAM de VD, ICC descompensada, BAV'],
  'Diretriz SBC 2021 / ESC STEMI 2023',
  'https://www.scielo.br/j/abc/a/dQDPsJjCcd5VnkYBFpgXJsx/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. ANAFILAXIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, protocol_slug, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'anafilaxia',
  'Anafilaxia — tratamento de emergência',
  'Anafilaxia',
  'Reação alérgica grave com envolvimento sistêmico (≥ 2 sistemas) ou hipotensão/laringospasmo',
  'anafilaxia',
  'PA / Emergência',
  'Adrenalina IM 0,01 mg/kg (máx 0,5 mg) na coxa lateral é PRIMEIRA E ÚNICA droga vital. Tudo mais é coadjuvante.',
  $$[
    {"droga":"ADRENALINA","dose":"0,3-0,5 mg adulto (0,01 mg/kg pediátrico, máx 0,3 mg)","via":"IM (vasto lateral da coxa)","frequencia":"repetir a cada 5-15 min se necessário","obs":"PRIMEIRA LINHA, NÃO adiar. Solução 1:1000 (1 mg/mL). NUNCA SC (absorção errática)","drug_slug":"epinefrina"},
    {"droga":"Cristaloide (SF 0,9% ou Ringer)","dose":"1-2 L bolus (20 mL/kg pediátrico)","via":"IV","frequencia":"correr rápido","obs":"se hipotensão. Repetir se PAS persistente <90"},
    {"droga":"Adrenalina IV","dose":"0,1 mcg/kg/min, titular","via":"IV BIC","frequencia":"contínua","obs":"APENAS se choque refratário a 2-3 doses IM + cristaloide. Acesso central preferível","drug_slug":"epinefrina"},
    {"droga":"O2 + posição","dose":"O2 alto fluxo + decúbito dorsal com MMII elevados","obs":"se vômito → decúbito lateral. NÃO sentar/levantar (risco de PCR síncope)"},
    {"droga":"Difenidramina","dose":"25-50 mg adulto (1 mg/kg pediátrico)","via":"IV","frequencia":"6/6h por 24-48h","obs":"COADJUVANTE — apenas para sintomas cutâneos. NÃO substitui adrenalina"},
    {"droga":"Hidrocortisona","dose":"200 mg adulto (4 mg/kg pediátrico)","via":"IV","frequencia":"6/6h por 48h","obs":"COADJUVANTE — pode reduzir reação bifásica (controverso). NÃO substitui adrenalina"},
    {"droga":"Salbutamol nebulização","dose":"5 mg nebulizar","via":"INALATÓRIA","frequencia":"a cada 20 min se broncoespasmo","obs":"se broncoespasmo persistente após adrenalina"}
  ]$$::jsonb,
  ARRAY[
    'TODO paciente com anafilaxia → observação mínima 6-12h (risco bifásica até 72h)',
    'Alta com prescrição de auto-injetor de adrenalina + plano de ação escrito + encaminhamento alergista',
    'Identificar e EVITAR alérgeno: medicamentos, alimentos, picadas, látex'
  ],
  ARRAY['Triptase sérica (1-3h após início — diagnóstico retrospectivo)','Hemograma','Função renal','Gasometria se grave'],
  ARRAY['Reação bifásica em até 20% — observar mín 6h se grave','Internar se: instabilidade hemodinâmica persistente, broncoespasmo refratário, comorbidade'],
  ARRAY['ADRENALINA SALVA VIDA — não há contraindicação absoluta em anafilaxia','Anti-histamínico e corticoide NÃO são primeira linha — adrenalina é','Beta-bloqueador prévio: usar glucagon 1-5 mg IV se refratário'],
  'World Allergy Organization 2020',
  'https://www.worldallergy.org/UserFiles/file/WAO-Anaphylaxis-Guidance-2020.pdf',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. CETOACIDOSE DIABÉTICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, protocol_slug, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'cad-cetoacidose-diabetica',
  'Cetoacidose diabética — tratamento',
  'Cetoacidose diabética',
  'Glicemia > 250 + pH < 7,3 + HCO3 < 15 + cetonemia/cetonúria',
  'cad',
  'PA / UTI',
  'Tripé: hidratação → insulina → reposição de potássio. Corrigir K+ ANTES da insulina se K+ < 3,3.',
  $$[
    {"droga":"SF 0,9%","dose":"1-1,5 L na 1ª hora; depois 250-500 mL/h conforme volemia","via":"IV","frequencia":"contínuo","obs":"trocar para SF 0,45% se Na corrigido normal/alto. Adicionar SG 5% quando glicemia <250"},
    {"droga":"Reposição K+ (ANTES da insulina se K<3,3)","dose":"K<3,3: KCl 20-30 mEq/h | K 3,3-5,2: 20-30 mEq/L na hidratação | K>5,2: NÃO repor","via":"IV","obs":"NUNCA infundir insulina com K<3,3 — risco arritmia fatal"},
    {"droga":"Insulina regular","dose":"0,1 U/kg bolus + 0,1 U/kg/h BIC (ou só BIC sem bolus)","via":"IV BIC","frequencia":"contínua","obs":"meta queda glicemia 50-75 mg/dL/h. Quando glicemia <250: reduzir para 0,02-0,05 U/kg/h + iniciar SG 5%"},
    {"droga":"Bicarbonato","dose":"100 mEq em 400 mL AD em 2h","via":"IV","obs":"APENAS se pH < 6,9. Não rotineiro — pode piorar acidose intracelular"},
    {"droga":"Insulina SC transição","dose":"insulina basal (NPH 0,3 U/kg ou glargina 0,2 U/kg) + bolus","via":"SC","obs":"INICIAR 1-2h ANTES de desligar a BIC. Critérios resolução: pH ≥ 7,3 + HCO3 ≥ 15 + AG normal + paciente comendo"}
  ]$$::jsonb,
  ARRAY[
    'Glicemia capilar 1/1h até estabilizar; depois 2/2h',
    'Eletrólitos + gasometria 2/2h até resolução',
    'Investigar fator precipitante: infecção (60%), omissão de insulina (20%), IAM, AVC, gestação',
    'NÃO desligar BIC de insulina antes de iniciar SC + comer (risco de recidiva)'
  ],
  ARRAY['Glicemia capilar de hora em hora','Gasometria + eletrólitos 2/2h','Cetonas séricas/urinárias','Função renal','Hemograma + PCR','Urina I + cultura','Rx tórax','ECG','Beta-HCG mulher idade fértil'],
  ARRAY['Todo CAD → internação','UTI se: pH < 7,0, alteração consciência, instabilidade hemodinâmica, K+ alterado'],
  ARRAY['Edema cerebral em criança/adolescente — manitol 0,5-1 g/kg IV se sinais','Não baixar glicemia muito rápido (>100 mg/dL/h) — risco edema cerebral','Monitor K+ — risco hipocalemia letal'],
  'SBD 2024 / ADA 2023',
  'https://diabetes.org.br',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. CRISE HIPERTENSIVA — EMERGÊNCIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'emergencia-hipertensiva',
  'Emergência hipertensiva',
  'Hipertensão arterial',
  'PAS ≥ 180 ou PAD ≥ 120 + LESÃO DE ÓRGÃO ALVO aguda (encefalopatia, AVC, IAM, dissecção, edema agudo, eclâmpsia)',
  'PA / UTI',
  'Reduzir 20-25% PAM na 1ª hora (exceto dissecção: PAS ≤ 120 em 20 min). Sempre IV — VO é para urgência.',
  $$[
    {"droga":"Nitroprussiato de sódio","dose":"0,25-10 mcg/kg/min","via":"IV BIC","frequencia":"contínua","obs":"DROGA DE ESCOLHA na maioria. Frasco fotoprotegido. Risco intoxicação cianeto se >48h ou IRA"},
    {"droga":"Nitroglicerina","dose":"5-200 mcg/min","via":"IV BIC","obs":"escolha em SCA / EAP. Tolerância em 24-48h"},
    {"droga":"Esmolol","dose":"500 mcg/kg bolus + 50-200 mcg/kg/min","via":"IV BIC","obs":"escolha em DISSECÇÃO DE AORTA (associado a NPS). BB cardio-seletivo ultracurto"},
    {"droga":"Labetalol","dose":"10-20 mg bolus a cada 10 min, máx 300 mg","via":"IV","obs":"escolha em ECLÂMPSIA, AVC. Alfa+beta bloqueador"},
    {"droga":"Hidralazina","dose":"5-10 mg IV bolus a cada 20 min","via":"IV","obs":"escolha em GESTAÇÃO / eclâmpsia. Cuidado em SCA (taquicardia reflexa)"},
    {"droga":"Sulfato de magnésio","dose":"4 g IV em 20 min + 1-2 g/h BIC","via":"IV","obs":"em ECLÂMPSIA — anticonvulsivante. Monitor reflexos, FR, débito"}
  ]$$::jsonb,
  ARRAY[
    'PAM = (PAS + 2×PAD)/3. Reduzir 20-25% PAM em 1h, depois 160/100-110 em 2-6h',
    'EXCEÇÕES: dissecção aorta — PAS ≤ 120 + FC ≤ 60 em 20 min; AVCi — só tratar se PAS > 220/120 (ou >185/110 se for usar trombolítico)',
    'Acesso arterial para PA invasiva',
    'Identificar órgão-alvo lesado direciona droga de escolha'
  ],
  ARRAY['ECG','Troponina','Função renal + eletrólitos','EAS (proteinúria, hematúria)','Fundo de olho (papiledema)','TC crânio se sintoma neurológico','Rx tórax','D-dímero/angio-TC se suspeita dissecção','Beta-HCG mulher idade fértil'],
  ARRAY['Em URGÊNCIA hipertensiva (sem lesão de órgão): NÃO usar IV — VO captopril 25 mg ou clonidina 0,1-0,2 mg, redução em 24-48h','Queda RÁPIDA da PA pode causar AVC isquêmico/IAM em pacientes com auto-regulação alterada (idosos, AVC prévio)','Captopril sublingual NÃO existe — absorção é VO mesmo'],
  'Diretriz Brasileira Hipertensão SBC 2020',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-116-03-0516/0066-782X-abc-116-03-0516.pdf',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 6. ASMA EXACERBAÇÃO GRAVE
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'asma-exacerbacao-grave',
  'Asma — exacerbação moderada/grave',
  'Asma brônquica',
  'PFE < 50% predito ou SatO2 < 92% ou frases incompletas, taquipneia, tiragem',
  'PA / Emergência',
  'Beta2 + ipratrópio + corticoide sistêmico precoce. SatO2 alvo 93-95% (não hipersaturar — risco hipercapnia).',
  $$[
    {"droga":"Salbutamol","dose":"5 mg (2,5 mg em <5a)","via":"NEBULIZAÇÃO ou MDI 4-8 puffs com espaçador","frequencia":"a cada 20 min na 1ª hora; depois 1-4/4h","obs":"VIA INALATÓRIA SEMPRE. Considerar contínua 10-15 mg/h se grave"},
    {"droga":"Brometo de ipratrópio","dose":"0,5 mg adulto / 0,25 mg criança","via":"NEBULIZAÇÃO (associar ao salbutamol)","frequencia":"a cada 20 min × 3 doses","obs":"benefício em moderada/grave nas primeiras 1-2h"},
    {"droga":"Prednisolona/Prednisona","dose":"40-60 mg adulto (1-2 mg/kg criança, máx 60)","via":"VO","frequencia":"1x/dia por 5-7 dias","obs":"administrar nas primeiras 1h. SEM desmame se ≤7 dias"},
    {"droga":"Hidrocortisona","dose":"200 mg adulto (4 mg/kg criança)","via":"IV","frequencia":"6/6h","obs":"alternativa se VO impossível. Corticoide SÓ é alternativo se exacerbação grave"},
    {"droga":"Sulfato de magnésio","dose":"2 g (40 mg/kg criança, máx 2g) em 20 min","via":"IV","obs":"se PFE <40% após 1h tratamento ou SatO2 persistente <92%. Dose única"},
    {"droga":"O2","dose":"titular para SatO2 93-95%","obs":"NÃO hipersaturar (alvo 93-95%, não 100%) — risco hipercapnia"},
    {"droga":"Adrenalina IM","dose":"0,3-0,5 mg","via":"IM","obs":"apenas em parada/peri-parada respiratória. NÃO rotineira em asma","drug_slug":"epinefrina"}
  ]$$::jsonb,
  ARRAY[
    'Reavaliar PFE/SatO2 após 1h: PFE > 70% predito + SatO2 > 95% sem ar = alta',
    'Alta com: corticoide VO 5-7 dias + plano escrito + revisão em 1-7 dias',
    'NÃO subestimar paciente quieto/sonolento — pode ser PRÉ-PARADA'
  ],
  ARRAY['SatO2 e PFE seriados','Gasometria se grave (NÃO faz parte da rotina inicial)','Rx tórax APENAS se: dor torácica, pneumotórax suspeito, falha terapia, primeiro episódio'],
  ARRAY['Internar se: PFE persistente <60% após 1h, SatO2 <92% em ar ambiente, fadiga muscular, alteração de consciência','UTI: pCO2 > 42, exaustão, alteração consciência, parada iminente'],
  ARRAY['Hipercapnia em asma é PRÉ-PARADA — pCO2 normal ou elevada em paciente taquipneico = falha respiratória iminente','Sedação contraindicada (depressão respiratória)','Hidratação excessiva pode piorar (edema pulmonar)','Antibiótico NÃO de rotina (apenas se infecção bacteriana documentada)'],
  'GINA 2024',
  'https://ginasthma.org/2024-gina-main-report/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 7. PNEUMONIA COMUNITÁRIA - INTERNAÇÃO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao,
  fonte, fonte_url, published
) VALUES (
  'pac-internacao',
  'Pneumonia adquirida na comunidade — internação',
  'Pneumonia',
  'PAC com CURB-65 ≥ 2 ou PSI classe IV-V',
  'Enfermaria / UTI',
  'Beta-lactâmico + macrolídeo (ou fluoroquinolona) cobre típicos + atípicos. Iniciar em 4-6h reduz mortalidade.',
  $$[
    {"droga":"Ceftriaxona","dose":"1-2 g","via":"IV","frequencia":"1x/dia","duracao":"5-7 dias (mínimo 5d se afebril 48-72h)","obs":"primeira escolha enfermaria. Em UTI: usar 2g/dia"},
    {"droga":"Azitromicina","dose":"500 mg","via":"IV ou VO","frequencia":"1x/dia","duracao":"3-5 dias","obs":"associar ao beta-lactâmico para cobrir Mycoplasma/Legionella/Chlamydia"},
    {"droga":"Levofloxacino (alternativa)","dose":"750 mg","via":"IV ou VO","frequencia":"1x/dia","duracao":"5 dias","obs":"monoterapia se alergia a beta-lactâmico OU em alto risco Pseudomonas"},
    {"droga":"Piperacilina-tazobactam (UTI / risco Pseudomonas)","dose":"4,5 g","via":"IV","frequencia":"6/6h","duracao":"7-10 dias","obs":"associar a azitro/levo. Indicado se: bronquiectasia, DPOC grave, ATB recente, internação recente","drug_slug":"piperacilina-tazobactam"},
    {"droga":"O2 suplementar","obs":"meta SatO2 92-96% (88-92% em retentor de CO2)"},
    {"droga":"Prednisolona","dose":"50 mg","via":"VO","frequencia":"1x/dia por 5 dias","obs":"considerar em PAC GRAVE (UTI, choque) — reduz mortalidade (CAPE-COD)"}
  ]$$::jsonb,
  ARRAY[
    'CURB-65: Confusão, Uréia >50, FR ≥30, PA <90/60, idade ≥65 (1 ponto cada)',
    'Reavaliar em 48-72h: se piora → coletar nova cultura + ampliar espectro',
    'Switch IV → VO quando estável (afebril, hemodinamicamente estável, VO tolerada)',
    'Vacina pneumocócica + influenza na alta'
  ],
  ARRAY['Hemograma','PCR','Procalcitonina','Função renal + eletrólitos','Gasometria','Hemoculturas (2)','Antígeno urinário pneumococo + Legionella','Rx tórax PA + perfil','TC se dúvida','Painel viral / SARS-CoV-2 se sazonal'],
  ARRAY['CURB-65 ≥ 2 ou hipoxemia','UTI se: choque séptico, VM, ≥ 3 critérios menores ATS/IDSA'],
  'Diretriz SBPT 2018 / IDSA 2019',
  'https://sbpt.org.br/portal/cuidados-em-pneumonia/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 8. ITU NÃO COMPLICADA - MULHER
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'itu-cistite-mulher',
  'Cistite não-complicada — mulher',
  'Infecção urinária',
  'Mulher não-gestante com disúria + polaciúria + urgência, sem febre/dor lombar',
  'Ambulatorial',
  'Tratamento empírico de 3-5 dias. Urocultura desnecessária se quadro típico.',
  $$[
    {"droga":"Nitrofurantoína","dose":"100 mg","via":"VO","frequencia":"6/6h","duracao":"5 dias","obs":"PRIMEIRA ESCOLHA. NÃO usar se ClCr <30. NÃO usar em pielonefrite (não atinge nível tecidual)"},
    {"droga":"Sulfametoxazol-trimetoprim (SMX-TMP)","dose":"800/160 mg","via":"VO","frequencia":"12/12h","duracao":"3 dias","obs":"alternativa SE resistência local <20%. CONTRAINDICADO em gestação 1º trimestre e termo"},
    {"droga":"Fosfomicina","dose":"3 g","via":"VO","frequencia":"DOSE ÚNICA","obs":"alternativa cara mas conveniente. Tomar à noite com bexiga vazia"},
    {"droga":"Cefalexina","dose":"500 mg","via":"VO","frequencia":"6/6h","duracao":"5-7 dias","obs":"opção em gestante (1ª escolha junto com nitrofurantoína fora do termo)"},
    {"droga":"Ciprofloxacino (NÃO 1ª linha)","dose":"500 mg","via":"VO","frequencia":"12/12h","duracao":"3 dias","obs":"reservar para casos com falha às de 1ª linha — alta resistência E. coli no Brasil"}
  ]$$::jsonb,
  ARRAY[
    'Reavaliar se sintomas persistirem >48h após início ATB → coletar urocultura, mudar ATB',
    'Hidratar, esvaziar bexiga regularmente',
    'Sintomáticos: fenazopiridina 100-200 mg 8/8h por 2 dias (se dor disúrica) — atenção urina alaranjada'
  ],
  ARRAY['EAS + urocultura: APENAS se atípico, gestante, falha terapêutica, ITU recorrente'],
  ARRAY['Em GESTANTE: nitrofurantoína (evitar 1º trim e termo) ou cefalexina por 7 dias. SEMPRE coletar urocultura','HOMEM com ITU = sempre considerada complicada → urocultura + tratamento 7 dias','Em DM/imunossuprimido: tratar 7 dias mesmo se cistite simples'],
  'Sociedade Brasileira de Urologia 2023',
  'https://sbu.org.br',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 9. INSUFICIÊNCIA CARDÍACA AGUDA / EAP
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'ic-aguda-eap',
  'Insuficiência cardíaca aguda / Edema agudo de pulmão',
  'Insuficiência cardíaca',
  'Dispneia aguda + estertores + congestão + FE comprometida',
  'PA / UTI',
  'Mnemônico DOVA: Diurético + O2/VNI + Vasodilatador + Adrenérgico (se choque). Furosemida + nitrato + VNI são pilares.',
  $$[
    {"droga":"Furosemida","dose":"40-80 mg IV bolus inicial (2,5x dose VO domiciliar se uso crônico)","via":"IV","frequencia":"6/6h ou BIC 5-20 mg/h se refratária","duracao":"até descongestão clínica","obs":"meta diurese > 0,5 mL/kg/h, balanço negativo 1-2 L/dia. Aumentar dose se resposta <100 mL/h"},
    {"droga":"Nitroglicerina","dose":"10-200 mcg/min, titular pela PA","via":"IV BIC","frequencia":"contínua","obs":"se PAS > 110. Reduz pré-carga. CONTRAINDICADO em PAS <90, IAM VD, sildenafil <24h"},
    {"droga":"Nitroprussiato","dose":"0,25-10 mcg/kg/min","via":"IV BIC","obs":"se HIPERTENSÃO + IC aguda. Reduz pós-carga. Cuidado uso prolongado (cianeto)"},
    {"droga":"VNI (CPAP/BiPAP)","dose":"CPAP 8-12 cmH2O ou BiPAP 12-15/5-8","obs":"PRIMEIRA ESCOLHA em EAP. Reduz necessidade IOT em 50%. Contraindicado: choque, rebaixamento, vômito, pneumotórax"},
    {"droga":"Morfina","dose":"2-4 mg IV","via":"IV","frequencia":"se necessário","obs":"USO CONTROVERSO — pode aumentar mortalidade (ADHERE registry). Reservar para ansiedade extrema/dor torácica","drug_slug":"morfina"},
    {"droga":"Dobutamina (se choque)","dose":"2,5-20 mcg/kg/min","via":"IV BIC","obs":"em IC com baixo débito + hipoperfusão (choque cardiogênico). Pode causar taquiarritmia","drug_slug":"dobutamina"},
    {"droga":"Noradrenalina (se choque)","dose":"0,05-0,5 mcg/kg/min","via":"IV BIC","obs":"se choque cardiogênico + hipotensão. Associar a dobutamina","drug_slug":"noradrenalina"}
  ]$$::jsonb,
  ARRAY[
    'Posição sentada com pernas pendentes (reduz retorno venoso)',
    'O2 alto fluxo se SatO2 <90% (não hipersaturar em DPOC)',
    'Identificar fator descompensador (CHAMPS): Compliance, HTA não controlada, Arritmia, MI, Pneumonia, Substâncias',
    'Não suspender BB e IECA/BRA crônico SE compensado/normotenso — apenas reduzir/suspender se choque'
  ],
  ARRAY['ECG','Troponina','BNP/NT-proBNP','Função renal + eletrólitos','Gasometria','Hemograma + PCR','Rx tórax','Eco TT (idealmente em 24-48h)','TSH','Painel hepático'],
  ARRAY['Cuidado com furosemida em ICFEp + IRA — pode piorar perfusão renal','VNI é PRIMEIRA escolha em EAP — não atrasar IOT se falha','Hipocalemia/hipomagnesemia secundária — repor agressivamente'],
  'Diretriz SBC IC Aguda 2018 / ESC 2021',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-111-03-0436/0066-782X-abc-111-03-0436.pdf',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 10. AVC ISQUÊMICO AGUDO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'avc-isquemico-agudo',
  'AVC isquêmico agudo — janela terapêutica',
  'AVC',
  'Déficit neurológico focal + TC sem hemorragia + tempo de início ≤ 4,5h (trombólise) ou ≤ 6-24h (trombectomia em casos selecionados)',
  'PA / Stroke Unit',
  'Tempo é cérebro: trombólise IV até 4,5h; trombectomia mecânica até 6h (24h se mismatch). NIHSS guia decisão.',
  $$[
    {"droga":"Alteplase (rtPA)","dose":"0,9 mg/kg (máx 90 mg): 10% bolus em 1 min + 90% em 60 min","via":"IV","obs":"JANELA: até 4,5h do ictus. Manter PA <185/110 ANTES E durante 24h pós."},
    {"droga":"Controle PA pré-trombólise","dose":"Labetalol 10-20 mg IV bolus OU nicardipino 5-15 mg/h BIC","via":"IV","obs":"alvo: <185/110 antes do rtPA. Sem uso de rtPA: tratar apenas se PA >220/120"},
    {"droga":"AAS","dose":"100-300 mg","via":"VO ou via SNG","frequencia":"1x/dia","obs":"INICIAR após 24h se rtPA. INICIAR em até 48h se sem trombólise"},
    {"droga":"Clopidogrel (em AVC menor / AIT)","dose":"300 mg ataque + 75 mg/dia por 21 dias","via":"VO","obs":"em NIHSS ≤ 3 ou AIT alto risco — dupla antiagregação 21 dias"},
    {"droga":"Estatina","dose":"Atorvastatina 80 mg","via":"VO","frequencia":"1x/dia","obs":"alta intensidade desde D1 — independente de LDL"},
    {"droga":"Enoxaparina profilática","dose":"40 mg SC 1x/dia","via":"SC","obs":"profilaxia TVP se déficit motor — INICIAR 24h pós-rtPA"}
  ]$$::jsonb,
  ARRAY[
    'NIHSS na admissão e a cada 1h nas primeiras 24h',
    'NÃO baixar PA agressivamente em AVCi não trombolisado (auto-regulação alterada — manter <220/120)',
    'Glicemia alvo 140-180 (hipo e hiperglicemia pioram desfecho)',
    'Iniciar reabilitação precoce em 48-72h se estável',
    'Investigar fonte: ECG (FA), eco TT/TE, doppler carótidas, painel coagulação se jovem'
  ],
  ARRAY['TC crânio sem contraste IMEDIATA','Angio-TC para selecionar trombectomia','RM com difusão se dúvida','ECG (FA?)','Glicemia (mimicker)','Hemograma','Coagulograma','Função renal','Troponina','Eco TT','Doppler carótidas'],
  ARRAY['rtPA é hemorragia intracraniana sintomática em ~6% — risco vs benefício','CONTRAINDICAÇÕES rtPA: TC com sangramento, AVC <3m, TCE <3m, cirurgia maior <14d, sangramento ativo, INR >1,7, plaquetas <100k, glicemia <50','Trombectomia mecânica até 24h em casos selecionados (ASPECTS ≥ 6, mismatch DWI/ADC) — DAWN/DEFUSE-3'],
  'Diretriz Brasileira AVC ABNeuro 2022 / AHA 2019',
  'https://www.scielo.br/j/anp/a/JTKxVGzqjZmrNSgrBzG6X9c/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 11. STATUS EPILEPTICUS
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'status-epilepticus',
  'Status epilepticus — tratamento escalonado',
  'Crise convulsiva',
  'Crise > 5 min ou crises recorrentes sem recuperação de consciência',
  'PA / UTI',
  'Tempo é cérebro: BZD em 5 min → fenitoína/levetiracetam em 20 min → IOT + sedação contínua se >40 min refratário.',
  $$[
    {"droga":"Diazepam","dose":"10 mg adulto (0,2-0,3 mg/kg, máx 10 mg) IV em 2 min","via":"IV","obs":"PRIMEIRA LINHA. Repetir 1× se persistir após 5 min. Sem acesso: midazolam 10 mg IM/intranasal","drug_slug":"midazolam"},
    {"droga":"Midazolam (alternativa BZD)","dose":"10 mg IM/IN/IV adulto (0,2 mg/kg)","via":"IM ou IV","obs":"opção se sem acesso venoso (IM/IN). Mesma eficácia que diazepam","drug_slug":"midazolam"},
    {"droga":"Fenitoína","dose":"20 mg/kg em SF 0,9% IV em 50 min (NÃO mais rápido que 50 mg/min)","via":"IV","obs":"SEGUNDA LINHA — após BZD. Monitor ECG (arritmia, hipotensão). NUNCA em SG (precipita)"},
    {"droga":"Levetiracetam (alternativa segunda linha)","dose":"60 mg/kg (máx 4,5 g) IV em 15 min","via":"IV","obs":"alternativa à fenitoína — sem hipotensão/arritmia. ESETT trial: equivalência"},
    {"droga":"Ácido valproico (alternativa)","dose":"40 mg/kg IV em 10 min","via":"IV","obs":"alternativa em alérgicos a fenitoína. Evitar em hepatopatia"},
    {"droga":"Midazolam BIC (status refratário)","dose":"0,1-0,2 mg/kg bolus + 0,05-2 mg/kg/h BIC","via":"IV BIC","obs":"se persistir após segunda linha — IOT obrigatório, EEG contínuo, alvo supressão de crises (ou burst-suppression)","drug_slug":"midazolam"},
    {"droga":"Propofol (status refratário)","dose":"2-5 mg/kg bolus + 30-200 mcg/kg/min BIC","via":"IV BIC","obs":"alternativa em status refratário. CUIDADO síndrome propofol em uso prolongado","drug_slug":"propofol"},
    {"droga":"Tiamina + glicose (se etiologia desconhecida)","dose":"Tiamina 100 mg IV + Glicose 50% 50 mL","via":"IV","obs":"se hipoglicemia/etilismo. Tiamina ANTES da glicose (Wernicke)"}
  ]$$::jsonb,
  ARRAY[
    'ABC: proteger via aérea, decúbito lateral, oximetria contínua',
    'Glicemia capilar SEMPRE (hipoglicemia mimetiza)',
    'Após cessar crise: TC crânio + EEG + investigar etiologia (infecção, AVC, distúrbio metabólico, droga, abstinência)',
    'Nunca colocar nada na boca durante crise'
  ],
  ARRAY['Glicemia capilar IMEDIATA','Eletrólitos completos (Na, K, Ca, Mg)','Gasometria','Hemograma','Função renal + hepática','Tóxicos urinários','Beta-HCG','TC crânio','Punção lombar se febre + suspeita meningite','EEG (urgente se status refratário)'],
  ARRAY['BZD subdose é causa frequente de falha — usar dose plena','Status não convulsivo é subdiagnosticado — pensar em rebaixamento sem causa explicada → EEG','Após status: período pós-ictal (sonolência) é normal — sem necessidade de re-dose BZD'],
  'Neurocritical Care Society 2016 / NICE 2022',
  'https://neurocriticalcare.org/Default.aspx',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 12. TVP / TEP AGUDO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'tep-tvp-agudo',
  'TEP / TVP — anticoagulação aguda',
  'Tromboembolismo venoso',
  'TEP confirmado ou TVP proximal — risco de extensão/embolização',
  'Enfermaria / UTI (TEP grave)',
  'TEP de alto risco (instabilidade) → trombolítico. Risco intermediário/baixo → anticoagulação plena.',
  $$[
    {"droga":"Enoxaparina","dose":"1 mg/kg SC 12/12h (ou 1,5 mg/kg 1x/dia)","via":"SC","frequencia":"12/12h","duracao":"transição para VO em 5-10 dias","obs":"PRIMEIRA ESCOLHA se função renal preservada (ClCr >30). Sem necessidade de monitor"},
    {"droga":"Heparina não-fracionada","dose":"80 U/kg bolus + 18 U/kg/h BIC, alvo TTPa 1,5-2,5x","via":"IV BIC","obs":"escolha em IRA grave (ClCr <30), instabilidade, cirurgia iminente, TEP maciço (rápida reversão se necessário)"},
    {"droga":"Rivaroxabana","dose":"15 mg VO 12/12h por 21 dias, depois 20 mg 1x/dia","via":"VO","obs":"DOAC de escolha — sem ponte com heparina. Tomar com refeição (>15 mg) para absorção"},
    {"droga":"Apixabana","dose":"10 mg VO 12/12h por 7 dias, depois 5 mg 12/12h","via":"VO","obs":"DOAC alternativa — menor risco sangramento que rivaroxabana (AMPLIFY)"},
    {"droga":"Varfarina","dose":"5 mg VO 1x/dia, ajustar pelo INR","via":"VO","obs":"alvo INR 2-3. SEMPRE PONTE com heparina (5d ou até INR ≥ 2 por 24h). Necessária em síndrome antifosfolípide, IRA grave, gestação"},
    {"droga":"Trombolítico (alteplase) — TEP de alto risco","dose":"100 mg em 2h (ou 0,6 mg/kg em 15 min, máx 50 mg)","via":"IV","obs":"INDICADO se: instabilidade hemodinâmica (PAS<90), parada cardíaca. Risco AVCh ~2-3%"},
    {"droga":"Filtro de veia cava","obs":"contraindicação absoluta a anticoagulação OU recidiva apesar de anticoagulação plena"}
  ]$$::jsonb,
  ARRAY[
    'Wells/PERC + D-dímero direcionam investigação. Wells alto → angio-TC direto',
    'Estratificar TEP: alto risco (choque), intermediário (BNP/troponina/disfunção VD), baixo',
    'Duração da anticoagulação: 3 meses se provocado; ≥ 6 meses ou indefinido se idiopático/recorrente/trombofilia',
    'Mobilização precoce — repouso prolongado NÃO previne embolia'
  ],
  ARRAY['D-dímero (se baixo/moderado risco)','Angio-TC tórax (TEP) ou doppler venoso (TVP)','Troponina + BNP (estratificação TEP)','Eco TT (disfunção VD em TEP)','Hemograma + plaquetas','Coagulograma','Função renal + hepática','TSH','Painel trombofilia ANTES de iniciar AC se idiopático/jovem'],
  ARRAY['NÃO repor com heparina em paciente com plaquetopenia <50k sem investigar HIT','Trombolítico em TEP submassivo (intermediário) — controverso (PEITHO: aumenta sangramento)','Em GESTANTE: enoxaparina 1 mg/kg 12/12h é escolha — DOAC e varfarina contraindicados','Em CÂNCER ATIVO: enoxaparina ou DOAC (apixabana/rivaroxabana são não-inferiores) — vide CARAVAGGIO/SELECT-D'],
  'CHEST 2021 / ESC TEP 2019',
  'https://academic.oup.com/eurheartj/article/41/4/543/5556136',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- ============================================================
-- Comentário tabela
-- ============================================================
COMMENT ON TABLE public.wb_prescriptions IS 'Rascunhos de prescrição por doença/protocolo. Sempre síntese editorial, nunca substitui avaliação clínica.';
