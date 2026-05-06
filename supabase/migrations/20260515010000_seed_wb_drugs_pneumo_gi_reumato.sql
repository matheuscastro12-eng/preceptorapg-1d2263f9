-- PreceptorBook: Bloco 4 — Pneumo (4) + GI (5) + Reumato/imuno (4) + Neuro (2) = 15 drogas
-- Total após esta migration: 109 drogas

-- ============================================================
-- PNEUMO
-- ============================================================

-- 95. TIOTRÓPIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'tiotropio',
  'Tiotrópio',
  ARRAY['Spiriva HandiHaler', 'Spiriva Respimat'],
  'LAMA — antagonista muscarínico de longa ação',
  ARRAY['INALAT'],
  $$[{"forma":"cápsula HandiHaler","concentracao":"18 mcg"},{"forma":"Respimat","concentracao":"2,5 mcg/dose"}]$$::jsonb,
  $${"indicacoes":[{"para":"DPOC manutenção","dose":"18 mcg HandiHaler 1x/dia OU 5 mcg (2 puffs 2,5 mcg) Respimat 1x/dia","via":"INALAT","frequencia":"1x/dia (mesmo horário)","obs":"PRIMEIRA ESCOLHA em DPOC GOLD B/E. Reduz exacerbações, melhora VEF1, dispneia e qualidade vida (UPLIFT)"},{"para":"asma grave (≥6a, refratária a CI+LABA)","dose":"5 mcg Respimat 1x/dia","via":"INALAT","obs":"add-on em asma grave não controlada — reduz exacerbações"}]}$$::jsonb,
  'C', 'Categoria C. Sem dados em humanos. Usar se benefício > risco.', 'Sem dados — evitar.',
  ARRAY['hipersensibilidade a atropina/derivados','glaucoma de ângulo fechado','retenção urinária por hipertrofia prostática (relativa)'],
  $$[{"freq":"comum","evento":"BOCA SECA (~16% — efeito anticolinérgico)"},{"freq":"comum","evento":"constipação"},{"freq":"comum","evento":"infecção respiratória alta"},{"freq":"incomum","evento":"retenção urinária (HBP)"},{"freq":"incomum","evento":"glaucoma agudo se aerossol no olho"},{"freq":"raro","evento":"taquicardia, FA"}]$$::jsonb,
  ARRAY['NÃO usar como resgate (ação lenta — início 30 min, pico 1-3h)','HandiHaler vs Respimat: Respimat libera mais aerossol fino — equivalência clínica em DPOC','Orientar técnica inalatória correta — taxa de erro >50% em idosos','Glaucoma: orientar não pulverizar diretamente nos olhos (Respimat)','Em ASMA: nunca substitui CI — sempre ADD-ON em asma grave'],
  ARRAY['VEF1 / espirometria anual','Sintomas de retenção urinária / glaucoma','Frequência de exacerbações','Técnica inalatória cada consulta'],
  'Antagonista muscarínico de longa ação — bloqueia receptores M1, M2 e M3 nas vias aéreas. Liga-se preferencialmente a M3 (broncodilatação) com dissociação muito lenta (>34h em M3 vs M2) → broncodilatação sustentada 24h com ação preferencial em via aérea (não cardíaca). Reduz tônus colinérgico predominante na DPOC. Mínima absorção sistêmica.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=tiotropio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 96. FORMOTEROL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'formoterol',
  'Formoterol',
  ARRAY['Foradil', 'Oxis Turbuhaler', 'em combinações: Symbicort, Vannair, Alenia, Fostair'],
  'LABA — beta-2 agonista de longa ação',
  ARRAY['INALAT'],
  $$[{"forma":"Turbuhaler","concentracao":"6/12 mcg/dose"},{"forma":"cápsula HandiHaler","concentracao":"12 mcg"}]$$::jsonb,
  $${"indicacoes":[{"para":"asma manutenção (associado a CI)","dose":"4,5-12 mcg 12/12h","via":"INALAT","frequencia":"12/12h","obs":"NUNCA EM MONOTERAPIA em asma — risco morte. Sempre com CI (ICS-formoterol é base GINA)"},{"para":"asma SOS + manutenção (estratégia MART)","dose":"budesonida-formoterol como SOS e manutenção","obs":"esquema MART (Maintenance and Reliever Therapy) — GINA 2024 PRIMEIRA escolha"},{"para":"DPOC manutenção","dose":"12 mcg 12/12h","via":"INALAT","obs":"associar a LAMA ou tripla terapia conforme GOLD"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥6a asma","dose":"4,5-9 mcg 12/12h"}]}$$::jsonb,
  'C', 'Sem evidência teratogenia. Usar se benefício > risco.', 'Compatível.',
  ARRAY['ASMA SEM CORTICOIDE INALATÓRIO ASSOCIADO (Black Box FDA)','hipersensibilidade'],
  $$[{"freq":"comum","evento":"tremor, taquicardia (efeito β1 residual)"},{"freq":"comum","evento":"palpitação"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"hipocalemia (em altas doses)"},{"freq":"incomum","evento":"prolongamento QT"},{"freq":"raro","evento":"broncoespasmo paradoxal"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: LABA EM MONOTERAPIA AUMENTA MORTALIDADE EM ASMA — sempre associado a CI','Início rápido (3-5 min) diferente de outros LABA — pode ser SOS no esquema MART (junto com CI)','MART: GINA 2024 prefere ICS-formoterol até em asma leve — substitui salbutamol SOS','Em DPOC: monoterapia LABA aceitável, mas associar LAMA é superior'],
  ARRAY['Frequência de exacerbações','Uso de SOS (>2x/sem indica controle ruim em asma)','PFE','Técnica inalatória'],
  'Agonista β2-adrenérgico altamente seletivo, lipofílico — liga-se na bicamada lipídica da membrana e libera-se gradualmente para o receptor β2 → broncodilatação 12h. Início rápido (3-5 min) diferente de salmeterol. Estimula adenilato ciclase → aumenta cAMP → relaxamento músculo liso brônquico. Em altas doses: efeito β1 (taquicardia, tremor).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=formoterol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 97. FLUTICASONA (corticoide inalatório)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'fluticasona',
  'Fluticasona (propionato/furoato)',
  ARRAY['Flixotide (propionato)', 'Avamys nasal (furoato)', 'em combinações: Seretide, Trelegy, Breo Ellipta'],
  'Corticoide inalatório (CI)',
  ARRAY['INALAT', 'NASAL'],
  $$[{"forma":"MDI propionato","concentracao":"50/125/250 mcg/puff"},{"forma":"Diskus","concentracao":"50/100/250/500 mcg/dose"},{"forma":"furoato Ellipta","concentracao":"100/200 mcg/dose"},{"forma":"spray nasal furoato","concentracao":"27,5 mcg/borrifada"}]$$::jsonb,
  $${"indicacoes":[{"para":"asma manutenção — dose baixa","dose":"propionato 100-200 mcg/dia OU furoato 100 mcg/dia","via":"INALAT","frequencia":"12/12h propionato; 1x/dia furoato","obs":"BASE do tratamento da asma — único que reduz mortalidade. Iniciar conforme step GINA"},{"para":"asma manutenção — dose moderada/alta","dose":"propionato 250-500 mcg 12/12h OU furoato 200 mcg/dia","obs":"step 4-5 GINA — após otimizar técnica"},{"para":"DPOC (apenas exacerbador/eosinofílico)","dose":"em combinações tripla","obs":"NÃO em todos DPOC — risco pneumonia 2x"},{"para":"rinite alérgica","dose":"furoato 27,5-110 mcg/dia spray nasal","via":"NASAL"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥4a asma","dose":"propionato 50-100 mcg 12/12h"}]}$$::jsonb,
  'C', 'Sem evidência teratogenia. Asma mal controlada na gestação é mais perigosa que CI.', 'Compatível (mínima absorção sistêmica).',
  ARRAY['hipersensibilidade','infecção fúngica respiratória ativa não tratada'],
  $$[{"freq":"comum","evento":"CANDIDÍASE OROFARÍNGEA (~5%) — orientar bochechar/escovar dentes pós-uso"},{"freq":"comum","evento":"disfonia, irritação garganta"},{"freq":"comum","evento":"tosse"},{"freq":"incomum","evento":"PNEUMONIA em DPOC (não em asma)"},{"freq":"incomum (uso prolongado alta dose)","evento":"supressão eixo HPA, osteoporose, catarata"},{"freq":"incomum (peds)","evento":"redução leve velocidade de crescimento"}]$$::jsonb,
  ARRAY['BOCHECHAR + ESCOVAR DENTES após cada uso → reduz candidíase','TÉCNICA inalatória correta com espaçador (MDI) é crítica — taxa de erro 50-90%','Em DPOC, CI aumenta risco PNEUMONIA — usar apenas se exacerbador ou eosinófilos ≥300','Em peds: efeito de altura é leve (~1-1,5 cm), reversível ao parar — benefício > risco em asma persistente','Suspensão abrupta em paciente com asma controlada → exacerbação. Reduzir gradualmente'],
  ARRAY['Controle de sintomas (ACT, ACQ)','Frequência exacerbações','PFE em casa (se grave)','Estatura em peds anual','Técnica inalatória cada consulta'],
  'Glicocorticoide tópico inalado de alta potência (lipofilicidade alta → retenção pulmonar). Liga ao receptor de glicocorticoide → modula transcrição genica → reduz inflamação eosinofílica das vias aéreas (reduz IL-4, IL-5, IL-13, eosinófilos), reduz hiperresponsividade brônquica, atenua remodelamento. Mínima absorção sistêmica (efeitos locais predominam). Furoato tem maior afinidade pelo receptor que propionato.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fluticasona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 98. MONTELUCASTE
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'montelucaste',
  'Montelucaste',
  ARRAY['Singulair'],
  'Antagonista do receptor de leucotrieno (LTRA)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"10 mg"},{"forma":"comprimido mastigável","concentracao":"4/5 mg"},{"forma":"granulado","concentracao":"4 mg/sachê"}]$$::jsonb,
  $${"indicacoes":[{"para":"asma persistente leve (alternativa)","dose":"10 mg/dia","via":"VO","frequencia":"1x/dia (noite)","obs":"NÃO É PRIMEIRA ESCOLHA — CI é superior. Opção em pacientes com baixa adesão a inalatórios"},{"para":"asma + rinite alérgica","dose":"10 mg/dia","obs":"adjuvante quando os 2 coexistem"},{"para":"asma induzida por exercício","dose":"10 mg 2h pré-exercício"},{"para":"rinite alérgica","dose":"10 mg/dia","obs":"alternativa a anti-histamínico/corticoide nasal"}]}$$::jsonb,
  $${"indicacoes":[{"para":"6m-5a","dose":"4 mg/dia"},{"para":"6-14a","dose":"5 mg/dia"},{"para":"≥15a","dose":"10 mg/dia"}]}$$::jsonb,
  'B', 'Sem evidência teratogenia.', 'Compatível.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"dor abdominal"},{"freq":"incomum","evento":"alteração de humor, irritabilidade, insônia"},{"freq":"incomum","evento":"PESADELOS, ALUCINAÇÕES (peds)"},{"freq":"raro","evento":"IDEAÇÃO SUICIDA, depressão (Black Box FDA 2020)"},{"freq":"raro","evento":"síndrome de Churg-Strauss (em pacientes que reduziram CI sistêmico)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA 2020: alteração comportamento, depressão, IDEAÇÃO SUICIDA — orientar paciente/família, especialmente em peds. Suspender se sintomas','Não é primeira escolha em asma — CI é superior em quase todos os cenários','Útil em paciente com má adesão a inalatórios (VO 1x/dia)','Pode REDUZIR uso de corticoide oral em asma grave eosinofílica resistente','Em alguns países foi RETIRADO de algumas indicações ou ganhou alerta máximo'],
  ARRAY['Controle asma (ACT)','Sintomas comportamentais (peds)','PFE','Necessidade de SOS'],
  'Antagonista seletivo e competitivo do receptor CysLT1 (cisteinil-leucotrieno tipo 1) → bloqueia ação de LTC4, LTD4 e LTE4 (mediadores liberados por mastócitos e eosinófilos) → reduz broncoconstrição, edema brônquico, hipersecreção mucosa, hiperresponsividade. Efeito anti-inflamatório modesto comparado a CI.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=montelucaste',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- GASTRO
-- ============================================================

-- 99. PANTOPRAZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'pantoprazol',
  'Pantoprazol',
  ARRAY['Pantozol', 'Eupantol'],
  'IBP — inibidor da bomba de prótons',
  ARRAY['VO', 'IV'],
  $$[{"forma":"comprimido","concentracao":"20/40 mg"},{"forma":"frasco-ampola","concentracao":"40 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DRGE","dose":"40 mg/dia","via":"VO","frequencia":"1x/dia (30 min antes do café)","duracao":"4-8 semanas","obs":"reavaliar; tentar reduzir/desmamar após 8 sem"},{"para":"úlcera péptica + H. pylori","dose":"40 mg 12/12h × 14 dias","via":"VO","obs":"esquema com claritro 500 mg 12/12h + amoxicilina 1 g 12/12h × 14 dias (terapia tripla); alternativa quádrupla com bismuto"},{"para":"profilaxia úlcera de estresse (UTI)","dose":"40 mg/dia","via":"IV","obs":"em ventilação mecânica >48h, coagulopatia, choque, queimadura — não rotineiro"},{"para":"hemorragia digestiva alta — ATAQUE","dose":"80 mg IV bolus + 8 mg/h BIC × 72h","via":"IV","obs":"em úlcera com sangramento ativo / Forrest IIa-IIb após hemostasia endoscópica"},{"para":"síndrome Zollinger-Ellison","dose":"80-240 mg/dia divididos","obs":"doses muito altas conforme necessidade"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"max 20 mg/dia"}]$$::jsonb,
  'B', 'Categoria B. Estudos animais sem dano; sem dados humanos suficientes. Usar se necessário.', 'Compatível em curto prazo.',
  $$[{"com":"clopidogrel","efeito":"omeprazol/esomeprazol reduzem ativação clopidogrel (CYP2C19); PANTOPRAZOL tem MENOR INTERAÇÃO","manejo":"em pacientes com SCA + clopidogrel preferir pantoprazol"},{"com":"metotrexato","efeito":"reduz excreção MTX","manejo":"suspender IBP em altas doses MTX"},{"com":"levotiroxina","efeito":"reduz absorção","manejo":"espaçar 4h"}]$$::jsonb,
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"diarreia, constipação, flatulência"},{"freq":"comum","evento":"dor abdominal"},{"freq":"incomum (uso prolongado)","evento":"deficiência B12, magnésio, ferro"},{"freq":"incomum (uso prolongado)","evento":"OSTEOPOROSE, FRATURA (uso >1 ano alta dose)"},{"freq":"incomum","evento":"infecção entérica (C. difficile, Salmonella)"},{"freq":"incomum","evento":"pneumonia comunitária (mais em idoso)"},{"freq":"raro","evento":"nefrite intersticial aguda"},{"freq":"raro","evento":"hipomagnesemia grave"}]$$::jsonb,
  ARRAY['IBP CRÔNICO É PROBLEMA — reavaliar em todas as consultas, tentar dose mínima ou step-down','Uso >1 ano: monitorar B12, magnésio, função renal. Risco osteoporose, fraturas','EM CRÔNICO: NÃO suspender abruptamente — efeito rebote (hipersecreção ácida). Desmamar gradualmente','Em pacientes com SCA + clopidogrel: PANTOPRAZOL é preferido (vs omeprazol que reduz ativação clopidogrel)','Não diluir IV em SF puro — usar SG 5% ou diluir 100 mL'],
  ARRAY['Resposta clínica em 4-8 semanas','B12, Mg, ferro se uso >1 ano','Função renal anual','Sintomas dispepsia (reavaliar necessidade)'],
  'Pró-droga ativada em meio ácido (pH<4) — concentra-se nas células parietais gástricas. Inibe IRREVERSIVELMENTE a H+/K+-ATPase (bomba de prótons) na membrana apical → bloqueia secreção ácida final, independente de estímulo (gastrina, histamina, ACh). Recuperação só com síntese de novas bombas (24-48h). Mais seletivo e menos interação CYP que omeprazol.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=pantoprazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 100. ONDANSETRONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'ondansetrona',
  'Ondansetrona',
  ARRAY['Zofran', 'Vonau'],
  'Antiemético — antagonista 5-HT3',
  ARRAY['VO', 'IV', 'IM'],
  $$[{"forma":"comprimido","concentracao":"4/8 mg"},{"forma":"orodispersível","concentracao":"4/8 mg"},{"forma":"ampola","concentracao":"2 mg/mL (4 mg/2mL ou 8 mg/4mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"náusea/vômito quimioterapia (alta emetogenicidade)","dose":"8 mg IV ou VO 30 min pré-quimio + 8 mg 12/12h × 1-2 dias","via":"IV ou VO","obs":"associar a dexametasona + aprepitanto (NK1) em quimio altamente emetogênica"},{"para":"náusea pós-operatória — profilaxia","dose":"4 mg IV ao final cirurgia","via":"IV"},{"para":"náusea/vômito gastroenterite","dose":"4-8 mg dose única VO/IV (orodispersível útil em criança)","via":"VO","obs":"reduz necessidade hidratação IV em peds"},{"para":"hiperêmese gravídica","dose":"4-8 mg 8/8h VO","via":"VO","obs":"linha 2 — antes tentar piridoxina + doxilamina, metoclopramida"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥6m gastroenterite","dose":"<15kg: 2 mg; 15-30 kg: 4 mg; >30 kg: 8 mg dose única"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia grave (Child-Pugh C)","ajuste":"max 8 mg/dia"}]$$::jsonb,
  'B', 'Categoria B. Estudos pré-clínicos sem dano. Em humanos: dados conflitantes em 1º trim (FDA emitiu alerta sobre fenda palatina, mas dados subsequentes tranquilizadores). Usar quando indicado.', 'Compatível em curto prazo.',
  ARRAY['hipersensibilidade','uso concomitante de apomorfina (hipotensão grave)','prolongamento congênito QT'],
  $$[{"freq":"muito comum","evento":"cefaleia (até 30%)"},{"freq":"comum","evento":"constipação"},{"freq":"comum","evento":"sensação de calor, rubor"},{"freq":"incomum","evento":"prolongamento QT (dose-dependente, especialmente IV >16 mg)"},{"freq":"incomum","evento":"elevação enzimas hepáticas"},{"freq":"raro","evento":"arritmias (torsades em uso IV alta dose)"},{"freq":"raro","evento":"síndrome serotoninérgica (em uso com ISRS/IRSN)"}]$$::jsonb,
  ARRAY['PROLONGAMENTO QT: FDA limitou dose IV única a 16 mg em adultos (2012) — risco torsades. ECG basal em paciente alto risco (cardiopatia, eletrólitos baixos, outros prolongadores QT)','SÍNDROME SEROTONINÉRGICA: em uso com ISRS/IRSN/triptanos/tramadol — atenção a sintomas','Não é eficaz em náusea por movimento (cinetose) ou vertigem — preferir anti-histamínico/escopolamina','Em peds: orodispersível é útil — efeito após 5-10 min, sem deglutir comprimido durante vômito','Em gestação: dados foram conflitantes. Em hiperêmese refratária a piridoxina+doxilamina+metoclopramida, ondansetrona é razoável após orientação'],
  ARRAY['ECG (QT) em alto risco','Eletrólitos (K, Mg) — corrigir antes','Sintomas (eficácia + cefaleia)'],
  'Antagonista seletivo do receptor 5-HT3 (serotonina) presente em terminações vagais aferentes do TGI E na zona de gatilho quimiorreceptora (área postrema do bulbo). Bloqueia o estímulo emetogênico induzido por: quimioterápicos (que liberam serotonina das células enterocromafins), radiação, anestesia. Não age em receptores D2/H1/M (não tem efeitos extrapiramidais como metoclopramida).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ondansetrona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 101. METOCLOPRAMIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'metoclopramida',
  'Metoclopramida',
  ARRAY['Plasil', 'Eucil'],
  'Procinético + antiemético (antagonista D2 + agonista 5-HT4)',
  ARRAY['VO', 'IV', 'IM'],
  $$[{"forma":"comprimido","concentracao":"10 mg"},{"forma":"solução oral","concentracao":"4 mg/mL"},{"forma":"ampola","concentracao":"5 mg/mL (10 mg/2mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"náusea/vômito agudo (qualquer causa)","dose":"10 mg IV/IM/VO 8/8h","via":"VO/IV/IM","duracao":"≤5 dias (FDA)","obs":"USO CURTO. Não exceder 30 mg/dia"},{"para":"gastroparesia","dose":"5-10 mg 30 min antes refeições + ao deitar","via":"VO","duracao":"≤12 sem","obs":"diabéticos. Reavaliar a cada 12 sem (risco discinesia)"},{"para":"hiperêmese gravídica","dose":"5-10 mg 8/8h","via":"VO ou IV","obs":"linha 2 antes de ondansetrona. Considerada segura na gestação"},{"para":"facilitar SNG / radiografia contrastada","dose":"10 mg IV","via":"IV","obs":"acelera esvaziamento gástrico"}]}$$::jsonb,
  $${"indicacoes":[{"para":"náusea peds (≥1a)","dose":"0,1-0,15 mg/kg/dose 8/8h, max 0,5 mg/kg/dia","obs":"limitar uso por risco extrapiramidal (mais sensível em peds)"}]}$$::jsonb,
  $${"obs":"INICIAR 5 mg. Mais sensível a discinesia (FDA 2009 — alerta vermelho)."}$$::jsonb,
  $$[{"clcr":"<40","ajuste":"reduzir 50%"}]$$::jsonb,
  'B', 'Categoria B. Considerada SEGURA em gestação (longa experiência).', 'Compatível em curto prazo.',
  ARRAY['hemorragia/perfuração TGI','obstrução intestinal','feocromocitoma','epilepsia','Parkinson','discinesia tardia prévia','hipersensibilidade'],
  $$[{"freq":"comum","evento":"sonolência, fadiga"},{"freq":"comum","evento":"agitação, ansiedade"},{"freq":"incomum","evento":"DISTONIA AGUDA — espasmos faciais, crise oculogíria, torcicolo (mais em jovens, peds, mulheres)"},{"freq":"incomum","evento":"sintomas extrapiramidais (parkinsonismo, acatisia)"},{"freq":"incomum","evento":"hiperprolactinemia (galactorreia, amenorreia)"},{"freq":"raro","evento":"DISCINESIA TARDIA (movimentos involuntários, irreversível) — ↑ risco em uso >12 sem"},{"freq":"raro","evento":"síndrome neuroléptica maligna"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: DISCINESIA TARDIA com uso >12 SEMANAS — limitar uso prolongado','DISTONIA AGUDA: tratar com biperideno 5 mg IV/IM ou difenidramina 25-50 mg IV (ANTES de chamar de psicogênico)','Em IDOSO: muito mais sensível a efeitos extrapiramidais — preferir ondansetrona se possível','Em PEDS: limitar uso em <1 ano (uso restrito) — risco extrapiramidal alto','SÍNDROME NEUROLÉPTICA MALIGNA: febre + rigidez + alteração consciência — emergência'],
  ARRAY['Sintomas extrapiramidais (qualquer movimento involuntário → suspender)','Função renal','Reavaliar necessidade a cada 12 sem (gastroparesia) ou 5 dias (vômito agudo)'],
  'Antagonista D2 dopaminérgico central (zona gatilho quimiorreceptora) e periférico (TGI) → efeito antiemético + procinético. Também AGONISTA 5-HT4 (estimula liberação de ACh, aumentando peristaltismo TGI alto: estômago, duodeno, jejuno) e ANTAGONISTA 5-HT3 (em altas doses). Atravessa BHE → efeitos extrapiramidais.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metoclopramida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 102. LACTULOSE
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'lactulose',
  'Lactulose',
  ARRAY['Duphalac', 'Lactulona'],
  'Laxante osmótico + redutor de amônia',
  ARRAY['VO', 'retal'],
  $$[{"forma":"xarope","concentracao":"667 mg/mL (10 g/15 mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"constipação crônica","dose":"15-30 mL/dia, ajustar para 1-2 evacuações pastosas/dia","via":"VO","frequencia":"1x/dia (manhã)","obs":"resposta em 24-48h. Alternativa: PEG 3350 (Polietilenoglicol) — mais eficaz"},{"para":"encefalopatia hepática","dose":"30-45 mL VO 6/6h, titular para 2-3 evacuações pastosas/dia","via":"VO ou clister 300 mL em 700 mL água","duracao":"contínuo (manutenção)","obs":"PRIMEIRA ESCOLHA. Reduz amônia. Manter mesmo após resolução para prevenir recidiva"},{"para":"profilaxia secundária encefalopatia hepática","dose":"30 mL 12/12h","via":"VO","obs":"associar a rifaximina 550 mg 12/12h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"constipação peds","dose":"<1a: 2,5-10 mL/dia; 1-7a: 5-10 mL/dia; ≥7a: 10-15 mL/dia"}]}$$::jsonb,
  'B', 'Categoria B. Não absorvida sistemicamente. Segura.', 'Compatível.',
  ARRAY['galactosemia','obstrução intestinal','perfuração TGI','intolerância à galactose'],
  $$[{"freq":"muito comum","evento":"flatulência, distensão abdominal (cede em dias)"},{"freq":"comum","evento":"náusea"},{"freq":"comum (overdose)","evento":"diarreia → desidratação, distúrbio hidroeletrolítico"},{"freq":"incomum","evento":"hipernatremia (perda água livre via diarreia)"}]$$::jsonb,
  ARRAY['Em ENCEFALOPATIA HEPÁTICA: titular pela frequência de evacuações (alvo 2-3/dia) — não pelo nível de amônia','PEG 3350 (Movicol/Macrogol) é PREFERÍVEL para constipação crônica simples — mais eficaz, menos flatulência','Sabor doce melhora aceitação em peds','Sem efeito laxante imediato — orientar paciente que demora 24-48h','NÃO deixar paciente com constipação crônica usar laxante estimulante (sene/bisacodil) por longos períodos — preferir osmótico'],
  ARRAY['Frequência evacuações','Sintomas encefalopatia (asterix, confusão)','Eletrólitos em uso prolongado'],
  'Dissacarídeo sintético (galactose-frutose) NÃO HIDROLISÁVEL pelas dissacaridases intestinais humanas → atinge cólon intacto → fermentado por bactérias colônicas em ácidos orgânicos (lático, acético, fórmico) → 1) acidifica luz colônica → converte NH3 (absorvível) em NH4+ (não-absorvível) → reduz amônia sistêmica em encefalopatia. 2) efeito osmótico → retém água → fezes pastosas/laxação.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=lactulose',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 103. POLIETILENOGLICOL (PEG 3350)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'polietilenoglicol',
  'Polietilenoglicol 3350 (PEG)',
  ARRAY['Muvinlax', 'Movicol', 'Macrogol'],
  'Laxante osmótico não absorvível',
  ARRAY['VO'],
  $$[{"forma":"sachê","concentracao":"13,1 g (Muvinlax)"}]$$::jsonb,
  $${"indicacoes":[{"para":"constipação crônica","dose":"1 sachê (13,1 g) 1-3x/dia em 125 mL água","via":"VO","obs":"PRIMEIRA ESCOLHA — mais eficaz que lactulose, menos flatulência. Resposta em 1-3 dias"},{"para":"impactação fecal (manejo ambulatorial)","dose":"8 sachês/dia × 3 dias OU 1-1,5 g/kg/dia em peds","via":"VO","obs":"hidratação adequada"},{"para":"preparo de colonoscopia","dose":"polietilenoglicol-eletrólitos 4 L (Klean-Prep) divididos","via":"VO","obs":"diferente do PEG 3350 puro — contém eletrólitos"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥6m constipação peds","dose":"0,4-0,8 g/kg/dia (manutenção); 1-1,5 g/kg/dia (impactação)","obs":"PRIMEIRA ESCOLHA EM PEDS — segurança comprovada"}]}$$::jsonb,
  'C', 'Sem absorção significativa — provavelmente seguro.', 'Compatível.',
  ARRAY['obstrução intestinal','perfuração','megacólon tóxico','íleo paralítico','hipersensibilidade'],
  $$[{"freq":"comum","evento":"distensão abdominal leve"},{"freq":"comum","evento":"náusea (uso inicial)"},{"freq":"incomum","evento":"diarreia (overdose)"}]$$::jsonb,
  ARRAY['MAIS EFICAZ E MELHOR TOLERADO QUE LACTULOSE — preferir em constipação crônica','SEGURO PEDS — primeira escolha em constipação funcional infantil','Sem absorção sistêmica significativa — perfil seguro mesmo em uso prolongado','Não causa dependência (diferente de laxantes estimulantes)'],
  ARRAY['Frequência evacuações','Distúrbio eletrolítico em uso prolongado / alta dose'],
  'Polímero inerte de alto peso molecular (3350 Da) NÃO ABSORVIDO no TGI. Retém água por força osmótica → aumenta volume e amolece bolo fecal → estimula peristaltismo. Sem efeito sistêmico, sem fermentação bacteriana significativa (diferente de lactulose) → menos flatulência. Sem alteração eletrolítica em uso normal.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=polietilenoglicol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- REUMATO / IMUNO
-- ============================================================

-- 104. ALOPURINOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'alopurinol',
  'Alopurinol',
  ARRAY['Zyloric'],
  'Inibidor da xantina oxidase (uricostático)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"100/300 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"gota crônica (urato-redutor)","dose":"INICIAR 100 mg/dia × 2-4 sem, titular 100 mg cada 2-4 sem até alvo (max 800 mg/dia, geralmente 300-600 mg basta)","via":"VO","frequencia":"1x/dia","duracao":"contínuo, vitalício se ≥2 crises/ano ou tofo","obs":"meta ácido úrico < 6 mg/dL (geral) ou < 5 (tofáceo). NÃO INICIAR durante crise aguda"},{"para":"profilaxia síndrome lise tumoral","dose":"300-600 mg/dia 24-48h pré-quimio","obs":"alternativa: rasburicase em alto risco"},{"para":"nefrolitíase por ácido úrico","dose":"300 mg/dia + alcalinização urinária"}]}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste"},{"clcr":"30-60","ajuste":"max 200 mg/dia"},{"clcr":"15-30","ajuste":"max 100 mg/dia"},{"clcr":"<15","ajuste":"50-100 mg cada 2 dias"}]$$::jsonb,
  'C', 'Categoria C. Sem dados suficientes. Avaliar risco-benefício.', 'Compatível.',
  $$[{"com":"azatioprina/6-mercaptopurina","efeito":"AUMENTA TOXICIDADE (mielotoxicidade fatal)","manejo":"reduzir azatioprina 75% se associação inevitável"},{"com":"varfarina","efeito":"aumenta INR","manejo":"monitor"},{"com":"AAS baixa dose","efeito":"sem clinicamente relevante","manejo":"manter"}]$$::jsonb,
  ARRAY['hipersensibilidade prévia','crise gota AGUDA (não iniciar durante; manter se já em uso)','SCAR (síndrome cutânea adversa grave) prévia'],
  $$[{"freq":"comum","evento":"reação cutânea (rash maculopapular ~2%)"},{"freq":"comum","evento":"náusea, dispepsia"},{"freq":"comum (início tratamento)","evento":"PIORA TRANSITÓRIA da gota (mobilização de cristais) — profilaxia com colchicina/AINE"},{"freq":"incomum","evento":"elevação enzimas hepáticas"},{"freq":"raro","evento":"SÍNDROME DE HIPERSENSIBILIDADE (DRESS, SJS/TEN) — risco maior HLA-B*5801 (asiáticos)"}]$$::jsonb,
  ARRAY['SCAR/DRESS é a complicação mais temida — qualquer rash novo nas primeiras 8 sem → SUSPENDER e avaliar urgência','HLA-B*5801: rastrear em paciente asiático/coreano/han chinês ANTES de iniciar (alto risco SCAR)','NÃO iniciar durante crise — pode prolongar/piorar. Mas se já em uso, MANTER (não interromper)','PROFILAXIA com COLCHICINA 0,5-0,6 mg 12/12h por 3-6 meses ao iniciar alopurinol — reduz crises de mobilização','Em DRC: titular MUITO lentamente, dose menor — maior risco SCAR','Alternativa: febuxostate 40-80 mg/dia (mais caro, ↑ risco CV em estudo CARES — preferir alopurinol)'],
  ARRAY['Ácido úrico sérico (alvo <6 ou <5)','Função renal','Função hepática (TGO/TGP)','Hemograma','Sintomas cutâneos (rash → suspender)'],
  'Inibe a xantina oxidase (XO) → reduz conversão de hipoxantina→xantina→ácido úrico → reduz uricogênese. É metabolizado a oxipurinol (metabólito ativo, meia-vida 18-30h). Adicionalmente, hipoxantina/xantina acumuladas inibem mais a XO (feedback). Resultado: redução do urato sérico → redissolução de cristais nos tofos (lento, meses). Não tem ação anti-inflamatória aguda.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=alopurinol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 105. COLCHICINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'colchicina',
  'Colchicina',
  ARRAY['Colchis'],
  'Anti-inflamatório (inibidor de microtúbulos)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"0,5/1 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"crise aguda gota","dose":"1,2 mg ataque + 0,6 mg 1h depois (max 1,8 mg/dia)","via":"VO","duracao":"até resolução, max 5 dias","obs":"INICIAR nas primeiras 24-36h da crise (após 36h eficácia cai). NÃO USAR doses altas antigas (recall: 4-6 mg/dia → toxicidade)"},{"para":"profilaxia crises na introdução de alopurinol","dose":"0,5-0,6 mg 1-2x/dia","via":"VO","duracao":"3-6 meses","obs":"reduz mobilização de cristais durante redução de urato"},{"para":"febre familiar do mediterrâneo (FMF)","dose":"1-2 mg/dia","via":"VO","obs":"primeira escolha. Profilaxia de amiloidose"},{"para":"pericardite (recorrente/aguda)","dose":"0,5 mg 12/12h","duracao":"3 meses (aguda) ou 6 meses (recorrente)","obs":"primeira escolha junto com AINE — CORP/CORP-2"},{"para":"prevenção CV pós-IAM (off-label)","dose":"0,5 mg/dia","obs":"COLCOT — reduz desfechos CV em pós-IAM"}]}$$::jsonb,
  $${"obs":"reduzir 50%. Maior sensibilidade GI."}$$::jsonb,
  $$[{"clcr":"≥60","ajuste":"sem ajuste"},{"clcr":"30-60","ajuste":"considerar reduzir 50%"},{"clcr":"<30 ou diálise","ajuste":"contraindicado para uso crônico; em crise aguda dose única reduzida"}]$$::jsonb,
  $$[{"contexto":"Child-Pugh C","ajuste":"contraindicado"}]$$::jsonb,
  'C', 'Categoria C. Atravessa placenta; usar se benefício > risco (FMF: continuar — protege feto).', 'Compatível em doses baixas.',
  $$[{"com":"claritromicina/eritromicina/cetoconazol/ciclosporina","efeito":"intoxicação grave por colchicina","manejo":"contraindicado em IRA/hepatopatia; reduzir dose 50% se uso obrigatório"},{"com":"sinvastatina","efeito":"miopatia/rabdomiólise","manejo":"monitor CK"}]$$::jsonb,
  ARRAY['ClCr <30 + uso de inibidor CYP3A4/PgP','Child-Pugh C','discrasia sanguínea','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"DIARREIA (>20%) — efeito limitante"},{"freq":"comum","evento":"náusea, vômito, dor abdominal"},{"freq":"incomum","evento":"mielossupressão (uso prolongado)"},{"freq":"raro","evento":"INTOXICAÇÃO (overdose ou interação) — falência multiorgânica, MORTAL — sem antídoto"},{"freq":"raro","evento":"miopatia, neuropatia"},{"freq":"raro","evento":"alopécia"}]$$::jsonb,
  ARRAY['JANELA TERAPÊUTICA ESTREITA — overdose é POTENCIALMENTE FATAL (sem antídoto). Não exceder doses recomendadas','INTERAÇÃO GRAVE com claritromicina, eritromicina, cetoconazol, ciclosporina (inibidores CYP3A4/PgP) → toxicidade letal','EM IRA + claritromicina = receita para óbito — atenção','DIARREIA é o efeito adverso mais comum — orientar paciente, reduzir dose ou suspender se intolerável','As doses ANTIGAS (4-6 mg/dia até diarreia) eram TÓXICAS — protocolo atual é dose baixa'],
  ARRAY['Hemograma + CK em uso prolongado','Função renal + hepática','Sintomas GI'],
  'Liga-se à TUBULINA → impede formação de microtúbulos → BLOQUEIA migração e fagocitose de neutrófilos no local da inflamação articular. Inibe também ativação do INFLAMASOMA NLRP3 (libera IL-1β em resposta a cristais de urato/pirofosfato) → reduz inflamação. Não afeta produção de ácido úrico (não é uricostático) — apenas anti-inflamatório.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=colchicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 106. METOTREXATO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'metotrexato',
  'Metotrexato',
  ARRAY['Metrexato', 'Tecnomet'],
  'Antimetabólito (antagonista do ácido fólico) — DMARD + quimioterápico',
  ARRAY['VO', 'SC', 'IM', 'IV'],
  $$[{"forma":"comprimido","concentracao":"2,5 mg"},{"forma":"frasco-ampola","concentracao":"50 mg/2mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"AR (DMARD 1ª linha)","dose":"INICIAR 7,5-15 mg/SEMANA, titular até 20-25 mg/sem","via":"VO ou SC (preferir SC se >15 mg/sem)","frequencia":"1X POR SEMANA","obs":"DOSE SEMANAL — NUNCA DIÁRIA. Erro = óbito. Sempre associar ÁCIDO FÓLICO 5 mg/sem (24h após MTX)"},{"para":"psoríase grave","dose":"7,5-25 mg/sem","via":"VO ou SC"},{"para":"AIJ poliarticular","dose":"10-15 mg/m²/sem","via":"VO ou SC"},{"para":"gestação ectópica","dose":"50 mg/m² IM dose única ou múltipla","via":"IM","obs":"em ectópica não rota, beta-HCG <5000, sem BCF, massa <3,5 cm"},{"para":"abortamento (uso ilícito — não indicado oficialmente)","obs":"NÃO É INDICAÇÃO LEGAL nem oficial no Brasil"}]}$$::jsonb,
  $$[{"clcr":"60-79","ajuste":"reduzir 50%"},{"clcr":"<60","ajuste":"em geral contraindicado em uso crônico"},{"clcr":"<30","ajuste":"contraindicado"}]$$::jsonb,
  $$[{"contexto":"hepatopatia ativa","ajuste":"contraindicado"}]$$::jsonb,
  'X', 'CONTRAINDICADO ABSOLUTO. ALTAMENTE TERATOGÊNICO (síndrome embriopatia metotrexato). Suspender 3 meses ANTES de concepção (ambos os sexos).', 'CONTRAINDICADO.',
  $$[{"com":"AINE/AAS","efeito":"reduz excreção MTX, toxicidade","manejo":"em altas doses MTX: SUSPENDER AINE. Em baixas (AR): pode manter com cuidado"},{"com":"sulfametoxazol-trimetoprim/dapsona","efeito":"mielotoxicidade fatal","manejo":"contraindicado"},{"com":"penicilinas","efeito":"reduz excreção MTX","manejo":"monitor"},{"com":"IBP","efeito":"reduz excreção (alta dose MTX)","manejo":"suspender em altas doses"}]$$::jsonb,
  ARRAY['gestação','lactação','imunodeficiência','hepatopatia ativa','etilismo significativo','discrasia sanguínea','úlcera péptica ativa','infecção ativa','ClCr <30','hidrotórax/ascite (acumula em 3º espaço)'],
  $$[{"freq":"muito comum","evento":"náusea, vômito (até 30%)"},{"freq":"comum","evento":"estomatite, alopecia leve"},{"freq":"comum","evento":"elevação enzimas hepáticas"},{"freq":"comum","evento":"mielossupressão (leucopenia/trombocitopenia)"},{"freq":"incomum","evento":"PNEUMONITE (3-5%) — tosse seca + dispneia + febre — pode ser fatal"},{"freq":"incomum","evento":"hepatotoxicidade crônica (fibrose, cirrose)"},{"freq":"raro","evento":"insuficiência renal aguda (alta dose ou desidratação)"},{"freq":"raro","evento":"linfoma EBV-associado (uso prolongado)"}]$$::jsonb,
  ARRAY['DOSE SEMANAL — não diária. Confusão dose semanal × diária causa óbitos no Brasil. Receita CLARA, paciente bem orientado','SEMPRE associar ÁCIDO FÓLICO 5 mg/SEM 24h após MTX → reduz efeitos adversos sem perder eficácia','PNEUMONITE: tosse seca progressiva + dispneia → suspender + Rx tórax + investigar (pode ser fatal)','TERATOGENICIDADE: anticoncepção OBRIGATÓRIA durante e ≥3 meses pós (ambos os sexos)','EVITAR ÁLCOOL — risco hepatotoxicidade aumentado','ANTÍDOTO em intoxicação aguda: ÁCIDO FOLÍNICO (leucovorin) — não confundir com ácido fólico (folato simples)'],
  ARRAY['Hemograma + função hepática + função renal CADA 2-4 SEM no início, depois 3 meses','Sintomas pulmonares (pneumonite — tosse seca + dispneia)','Beta-HCG mulher idade fértil ANTES de cada infusão alta dose','Atualização vacinal (atenuadas contraindicadas)'],
  'Análogo do ácido fólico → INIBE COMPETITIVAMENTE a DI-HIDROFOLATO REDUTASE → reduz THF (tetraidrofolato) → bloqueia síntese de purinas e timidilato → INTERFERE replicação DNA em células de divisão rápida (linfócitos, mucosa, MO, etc). Em baixas doses (AR): efeito imunomodulador via aumento de adenosina extracelular (anti-inflamatório). Em altas doses: citotóxico clássico.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metotrexato',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 107. HIDROXICLOROQUINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'hidroxicloroquina',
  'Hidroxicloroquina',
  ARRAY['Reuquinol', 'Plaquinol'],
  'Antimalárico / DMARD (modificador da doença)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"400 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"lúpus eritematoso sistêmico (LES)","dose":"5 mg/kg/dia (max 400 mg/dia)","via":"VO","frequencia":"1x/dia ou 12/12h","duracao":"contínuo","obs":"BASE do tratamento de TODO paciente com LES (reduz mortalidade, atividade, eventos CV, trombose)"},{"para":"artrite reumatoide (DMARD leve)","dose":"200-400 mg/dia","obs":"DMARD de baixa potência — usar em doença leve ou em combinação"},{"para":"síndrome antifosfolípide (adjuvante)","dose":"200-400 mg/dia"},{"para":"profilaxia/tratamento malária","dose":"profilaxia: 400 mg/sem; tratamento: ataque + manutenção","obs":"resistência crescente em P. falciparum"}]}$$::jsonb,
  $$[{"clcr":"<30","ajuste":"considerar reduzir 50%"}]$$::jsonb,
  'C', 'Categoria C — mas CONTINUAR durante a gestação em LES (suspender = surto severo, pior para o feto que manter HCQ).', 'Compatível.',
  ARRAY['retinopatia prévia','hipersensibilidade','psoríase (pode exacerbar — relativa)','deficiência G6PD (relativa — pode causar hemólise)'],
  $$[{"freq":"comum","evento":"náusea, dispepsia"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"hiperpigmentação cutânea"},{"freq":"incomum (uso >5a)","evento":"RETINOPATIA (toxicidade macular irreversível)"},{"freq":"incomum","evento":"miopatia/cardiomiopatia (uso prolongado)"},{"freq":"raro","evento":"hipoglicemia (pode beneficiar DM)"},{"freq":"raro","evento":"prolongamento QT"}]$$::jsonb,
  ARRAY['RETINOPATIA: dose-dependente (>5 mg/kg/dia) E tempo-dependente (>5 anos uso). Risco 1% em 5a, 20% em 20a. AVALIAÇÃO OFTALMOLÓGICA basal + anual após 5 anos de uso','LIMITE 5 mg/kg/dia (peso real, não ideal) reduz risco retinopatia','EM LES NA GESTAÇÃO: continuar — suspensão precipita surto. Risco materno > benefício de suspender','Em COVID-19: SEM EFICÁCIA comprovada (RECOVERY, SOLIDARITY) — risco arritmia desnecessário','Não confundir com cloroquina (mais tóxica)'],
  ARRAY['Avaliação oftalmológica basal e anual após 5 anos (campo visual + OCT)','Hemograma','Função hepática + renal','ECG (QT) em uso de outros prolongadores'],
  'Liga ao DNA citoplasmático e modifica pH lisossomal/endossomal (eleva pH) → interfere com PROCESSAMENTO DE ANTÍGENOS pelos APCs (apresentação MHC-II reduzida) e bloqueia ativação de TLR7/TLR9 → reduz produção de IFN tipo I e citocinas pró-inflamatórias. Reduz autoimunidade no LES. Em malária: concentra no vacúolo digestivo do plasmódio, impedindo polimerização do heme em hemozoína (toxicidade direta).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=hidroxicloroquina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- NEURO
-- ============================================================

-- 108. GABAPENTINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'gabapentina',
  'Gabapentina',
  ARRAY['Neurontin', 'Gabaneurin'],
  'Anticonvulsivante / analgésico (gabapentinoide)',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"300/400 mg"},{"forma":"comprimido","concentracao":"600/800 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"dor neuropática (neuralgia pós-herpética, neuropatia diabética, lombociatalgia)","dose":"INICIAR 300 mg noite × 1d → 300 mg 12/12h × 1d → 300 mg 8/8h, titular até 1800-3600 mg/dia","via":"VO","frequencia":"8/8h","obs":"resposta em 2-4 sem. Pregabalina é alternativa mais cara mas mais previsível"},{"para":"epilepsia (crises focais — adjuvante)","dose":"900-3600 mg/dia divididos","obs":"adjuvante em crises focais — não primeira escolha"},{"para":"síndrome pernas inquietas","dose":"300-600 mg ao deitar","via":"VO","obs":"linha 2 (após dopaminérgicos)"},{"para":"fogachos (climatério)","dose":"300-900 mg/dia","obs":"alternativa não-hormonal"}]}$$::jsonb,
  $${"obs":"INICIAR 100-300 mg, titular lentamente. Risco queda + sedação."}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste"},{"clcr":"30-60","ajuste":"reduzir 50%"},{"clcr":"15-30","ajuste":"300-700 mg/dia"},{"clcr":"<15 ou diálise","ajuste":"100-300 mg/dia + dose após HD"}]$$::jsonb,
  'C', 'Sem evidência teratogenia clara — preferir a outros anticonvulsivantes em mulher idade fértil.', 'Compatível com cautela.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"sonolência, tonteira (cede em dias)"},{"freq":"comum","evento":"ataxia, edema MMII"},{"freq":"comum","evento":"ganho peso"},{"freq":"comum","evento":"cefaleia, fadiga"},{"freq":"incomum","evento":"depressão, irritabilidade"},{"freq":"incomum","evento":"sintomas pseudo-anticolinérgicos"},{"freq":"raro","evento":"depressão respiratória (com opioides/BZD)"}]$$::jsonb,
  ARRAY['Em IDOSO: alta sensibilidade — começar com doses MUITO baixas, titular lentamente. Risco quedas','TITULAÇÃO LENTA: começar à noite (1 dose) e adicionar progressivamente — minimiza tonteira/sedação','SUSPENSÃO ABRUPTA pode precipitar crise convulsiva ou síndrome de descontinuação — desmamar','POTENCIAL DE ABUSO: lista no Brasil para receita controlada (B1) desde 2019. Combinada a opioide aumenta depressão respiratória','Pregabalina tem farmacocinética mais previsível mas custo maior'],
  ARRAY['Resposta clínica (escalas de dor: NRS, DN4)','Sintomas SNC (sonolência, ataxia)','Função renal','Sinais abuso/dependência'],
  'Análogo estrutural do GABA mas NÃO atua em receptores GABA. Liga-se à subunidade α2δ-1 dos canais de cálcio voltagem-dependentes pré-sinápticos → reduz influxo de Ca++ → reduz liberação de neurotransmissores excitatórios (glutamato, noradrenalina, substância P) em circuitos hiperativos (dor neuropática, foco epileptogênico). Sem ação direta em GABA, mas modula tônus inibitório indiretamente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=gabapentina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 109. PREGABALINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'pregabalina',
  'Pregabalina',
  ARRAY['Lyrica'],
  'Anticonvulsivante / analgésico (gabapentinoide)',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"25/50/75/100/150/300 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"dor neuropática","dose":"INICIAR 75 mg 12/12h × 3-7d → 150 mg 12/12h, titular até 300-600 mg/dia","via":"VO","frequencia":"12/12h","obs":"farmacocinética mais previsível que gabapentina (linear)"},{"para":"fibromialgia","dose":"150-450 mg/dia divididos","via":"VO","obs":"junto com duloxetina = primeira linha"},{"para":"transtorno de ansiedade generalizada","dose":"150-450 mg/dia","obs":"linha 2-3 — risco abuso em paciente com história"},{"para":"epilepsia focal (adjuvante)","dose":"150-600 mg/dia"}]}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste"},{"clcr":"30-60","ajuste":"reduzir 50%"},{"clcr":"15-30","ajuste":"75-150 mg/dia"},{"clcr":"<15","ajuste":"25-75 mg/dia + dose após HD"}]$$::jsonb,
  'C', 'Sem dados suficientes — estudo NORDIC sugeriu aumento de malformações maiores no 1º trim. EVITAR.', 'Compatível com cautela.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"sonolência (~30%), tonteira (~30%)"},{"freq":"comum","evento":"edema MMII (até 10%)"},{"freq":"comum","evento":"ganho peso"},{"freq":"comum","evento":"boca seca, visão borrada"},{"freq":"incomum","evento":"depressão respiratória com opioides"},{"freq":"incomum","evento":"ideação suicida"},{"freq":"raro","evento":"angioedema"}]$$::jsonb,
  ARRAY['ABUSO É REAL — receita de CONTROLE ESPECIAL no Brasil (B1) desde 2019. Atenção em paciente com história de uso de drogas','OPIOIDES + PREGABALINA = risco depressão respiratória ↑↑ (FDA Black Box 2019)','MAIS POTENTE QUE GABAPENTINA na mesma dose — biodisponibilidade ~90% vs ~33% gabapentina','Sintomas oculares (visão borrada, ambliopia) — orientar paciente','Suspensão abrupta → síndrome (insônia, náusea, cefaleia, ansiedade) — desmamar 1 sem'],
  ARRAY['Resposta clínica','Função renal (ajuste)','Sinais de abuso','Sintomas SNC'],
  'Análogo estrutural do GABA com mecanismo idêntico à gabapentina — liga subunidade α2δ-1 dos canais de cálcio voltagem-dependentes pré-sinápticos → reduz liberação de neurotransmissores excitatórios. Diferenças farmacocinéticas: absorção saturável da gabapentina vs LINEAR e previsível da pregabalina (BID vs TID), maior potência (necessita dose menor), pico mais rápido (1-2h).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=pregabalina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
