-- PreceptorBook: Bloco 1 — Drogas de UTI/emergência (20 drogas)
-- Vasopressores (6) + Sedação/analgesia UTI (6) + ATB hospitalar (8)
-- Total após esta migration: 70 drogas

-- ============================================================
-- VASOPRESSORES E INOTRÓPICOS
-- ============================================================

-- 51. NORADRENALINA (norepinefrina)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'noradrenalina',
  'Noradrenalina (norepinefrina)',
  ARRAY['Norepinefrina', 'Levophed'],
  'Vasopressor — agonista alfa-adrenérgico',
  ARRAY['IV (acesso central preferível)'],
  $$[{"forma":"ampola","concentracao":"4 mg/4 mL (1 mg/mL)"},{"forma":"diluição padrão","concentracao":"16 mg em 250 mL SG 5% = 64 mcg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"choque séptico (1ª escolha)","dose":"0,05–0,5 mcg/kg/min IV BIC, titular para PAM ≥ 65","obs":"Alvo: PAM 65 (ou 80 se HAS prévia/aterosclerose). Surviving Sepsis 2021"},{"para":"choque cardiogênico","dose":"0,05–0,3 mcg/kg/min IV","obs":"Associar inotrópico (dobutamina) se débito baixo"},{"para":"hipotensão pós-PCR","dose":"0,1–1 mcg/kg/min titular"}]}$$::jsonb,
  $${"indicacoes":[{"para":"choque pediátrico","dose":"0,05–2 mcg/kg/min IV BIC, titular pela PA"}]}$$::jsonb,
  $${"obs":"Mesma dose ajustada por kg. Monitorar perfusão periférica de perto (idoso isquemia digital)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'C',
  'Categoria C. Reduz fluxo uteroplacentário. Usar se vital materno.',
  'Sem dados — uso curto em UTI com mãe estável.',
  $$[{"com":"IMAO","efeito":"crise hipertensiva grave","manejo":"contraindicado por 14 dias"},{"com":"tricíclicos","efeito":"potencializa resposta pressora","manejo":"reduzir dose 50%"},{"com":"halotano (anestésico)","efeito":"arritmia","manejo":"cautela em SO"},{"com":"linezolida","efeito":"crise HTN (efeito IMAO)","manejo":"reduzir dose noradrenalina"}]$$::jsonb,
  ARRAY['hipovolemia não corrigida (corrigir volume PRIMEIRO)','trombose vascular periférica/mesentérica','feocromocitoma'],
  $$[{"freq":"comum","evento":"isquemia periférica (digital, mesentérica) — dose-dependente"},{"freq":"comum","evento":"taquicardia, arritmia"},{"freq":"comum","evento":"hipertensão se sobre-titulação"},{"freq":"raro","evento":"necrose tecidual em extravasamento (antídoto: fentolamina 5–10 mg infiltrar)"},{"freq":"raro","evento":"isquemia miocárdica em DAC"}]$$::jsonb,
  ARRAY['ACESSO CENTRAL preferível (extravasamento causa necrose); periférico ACEITÁVEL em curto prazo se central não disponível (estudo Cardiff)','Antídoto extravasamento: fentolamina 5-10 mg em 10 mL SF infiltrado em pétalas','Titular pela PAM, não pela PAS. Alvo PAM ≥ 65 mmHg','Não administrar em bolus','Suspender gradualmente — desmame de 0,02-0,05 mcg/kg/min cada 30 min'],
  ARRAY['PAM contínua (linha arterial idealmente)','FC e ritmo (telemetria)','Lactato seriado (perfusão)','Diurese (alvo > 0,5 mL/kg/h)','Perfusão periférica (cor, temperatura, tempo enchimento capilar)','Local de infusão (extravasamento)'],
  'Agonista alfa-1 adrenérgico potente (vasoconstrição arteriolar) com leve efeito beta-1 (inotrópico). Aumenta resistência vascular sistêmica e PAM com pouca taquicardia (diferente da epinefrina). Liberada por neurônios simpáticos pós-ganglionares fisiologicamente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=noradrenalina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 52. EPINEFRINA (adrenalina)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'epinefrina',
  'Epinefrina (adrenalina)',
  ARRAY['Adrenalina', 'EpiPen'],
  'Vasopressor + inotrópico — agonista alfa e beta',
  ARRAY['IV', 'IM', 'SC', 'inalatória', 'intratraqueal'],
  $$[{"forma":"ampola","concentracao":"1 mg/mL (1:1.000)"},{"forma":"diluição PCR/IV","concentracao":"1 mg em 10 mL SF (1:10.000)"},{"forma":"caneta auto-injetora","concentracao":"0,3 mg (adulto)"}]$$::jsonb,
  $${"indicacoes":[{"para":"PCR (ACLS)","dose":"1 mg IV bolus a cada 3-5 min","obs":"Mesma dose em todos ritmos (FV, AESP, assistolia)"},{"para":"anafilaxia","dose":"0,3-0,5 mg IM no vasto lateral coxa","obs":"Repetir 5-15 min se necessário. PILAR do tratamento"},{"para":"choque refratário (3ª linha após NA)","dose":"0,01-0,5 mcg/kg/min IV BIC"},{"para":"asma quase-fatal","dose":"0,3-0,5 mg IM ou neb 5 mg em 5 mL SF","obs":"Quando salbutamol falha"}]}$$::jsonb,
  $${"indicacoes":[{"para":"PCR pediátrica","dose":"0,01 mg/kg IV (max 1 mg) ou 0,1 mg/kg ET (max 2,5 mg)"},{"para":"anafilaxia","dose":"0,01 mg/kg IM (max 0,3 mg em < 30 kg, 0,5 mg em > 30 kg)"},{"para":"crupe (laringotraqueíte)","dose":"neb 0,5 mL/kg de 1:1.000 (max 5 mL)"}]}$$::jsonb,
  $${"obs":"Sem ajuste por idade. Cuidado em doença coronariana — risco isquemia."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'C',
  'Atravessa placenta. Usar SEMPRE em anafilaxia gestacional — risco de não tratar > risco fetal.',
  'Sem dados; uso agudo aceitável.',
  $$[{"com":"IMAO","efeito":"crise hipertensiva","manejo":"contraindicado se possível"},{"com":"betabloqueador não-seletivo (propranolol)","efeito":"hipertensão paradoxal (alfa sem oposição)","manejo":"em anafilaxia: dobrar dose epi e considerar glucagon"},{"com":"halotano","efeito":"arritmia ventricular","manejo":"limitar dose intra-op"},{"com":"tricíclicos","efeito":"potencializa","manejo":"reduzir 50%"}]$$::jsonb,
  ARRAY['NÃO há contraindicação absoluta em PCR ou anafilaxia (são situações de vida ou morte)','Cautela relativa: cardiopatia isquêmica, HAS grave, hipertireoidismo, glaucoma de ângulo estreito'],
  $$[{"freq":"comum","evento":"taquicardia, palpitação"},{"freq":"comum","evento":"tremor, ansiedade"},{"freq":"incomum","evento":"isquemia miocárdica/IAM em cardiopata"},{"freq":"incomum","evento":"arritmia ventricular"},{"freq":"raro","evento":"AVC hemorrágico"},{"freq":"raro","evento":"necrose tecidual em extravasamento (mesma fentolamina)"}]$$::jsonb,
  ARRAY['ANAFILAXIA: IM no vasto lateral é PRIMEIRA escolha (não SC, não IV em paciente consciente)','IV reservado a PCR e choque refratário com monitor cardíaco','Concentração 1:1.000 (1 mg/mL) é IM/SC; 1:10.000 (0,1 mg/mL) é IV','EpiPen 0,3 mg em adulto, 0,15 mg em criança 15-30 kg'],
  ARRAY['ECG/telemetria contínua','PA não-invasiva ou linha arterial','Glicemia (epi causa hiperglicemia)','Lactato'],
  'Agonista alfa-1, alfa-2, beta-1 e beta-2 adrenérgico. Em dose alta predomina alfa (vasoconstrição); em dose baixa predomina beta (broncodilatação, inotropismo, taquicardia). Reverte broncoconstrição e edema da anafilaxia em segundos via beta-2 e alfa-1.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=epinefrina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 53. DOPAMINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dopamina',
  'Dopamina',
  ARRAY['Dopamina', 'Revivan'],
  'Vasopressor / inotrópico — efeito dose-dependente',
  ARRAY['IV (acesso central preferível)'],
  $$[{"forma":"ampola","concentracao":"5 mg/mL (10 mL = 50 mg)"},{"forma":"diluição padrão","concentracao":"200-400 mg em 250 mL SG 5%"}]$$::jsonb,
  $${"indicacoes":[{"para":"bradicardia sintomática (alternativa atropina)","dose":"5-20 mcg/kg/min IV BIC titular pela FC","obs":"ACLS 2020"},{"para":"choque cardiogênico (alternativa)","dose":"5-15 mcg/kg/min IV BIC","obs":"Estudo SOAP-II 2010: noradrenalina é PREFERIDA (menos arritmia, menor mortalidade em choque)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"choque/bradicardia","dose":"2-20 mcg/kg/min IV BIC"}]}$$::jsonb,
  $${"obs":"Maior risco de arritmia. Preferir noradrenalina em idoso com choque."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'C',
  'Reduz fluxo uteroplacentário. Usar só se vital materno.',
  'Inibe lactação (antagoniza prolactina).',
  $$[{"com":"IMAO","efeito":"crise hipertensiva","manejo":"reduzir 1/10 dose habitual"},{"com":"fenitoína","efeito":"hipotensão grave + bradicardia","manejo":"evitar associação"},{"com":"betabloqueador","efeito":"reduz efeito inotrópico","manejo":"considerar dobutamina"}]$$::jsonb,
  ARRAY['feocromocitoma','taquiarritmia ventricular','fibrilação ventricular'],
  $$[{"freq":"comum","evento":"taquicardia, arritmia (mais que noradrenalina)"},{"freq":"comum","evento":"náusea, vômito"},{"freq":"incomum","evento":"isquemia digital/mesentérica"},{"freq":"raro","evento":"necrose em extravasamento (fentolamina antídoto)"},{"freq":"raro","evento":"gangrena periférica"}]$$::jsonb,
  ARRAY['EFEITO É DOSE-DEPENDENTE: 1-3 mcg/kg/min = receptores DA (vasodilatação renal — hoje não recomendado pra "proteção renal"); 3-10 = beta-1 (inotrópico); >10 = alfa-1 (vasoconstrição)','SOAP-II 2010 mostrou MAIOR mortalidade em choque cardiogênico vs noradrenalina','"Dose dopaminérgica" pra proteção renal NÃO É EFICAZ — abandonar prática','Acesso central preferível, mas periférico curto-prazo aceitável'],
  ARRAY['ECG (telemetria contínua)','PA arterial invasiva idealmente','Lactato','Diurese','Local infusão'],
  'Precursor da noradrenalina. Efeito DEPENDE DA DOSE: baixa (1-3 mcg/kg/min) ativa receptores dopaminérgicos D1/D2 (vasodilatação renal/mesentérica — sem benefício clínico); média (3-10) ativa beta-1 (inotrópico); alta (>10) ativa alfa-1 (vasoconstrição como noradrenalina). Liberação de NA endógena também contribui.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dopamina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 54. DOBUTAMINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dobutamina',
  'Dobutamina',
  ARRAY['Dobutrex', 'Dobutamina Genérico'],
  'Inotrópico — agonista beta-1 seletivo',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"12,5 mg/mL (20 mL = 250 mg)"},{"forma":"diluição padrão","concentracao":"250-500 mg em 250 mL SG 5%"}]$$::jsonb,
  $${"indicacoes":[{"para":"choque cardiogênico (perfil C/L Stevenson)","dose":"2,5-15 mcg/kg/min IV BIC","obs":"Combinar com vasopressor (NA) se hipotenso"},{"para":"IC descompensada com baixo débito","dose":"2-10 mcg/kg/min IV","obs":"Curto prazo — NÃO usar em IC compensada (aumenta mortalidade — REMATCH)"},{"para":"prova farmacológica de stress (eco-dobutamina)","dose":"5-40 mcg/kg/min escalonado","obs":"Detecção de isquemia em pacientes que não fazem teste físico"}]}$$::jsonb,
  $${"indicacoes":[{"para":"baixo débito cardíaco","dose":"2-20 mcg/kg/min IV BIC"}]}$$::jsonb,
  $${"obs":"Maior risco de arritmia. Iniciar 2,5 mcg/kg/min e titular."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Sem dados firmes; risco-benefício em IC descompensada.',
  'Sem dados.',
  $$[{"com":"betabloqueador","efeito":"reduz efeito inotrópico","manejo":"em uso crônico — considerar milrinona (não depende de beta-1)"},{"com":"halotano","efeito":"arritmia","manejo":"cautela"},{"com":"nitroprussiato","efeito":"sinergismo (reduz pré e pós-carga + aumenta DC)","manejo":"associação útil em choque cardiogênico"}]$$::jsonb,
  ARRAY['estenose subaórtica idiopática (cardiomiopatia hipertrófica obstrutiva — piora obstrução)','feocromocitoma','sensibilidade a sulfitos (ampolas contêm bissulfito de sódio)'],
  $$[{"freq":"comum","evento":"taquicardia, palpitação"},{"freq":"comum","evento":"hipertensão (paradoxal por aumento DC)"},{"freq":"incomum","evento":"hipotensão (vasodilatação periférica via beta-2)"},{"freq":"incomum","evento":"arritmia ventricular"},{"freq":"raro","evento":"isquemia miocárdica"},{"freq":"raro","evento":"taquifilaxia em uso > 72h"}]$$::jsonb,
  ARRAY['Aumenta DC sem aumentar significativamente RVS — NÃO sobe PA muito (por isso precisa de vasopressor associado em choque)','Tolerância (taquifilaxia) aparece em 48-72h — desmamar progressivamente','REMATCH e ESCAPE: uso crônico ambulatorial de inotrópico AUMENTA mortalidade — só agudo','Em paciente em uso crônico de betabloq, dobutamina pode não funcionar — usar milrinona'],
  ARRAY['ECG/telemetria contínua','PA arterial idealmente','Débito urinário','Lactato','Sintomas (alívio congestão)'],
  'Agonista β1-adrenérgico seletivo (com leve atividade β2 e α1). Aumenta contratilidade miocárdica via AMPc (via Gs/adenilato ciclase). Pouco efeito cronotrópico em doses moderadas — o ganho hemodinâmico vem do aumento de volume sistólico, não da FC. β2 vasodilatador periférico contribui para reduzir pós-carga.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dobutamina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 55. VASOPRESSINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'vasopressina',
  'Vasopressina (ADH)',
  ARRAY['Pitressin'],
  'Vasopressor — agonista receptor V1',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"20 UI/mL"},{"forma":"diluição padrão","concentracao":"20 UI em 100 mL SF (0,2 UI/mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"choque séptico (adjuvante à noradrenalina)","dose":"0,03 UI/min IV BIC (não titular)","obs":"Adicionar quando NA > 0,25 mcg/kg/min — VASST trial"},{"para":"choque vasoplégico pós-cirúrgico","dose":"0,03-0,04 UI/min IV"},{"para":"diabetes insipidus central","dose":"5-10 UI SC/IM 6/6h"},{"para":"hemorragia digestiva varicosa (alternativa)","dose":"0,2-0,4 UI/min IV","obs":"Octreotida é preferida hoje"}]}$$::jsonb,
  $${"indicacoes":[{"para":"choque refratário","dose":"0,0003-0,002 UI/kg/min IV"}]}$$::jsonb,
  $${"obs":"Maior risco de isquemia mesentérica e digital — monitorar perfusão."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia avançada","ajuste":"cautela em sangramento varicoso (pode reduzir fluxo hepático)"}]$$::jsonb,
  'C',
  'Pode causar contração uterina. Evitar em gestação se possível.',
  'Compatível.',
  $$[{"com":"agentes vasoativos","efeito":"sinergismo (NA + vaso = aumenta PAM)","manejo":"intencional em choque"},{"com":"diuréticos","efeito":"hiponatremia se SIADH","manejo":"monitorar Na"}]$$::jsonb,
  ARRAY['doença coronariana grave (risco isquemia)','isquemia mesentérica conhecida','gestação (relativo)'],
  $$[{"freq":"comum","evento":"isquemia digital/mesentérica (mais que NA)"},{"freq":"comum","evento":"hiponatremia (efeito V2 — antidiurese)"},{"freq":"incomum","evento":"arritmia"},{"freq":"raro","evento":"isquemia miocárdica"},{"freq":"raro","evento":"hipertensão paradoxal grave"}]$$::jsonb,
  ARRAY['ADJUVANTE — não substitui NA. Permite reduzir dose de NA em ~40-50%','VASST 2008: não reduz mortalidade global, mas reduz NA necessária','Dose FIXA 0,03 UI/min — não titular (risco isquemia se dose alta)','Não atravessa BHE significativamente'],
  ARRAY['Sódio sérico (hiponatremia comum)','Perfusão periférica + mesentérica (lactato)','PAM','Diurese (pode oligúria)'],
  'Hormônio antidiurético (ADH) endógeno. Em DOSE FISIOLÓGICA atua em V2 renal (concentração de urina). Em DOSE FARMACOLÓGICA ativa V1 vascular causando vasoconstrição via fosfolipase C. Mantém eficácia em acidose (diferente da NA, que perde resposta dos receptores adrenérgicos em pH baixo) — útil em choque séptico avançado.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=vasopressina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 56. MILRINONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'milrinona',
  'Milrinona',
  ARRAY['Primacor', 'Milrinona Genérico'],
  'Inotrópico — inibidor da fosfodiesterase III',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"1 mg/mL (10 mL = 10 mg)"},{"forma":"diluição padrão","concentracao":"20 mg em 100 mL SG 5%"}]$$::jsonb,
  $${"indicacoes":[{"para":"IC descompensada com baixo débito","dose":"BIC 0,375-0,75 mcg/kg/min IV","obs":"Sem bolus rotineiro (hipotensão). Útil em paciente em betabloq crônico"},{"para":"hipertensão pulmonar (peri-op)","dose":"0,25-0,75 mcg/kg/min","obs":"Vasodilata leito pulmonar"},{"para":"choque cardiogênico (alternativa)","dose":"0,25-0,75 mcg/kg/min","obs":"Sempre com vasopressor por causa da hipotensão sistêmica"}]}$$::jsonb,
  $${"indicacoes":[{"para":"baixo débito pós-cirurgia cardíaca","dose":"0,25-0,75 mcg/kg/min IV"}]}$$::jsonb,
  $${"obs":"Maior risco de hipotensão. Reduzir dose 25-50% em > 75 anos."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"dose habitual"},{"clcr":"30-50","ajuste":"reduzir 25-50% (acúmulo)"},{"clcr":"<30","ajuste":"reduzir 50-75%"},{"clcr":"diálise","ajuste":"0,2 mcg/kg/min — monitor"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste (eliminação renal)"}]$$::jsonb,
  'C',
  'Sem dados; usar se essencial.',
  'Sem dados.',
  $$[{"com":"vasodilatadores","efeito":"hipotensão aditiva","manejo":"cautela e volume"},{"com":"diuréticos","efeito":"hipocalemia + arritmia","manejo":"monitor K+"}]$$::jsonb,
  ARRAY['estenose aórtica grave (hipotensão piora pós-carga ventricular)','obstrução de via de saída do VE'],
  $$[{"freq":"comum","evento":"hipotensão (até 30%)"},{"freq":"comum","evento":"taquiarritmia atrial/ventricular"},{"freq":"incomum","evento":"trombocitopenia"},{"freq":"incomum","evento":"cefaleia"},{"freq":"raro","evento":"torsade de pointes"}]$$::jsonb,
  ARRAY['Útil quando paciente está em BETABLOQUEADOR crônico (dobutamina não funciona — bloqueada nos receptores beta-1)','NÃO faz bolus de rotina (estudos mostram aumento de mortalidade — OPTIME-CHF)','Ajustar dose pela função renal (eliminação renal exclusiva)','Vida-média mais longa que dobutamina (~2,5h) — efeito persiste após desligar BIC'],
  ARRAY['ECG/telemetria','PAM','Função renal','Plaquetas','K+','Sintomas de IC'],
  'Inibidor seletivo da fosfodiesterase tipo 3 (PDE3) — bloqueia degradação do AMPc no miócito → aumenta cálcio intracelular → maior contratilidade. Na musculatura lisa vascular, mesmo mecanismo causa vasodilatação sistêmica E pulmonar (reduz pré e pós-carga). Efeito INDEPENDE de receptor beta — útil quando flag betabloqueador no paciente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=milrinona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- SEDAÇÃO / ANALGESIA UTI
-- ============================================================

-- 57. FENTANIL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'fentanil',
  'Fentanil',
  ARRAY['Fentanest', 'Sublimaze', 'Fentanil Genérico'],
  'Opioide sintético potente — agonista mu',
  ARRAY['IV', 'IM', 'transdérmico', 'transmucoso (lollipop)', 'epidural'],
  $$[{"forma":"ampola","concentracao":"50 mcg/mL (2-10 mL)"},{"forma":"adesivo transdérmico","concentracao":"12, 25, 50, 75, 100 mcg/h"},{"forma":"diluição padrão BIC","concentracao":"500-1000 mcg em 100 mL SG 5%"}]$$::jsonb,
  $${"indicacoes":[{"para":"sedação/analgesia em UTI (intubado)","dose":"BIC 0,5-3 mcg/kg/h IV","obs":"100x mais potente que morfina; preferido em IRA (sem metabolito ativo)"},{"para":"indução anestésica","dose":"1-3 mcg/kg IV bolus pré-IOT","obs":"Atenua resposta hemodinâmica à laringoscopia"},{"para":"analgesia procedural","dose":"0,5-1 mcg/kg IV bolus","obs":"Pico em 3-5 min, duração 30-60 min"},{"para":"dor crônica oncológica","dose":"adesivo TD 12-100 mcg/h trocado 72/72h","obs":"Início efeito 12-18h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sedação/analgesia","dose":"1-5 mcg/kg/h IV BIC"},{"para":"intubação","dose":"1-2 mcg/kg IV"}]}$$::jsonb,
  $${"obs":"REDUZIR DOSE 50%. Maior risco de depressão respiratória e delirium. Beers Criteria: usar com cautela."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste (eliminação não-renal — preferido em IRA)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose 25-50%"}]$$::jsonb,
  'C',
  'Atravessa placenta; depressão respiratória neonatal se uso pré-parto. TD não em gestante.',
  'Pequena quantidade no leite — ok em dose única; evitar uso crônico.',
  $$[{"com":"benzodiazepínicos","efeito":"depressão respiratória e óbito (FDA Black Box)","manejo":"se necessário em UTI: titular cuidadoso, monitor"},{"com":"inibidores CYP3A4 (claritro, ritonavir, itraconazol)","efeito":"aumenta níveis (até 2x)","manejo":"reduzir dose 30-50%"},{"com":"álcool, gabapentinoides","efeito":"depressão SNC aditiva","manejo":"monitor/evitar"}]$$::jsonb,
  ARRAY['hipersensibilidade a opioides','depressão respiratória aguda sem suporte','traumatismo craniano com PIC elevada (depende — útil pós-IOT)','íleo paralítico'],
  $$[{"freq":"comum","evento":"depressão respiratória dose-dependente"},{"freq":"comum","evento":"náusea, vômito, prurido"},{"freq":"comum","evento":"constipação (em uso crônico — sempre laxante profilático)"},{"freq":"comum","evento":"rigidez torácica em bolus rápido em alta dose ('chest wall rigidity')"},{"freq":"incomum","evento":"bradicardia, hipotensão"},{"freq":"incomum","evento":"delirium (especialmente em idoso)"},{"freq":"raro","evento":"síndrome de abstinência se suspensão abrupta após > 5d"}]$$::jsonb,
  ARRAY['Antídoto: NALOXONA 0,04-0,4 mg IV (titular pra preservar analgesia)','Bolus rápido em alta dose causa RIGIDEZ TORÁCICA (parece pneumotórax) — tratar com bloqueador neuromuscular + IOT','TD: NUNCA em paciente virgem de opioides (overdose); evitar febre/calor (libera mais droga)','Em UTI: combinar com sedativo (propofol, midazolam) — fentanil sozinho não sedando bem'],
  ARRAY['Sat O2, FR (depressão respiratória)','PA, FC','Escala de dor (BPS, CPOT em sedado)','Escala de sedação (RASS)','Trânsito intestinal','Sinais de abstinência se desmame'],
  'Agonista PURO de receptor μ-opioide (Mu) com seletividade alta. Ativa proteína Gi → reduz AMPc → hiperpolariza neurônio → bloqueia transmissão da dor no corno dorsal medular E modula percepção central no córtex. Lipofílico — atravessa BHE rápido (efeito em segundos), curta duração por redistribuição.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fentanil',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 58. MORFINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'morfina',
  'Morfina',
  ARRAY['Dimorf', 'MS Long', 'Morfina Genérico'],
  'Opioide forte — protótipo agonista mu',
  ARRAY['VO', 'IV', 'IM', 'SC', 'epidural', 'intratecal'],
  $$[{"forma":"ampola","concentracao":"1 mg/mL ou 10 mg/mL"},{"forma":"comprimido LR (longa ação)","concentracao":"30, 60, 100 mg"},{"forma":"solução oral","concentracao":"10 mg/5 mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"dor aguda intensa (pós-op, IAM, EAP)","dose":"2-5 mg IV bolus a cada 10-15 min titular","obs":"Em EAP: 2-4 mg IV reduz pré-carga e ansiedade"},{"para":"dor oncológica","dose":"VO 5-30 mg 4/4h ou LR 15-60 mg 12/12h","obs":"Rotação titular pela necessidade"},{"para":"sedação UTI (alternativa fentanil)","dose":"BIC 1-10 mg/h IV"},{"para":"dispneia em paliativos","dose":"2-5 mg VO ou SC 4/4h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"dor aguda > 6 meses","dose":"0,1-0,2 mg/kg IV/SC 2-4h"}]}$$::jsonb,
  $${"obs":"REDUZIR DOSE 25-50%. Acúmulo de metabolito (M6G) em IRA causa narcose."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"30-50","ajuste":"reduzir 25%"},{"clcr":"<30","ajuste":"PREFERIR fentanil ou hidromorfona (M6G acumula)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir dose, intervalos maiores"}]$$::jsonb,
  'C/D',
  'C em uso curto. D em uso crônico/3º trimestre (síndrome abstinência neonatal).',
  'Pequena quantidade leite — ok em dose única; evitar uso crônico.',
  $$[{"com":"benzodiazepínicos","efeito":"depressão respiratória/óbito (Black Box)","manejo":"evitar combinação ou monitor"},{"com":"IMAO","efeito":"síndrome serotoninérgica","manejo":"separar 14 dias"},{"com":"cimetidina","efeito":"aumenta níveis","manejo":"reduzir dose"}]$$::jsonb,
  ARRAY['depressão respiratória aguda','asma aguda grave','obstrução intestinal','TCE com risco de PIC','liberação histamínica documentada'],
  $$[{"freq":"comum","evento":"depressão respiratória dose-dependente"},{"freq":"comum","evento":"prurido, hipotensão (libera histamina — mais que fentanil)"},{"freq":"comum","evento":"náusea, vômito, constipação"},{"freq":"comum","evento":"miose, sedação"},{"freq":"incomum","evento":"retenção urinária"},{"freq":"raro","evento":"convulsão (metabolito M3G em alta dose/IRA)"},{"freq":"raro","evento":"abstinência neonatal se uso 3º T"}]$$::jsonb,
  ARRAY['Antídoto: NALOXONA 0,04-0,4 mg IV','LIBERA HISTAMINA — mais hipotensão e prurido que fentanil; evitar em asmático','Em IRA, METABOLITO M6G (ativo) acumula — preferir fentanil','Conversão IV→VO: multiplicar por 3 (biodisp ~30%)','Sempre prescrever LAXANTE profilático em uso crônico'],
  ARRAY['Sat O2, FR','PA, FC','Escala de dor','Função renal (em uso crônico — risco acúmulo)','Trânsito intestinal'],
  'Agonista μ-opioide (igual fentanil), com afinidade adicional por receptores κ e δ. Atravessa BHE mais devagar que fentanil (menos lipofílica). Metabolizada no fígado em morfina-6-glucuronídeo (M6G — analgésico ativo, eliminação renal — acumula em IRA) e M3G (neurotóxico em alta dose).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=morfina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 59. MIDAZOLAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'midazolam',
  'Midazolam',
  ARRAY['Dormonid', 'Versed', 'Midazolam Genérico'],
  'Benzodiazepínico de ação curta',
  ARRAY['IV', 'IM', 'VO', 'intranasal', 'sublingual'],
  $$[{"forma":"ampola","concentracao":"1 mg/mL ou 5 mg/mL"},{"forma":"comprimido","concentracao":"7,5 ou 15 mg"},{"forma":"solução oral","concentracao":"2 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"sedação UTI (intubado)","dose":"BIC 0,02-0,1 mg/kg/h IV","obs":"Combinar com analgésico (fentanil). PRP UTI 2018: prefere propofol ou dexmedetomidina"},{"para":"indução anestésica","dose":"0,1-0,3 mg/kg IV"},{"para":"sedação procedural","dose":"0,5-2 mg IV titulado a cada 2 min","obs":"Endoscopia, broncoscopia"},{"para":"status epilepticus","dose":"0,2 mg/kg IV (max 10 mg) ou 10 mg IM/IN","obs":"RAMPART: midazolam IM = lorazepam IV em pré-hospitalar"},{"para":"agitação aguda","dose":"2-5 mg IV/IM titular"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sedação procedural","dose":"0,05-0,1 mg/kg IV"},{"para":"convulsão prolongada (rectal/IN/IM)","dose":"0,2 mg/kg IM/IN ou 0,5 mg/kg retal (max 10 mg)"}]}$$::jsonb,
  $${"obs":"REDUZIR DOSE 50%. Maior risco delirium e queda. Beers Criteria EVITAR uso crônico."}$$::jsonb,
  $$[{"clcr":">30","ajuste":"sem ajuste"},{"clcr":"<30","ajuste":"reduzir 50% (acúmulo de metabolito ativo)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir 50% (CYP3A4)"}]$$::jsonb,
  'D',
  'Atravessa placenta. Síndrome abstinência neonatal se uso prolongado. Evitar 1º T e parto.',
  'Pequena quantidade leite. Doses únicas tolerada.',
  $$[{"com":"opioides","efeito":"depressão respiratória/óbito (Black Box)","manejo":"em UTI: monitor, IOT pronta"},{"com":"inibidores CYP3A4 (claritro, fluconazol, ritonavir)","efeito":"aumenta níveis 2-5x","manejo":"reduzir dose 50-75%"},{"com":"indutores CYP3A4 (rifampicina, fenitoína)","efeito":"reduz efeito","manejo":"aumentar dose"},{"com":"álcool","efeito":"sedação aditiva","manejo":"orientar"}]$$::jsonb,
  ARRAY['miastenia gravis','depressão respiratória','glaucoma de ângulo agudo','choque (cuidado — usa propofol/dexmed)','intoxicação aguda álcool/SNC depressor'],
  $$[{"freq":"comum","evento":"hipotensão (especialmente em hipovolêmico)"},{"freq":"comum","evento":"depressão respiratória"},{"freq":"comum","evento":"DELIRIUM (alta incidência em UTI — evitar uso prolongado)"},{"freq":"incomum","evento":"reação paradoxal (agitação) — especialmente idoso"},{"freq":"incomum","evento":"amnésia (anterógrada — pode ser desejável)"},{"freq":"raro","evento":"abstinência se suspensão abrupta após > 5-7 dias"}]$$::jsonb,
  ARRAY['Antídoto: FLUMAZENIL 0,2 mg IV pode repetir até 1 mg (cuidado — pode precipitar convulsão em uso crônico)','PADIS Guidelines 2018: PROPOFOL e DEXMEDETOMIDINA são preferidos sobre midazolam em UTI (menos delirium e tempo VM)','Em IRA, metabolito alfa-1-hidroximidazolam acumula → sedação prolongada','Sempre titular dose mínima eficaz (RASS -2 a 0 em UTI)','Síndrome abstinência: tremor, agitação, taquicardia, convulsão — desmamar gradualmente'],
  ARRAY['RASS (sedação)','BPS/CPOT (dor)','CAM-ICU (delirium) diariamente','Sat O2, FR, PA, FC','Sinais abstinência se desmame'],
  'Modulador alostérico positivo do receptor GABA-A — aumenta a frequência de abertura do canal de Cl⁻ na presença de GABA → hiperpolarização neuronal → ansiólise, sedação, hipnose, anticonvulsivante e relaxamento muscular. Lipossolúvel em pH fisiológico (atravessa BHE) — daí início rápido.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=midazolam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 60. PROPOFOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'propofol',
  'Propofol',
  ARRAY['Diprivan', 'Propovan', 'Propofol Genérico'],
  'Anestésico/sedativo IV — agonista GABA-A',
  ARRAY['IV (via central preferível em UTI)'],
  $$[{"forma":"ampola/frasco","concentracao":"10 mg/mL (20-100 mL)"},{"forma":"BIC padrão","concentracao":"frasco direto na bomba (não diluir — emulsão lipídica)"}]$$::jsonb,
  $${"indicacoes":[{"para":"sedação UTI (intubado)","dose":"BIC 5-50 mcg/kg/min IV (~1-3 mg/kg/h)","obs":"PADIS prefere propofol ou dexmed sobre midazolam (menos delirium)"},{"para":"indução anestésica","dose":"1-2,5 mg/kg IV bolus","obs":"Início <60s, dura 5-10 min"},{"para":"sedação procedural","dose":"0,5-1 mg/kg IV bolus + repetir 0,5 mg/kg PRN"},{"para":"status epilepticus refratário","dose":"BIC 30-200 mcg/kg/min após bolus 1-2 mg/kg","obs":"Última linha — UTI"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sedação >2 meses","dose":"BIC inicial 1-3 mg/kg/h"}]}$$::jsonb,
  $${"obs":"REDUZIR DOSE 30-50%. Hipotensão é mais comum (vasodilatação)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Atravessa placenta. Curto uso em SO geralmente seguro; evitar uso prolongado.',
  'Pequena quantidade — pode amamentar após dose única depois de 5 meias-vidas.',
  $$[{"com":"opioides, BZD","efeito":"depressão respiratória/cardiovascular aditiva","manejo":"reduzir dose; titular"},{"com":"vasodilatadores","efeito":"hipotensão grave","manejo":"volume + vasopressor pronto"}]$$::jsonb,
  ARRAY['ALERGIA A OVO/SOJA — emulsão lipídica contém ambos (controverso, mas evitar em alergia documentada)','hipotensão grave não-corrigida','crianças < 2 meses (sem dados)'],
  $$[{"freq":"muito comum","evento":"HIPOTENSÃO (vasodilatação + leve depressão miocárdica)"},{"freq":"comum","evento":"depressão respiratória, apneia em bolus"},{"freq":"comum","evento":"dor à injeção (usar veia calibrosa, lidocaína 20 mg pré)"},{"freq":"incomum","evento":"hipertrigliceridemia em uso > 48h (frasco é 10% lipídio)"},{"freq":"raro mas grave","evento":"SÍNDROME DE INFUSÃO DO PROPOFOL (PRIS): acidose metabólica, rabdomiólise, FA, IRA. Risco em > 4 mg/kg/h por > 48h"}]$$::jsonb,
  ARRAY['VANTAGENS UTI: meia-vida CURTA permite avaliação neuro fácil (despertar diário); sem acúmulo em IRA/IH','HIPOTENSÃO é o efeito limitante — começar volume antes de bolus em paciente instável','PRIS: NUNCA > 4 mg/kg/h por > 48h. Sinais de alerta: acidose lática súbita, hipertrigliceridemia, IRA, FA refratária. Trocar imediatamente pra dexmedetomidina','Frasco contém EMULSÃO LIPÍDICA — contar como nutrição (1,1 kcal/mL); pode aumentar TG'],
  ARRAY['PA invasiva idealmente (queda comum)','RASS','CAM-ICU diário','Triglicérides 2-3x/semana se uso > 24h','CK + lactato + gasometria + Na/K se sinais de PRIS','Cor da urina (mioglobinúria em PRIS)'],
  'Agonista do receptor GABA-A (potencializa GABA endógeno) e antagonista NMDA fraco. Lipofílico — pico cerebral em 30-60s. Reduz consumo de O2 cerebral, fluxo sanguíneo cerebral e PIC (útil em TCE). Causa vasodilatação periférica (alfa-1 antagonismo + redução simpática) e leve depressão inotrópica → HIPOTENSÃO comum.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=propofol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 61. DEXMEDETOMIDINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dexmedetomidina',
  'Dexmedetomidina',
  ARRAY['Precedex', 'Dexmedetomidina Genérico'],
  'Sedativo — agonista alfa-2 adrenérgico seletivo',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"100 mcg/mL"},{"forma":"diluição padrão","concentracao":"200 mcg em 50 mL SF (4 mcg/mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"sedação UTI (intubado ou não-intubado)","dose":"BIC 0,2-1,4 mcg/kg/h IV","obs":"NÃO precisa proteger via aérea — sedação 'arousable'. PADIS prefere em UTI"},{"para":"adjuvante anestesia (intra/pós-op)","dose":"BIC 0,2-0,7 mcg/kg/h"},{"para":"abstinência alcoólica grave","dose":"BIC 0,2-1,5 mcg/kg/h","obs":"Reduz necessidade de BZD/opioide"},{"para":"agitação refratária a midazolam","dose":"0,2-1,5 mcg/kg/h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sedação procedural","dose":"BIC 0,2-1 mcg/kg/h"}]}$$::jsonb,
  $${"obs":"Sem ajuste rotineiro, mas começar com dose mais baixa. Bradicardia frequente."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose 30-50%"}]$$::jsonb,
  'C',
  'Sem dados — uso curto se essencial.',
  'Sem dados.',
  $$[{"com":"betabloqueadores, BCC","efeito":"bradicardia/bloqueio AV","manejo":"monitor; pode reduzir dose"},{"com":"vasodilatadores","efeito":"hipotensão aditiva","manejo":"cautela"},{"com":"álcool, opioides, BZD","efeito":"sedação aditiva (mas menos respiratória que opioide+BZD)","manejo":"reduzir dose dos demais"}]$$::jsonb,
  ARRAY['bloqueio AV avançado sem MP','choque cardiogênico não-tratado','intoxicação aguda por álcool ou opioide'],
  $$[{"freq":"muito comum","evento":"BRADICARDIA (até 40%) — pode precisar atropina"},{"freq":"comum","evento":"hipotensão (vasodilatação periférica)"},{"freq":"comum","evento":"boca seca (xerostomia)"},{"freq":"incomum","evento":"hipertensão paradoxal em bolus rápido (alfa-1 transitório)"},{"freq":"raro","evento":"síndrome de abstinência se > 7 dias (taquicardia, agitação) — desmamar"}]$$::jsonb,
  ARRAY['VANTAGEM UNIQUE: paciente sedado mas DESPERTÁVEL e ARGUMENTATIVO — útil em desmame de VM e procedimentos com anestesia colaborativa','MENOS DELIRIUM que midazolam (estudos PRODEX/MIDEX) — primeira escolha em paciente em risco','Sem efeito significativo na ventilação — pode usar em paciente NÃO intubado (sedação consciente)','BOLUS RÁPIDO causa hipertensão paradoxal e bradicardia — fazer dose de ataque LENTA (10 min) ou pular bolus'],
  ARRAY['ECG/telemetria (bradicardia comum)','PA invasiva idealmente','RASS (alvo -1 a +1; sedação leve preservando interação)','CAM-ICU diário'],
  'Agonista alfa-2 adrenérgico SELETIVO (8x mais que clonidina). Ativação pré-sináptica em locus coeruleus REDUZ liberação de noradrenalina → sedação que MIMETIZA SONO NATURAL (preserva resposta a estímulos verbais — sedação "cooperativa"). Pouco efeito respiratório (vantagem sobre opioides/BZD). Pós-sináptico vascular causa bradicardia e leve hipotensão.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dexmedetomidina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 62. KETAMINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'ketamina',
  'Ketamina',
  ARRAY['Ketalar', 'Ketamin', 'Ketamina Genérico'],
  'Anestésico dissociativo / antidepressivo — antagonista NMDA',
  ARRAY['IV', 'IM', 'intranasal', 'oral', 'epidural'],
  $$[{"forma":"ampola","concentracao":"50 mg/mL (10 mL = 500 mg)"},{"forma":"diluição","concentracao":"variável conforme indicação"}]$$::jsonb,
  $${"indicacoes":[{"para":"indução em paciente instável (choque séptico, trauma)","dose":"1-2 mg/kg IV bolus","obs":"PRESERVA tônus simpático — não cai PA como propofol/etomidato"},{"para":"sedação procedural (TC pediátrica, redução fratura)","dose":"1-2 mg/kg IV ou 4-5 mg/kg IM"},{"para":"asma quase-fatal (broncodilator)","dose":"1-2 mg/kg IV bolus + BIC 0,5-2 mg/kg/h","obs":"Mecanismo broncodilator único"},{"para":"analgesia (sub-anestésica)","dose":"BIC 0,1-0,3 mg/kg/h IV","obs":"Reduz tolerância a opioide"},{"para":"depressão refratária (off-label)","dose":"0,5 mg/kg IV em 40 min","obs":"Eficácia em horas — investigacional"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sedação procedural","dose":"1-2 mg/kg IV ou 4-5 mg/kg IM"},{"para":"indução","dose":"1-2 mg/kg IV"}]}$$::jsonb,
  $${"obs":"Cuidado em DAC — aumenta consumo miocárdico de O2 via simpaticomimético."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste; cuidado em uso prolongado"}]$$::jsonb,
  'C',
  'Atravessa placenta. Cesárea: pode usar 1 mg/kg IV.',
  'Pequena quantidade — uso pontual aceitável.',
  $$[{"com":"BZD","efeito":"reduz emergência psicomimética","manejo":"midazolam 2 mg pré-ketamina é prática comum"},{"com":"teofilina","efeito":"reduz limiar convulsivo","manejo":"cautela"},{"com":"opioides","efeito":"sinergismo analgésico","manejo":"reduzir dose ambos"}]$$::jsonb,
  ARRAY['psicose ativa não-tratada','HAS grave não-controlada','aneurisma intracraniano (cautela — relativo)','glaucoma de ângulo agudo (relativo)','tireotoxicose'],
  $$[{"freq":"comum","evento":"HALLUCINAÇÕES e EXPERIÊNCIA DISSOCIATIVA na emergência (40-60%) — atenuar com BZD"},{"freq":"comum","evento":"hipertensão e taquicardia (efeito simpaticomimético)"},{"freq":"comum","evento":"hipersalivação (atropina pré-pode ser útil)"},{"freq":"incomum","evento":"laringoespasmo (raro mas reportado)"},{"freq":"raro","evento":"depressão respiratória (em bolus rápido em alta dose)"},{"freq":"raro","evento":"cistite ulcerativa em uso recreativo crônico"}]$$::jsonb,
  ARRAY['ÚNICO ANESTÉSICO QUE PRESERVA O DRIVE RESPIRATÓRIO E O TÔNUS HEMODINÂMICO — ideal em choque, hemorragia, trauma','BRONCODILATADOR — preferido em asma quase-fatal','EMERGÊNCIA: midazolam 1-2 mg IV pré-procedimento atenua hallucinações','NÃO eleva PIC tanto quanto se pensava — pode usar em TCE com cautela','Etomidato é alternativa mas causa supressão adrenal em sepse'],
  ARRAY['ECG (HAS, taquicardia)','PA','Sat O2, FR (preservados, mas monitorar)','Comportamento na emergência','Frequência salivar (aspiração se necessário)'],
  'Antagonista NÃO-COMPETITIVO do receptor NMDA (glutamato) — bloqueia o canal iônico. Causa "dissociação" do tálamo do córtex (paciente parece acordado mas desconectado). Estimulação simpática indireta (libera catecolaminas) — único anestésico que ELEVA PA/FC. Broncodilatação direta + por simpático. Ação antidepressiva via plasticidade glutamatérgica em horas (BDNF, mTOR).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ketamina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- ANTIBIÓTICOS HOSPITALARES (8)
-- ============================================================

-- 63. PIPERACILINA-TAZOBACTAM (PIP-TAZO)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'piperacilina-tazobactam',
  'Piperacilina-Tazobactam',
  ARRAY['Tazocin', 'Tazonan', 'Pip-tazo Genérico'],
  'Penicilina antipseudomonas + inibidor de beta-lactamase',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"4,5 g (4 g pip + 0,5 g tazo) ou 2,25 g"}]$$::jsonb,
  $${"indicacoes":[{"para":"sepse hospitalar empírica","dose":"4,5 g IV 6/6h","obs":"Cobertura ampla incluindo Pseudomonas e anaeróbios"},{"para":"PAC grave em UTI","dose":"4,5 g IV 6/6h"},{"para":"infecção intra-abdominal complicada","dose":"4,5 g IV 6/6h × 4-7 dias"},{"para":"neutropenia febril","dose":"4,5 g IV 6/6h","obs":"Cobertura empírica padrão (com ou sem amicacina)"},{"para":"infusão estendida","dose":"4,5 g IV em 4h a cada 8h","obs":"Estudos sugerem benefício em infecções graves (pharmacodynamic optimization)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção grave","dose":"100 mg/kg/dose (componente pip) IV 8/8h"}]}$$::jsonb,
  $${"obs":"Reduzir dose conforme função renal (declínio fisiológico)."}$$::jsonb,
  $$[{"clcr":">40","ajuste":"4,5 g 6/6h"},{"clcr":"20-40","ajuste":"3,375 g 6/6h"},{"clcr":"<20","ajuste":"2,25 g 6/6h"},{"clcr":"hemodiálise","ajuste":"2,25 g 8/8h + dose pós-sessão"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Atravessa placenta — uso aceitável em infecções graves.',
  'Compatível.',
  $$[{"com":"vancomicina","efeito":"NEFROTOXICIDADE ADITIVA (controverso — alguns estudos confirmam)","manejo":"considerar cefepime se alta nefrotoxicidade preocupa"},{"com":"aminoglicosídeos","efeito":"sinergismo + nefrotoxicidade","manejo":"monitorar Cr e nível"},{"com":"varfarina","efeito":"prolonga TP","manejo":"monitorar INR"},{"com":"metotrexato","efeito":"reduz clearance","manejo":"evitar associação ou monitor"}]$$::jsonb,
  ARRAY['hipersensibilidade a penicilinas/beta-lactâmicos','história de anafilaxia','colestase induzida por amoxi-clavulanato (alerta — pip-tazo tem risco semelhante)'],
  $$[{"freq":"comum","evento":"diarreia, náusea"},{"freq":"comum","evento":"rash"},{"freq":"comum","evento":"trombocitose, eosinofilia"},{"freq":"incomum","evento":"colite por C. difficile"},{"freq":"incomum","evento":"nefrotoxicidade (especialmente com vanco)"},{"freq":"raro","evento":"anafilaxia (1:5.000-10.000 das penicilinas)"},{"freq":"raro","evento":"convulsão em DOSE ALTA + IRA"}]$$::jsonb,
  ARRAY['Espectro AMPLO incluindo Pseudomonas, anaeróbios e gram-positivos comuns (S. aureus MS)','NÃO cobre MRSA, ESBL, Enterococcus faecium, Stenotrophomonas, Acinetobacter','Estudo MERINO 2018: NÃO usar empiricamente em bacteremia por E. coli/Klebsiella ESBL — meropenem é superior','Em paciente em VANCO concomitante (terapia comum em sepse), considerar trocar pip-tazo por cefepime (alguns estudos mostram menos nefrotoxicidade)','Infusão estendida (4h) em paciente grave melhora desfecho'],
  ARRAY['Função renal (Cr basal e a cada 48-72h)','Hemograma (plaquetas, eosinófilos, leucograma)','Função hepática','Sintomas GI (C. difficile)','Resposta clínica em 48-72h'],
  'Piperacilina = penicilina antipseudomonas que inibe transpeptidases (PBPs) bloqueando síntese da parede bacteriana → lise. Tazobactam = inibidor IRREVERSÍVEL de beta-lactamases classe A (incluindo TEM, SHV) — protege a piperacilina de hidrólise. Sinergismo expande espectro pra cepas produtoras de beta-lactamase. NÃO cobre ESBL clinicamente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=piperacilina+tazobactam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 64. CEFEPIME
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'cefepime',
  'Cefepime',
  ARRAY['Maxcef', 'Cefepime Genérico'],
  'Cefalosporina de 4ª geração',
  ARRAY['IV', 'IM'],
  $$[{"forma":"frasco-ampola","concentracao":"1 g ou 2 g"}]$$::jsonb,
  $${"indicacoes":[{"para":"PAH/sepse hospitalar","dose":"2 g IV 8/8h","obs":"Cobre Pseudomonas + maioria das gram+ e gram-"},{"para":"neutropenia febril","dose":"2 g IV 8/8h","obs":"Alternativa a pip-tazo"},{"para":"meningite bacteriana (em adulto > 50 ou imunossupr)","dose":"2 g IV 8/8h + ampicilina + vanco","obs":"Boa penetração SNC"},{"para":"ITU complicada/pielonefrite","dose":"2 g IV 12/12h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção grave","dose":"50 mg/kg/dose IV 8/8h (max 2 g)"}]}$$::jsonb,
  $${"obs":"REDUZIR DOSE conforme clearance — risco neurotoxicidade (encefalopatia, convulsão)."}$$::jsonb,
  $$[{"clcr":">60","ajuste":"2 g 8/8h"},{"clcr":"30-60","ajuste":"2 g 12/12h"},{"clcr":"11-29","ajuste":"2 g 24/24h"},{"clcr":"<11","ajuste":"1 g 24/24h"},{"clcr":"hemodiálise","ajuste":"1 g 24/24h + dose pós-sessão"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste hepático"}]$$::jsonb,
  'B',
  'Atravessa placenta; aceitável em gestação se necessário.',
  'Compatível.',
  $$[{"com":"aminoglicosídeos","efeito":"sinergismo + nefrotoxicidade aditiva","manejo":"monitorar"},{"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},{"com":"diuréticos de alça","efeito":"nefrotoxicidade","manejo":"monitorar"}]$$::jsonb,
  ARRAY['hipersensibilidade a cefalosporinas','história de anafilaxia a penicilina (reação cruzada 5-10%)','encefalopatia prévia por cefepime'],
  $$[{"freq":"comum","evento":"diarreia, rash"},{"freq":"comum","evento":"flebite no local IV"},{"freq":"incomum","evento":"convulsão e ENCEFALOPATIA POR CEFEPIME (mioclonia, alteração consciência) — especialmente em IRA com dose não-ajustada"},{"freq":"incomum","evento":"colite por C. difficile"},{"freq":"raro","evento":"anemia hemolítica autoimune"},{"freq":"raro","evento":"agranulocitose"}]$$::jsonb,
  ARRAY['ENCEFALOPATIA é o efeito adverso característico — alta mortalidade se não reconhecida; suspender e dialisar','SEMPRE ajustar dose pela função renal (Cr de base + clearance)','NÃO cobre anaeróbios — adicionar metronidazol em infecção intra-abdominal','NÃO cobre ESBL, MRSA, Enterococcus','Alternativa a pip-tazo em paciente em vancomicina (menos nefrotoxicidade aditiva)'],
  ARRAY['Função renal (basal + cada 48h)','Sinais neurológicos (mioclonia, confusão — pensar encefalopatia se desenvolver)','EEG se alteração mental inexplicada em uso','Hemograma'],
  'Cefalosporina de 4ª geração — beta-lactâmico que inibe PBPs (penicillin-binding proteins) bloqueando transpeptidação da parede celular bacteriana → lise osmótica. Penetra MELHOR a membrana externa de gram-negativas (incluindo Pseudomonas) que cefalosporinas anteriores. RESISTÊNCIA a beta-lactamases AmpC cromossomais. Convulsão por antagonismo do receptor GABA-A em concentrações altas no SNC.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cefepime',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 65. MEROPENEM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'meropenem',
  'Meropenem',
  ARRAY['Meronem', 'Meropenem Genérico'],
  'Carbapenêmico — antibiótico de amplo espectro',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"500 mg ou 1 g"}]$$::jsonb,
  $${"indicacoes":[{"para":"sepse grave/choque com risco de ESBL","dose":"1 g IV 8/8h","obs":"PADRÃO em ESBL (estudo MERINO)"},{"para":"meningite bacteriana","dose":"2 g IV 8/8h","obs":"Penetra BHE; preferir em sepse SNC com gram- resistente"},{"para":"infecção intra-abdominal complicada","dose":"1 g IV 8/8h","obs":"Cobre anaeróbios"},{"para":"pneumonia hospitalar / VAP grave","dose":"1-2 g IV 8/8h"},{"para":"infusão estendida em paciente grave","dose":"1-2 g IV em 3h a cada 8h","obs":"PK/PD: tempo > MIC; útil em MIC alta"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção grave","dose":"20 mg/kg/dose IV 8/8h (max 1 g; 2 g em meningite)"}]}$$::jsonb,
  $${"obs":"Reduzir dose conforme clearance. Convulsão é mais frequente em > 65a."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"1 g 8/8h"},{"clcr":"25-50","ajuste":"1 g 12/12h"},{"clcr":"10-25","ajuste":"500 mg 12/12h"},{"clcr":"<10","ajuste":"500 mg 24/24h"},{"clcr":"hemodiálise","ajuste":"500 mg 24/24h + dose pós-sessão"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Atravessa placenta; aceitável.',
  'Compatível.',
  $$[{"com":"valproato","efeito":"REDUZ DRASTICAMENTE nível valproato (pode precipitar status epilepticus em epiléptico)","manejo":"EVITAR ASSOCIAÇÃO; monitor nível ou trocar"},{"com":"probenecida","efeito":"aumenta meropenem","manejo":"sem necessidade rotineira"},{"com":"varfarina","efeito":"potencializa","manejo":"monitor INR"}]$$::jsonb,
  ARRAY['hipersensibilidade a carbapenêmicos','anafilaxia prévia a beta-lactâmico (cautela — reação cruzada baixa, ~1%)'],
  $$[{"freq":"comum","evento":"diarreia, náusea"},{"freq":"comum","evento":"flebite, rash"},{"freq":"comum","evento":"trombocitose"},{"freq":"incomum","evento":"convulsão (menos que imipenem; mais em IRA + dose alta + > 65a)"},{"freq":"incomum","evento":"colite por C. difficile"},{"freq":"raro","evento":"agranulocitose, anemia hemolítica"}]$$::jsonb,
  ARRAY['ANTIBIÓTICO DE RESERVA — usar APENAS quando ESBL é provável ou comprovado, ou em sepse com choque sem foco identificado','Cobre ESBL, AmpC desreprimido, anaeróbios, MAIORIA dos gram- (incluindo Pseudomonas)','NÃO cobre MRSA, Enterococcus faecium, Stenotrophomonas, MBL (KPC=variável; Acineto MRD=resistente)','Em uso de VALPROATO: reduz nível em 60-80% — descontrola convulsão. ALERTAR neuro','Convulsão menor risco que imipenem; raro em dose ajustada'],
  ARRAY['Função renal (basal + a cada 48h)','Hemograma (plaquetas, leucograma)','Sinais neuro em > 65a','Sintomas GI (C. difficile)','Resposta clínica + culturas em 48-72h pra descalonamento'],
  'Carbapenêmico — beta-lactâmico que inibe PBPs (especialmente PBP-2 e PBP-3) → bloqueia parede celular → lise. ESTABILIDADE a maioria das beta-lactamases (incluindo ESBL, AmpC); apenas carbapenemases (KPC, MBL, OXA-48) hidrolisam. Penetra bem todos compartimentos incluindo SNC. Excelente espectro pra gram-, gram+ e anaeróbios — daí ser droga de RESERVA.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=meropenem',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 66. ERTAPENEM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'ertapenem',
  'Ertapenem',
  ARRAY['Invanz', 'Ertapenem Genérico'],
  'Carbapenêmico de espectro estendido (sem Pseudomonas)',
  ARRAY['IV', 'IM'],
  $$[{"forma":"frasco-ampola","concentracao":"1 g"}]$$::jsonb,
  $${"indicacoes":[{"para":"infecção intra-abdominal complicada (sem fatores de risco Pseudomonas)","dose":"1 g IV 24/24h","obs":"Conveniência de dose 1x/dia em ambulatório"},{"para":"ITU complicada / pielonefrite (ESBL ambulatorial)","dose":"1 g IV 24/24h"},{"para":"pneumonia comunitária com risco ESBL","dose":"1 g IV 24/24h"},{"para":"infecção pé diabético","dose":"1 g IV 24/24h × 7-14d"},{"para":"profilaxia cirúrgica colorretal (alternativa)","dose":"1 g IV 1h pré-incisão"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção","dose":"15 mg/kg 12/12h (max 1 g)"}]}$$::jsonb,
  $${"obs":"Sem ajuste rotineiro; menor risco de convulsão que imipenem."}$$::jsonb,
  $$[{"clcr":">30","ajuste":"1 g 24/24h"},{"clcr":"<30","ajuste":"500 mg 24/24h"},{"clcr":"hemodiálise","ajuste":"500 mg 24/24h + dose suplementar pós-sessão se sessão < 6h da última dose"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Atravessa placenta; aceitável.',
  'Compatível.',
  $$[{"com":"valproato","efeito":"REDUZ NÍVEL valproato","manejo":"evitar associação"},{"com":"probenecida","efeito":"aumenta ertapenem","manejo":"sem ajuste necessário"}]$$::jsonb,
  ARRAY['hipersensibilidade a carbapenêmicos','anafilaxia prévia a beta-lactâmicos'],
  $$[{"freq":"comum","evento":"diarreia, náusea"},{"freq":"comum","evento":"reação no local IV/IM"},{"freq":"incomum","evento":"convulsão (menor risco que imipenem)"},{"freq":"incomum","evento":"colite C. difficile"},{"freq":"raro","evento":"alteração mental em idoso"}]$$::jsonb,
  ARRAY['Conveniência: DOSE ÚNICA DIÁRIA — útil em terapia OPAT (outpatient antimicrobial therapy)','NÃO COBRE Pseudomonas aeruginosa, Acinetobacter, Enterococcus — diferente do meropenem/imipenem','Cobre ESBL, anaeróbios, gram-positivos comuns (não MRSA)','Diluir IM com lidocaína 1% (sem epi) por dor — não fazer IV com lidocaína'],
  ARRAY['Função renal','Hemograma','Sintomas GI','Resposta clínica em 48-72h'],
  'Carbapenêmico — mesmo mecanismo que meropenem (inibe PBPs, lise osmótica). ESPECTRO MENOR que meropenem/imipenem: PERDE Pseudomonas, Acinetobacter e Enterococcus (modificação química o tornou mais ligado a proteínas plasmáticas, prolongando meia-vida pra 1x/dia mas reduzindo penetração em alguns gram-). Ideal em infecção comunitária com risco ESBL.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ertapenem',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 67. LINEZOLIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'linezolida',
  'Linezolida',
  ARRAY['Zyvox', 'Zyvoxam', 'Linezolida Genérico'],
  'Oxazolidinona — anti-MRSA/VRE',
  ARRAY['IV', 'VO (biodisp 100%)'],
  $$[{"forma":"comprimido","concentracao":"600 mg"},{"forma":"bolsa IV","concentracao":"600 mg/300 mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"pneumonia por MRSA","dose":"600 mg IV/VO 12/12h × 10-14d","obs":"Alternativa a vancomicina; melhor penetração pulmonar"},{"para":"infecção pele/partes moles MRSA","dose":"600 mg IV/VO 12/12h × 10-14d"},{"para":"infecção por VRE (Enterococcus faecium resistente a vanco)","dose":"600 mg IV/VO 12/12h"},{"para":"tuberculose XDR (off-label)","dose":"600 mg/dia VO","obs":"Esquema individualizado"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção MRSA","dose":"10 mg/kg IV/VO 8/8h (max 600 mg)"}]}$$::jsonb,
  $${"obs":"Sem ajuste por idade. Atenção a interações com ISRS."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia leve-moderada","ajuste":"sem ajuste"},{"contexto":"hepatopatia grave","ajuste":"considerar"}]$$::jsonb,
  'C',
  'Sem dados; usar se necessário.',
  'Sem dados; preferir alternativa.',
  $$[{"com":"ISRS, IRSN, tricíclicos","efeito":"SÍNDROME SEROTONINÉRGICA (linezolida é IMAO fraco)","manejo":"suspender ISRS 2 sem antes ou usar alternativa antibiótica"},{"com":"simpaticomiméticos (pseudoefedrina, vasopressores)","efeito":"crise hipertensiva","manejo":"reduzir dose vasopressor"},{"com":"alimentos ricos em tiramina","efeito":"crise hipertensiva (efeito IMAO)","manejo":"orientar (queijos curados, vinho tinto)"},{"com":"rifampicina","efeito":"reduz nível linezolida","manejo":"monitorar resposta"}]$$::jsonb,
  ARRAY['uso atual de IMAO ou suspensão < 2 semanas','feocromocitoma','tireotoxicose não-tratada (HAS de difícil controle)'],
  $$[{"freq":"comum","evento":"trombocitopenia (uso > 14 dias) — monitorar plaquetas semanal"},{"freq":"comum","evento":"diarreia, náusea"},{"freq":"incomum","evento":"anemia, leucopenia (em uso prolongado)"},{"freq":"incomum","evento":"neuropatia periférica (uso > 4 semanas — pode ser IRREVERSÍVEL)"},{"freq":"raro","evento":"neuropatia óptica (revertível se suspender precoce)"},{"freq":"raro","evento":"acidose lática (uso prolongado — disfunção mitocondrial)"}]$$::jsonb,
  ARRAY['Cobertura ÚNICA: VRE (Enterococcus faecium vanco-resistente), MRSA, S. aureus VISA/VRSA — drogas de reserva','Biodisponibilidade VO 100% — switch IV→VO ideal pra alta hospitalar','LIMITAR USO a < 28 dias se possível (toxicidade mitocondrial e neuropática)','Trombocitopenia em ~10% após 2 semanas — monitor obrigatório','TRIPLO IMAO: cuidado com alimentos tiramínicos e ISRS'],
  ARRAY['Hemograma com plaquetas (basal + semanal)','Função visual em uso > 4 semanas','Sintomas neuropatia (parestesia, fraqueza)','Lactato + gaso se uso prolongado','PA (HAS pode aparecer)'],
  'Inibidor da síntese proteica bacteriana via ligação à subunidade 50S do ribossomo (sítio único — sem resistência cruzada com outras classes). Bloqueia formação do complexo de iniciação 70S. BACTERIOSTÁTICO. Inibidor REVERSÍVEL e fraco da MAO (monoamina oxidase) — daí as interações com serotoninérgicos e simpaticomiméticos.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=linezolida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 68. DAPTOMICINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'daptomicina',
  'Daptomicina',
  ARRAY['Cubicin', 'Daptomicina Genérico'],
  'Lipopeptídeo — anti-MRSA/VRE',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"350 mg ou 500 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"bacteremia por S. aureus (incluindo MRSA)","dose":"6-10 mg/kg IV 24/24h","obs":"Doses altas em endocardite/bacteremia complicada"},{"para":"endocardite direita (S. aureus)","dose":"8-10 mg/kg IV 24/24h × 4-6 semanas"},{"para":"infecção pele/partes moles complicada","dose":"4-6 mg/kg IV 24/24h × 7-14d"},{"para":"infecção por VRE","dose":"8-12 mg/kg IV 24/24h"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção MRSA grave","dose":"5-12 mg/kg IV 24/24h (idade-dependente)"}]}$$::jsonb,
  $${"obs":"Sem ajuste rotineiro; monitorar CK."}$$::jsonb,
  $$[{"clcr":">30","ajuste":"dose habitual 24/24h"},{"clcr":"<30","ajuste":"mesma dose, intervalo 48/48h"},{"clcr":"hemodiálise","ajuste":"6 mg/kg pós-sessão (3x/sem)"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Atravessa placenta; sem dados firmes.',
  'Sem dados.',
  $$[{"com":"estatinas","efeito":"RABDOMIÓLISE ADITIVA (suspender estatina durante daptomicina)","manejo":"suspender estatina"},{"com":"varfarina","efeito":"sem interação","manejo":"-"},{"com":"tobramicina","efeito":"aumenta níveis daptomicina","manejo":"monitorar CK"}]$$::jsonb,
  ARRAY['hipersensibilidade a daptomicina'],
  $$[{"freq":"comum","evento":"elevação de CK assintomática (até 2,5%)"},{"freq":"comum","evento":"diarreia, náusea"},{"freq":"incomum","evento":"MIOPATIA/RABDOMIÓLISE — monitorar CK semanal"},{"freq":"incomum","evento":"pneumonia eosinofílica (uso > 2 semanas — RARA mas grave)"},{"freq":"raro","evento":"neuropatia periférica"},{"freq":"raro","evento":"insuficiência renal aguda"}]$$::jsonb,
  ARRAY['NÃO USAR EM PNEUMONIA — surfactante pulmonar INATIVA daptomicina (apenas drogas inhibidoras de gram+ úteis em pulmão)','Suspender estatinas DURANTE tratamento (rabdomiólise aditiva)','CK semanal — sintomas musculares + CK > 1.000 = suspender','Cobertura: MRSA, MSSA, VRE, Streptococcus — primeira escolha em bacteremia/endocardite por MRSA quando vanco MIC > 2','Pneumonia eosinofílica é raríssima mas pode ser fatal — febre + infiltrados + eosinofilia BAL = suspender'],
  ARRAY['CK basal + semanal','Função renal a cada 48-72h','Hemograma','Em uso > 2 sem: RX tórax + eosinófilos se sintomas respiratórios','Sintomas musculares (mialgia, fraqueza)'],
  'Lipopeptídeo cíclico — em presença de cálcio, insere sua cauda lipofílica na membrana de bactérias gram-positivas formando poros que despolarizam a membrana → vazamento de íons → morte rápida (BACTERICIDA concentração-dependente). Mecanismo único = sem resistência cruzada com outras classes. Inativa em pulmão por ligação ao surfactante (fosfatidilglicerol).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=daptomicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 69. POLIMIXINA B
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'polimixina-b',
  'Polimixina B',
  ARRAY['Polimixina B'],
  'Polimixina — anti-MDR gram-negativo',
  ARRAY['IV', 'tópica', 'inalatória'],
  $$[{"forma":"frasco-ampola","concentracao":"500.000 UI"}]$$::jsonb,
  $${"indicacoes":[{"para":"infecção por gram-negativo MDR/PDR (KPC, Acinetobacter, Pseudomonas resistentes)","dose":"15.000-25.000 UI/kg/dia IV dividido 12/12h","obs":"Dose ataque 25.000 UI/kg recomendada (estudos PK)"},{"para":"meningite por gram- MDR","dose":"intratecal/intraventricular 50.000 UI/dia","obs":"Combinada com IV"},{"para":"VAP por gram- MDR (adjuvante)","dose":"inalatória 1 milhão UI 2x/dia"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção MDR","dose":"40.000 UI/kg/dia IV dividido 12/12h"}]}$$::jsonb,
  $${"obs":"Maior risco de nefrotoxicidade. Monitor função renal de perto."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"NÃO REDUZIR DOSE em IRA (efeito não dose-dependente da nefrotoxicidade — concentração serica precisa ser mantida pra eficácia)"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'C',
  'Sem dados; usar se MDR sem alternativa.',
  'Evitar.',
  $$[{"com":"aminoglicosídeos","efeito":"NEFROTOXICIDADE + neurotoxicidade aditiva","manejo":"evitar associação se possível"},{"com":"vancomicina","efeito":"nefrotoxicidade aditiva","manejo":"monitor de perto"},{"com":"bloqueadores neuromusculares","efeito":"prolonga bloqueio","manejo":"monitorar TOF"},{"com":"AINEs","efeito":"nefrotoxicidade aditiva","manejo":"evitar"}]$$::jsonb,
  ARRAY['hipersensibilidade a polimixinas','miastenia gravis (relativo — bloqueio neuromuscular)'],
  $$[{"freq":"muito comum","evento":"NEFROTOXICIDADE (até 50%) — geralmente reversível"},{"freq":"comum","evento":"NEUROTOXICIDADE — parestesia, ataxia, bloqueio neuromuscular"},{"freq":"comum","evento":"hiperpigmentação cutânea"},{"freq":"incomum","evento":"reação anafilactoide (libera histamina)"},{"freq":"raro","evento":"apneia em infusão rápida (bloqueio neuromuscular)"}]$$::jsonb,
  ARRAY['DROGA DE ÚLTIMO RECURSO — usar SOMENTE em gram- MDR/PDR sem alternativa (KPC, NDM, OXA-48, Acinetobacter MDR)','Polimixina B vs Colistina (polimixina E): polimixina B é PRÓ-DROGA-ATIVA (não precisa hidrólise), níveis previsíveis; colistina precisa converter (níveis variáveis)','SEMPRE em terapia COMBINADA (com meropenem em alta dose, tigeciclina, ou aminoglicosídeo) — monoterapia tem alta falha','Nefrotoxicidade reversível na maioria dos casos — não suspender automaticamente se eficaz','Inalatório como adjuvante em VAP gram- MDR'],
  ARRAY['Função renal DIÁRIA (Cr seriado)','Hemograma','Sinais neurológicos (parestesia, fraqueza)','PA, FC','Sintomas respiratórios em inalação'],
  'Antibiótico catiônico que se liga ao LIPÍDIO A do LPS na membrana externa de bactérias gram-negativas → desestabiliza/desorganiza a membrana → permeabilidade aumentada e morte celular (BACTERICIDA concentração-dependente). Mecanismo único explica eficácia em CEPAS resistentes a TODAS as outras classes (MDR, PDR). Não atravessa BHE — daí necessidade de via intratecal em meningite.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=polimixina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 70. TIGECICLINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'tigeciclina',
  'Tigeciclina',
  ARRAY['Tygacil', 'Tigeciclina Genérico'],
  'Glicilciclina — anti-MDR de amplo espectro',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"50 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"infecção pele/partes moles complicada (MDR)","dose":"100 mg IV ataque + 50 mg 12/12h"},{"para":"infecção intra-abdominal complicada","dose":"100 mg IV ataque + 50 mg 12/12h"},{"para":"adjuvante em gram- MDR (KPC, Acinetobacter)","dose":"100-200 mg ataque + 50-100 mg 12/12h","obs":"DOSE ALTA em pneumonia/bacteremia (estudos pós-marketing mostram melhor desfecho)"}]}$$::jsonb,
  $${"indicacoes":[{"para":">8 anos","dose":"1,2 mg/kg IV (max 50 mg) 12/12h"}]}$$::jsonb,
  $${"obs":"Sem ajuste rotineiro."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"Child-Pugh A-B","ajuste":"sem ajuste"},{"contexto":"Child-Pugh C","ajuste":"reduzir manutenção 50% (25 mg 12/12h)"}]$$::jsonb,
  'D',
  'Atravessa placenta; descoloração dentária fetal (efeito tetraciclina). EVITAR.',
  'Evitar.',
  $$[{"com":"varfarina","efeito":"prolonga TP","manejo":"monitor INR"},{"com":"contraceptivos","efeito":"reduz eficácia","manejo":"orientar barreira"}]$$::jsonb,
  ARRAY['hipersensibilidade a tetraciclinas','crianças < 8 anos (descoloração dentária)','gestação','lactação'],
  $$[{"freq":"muito comum","evento":"NÁUSEA E VÔMITO (até 30%) — limitante"},{"freq":"comum","evento":"diarreia, dor abdominal"},{"freq":"comum","evento":"elevação enzimas hepáticas"},{"freq":"incomum","evento":"pancreatite"},{"freq":"raro","evento":"AUMENTO MORTALIDADE em uso off-label em VAP/bacteremia (FDA Black Box)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: aumento mortalidade em pneumonia hospitalar/bacteremia em monoterapia — USAR DOSE ALTA + TERAPIA COMBINADA','Cobertura: MRSA, VRE, MAIORIA dos gram-negativos (incluindo ESBL, KPC, Acinetobacter), anaeróbios. NÃO COBRE Pseudomonas e Proteus','Atinge baixos níveis SÉRICOS (alta distribuição tecidual) — não usar em bacteremia em monoterapia','Náusea/vômito é o efeito limitante — pré-medicar com antiemético','Em pneumonia/bacteremia MDR usar DOSE ALTA: 200 mg ataque + 100 mg 12/12h'],
  ARRAY['Função hepática (AST/ALT, BT)','Lipase/amilase em sintomas abdominais','Sintomas GI','TP/INR se varfarina','Resposta clínica + culturas'],
  'Glicilciclina (derivada da tetraciclina) — liga subunidade 30S do ribossomo bacteriano bloqueando ligação do aminoacil-tRNA → inibe síntese proteica (BACTERIOSTÁTICA). Modificação química (substituinte glicilamida) supera mecanismos de resistência tradicionais a tetraciclinas (efflux pumps Tet e proteção ribossomal Tet). Amplo espectro mas baixos níveis séricos.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=tigeciclina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
