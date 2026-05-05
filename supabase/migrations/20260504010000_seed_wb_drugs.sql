-- Phase 2.2: seed das 20 drogas mais prescritas no Brasil (~80% das
-- prescricoes em ambulatorio segundo PCDT/PNAUM). Conteudo factual
-- sintetizado de bulas ANVISA + diretrizes brasileiras (SBC, SBD,
-- SBPT, SBI, Febrasgo) + Brazilian Med Letter / Goldman-Cecil.
-- Fontes citadas em bula_fonte_url. Re-seedavel via ON CONFLICT.

-- ============================================================
-- 1. PARACETAMOL — analgesico/antitermico
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'paracetamol',
  'Paracetamol',
  ARRAY['Tylenol', 'Dôrico', 'Paracetamol Genérico'],
  'Analgésico não-opioide / antipirético',
  ARRAY['VO', 'IV', 'retal'],
  $$[
    {"forma":"comprimido","concentracao":"500 mg, 750 mg"},
    {"forma":"gotas","concentracao":"200 mg/mL"},
    {"forma":"suspensão oral","concentracao":"32 mg/mL"},
    {"forma":"ampola IV","concentracao":"10 mg/mL (1g/100mL)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor leve a moderada / febre","dose":"500–1000 mg VO","frequencia":"4–6/4h","max_dia":"3 g/dia (reduzido de 4g pelo FDA em 2011 por hepatotoxicidade)","duracao":"até 5 dias sem reavaliação"}
    ],
    "iv":{"dose":"1 g IV em 15 min","frequencia":"6/6h","max":"4 g/dia, peso ≥ 50 kg"}
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor / febre","dose":"10–15 mg/kg/dose VO","frequencia":"4–6/6h","max":"75 mg/kg/dia ou 5 doses/24h"}
    ],
    "atencao":"NÃO usar em < 3 meses sem avaliação médica."
  }$$::jsonb,
  $${
    "obs":"Mesma dose adulta. Monitorar hepatotoxicidade em uso prolongado, etilistas e desnutridos.",
    "max_dia":"≤ 2,6 g/dia em ≥ 65 anos com risco hepático"
  }$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"10–50","ajuste":"intervalo a cada 6h"},
    {"clcr":"<10","ajuste":"intervalo a cada 8h"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia leve a moderada","ajuste":"max 2 g/dia"},
    {"contexto":"hepatopatia grave / Child-Pugh C","ajuste":"contraindicado em uso regular"}
  ]$$::jsonb,
  'B',
  'Seguro em todos os trimestres. Analgésico de primeira escolha na gestação.',
  'Compatível. Excretado em quantidade mínima no leite.',
  $$[
    {"com":"varfarina","efeito":"potencializa anticoagulação se uso ≥ 2 semanas em dose plena","manejo":"monitorar INR; evitar uso prolongado"},
    {"com":"álcool","efeito":"hepatotoxicidade aditiva","manejo":"reduzir dose máx para 2 g/dia em etilistas crônicos"},
    {"com":"isoniazida","efeito":"hepatotoxicidade aditiva","manejo":"monitorar função hepática"},
    {"com":"fenitoína / fenobarbital / carbamazepina","efeito":"indutores de CYP — aumentam formação de NAPQI tóxico","manejo":"reduzir dose; monitorar TGO/TGP"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade ao paracetamol', 'hepatopatia grave (Child-Pugh C)'],
  $$[
    {"freq":"raro","evento":"hepatotoxicidade dose-dependente (NAPQI)"},
    {"freq":"raro","evento":"reação cutânea grave (SSJ/NET) — FDA 2013 alert"},
    {"freq":"raro","evento":"trombocitopenia, agranulocitose"}
  ]$$::jsonb,
  ARRAY['Limite máximo: 3 g/dia em adulto saudável; 2 g/dia em hepatopatas/etilistas','Intoxicação > 7,5 g em 24h adulto: avaliar N-acetilcisteína','Verificar combinações fixas (ex: paracetamol+codeína) para evitar duplicação'],
  ARRAY['TGO/TGP em uso prolongado >7 dias','INR se em varfarina concomitante'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=paracetamol',
  true
) ON CONFLICT (slug) DO UPDATE SET
  apresentacoes = EXCLUDED.apresentacoes,
  dose_adulto = EXCLUDED.dose_adulto,
  dose_pediatrica = EXCLUDED.dose_pediatrica,
  efeitos_adversos = EXCLUDED.efeitos_adversos,
  updated_at = now();

-- ============================================================
-- 2. DIPIRONA — analgésico/antitérmico
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'dipirona',
  'Dipirona sódica (metamizol)',
  ARRAY['Novalgina', 'Anador', 'Magnopyrol'],
  'Analgésico não-opioide / antipirético',
  ARRAY['VO', 'IV', 'IM', 'retal'],
  $$[
    {"forma":"comprimido","concentracao":"500 mg, 1 g"},
    {"forma":"gotas","concentracao":"500 mg/mL"},
    {"forma":"solução oral","concentracao":"50 mg/mL"},
    {"forma":"ampola","concentracao":"500 mg/mL (2 mL = 1 g; 5 mL = 2,5 g)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor moderada a intensa / febre","dose":"500–1000 mg","frequencia":"6/6h","via":"VO ou IV diluído em SF 100 mL"},
      {"para":"cólica renal/biliar","dose":"2 g IV lento (10 min)","obs":"diluir em 100 mL SF; bolus rápido pode causar hipotensão"}
    ],
    "max_dia":"4 g/dia"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor/febre","dose":"15–25 mg/kg/dose VO ou IV","frequencia":"6/6h","max":"4 doses/dia"}
    ],
    "atencao":"Evitar em < 3 meses ou peso < 5 kg (risco agranulocitose)."
  }$$::jsonb,
  $${
    "obs":"Sem ajuste rotineiro. Atenção à hipotensão IV em desidratados."
  }$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"reduzir dose ou aumentar intervalo"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"contraindicada"}
  ]$$::jsonb,
  'C',
  'Evitar 1º e 3º trimestres (risco fechamento ductal e hemorragia perinatal). 2º trimestre: usar com cautela.',
  'Evitar — passa para o leite e há relato de cianose em neonato.',
  $$[
    {"com":"varfarina","efeito":"potencializa efeito anticoagulante","manejo":"monitorar INR"},
    {"com":"ciclosporina","efeito":"reduz nível sérico","manejo":"monitorar nível"},
    {"com":"metotrexato","efeito":"aumenta hematotoxicidade","manejo":"evitar associação"},
    {"com":"clorpromazina","efeito":"hipotermia grave","manejo":"evitar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a pirazolonas','agranulocitose prévia','porfiria intermitente','deficiência G6PD','3º trimestre gestação','recém-nascidos < 3 meses'],
  $$[
    {"freq":"raro (1:1500–1:30000)","evento":"agranulocitose / neutropenia (fatal em ~10% dos casos)"},
    {"freq":"raro","evento":"reação anafilactoide / choque hipotensivo (IV rápido)"},
    {"freq":"comum","evento":"hipotensão dose-dependente (IV)"},
    {"freq":"raro","evento":"síndrome de Stevens-Johnson / NET"}
  ]$$::jsonb,
  ARRAY['Diluir e infundir IV em ≥ 10 minutos para evitar hipotensão','Suspender e investigar se febre + odinofagia inexplicada (risco agranulocitose)','Proibida em vários países (EUA, Reino Unido, Suécia) por agranulocitose; permitida no Brasil/Alemanha/Espanha'],
  ARRAY['Hemograma se uso > 7 dias','PA durante infusão IV'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dipirona',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  efeitos_adversos = EXCLUDED.efeitos_adversos,
  updated_at = now();

-- ============================================================
-- 3. IBUPROFENO — AINE
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'ibuprofeno',
  'Ibuprofeno',
  ARRAY['Advil', 'Alivium', 'Buscofem', 'Motrin'],
  'AINE não-seletivo (inibidor COX-1/COX-2)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"200 mg, 300 mg, 400 mg, 600 mg"},
    {"forma":"suspensão","concentracao":"50 mg/mL, 100 mg/5mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor leve a moderada","dose":"400 mg VO","frequencia":"6–8/6h","max_dia":"2,4 g (uso curto)"},
      {"para":"dismenorreia / cefaleia tensional","dose":"400–600 mg VO","frequencia":"6/6h"},
      {"para":"artrite reumatoide / OA","dose":"600 mg VO","frequencia":"8/8h ou 6/6h","max_dia":"3,2 g (acompanhamento)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"febre / dor","dose":"5–10 mg/kg/dose VO","frequencia":"6/6 ou 8/8h","max":"40 mg/kg/dia"}
    ],
    "atencao":"Não usar em < 6 meses; cautela em desidratação."
  }$$::jsonb,
  $${
    "obs":"Evitar em ≥ 75 anos; se necessário, usar menor dose efetiva por menor tempo (alto risco GI/renal/CV)."
  }$$::jsonb,
  $$[
    {"clcr":">60","ajuste":"sem ajuste"},
    {"clcr":"30–60","ajuste":"cautela; reduzir dose"},
    {"clcr":"<30","ajuste":"contraindicado"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia ativa","ajuste":"contraindicado"}
  ]$$::jsonb,
  'C/D',
  'C nos 1º/2º trimestres. D no 3º trimestre (fechamento prematuro do ducto arterioso, oligoidrâmnio). Evitar a partir de 30 semanas.',
  'Compatível em curto prazo (concentração mínima no leite).',
  $$[
    {"com":"AAS baixa dose","efeito":"reduz cardioproteção do AAS","manejo":"tomar AAS 2h antes ou 4h depois"},
    {"com":"varfarina / DOACs","efeito":"sangramento aumentado","manejo":"evitar associação"},
    {"com":"IECAs / BRAs / diuréticos","efeito":"reduz efeito anti-hipertensivo + risco IRA","manejo":"monitorar PA e creatinina"},
    {"com":"lítio / metotrexato","efeito":"aumenta nível sérico","manejo":"monitorar níveis"},
    {"com":"corticoides","efeito":"risco GI aditivo","manejo":"associar IBP profilático"}
  ]$$::jsonb,
  ARRAY['úlcera péptica ativa','sangramento GI prévio com AINE','asma induzida por AAS (tríade de Samter)','IC grau IV','DRC clcr < 30','3º trimestre gestação','pós-operatório de revascularização miocárdica'],
  $$[
    {"freq":"comum","evento":"dispepsia, gastrite"},
    {"freq":"comum","evento":"retenção hídrica / edema"},
    {"freq":"incomum","evento":"úlcera péptica / hemorragia digestiva"},
    {"freq":"incomum","evento":"injúria renal aguda"},
    {"freq":"raro","evento":"infarto do miocárdio / AVC (uso prolongado em alto risco CV)"}
  ]$$::jsonb,
  ARRAY['BLACK BOX FDA: aumento de eventos CV; usar menor dose pelo menor tempo','Risco GI proporcional a dose, idade e duração','Em DRC: AINE pode precipitar IRA — preferir paracetamol/dipirona'],
  ARRAY['PA, edema, creatinina, hemograma em uso > 4 semanas'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ibuprofeno',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  contraindicacoes = EXCLUDED.contraindicacoes,
  updated_at = now();

-- ============================================================
-- 4. ÁCIDO ACETILSALICÍLICO (AAS)
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'aas',
  'Ácido acetilsalicílico (AAS)',
  ARRAY['Aspirina', 'AAS', 'Ácido acetilsalicílico', 'Bufferin'],
  'Antiplaquetário / AINE em alta dose',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"100 mg (cardio), 500 mg, 100 mg tamponado"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"prevenção secundária CV (DAC, AVC, DAOP)","dose":"100 mg VO","frequencia":"1x/dia"},
      {"para":"SCA aguda — ataque","dose":"160–325 mg VO mastigado","obs":"dose única; manter 100 mg/dia"},
      {"para":"prevenção primária CV","dose":"100 mg VO","frequencia":"1x/dia","obs":"NÃO indicado rotineiramente em > 70 anos (USPSTF 2022); discutir risco-benefício individualizado"},
      {"para":"dor / febre (alta dose)","dose":"500–1000 mg","frequencia":"6/6h","max_dia":"4 g"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"doença de Kawasaki","dose":"30–50 mg/kg/dia (fase aguda) → 3–5 mg/kg/dia (manutenção)","obs":"uso especializado"}
    ],
    "atencao":"PROIBIDO em criança/adolescente febril (< 19 anos) por risco de síndrome de Reye, exceto Kawasaki."
  }$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste em dose antiplaquetária"},
    {"clcr":"<30","ajuste":"evitar dose anti-inflamatória"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"contraindicado"}
  ]$$::jsonb,
  'C/D',
  'D no 3º trimestre (fechamento ductal); baixa dose (100 mg) usada em pré-eclâmpsia a partir de 12–16 semanas.',
  'Compatível em dose baixa.',
  $$[
    {"com":"varfarina / DOACs / heparina","efeito":"sangramento aditivo","manejo":"avaliar indicação dupla; usar IBP"},
    {"com":"ibuprofeno","efeito":"reduz cardioproteção","manejo":"AAS 2h antes do ibuprofeno"},
    {"com":"IECA","efeito":"pode reduzir efeito hipotensor (alta dose)","manejo":"monitorar PA"},
    {"com":"metotrexato","efeito":"aumenta toxicidade","manejo":"evitar dose anti-inflamatória"}
  ]$$::jsonb,
  ARRAY['úlcera péptica ativa','distúrbio hemorrágico','asma sensível a AAS','hipersensibilidade','idade < 19 anos com viral/febre (Reye)','30 dias antes de cirurgia eletiva (avaliar suspensão 7 dias)'],
  $$[
    {"freq":"comum","evento":"dispepsia, sangramento GI subclínico"},
    {"freq":"incomum","evento":"hemorragia digestiva / úlcera"},
    {"freq":"incomum","evento":"sangramento intracraniano (especialmente em idoso)"},
    {"freq":"raro","evento":"síndrome de Reye em criança"},
    {"freq":"raro","evento":"broncoespasmo (asma AAS-sensível)"}
  ]$$::jsonb,
  ARRAY['Pré-op: suspender 7–10 dias se cirurgia de alto risco hemorrágico','Manter no perioperatório se DAC com stent recente (discutir com cirurgia)','Associar IBP em > 60 anos ou risco GI'],
  ARRAY['Hb/Ht periódico se sangramento ou em idoso','PA em prevenção primária'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=acido+acetilsalicilico',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  alertas_seguranca = EXCLUDED.alertas_seguranca,
  updated_at = now();

-- ============================================================
-- 5. OMEPRAZOL — IBP
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'omeprazol',
  'Omeprazol',
  ARRAY['Losec', 'Peprazol', 'Omeprazol Genérico', 'Gaspery'],
  'Inibidor da bomba de prótons (IBP)',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"cápsula","concentracao":"10 mg, 20 mg, 40 mg"},
    {"forma":"frasco-ampola IV","concentracao":"40 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DRGE","dose":"20 mg VO 1x/dia","frequencia":"30 min antes do café","duracao":"4–8 semanas"},
      {"para":"esofagite erosiva","dose":"40 mg VO 1x/dia","duracao":"8 semanas"},
      {"para":"úlcera duodenal","dose":"20 mg VO 1x/dia","duracao":"4 semanas"},
      {"para":"erradicação H. pylori","dose":"20 mg 12/12h + amoxi 1g 12/12h + claritro 500 mg 12/12h","duracao":"14 dias (terapia tripla CL: usar bismuto se região alta resistência)"},
      {"para":"profilaxia úlcera de estresse em UTI","dose":"40 mg IV 1x/dia","obs":"considerar somente se: VM > 48h, coagulopatia, queimadura grave, TCE, sepse com choque"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DRGE / esofagite","dose":"0,7–3,3 mg/kg/dia VO","max":"40 mg/dia"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"reduzir para 10–20 mg/dia"}
  ]$$::jsonb,
  'C',
  'Risco baixo. Usar se benefício justificar (ex: DRGE refratária na gestação).',
  'Compatível.',
  $$[
    {"com":"clopidogrel","efeito":"reduz ativação (CYP2C19) — efeito clínico controverso","manejo":"preferir pantoprazol em paciente cardiológico"},
    {"com":"varfarina","efeito":"potencializa efeito","manejo":"monitorar INR"},
    {"com":"metotrexato (alta dose)","efeito":"aumenta toxicidade","manejo":"suspender 1 semana antes do MTX em ciclo oncológico"},
    {"com":"levotiroxina","efeito":"reduz absorção","manejo":"separar 4h"},
    {"com":"itraconazol / cetoconazol","efeito":"reduz absorção (precisa pH ácido)","manejo":"trocar antifúngico ou alimentar com refrigerante cola"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a IBP'],
  $$[
    {"freq":"comum","evento":"cefaleia, diarreia, náusea"},
    {"freq":"incomum (uso > 1 ano)","evento":"hipomagnesemia, deficiência B12, fratura osteoporótica"},
    {"freq":"raro","evento":"nefrite intersticial aguda"},
    {"freq":"incomum","evento":"infecção C. difficile / pneumonia adquirida"}
  ]$$::jsonb,
  ARRAY['Reavaliar indicação a cada 6–12 meses; uso crônico injustificado é frequente','Uso > 1 ano: dosar Mg, B12 anual','Não suspender abruptamente após uso prolongado (rebote ácido)'],
  ARRAY['Magnésio sérico anual em uso > 1 ano','B12 anual em uso > 2 anos'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=omeprazol',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  interacoes = EXCLUDED.interacoes,
  updated_at = now();

-- ============================================================
-- 6. AMOXICILINA + CLAVULANATO
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'amoxicilina-clavulanato',
  'Amoxicilina + clavulanato',
  ARRAY['Clavulin', 'Augmentin', 'Novamox'],
  'Penicilina + inibidor de beta-lactamase',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"comprimido","concentracao":"500/125 mg, 875/125 mg"},
    {"forma":"comprimido BD","concentracao":"875/125 mg (12/12h)"},
    {"forma":"suspensão","concentracao":"250/62,5 mg/5mL, 400/57 mg/5mL"},
    {"forma":"frasco-ampola IV","concentracao":"1g/200mg, 2g/200mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"sinusite bacteriana","dose":"875/125 mg VO 12/12h","duracao":"5–7 dias"},
      {"para":"otite média aguda","dose":"875/125 mg VO 12/12h","duracao":"5–10 dias"},
      {"para":"PAC leve","dose":"875/125 mg VO 12/12h","duracao":"5 dias"},
      {"para":"ITU complicada","dose":"875/125 mg VO 12/12h","duracao":"7–14 dias"},
      {"para":"infecção odontogênica","dose":"875/125 mg VO 12/12h","duracao":"7 dias"},
      {"para":"mordedura humana ou animal","dose":"875/125 mg VO 12/12h","duracao":"5–7 dias profilaxia / 10–14 dias tratamento"},
      {"para":"abscesso intra-abdominal (associado a outros)","dose":"1,2 g IV 8/8h"}
    ],
    "max_dia":"3 g amoxicilina/dia + 250 mg clavulanato"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecções comunitárias","dose":"45–90 mg/kg/dia (componente amoxi) VO div 12/12h","max":"875/125 mg/dose"}
    ],
    "atencao":"Para OMA, dose alta 90 mg/kg/dia se < 2 anos ou recorrente."
  }$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"10–30","ajuste":"500/125 mg 12/12h (não usar 875 mg)"},
    {"clcr":"<10","ajuste":"500/125 mg 24/24h"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia","ajuste":"monitorar; risco de colestase pelo clavulanato"}
  ]$$::jsonb,
  'B',
  'Seguro em todos os trimestres.',
  'Compatível.',
  $$[
    {"com":"varfarina","efeito":"prolonga TP","manejo":"monitorar INR"},
    {"com":"alopurinol","efeito":"aumenta risco de rash","manejo":"orientar paciente"},
    {"com":"metotrexato","efeito":"aumenta toxicidade","manejo":"monitorar hemograma"},
    {"com":"contraceptivos orais","efeito":"redução teórica de eficácia (evidência fraca)","manejo":"orientar barreira na 1ª semana"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a beta-lactâmicos','história de colestase ou hepatite por amoxi-clavulanato','mononucleose infecciosa (rash em 80%)'],
  $$[
    {"freq":"comum","evento":"diarreia (mais frequente que amoxi pura, pelo clavulanato)"},
    {"freq":"comum","evento":"rash maculopapular (não-alérgico)"},
    {"freq":"incomum","evento":"colite por C. difficile"},
    {"freq":"raro","evento":"hepatite colestática (1:10000), pode aparecer até 6 semanas após o tratamento"},
    {"freq":"raro","evento":"anafilaxia"}
  ]$$::jsonb,
  ARRAY['Clavulanato é a causa principal de diarreia, orientar tomar com alimentos','Hepatotoxicidade pode ser tardia, orientar retorno se icterícia ou prurido após tratamento'],
  ARRAY['Hemograma e função hepática se uso > 10 dias'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=amoxicilina+clavulanato',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 7. AZITROMICINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'azitromicina',
  'Azitromicina',
  ARRAY['Zitromax', 'Astro', 'Azi', 'Azitrom'],
  'Macrolídeo (ribossomo 50S)',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"comprimido","concentracao":"250 mg, 500 mg"},
    {"forma":"suspensão","concentracao":"40 mg/mL, 200 mg/5mL"},
    {"forma":"frasco-ampola IV","concentracao":"500 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"PAC ambulatorial associada a beta-lactâmico","dose":"500 mg VO 1x/dia","duracao":"3–5 dias"},
      {"para":"DPOC exacerbada","dose":"500 mg VO 1x/dia","duracao":"3–5 dias"},
      {"para":"uretrite ou cervicite por Chlamydia","dose":"1 g VO dose única"},
      {"para":"sífilis primária se alergia a penicilina","dose":"2 g VO dose única","obs":"resistência crescente, preferir penicilina"},
      {"para":"pertussis","dose":"500 mg dia 1, depois 250 mg/dia 4 dias"},
      {"para":"profilaxia DPOC","dose":"250 mg VO 3x/semana","duracao":"avaliar 6–12 meses"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"PAC ou OMA","dose":"10 mg/kg dia 1, depois 5 mg/kg/dia 4 dias","max":"500 mg/dose"},
      {"para":"pertussis < 6 meses","dose":"10 mg/kg/dia 5 dias"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">10","ajuste":"sem ajuste"},
    {"clcr":"<10","ajuste":"usar com cautela"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"contraindicado (eliminação biliar)"}
  ]$$::jsonb,
  'B',
  'Seguro. Macrolídeo de escolha em alergia a beta-lactâmicos.',
  'Compatível.',
  $$[
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},
    {"com":"digoxina","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"sinvastatina ou lovastatina","efeito":"risco rabdomiólise","manejo":"suspender estatina ou usar pravastatina"},
    {"com":"QT-prolongadores como haloperidol metadona quinolonas","efeito":"torsade de pointes","manejo":"evitar associação, ECG basal"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a macrolídeos','história de hepatotoxicidade por azitromicina','QT longo congênito'],
  $$[
    {"freq":"comum","evento":"diarreia, dor abdominal"},
    {"freq":"incomum","evento":"prolongamento QT, arritmia"},
    {"freq":"raro","evento":"hepatotoxicidade colestática"},
    {"freq":"raro","evento":"perda auditiva em uso prolongado em alta dose"}
  ]$$::jsonb,
  ARRAY['FDA 2013: alerta de QT longo e morte súbita CV','Evitar em paciente cardiopata com QTc > 450 ms','Não tem ação contra Pseudomonas, MRSA ou anaeróbios da boca'],
  ARRAY['ECG se cardiopata ou em uso de outros QT-prolongadores'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=azitromicina',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 8. CEFALEXINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'cefalexina',
  'Cefalexina',
  ARRAY['Keflex', 'Cefalexina Genérico'],
  'Cefalosporina 1ª geração',
  ARRAY['VO'],
  $$[
    {"forma":"cápsula","concentracao":"250 mg, 500 mg"},
    {"forma":"suspensão","concentracao":"50 mg/mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"erisipela ou celulite não-purulenta","dose":"500 mg VO 6/6h","duracao":"7–10 dias"},
      {"para":"impetigo","dose":"500 mg VO 6/6h","duracao":"7 dias"},
      {"para":"ITU não complicada","dose":"500 mg VO 6/6h","duracao":"5–7 dias"},
      {"para":"profilaxia ITU recorrente","dose":"250 mg VO à noite","duracao":"6 meses"},
      {"para":"profilaxia endocardite procedimento dentário com alergia a amoxi não-anafilática","dose":"2 g VO 1h antes"}
    ],
    "max_dia":"4 g"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção pele ou ITU","dose":"25–100 mg/kg/dia VO div 6/6h","max":"500 mg/dose"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"10–50","ajuste":"500 mg 12/12h"},
    {"clcr":"<10","ajuste":"500 mg 24/24h"}
  ]$$::jsonb,
  $$[
    {"contexto":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  'B',
  'Segura.',
  'Compatível.',
  $$[
    {"com":"metformina","efeito":"aumenta nível plasmático","manejo":"monitorar glicemia"},
    {"com":"varfarina","efeito":"potencializa (raro)","manejo":"monitorar INR"},
    {"com":"probenecida","efeito":"prolonga meia-vida","manejo":"reduzir dose se possível"}
  ]$$::jsonb,
  ARRAY['anafilaxia prévia a beta-lactâmicos','colite pseudomembranosa prévia'],
  $$[
    {"freq":"comum","evento":"diarreia, náusea"},
    {"freq":"incomum","evento":"rash"},
    {"freq":"raro","evento":"colite por C. difficile"},
    {"freq":"raro","evento":"reação cruzada com penicilina (5–10% se anafilaxia prévia)"}
  ]$$::jsonb,
  ARRAY['Não cobre MRSA, escolha errada se suspeita de MRSA (preferir SMX-TMP, doxiciclina ou clindamicina)','Não cobre Pseudomonas','Atinge concentração baixa em SNC, não usar em meningite'],
  ARRAY['Considerar troca se sem resposta em 48–72h'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cefalexina',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 9. CIPROFLOXACINO
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'ciprofloxacino',
  'Ciprofloxacino',
  ARRAY['Cipro', 'Ciprofloxacino Genérico', 'Proflox'],
  'Fluoroquinolona (DNA-girase, topoisomerase IV)',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"comprimido","concentracao":"250 mg, 500 mg, 750 mg"},
    {"forma":"frasco-ampola IV","concentracao":"200 mg/100mL, 400 mg/200mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"ITU complicada ou pielonefrite","dose":"500–750 mg VO 12/12h ou 400 mg IV 12/12h","duracao":"7–14 dias"},
      {"para":"prostatite bacteriana","dose":"500 mg VO 12/12h","duracao":"4–6 semanas"},
      {"para":"diarreia bacteriana ou disenteria","dose":"500 mg VO 12/12h","duracao":"3–5 dias"},
      {"para":"pneumonia hospitalar com Pseudomonas","dose":"400 mg IV 8/8h","duracao":"7–14 dias"},
      {"para":"febre tifoide","dose":"500 mg VO 12/12h","duracao":"7–14 dias"},
      {"para":"gonorreia","dose":"NÃO USAR","obs":"resistência > 50% no Brasil, usar ceftriaxone"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"fibrose cística ou antraz","dose":"20–30 mg/kg/dia VO div 12/12h","max":"1,5 g/dia","obs":"uso restrito por toxicidade articular"}
    ],
    "atencao":"Geralmente evitada em < 18 anos (artropatia teórica)."
  }$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"30–50","ajuste":"250–500 mg 12/12h"},
    {"clcr":"<30","ajuste":"250–500 mg 24/24h"}
  ]$$::jsonb,
  $$[
    {"contexto":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  'C',
  'Evitar.',
  'Evitar, preferir alternativa.',
  $$[
    {"com":"antiácidos sucralfato ferro cálcio lácteos","efeito":"reduz absorção em até 90%","manejo":"separar 2h antes ou 6h depois"},
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},
    {"com":"teofilina ou cafeína","efeito":"aumenta nível","manejo":"reduzir dose teofilina"},
    {"com":"tizanidina","efeito":"hipotensão grave","manejo":"contraindicação"},
    {"com":"AINE","efeito":"convulsão (raro)","manejo":"cautela"},
    {"com":"QT-prolongadores","efeito":"arritmia","manejo":"monitorar ECG"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a quinolonas','tendinopatia prévia por quinolona','miastenia gravis (exacerba)','idade < 18 anos (exceto indicações específicas)','gestação','aneurisma de aorta ou risco (FDA 2018)'],
  $$[
    {"freq":"comum","evento":"náusea, diarreia, cefaleia, insônia"},
    {"freq":"incomum","evento":"prolongamento QT"},
    {"freq":"incomum","evento":"tendinopatia ou ruptura de tendão (Aquiles), risco maior em > 60 anos, corticoide, transplantado"},
    {"freq":"raro","evento":"convulsão (especialmente epilépticos)"},
    {"freq":"raro","evento":"neuropatia periférica permanente (FDA 2013)"},
    {"freq":"raro","evento":"dissecção aórtica ou aneurisma"},
    {"freq":"raro","evento":"hipoglicemia ou hiperglicemia"}
  ]$$::jsonb,
  ARRAY['BLACK BOX FDA: tendinopatia, neuropatia, efeitos SNC','Não usar 1ª linha para sinusite, bronquite ou ITU não complicada (FDA 2016)','Evitar em paciente com aneurisma de aorta ou doença vascular','Suspender ao primeiro sinal de dor tendínea'],
  ARRAY['ECG se uso prolongado ou cardiopata','Função renal','Glicemia em diabético'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ciprofloxacino',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  alertas_seguranca = EXCLUDED.alertas_seguranca,
  updated_at = now();

-- ============================================================
-- 10. METRONIDAZOL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'metronidazol',
  'Metronidazol',
  ARRAY['Flagyl', 'Metronil', 'Metronidazol Genérico'],
  'Nitroimidazol',
  ARRAY['VO', 'IV', 'tópico', 'vaginal'],
  $$[
    {"forma":"comprimido","concentracao":"250 mg, 400 mg"},
    {"forma":"suspensão","concentracao":"40 mg/mL"},
    {"forma":"bolsa IV","concentracao":"500 mg/100mL"},
    {"forma":"creme vaginal","concentracao":"100 mg/g"},
    {"forma":"gel tópico","concentracao":"7,5 mg/g (rosácea)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"vaginose bacteriana","dose":"500 mg VO 12/12h","duracao":"7 dias"},
      {"para":"tricomoníase","dose":"2 g VO dose única ou 500 mg 12/12h por 7 dias","obs":"tratar parceiros"},
      {"para":"abscesso intra-abdominal ou diverticulite","dose":"500 mg IV 8/8h","duracao":"7–14 dias"},
      {"para":"colite C. difficile não-grave","dose":"500 mg VO 8/8h","duracao":"10 dias","obs":"vancomicina VO ou fidaxomicina são primeira linha hoje"},
      {"para":"giardíase","dose":"250 mg VO 8/8h","duracao":"5–7 dias"},
      {"para":"amebíase intestinal","dose":"500–750 mg VO 8/8h por 7–10 dias mais agente luminal"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"giardíase ou anaeróbios","dose":"15–30 mg/kg/dia VO div 8/8h","max":"500 mg/dose"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">10","ajuste":"sem ajuste"},
    {"clcr":"<10","ajuste":"reduzir dose 50%"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"reduzir dose 50%"}
  ]$$::jsonb,
  'B',
  'Evitar 1º trimestre se possível, seguro 2º e 3º.',
  'Suspender lactação por 12–24h após dose única de 2 g.',
  $$[
    {"com":"álcool","efeito":"reação dissulfiram-like","manejo":"abstinência durante e até 72h após"},
    {"com":"varfarina","efeito":"potencializa fortemente","manejo":"reduzir varfarina ~30%, monitorar INR"},
    {"com":"lítio","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"fenitoína ou fenobarbital","efeito":"reduz nível do metro","manejo":"monitorar resposta"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a nitroimidazóis','1º trimestre gestação (relativo)','etilismo ativo'],
  $$[
    {"freq":"comum","evento":"gosto metálico, náusea"},
    {"freq":"comum","evento":"urina escurecida (benigno)"},
    {"freq":"incomum","evento":"neuropatia periférica em uso prolongado > 4 semanas"},
    {"freq":"raro","evento":"encefalopatia ou convulsão"},
    {"freq":"raro","evento":"reação dissulfiram com álcool"}
  ]$$::jsonb,
  ARRAY['Orientar abstinência alcoólica durante e 72h após o tratamento','Uso prolongado: avaliar neuropatia (parestesia em mãos e pés)','Não combinar com vacina antitifoide oral viva'],
  ARRAY['Hemograma se uso > 10 dias','Função neurológica em uso crônico'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metronidazol',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 11. LOSARTANA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'losartana',
  'Losartana potássica',
  ARRAY['Cozaar', 'Aradois', 'Corus', 'Losartana Genérico'],
  'Bloqueador receptor angiotensina II (BRA)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"25 mg, 50 mg, 100 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS","dose":"50 mg VO 1x/dia inicial titular até 100 mg 1x/dia","obs":"alguns pacientes melhor com 50 mg 12/12h pela meia-vida"},
      {"para":"IC FEr","dose":"25 mg VO 1x/dia titular até 150 mg 1x/dia (HEAAL)","obs":"sacubitril/valsartan é preferível se tolerado"},
      {"para":"nefropatia diabética","dose":"50 mg VO 1x/dia titular até 100 mg 1x/dia","obs":"reduz progressão (RENAAL)"},
      {"para":"prevenção AVC em HAS com HVE","dose":"50–100 mg VO 1x/dia (LIFE)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS pediátrica","dose":"0,7 mg/kg/dia (max 50 mg) VO 1x/dia"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"iniciar 25 mg 1x/dia, titular conforme PA e K+"},
    {"clcr":"diálise","ajuste":"25 mg 1x/dia"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia leve","ajuste":"iniciar 25 mg 1x/dia"},
    {"contexto":"hepatopatia grave","ajuste":"contraindicado"}
  ]$$::jsonb,
  'D',
  'CONTRAINDICADA em todos os trimestres. Causa oligoidrâmnio, IRA neonatal, hipoplasia pulmonar.',
  'Evitar (sem dados).',
  $$[
    {"com":"AINE","efeito":"reduz efeito anti-HTN e IRA","manejo":"evitar uso crônico de AINE"},
    {"com":"diuréticos poupadores de K (espironolactona, amilorida)","efeito":"hipercalemia","manejo":"monitorar K+ a cada 1–2 semanas"},
    {"com":"lítio","efeito":"aumenta nível","manejo":"monitorar litemia"},
    {"com":"IECA (enalapril)","efeito":"duplo bloqueio SRAA, IRA, hiperK, hipotensão","manejo":"NÃO combinar (ON-TARGET 2008)"}
  ]$$::jsonb,
  ARRAY['gestação (todos os trimestres)','hipersensibilidade','estenose bilateral de artéria renal','hipercalemia > 5,5 não corrigida'],
  $$[
    {"freq":"comum","evento":"tontura, hipotensão postural"},
    {"freq":"incomum","evento":"hipercalemia"},
    {"freq":"incomum","evento":"piora função renal (especialmente em estenose bilateral)"},
    {"freq":"raro","evento":"angioedema (menos comum que IECA)"},
    {"freq":"raro","evento":"rash, anemia"}
  ]$$::jsonb,
  ARRAY['Causa muito menos tosse seca que IECA, alternativa de escolha em quem não tolera enalapril','Suspender em diarreia ou desidratação grave (risco IRA)','Verificar creatinina e K+ 1–2 semanas após início ou aumento de dose'],
  ARRAY['Creatinina e K+ basais e 1–2 semanas após mudança de dose'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=losartana',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 12. ANLODIPINO
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'anlodipino',
  'Anlodipino',
  ARRAY['Norvasc', 'Anlo', 'Pressat', 'Anlodipino Genérico'],
  'Bloqueador de canal de cálcio di-hidropiridínico (BCC-DHP)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"2,5 mg, 5 mg, 10 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS","dose":"5 mg VO 1x/dia titular até 10 mg 1x/dia","obs":"meia-vida longa (40h), efeito pleno em 7–10 dias"},
      {"para":"angina estável","dose":"5–10 mg VO 1x/dia"},
      {"para":"angina vasoespástica (Prinzmetal)","dose":"5–10 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS pediátrica (≥ 6 anos)","dose":"2,5–5 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia","ajuste":"iniciar 2,5 mg 1x/dia"}
  ]$$::jsonb,
  'C',
  'Pouco usado, nifedipino tem mais experiência na gestação.',
  'Compatível.',
  $$[
    {"com":"sinvastatina","efeito":"aumenta nível da estatina","manejo":"limitar sinva 20 mg/dia"},
    {"com":"ciclosporina ou tacrolimus","efeito":"aumenta nível dos imunossupressores","manejo":"monitorar nível"},
    {"com":"sucos pomelo (grapefruit)","efeito":"aumenta nível anlodipino","manejo":"orientar evitar"},
    {"com":"beta-bloqueador","efeito":"associação racional para angina, pode causar bradicardia ou hipotensão","manejo":"titular gradualmente"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade','estenose aórtica grave','choque cardiogênico'],
  $$[
    {"freq":"comum","evento":"edema maleolar (até 30% em dose alta, não responde a diurético)"},
    {"freq":"comum","evento":"rubor facial, cefaleia"},
    {"freq":"comum","evento":"taquicardia reflexa"},
    {"freq":"incomum","evento":"hiperplasia gengival"},
    {"freq":"incomum","evento":"fadiga"}
  ]$$::jsonb,
  ARRAY['Edema NÃO responde a diurético, é vasodilatação capilar, combinar com IECA ou BRA reduz o edema','Início lento (7–10 dias), não titular antes disso','Cuidado em IC FEr (verapamil/diltiazem são proibidos, di-hidropiridínicos são neutros)'],
  ARRAY['PA, edema, FC'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=anlodipino',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 13. HIDROCLOROTIAZIDA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'hidroclorotiazida',
  'Hidroclorotiazida',
  ARRAY['Drausan', 'Clorana', 'Hidroclorotiazida Genérico'],
  'Diurético tiazídico',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"12,5 mg, 25 mg, 50 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS","dose":"12,5–25 mg VO 1x/dia (manhã)","obs":"acima de 25 mg, pouco ganho hipotensor e mais distúrbio metabólico"},
      {"para":"edema em IC ou hepatopatia leve","dose":"25–100 mg VO 1x/dia"},
      {"para":"prevenção nefrolitíase com hipercalciúria","dose":"25 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS ou edema","dose":"1–2 mg/kg/dia VO 1x/dia (max 50 mg)"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"INEFICAZ, trocar por diurético de alça (furosemida)"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"cautela, risco encefalopatia hepática"}
  ]$$::jsonb,
  'B',
  'Pouco usada, evitar 1º trimestre. Risco de redução volêmica placentária.',
  'Compatível em dose baixa, suprime lactação em alta dose.',
  $$[
    {"com":"lítio","efeito":"aumenta nível (até 50%)","manejo":"reduzir lítio, monitorar"},
    {"com":"AINE","efeito":"reduz efeito diurético","manejo":"evitar uso crônico de AINE"},
    {"com":"digoxina","efeito":"hipocalemia potencializa toxicidade digital","manejo":"manter K+ > 4,0"},
    {"com":"corticoides","efeito":"hipocalemia aditiva","manejo":"monitorar K+"},
    {"com":"colestiramina","efeito":"reduz absorção","manejo":"separar 4h"}
  ]$$::jsonb,
  ARRAY['anúria','hipersensibilidade a sulfas (cuidado)','hiponatremia grave','hipocalemia refratária','gota descontrolada (relativo)','clcr < 30 (ineficaz)'],
  $$[
    {"freq":"comum","evento":"hipocalemia, hiponatremia"},
    {"freq":"comum","evento":"hiperuricemia (precipita gota)"},
    {"freq":"comum","evento":"hiperglicemia leve, dislipidemia"},
    {"freq":"incomum","evento":"hipercalcemia, hipomagnesemia"},
    {"freq":"raro","evento":"câncer de pele não-melanoma (uso prolongado, FDA 2020)"},
    {"freq":"raro","evento":"pancreatite, fotossensibilidade"}
  ]$$::jsonb,
  ARRAY['Tomar pela manhã para evitar nictúria','Combina bem com IECA/BRA (sinergia + corrige hipoK)','Verificar Na/K/glicemia/ác. úrico em 2–4 semanas após início','Em > 65 anos: maior risco de hiponatremia sintomática'],
  ARRAY['Eletrólitos (Na, K, Mg), creatinina, glicemia, ác. úrico em 2–4 semanas e periodicamente'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=hidroclorotiazida',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 14. FUROSEMIDA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'furosemida',
  'Furosemida',
  ARRAY['Lasix', 'Furosemida Genérico'],
  'Diurético de alça',
  ARRAY['VO', 'IV', 'IM'],
  $$[
    {"forma":"comprimido","concentracao":"40 mg"},
    {"forma":"ampola","concentracao":"10 mg/mL (2 mL = 20 mg)"},
    {"forma":"solução oral","concentracao":"10 mg/mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"IC descompensada","dose":"20–40 mg IV (se virgem) ou dose VO crônica IV (se já em uso)","frequencia":"6/6 ou 8/8h conforme resposta","obs":"se sem resposta em 1h, dobrar dose; biodisponibilidade VO ~50% (1 mg IV = 2 mg VO)"},
      {"para":"edema crônico em IC","dose":"20–80 mg VO 1–2x/dia"},
      {"para":"edema em cirrose","dose":"40 mg VO 1x/dia, sempre associado à espironolactona (proporção 2:5)"},
      {"para":"hipercalemia em IRA","dose":"40–80 mg IV","obs":"adjuvante, não é tratamento principal"},
      {"para":"edema agudo de pulmão","dose":"40 mg IV em bolus, repetir em 30 min se necessário","obs":"vasodilatação imediata + diurese 30 min depois"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"edema","dose":"1–2 mg/kg/dose VO ou 0,5–1 mg/kg/dose IV","frequencia":"6/6 a 12/12h","max":"6 mg/kg/dia"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"funciona até clcr ~5; dose pode precisar ser maior em IRC para atingir túbulo"}
  ]$$::jsonb,
  $$[
    {"contexto":"cirrose","ajuste":"sempre com espironolactona, proporção 40:100 mg (Furo:Espiro)"}
  ]$$::jsonb,
  'C',
  'Cautela. Evitar uso desnecessário, risco de reduzir perfusão placentária.',
  'Suprime lactação.',
  $$[
    {"com":"aminoglicosídeos","efeito":"ototoxicidade aditiva (especialmente IV rápido)","manejo":"infundir IV em ≥ 4 min se dose > 80 mg"},
    {"com":"AINE","efeito":"reduz efeito diurético","manejo":"evitar uso crônico"},
    {"com":"lítio","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"digoxina","efeito":"hipocalemia potencializa toxicidade","manejo":"manter K+ > 4,0"}
  ]$$::jsonb,
  ARRAY['anúria sem resposta a teste','hipovolemia ou desidratação','encefalopatia hepática','alergia a sulfas (relativo)'],
  $$[
    {"freq":"comum","evento":"hipocalemia, hiponatremia, hipomagnesemia"},
    {"freq":"comum","evento":"hipotensão postural, depleção volêmica"},
    {"freq":"comum","evento":"hiperuricemia, hiperglicemia leve"},
    {"freq":"incomum","evento":"alcalose metabólica hipoclorêmica"},
    {"freq":"raro","evento":"ototoxicidade (transitória ou permanente, dose-dependente IV)"},
    {"freq":"raro","evento":"nefrite intersticial, pancreatite"}
  ]$$::jsonb,
  ARRAY['IV em dose alta: infundir em ≥ 4 minutos para evitar ototoxicidade','Em IC, monitorar peso diário e diurese','Resistência diurética: avaliar dose, restrição salina, associar tiazida (sinergia)','Não confundir miligramas IV com miligramas VO (biodisponibilidade VO ~50%)'],
  ARRAY['Eletrólitos diários se uso IV, semanal se VO crônico','Creatinina, peso, débito urinário'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=furosemida',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 15. CARVEDILOL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'carvedilol',
  'Carvedilol',
  ARRAY['Coreg', 'Carvediloc', 'Carvedilato'],
  'Beta-bloqueador não-seletivo + alfa-1 bloqueador',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"3,125 mg, 6,25 mg, 12,5 mg, 25 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"IC FEr (FE ≤ 40%)","dose":"iniciar 3,125 mg VO 12/12h, dobrar a cada 2 semanas até 25 mg 12/12h (50 mg/dia)","obs":"em IC, reduz mortalidade (US Carvedilol HF, COPERNICUS); só iniciar se euvolêmico"},
      {"para":"HAS","dose":"6,25 mg VO 12/12h, titular até 25 mg 12/12h"},
      {"para":"pós-IAM com disfunção VE","dose":"6,25 mg VO 12/12h, titular até 25 mg 12/12h (CAPRICORN)"},
      {"para":"profilaxia primária varizes esofágicas (cirrose)","dose":"6,25–12,5 mg VO 1x/dia ou 12/12h"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"IC pediátrica","dose":"0,1 mg/kg/dose VO 12/12h, titular até 0,5 mg/kg/dose 12/12h","max":"25 mg/dose"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia grave","ajuste":"contraindicado"}
  ]$$::jsonb,
  'C',
  'Evitar (preferir metoprolol succinato ou bisoprolol se necessário).',
  'Sem dados suficientes, evitar.',
  $$[
    {"com":"verapamil ou diltiazem","efeito":"bradicardia grave, BAV","manejo":"NÃO combinar"},
    {"com":"clonidina","efeito":"hipertensão rebote se suspensão de clonidina","manejo":"suspender carvedilol primeiro, depois clonidina"},
    {"com":"insulina ou hipoglicemiante","efeito":"mascara hipoglicemia (taquicardia)","manejo":"orientar diabético"},
    {"com":"amiodarona","efeito":"bradicardia aditiva","manejo":"monitorar FC"},
    {"com":"rifampicina","efeito":"reduz nível","manejo":"aumentar dose"}
  ]$$::jsonb,
  ARRAY['IC descompensada com edema agudo','BAV de 2º ou 3º grau sem MP','bradicardia < 50 bpm','choque cardiogênico','asma grave (use cardiosseletivo se preciso)','hepatopatia grave'],
  $$[
    {"freq":"comum","evento":"tontura, hipotensão postural (especialmente na 1ª dose)"},
    {"freq":"comum","evento":"bradicardia, fadiga"},
    {"freq":"incomum","evento":"piora transitória da IC nos primeiros dias (dose-dependente)"},
    {"freq":"incomum","evento":"broncoespasmo (não-seletivo)"},
    {"freq":"raro","evento":"edema, ganho de peso"},
    {"freq":"raro","evento":"hipoglicemia em diabético, mascaramento de sintomas"}
  ]$$::jsonb,
  ARRAY['Em IC, NUNCA iniciar com paciente congesto, descongestionar primeiro','Titular lentamente (a cada 2 semanas), suspensão abrupta pode precipitar isquemia','Tomar com alimentos (reduz hipotensão postural)','Monitorar FC e PA antes de cada aumento de dose'],
  ARRAY['FC, PA, peso, sinais de congestão a cada visita'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=carvedilol',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 16. METFORMINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'metformina',
  'Cloridrato de metformina',
  ARRAY['Glifage', 'Glucoformin', 'Metformina Genérico'],
  'Biguanida',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"500 mg, 850 mg, 1 g"},
    {"forma":"comprimido XR (liberação prolongada)","concentracao":"500 mg, 750 mg, 1 g"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM2","dose":"500 mg VO 1x/dia (jantar) titular semanalmente até 1 g 12/12h","max":"2,5 g/dia (formulação convencional) ou 2 g/dia (XR)","obs":"PRIMEIRA LINHA (SBD/ADA)"},
      {"para":"síndrome dos ovários policísticos (SOP)","dose":"500 mg VO 12/12h titular até 1500–2000 mg/dia","obs":"melhora ciclo menstrual e fertilidade"},
      {"para":"pré-diabetes em alto risco (IMC > 35, < 60a, GDM prévio)","dose":"850 mg VO 12/12h"}
    ],
    "obs_geral":"Tomar com alimentos para reduzir efeitos GI; XR uma vez ao dia melhora aderência."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM2 ≥ 10 anos","dose":"500 mg VO 12/12h titular até 1 g 12/12h"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":">60","ajuste":"sem ajuste"},
    {"clcr":"45–60","ajuste":"reavaliar risco-benefício; max 1 g/dia"},
    {"clcr":"30–45","ajuste":"reduzir 50%; max 1 g/dia; monitor renal trimestral"},
    {"clcr":"<30","ajuste":"contraindicado"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia ativa ou grave","ajuste":"contraindicado (risco acidose lática)"}
  ]$$::jsonb,
  'B',
  'Segura. Pode ser usada em DMG (especialmente associada à insulina).',
  'Compatível.',
  $$[
    {"com":"contraste iodado IV","efeito":"acidose lática se IRA","manejo":"suspender metformina antes do exame se clcr < 60 e reavaliar 48h após"},
    {"com":"álcool","efeito":"acidose lática aditiva","manejo":"evitar binge drinking"},
    {"com":"inibidores de CYP2C8 (gemfibrozila)","efeito":"aumenta nível","manejo":"reduzir dose"},
    {"com":"corticoides ou simpaticomiméticos","efeito":"hiperglicemia antagonista","manejo":"ajustar dose conforme glicemia"}
  ]$$::jsonb,
  ARRAY['clcr < 30','acidose metabólica aguda','choque/hipoperfusão','hepatopatia grave','etilismo crônico em binge','contraste iodado iminente','suspeita de sepse'],
  $$[
    {"freq":"comum (~30%)","evento":"diarreia, náusea, dor abdominal (geralmente nas primeiras 2 semanas)"},
    {"freq":"comum","evento":"gosto metálico"},
    {"freq":"incomum","evento":"deficiência de B12 em uso > 4 anos (até 30%)"},
    {"freq":"raro","evento":"acidose lática (1–9:100000, mortalidade ~50%)"}
  ]$$::jsonb,
  ARRAY['Iniciar com dose baixa e titular gradualmente para reduzir GI','Suspender em vômitos, diarreia profusa, sepse, IAM, insuficiência respiratória','Suspender 48h antes de cirurgia maior ou contraste','Não causa hipoglicemia em monoterapia (vantagem sobre sulfonilureias)'],
  ARRAY['HbA1c trimestral até estabilizar','Função renal anual (semestral se clcr 45–60)','Vitamina B12 anual em uso > 4 anos'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metformina',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 17. ATORVASTATINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'atorvastatina',
  'Atorvastatina cálcica',
  ARRAY['Lipitor', 'Atorvis', 'Citalor', 'Atorvastatina Genérico'],
  'Estatina (inibidor HMG-CoA redutase) — alta intensidade',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"10 mg, 20 mg, 40 mg, 80 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"prevenção secundária CV (DAC, AVC, DAOP)","dose":"40–80 mg VO 1x/noite","obs":"alta intensidade, meta LDL < 50 (SBC) ou queda > 50%"},
      {"para":"prevenção primária em alto risco (CV ≥ 7,5% em 10 anos)","dose":"20–40 mg VO 1x/noite"},
      {"para":"DM em maior de 40a com risco","dose":"20–40 mg VO 1x/noite"},
      {"para":"hipercolesterolemia familiar","dose":"40–80 mg VO 1x/noite"},
      {"para":"AVC isquêmico ou AIT","dose":"80 mg VO 1x/noite (SPARCL)"}
    ],
    "obs":"Pode tomar em qualquer horário (meia-vida 14h, diferente de sinvastatina)."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"hipercolesterolemia familiar (≥ 10a)","dose":"10 mg VO 1x/dia, max 20 mg"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia ativa, TGO/TGP > 3x LSN persistente","ajuste":"contraindicado"}
  ]$$::jsonb,
  'X',
  'CONTRAINDICADA. Suspender 1–3 meses antes da gestação. Risco de defeitos do SNC.',
  'Contraindicada.',
  $$[
    {"com":"claritromicina, eritromicina, itraconazol, cetoconazol, ciclosporina","efeito":"aumenta nível, risco rabdomiólise","manejo":"limitar atorva 20 mg/dia; preferir azitromicina e fluconazol"},
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},
    {"com":"colchicina","efeito":"miopatia aditiva","manejo":"cautela em DRC"},
    {"com":"gemfibrozila","efeito":"miopatia/rabdomiólise","manejo":"NÃO combinar (preferir fenofibrato)"},
    {"com":"sucos pomelo (grapefruit)","efeito":"aumenta nível","manejo":"evitar grandes quantidades (>1 L/dia)"}
  ]$$::jsonb,
  ARRAY['gestação','lactação','hepatopatia ativa','TGO/TGP > 3x LSN persistente','rabdomiólise prévia por estatina','hipersensibilidade'],
  $$[
    {"freq":"comum","evento":"mialgia (5–10%, sem CK aumentada na maioria)"},
    {"freq":"incomum","evento":"miopatia (CK > 10x LSN com sintomas)"},
    {"freq":"raro (1:10000)","evento":"rabdomiólise (CK > 40x LSN, urina escura, IRA)"},
    {"freq":"comum","evento":"hepatotoxicidade leve (TGO/TGP < 3x), reversível"},
    {"freq":"incomum","evento":"hiperglicemia leve, novo DM (~10%, mas benefício CV maior que risco)"},
    {"freq":"raro","evento":"miopatia necrosante autoimune (HMGCR-Ab+)"}
  ]$$::jsonb,
  ARRAY['Mialgia leve não exige suspensão, tentar reduzir dose, alternar dia, ou trocar por rosuvastatina','Suspender se CK > 10x LSN ou sintomas musculares graves','Não dosar TGO/TGP rotineiramente sem indicação (dosagem inicial é suficiente, AHA 2018)','Manter mesmo no perioperatório (não há benefício em suspender)'],
  ARRAY['Lipidograma 4–12 semanas após início e a cada 6–12 meses','TGO/TGP basal','CK só se sintomas musculares'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=atorvastatina',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 18. LEVOTIROXINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'levotiroxina',
  'Levotiroxina sódica (T4)',
  ARRAY['Puran T4', 'Synthroid', 'Euthyrox', 'Levoid'],
  'Hormônio tireoidiano',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"25, 38, 50, 62, 75, 88, 100, 112, 125, 137, 150, 175, 200 mcg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"hipotireoidismo primário","dose":"1,6 mcg/kg/dia VO 1x/dia em jejum (30–60 min antes café)","ajuste":"titular pelo TSH a cada 6–8 semanas"},
      {"para":"hipotireoidismo subclínico (TSH > 10 ou TSH 7–10 com sintomas)","dose":"25–50 mcg/dia, titular"},
      {"para":"supressão de TSH em câncer de tireoide","dose":"2,2 mcg/kg/dia (alvo TSH < 0,1)"},
      {"para":"hipotireoidismo na gestação","dose":"aumentar 25–30% logo no diagnóstico de gravidez (alvo TSH < 2,5 no 1ºT)"}
    ],
    "obs":"Em > 50 anos ou cardiopata: iniciar 25–50 mcg/dia e titular para evitar precipitar isquemia."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"hipotireoidismo congênito","dose":"10–15 mcg/kg/dia VO 1x/dia"},
      {"para":"crianças maiores","dose":"4–6 mcg/kg/dia (1–5a), 3–4 mcg/kg/dia (6–12a), 2–3 mcg/kg/dia (>12a)"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  'A',
  'Segura e necessária. Aumentar dose em 25–30% no início da gestação.',
  'Compatível.',
  $$[
    {"com":"sulfato ferroso, cálcio, sucralfato, antiácidos, colestiramina","efeito":"reduz absorção","manejo":"separar 4h"},
    {"com":"omeprazol/IBP","efeito":"reduz absorção","manejo":"separar 4h"},
    {"com":"varfarina","efeito":"potencializa anticoagulação","manejo":"monitorar INR ao iniciar/ajustar"},
    {"com":"estrogênio","efeito":"aumenta TBG, exige aumento de dose","manejo":"reavaliar TSH 6 semanas após início"},
    {"com":"rifampicina, fenitoína, carbamazepina","efeito":"reduz nível (aumenta clearance)","manejo":"aumentar dose"},
    {"com":"insulina/antidiabéticos","efeito":"pode exigir aumento de dose hipoglicemiante","manejo":"monitorar glicemia"}
  ]$$::jsonb,
  ARRAY['hipertireoidismo não tratado','IAM agudo','insuficiência adrenal não tratada (precipita crise)','tireotoxicose','hipersensibilidade'],
  $$[
    {"freq":"raro (em dose adequada)","evento":"sinais de hipertireoidismo (taquicardia, perda de peso, tremor)"},
    {"freq":"raro","evento":"angina/IAM em cardiopata por aumento muito rápido de dose"},
    {"freq":"raro","evento":"osteoporose (uso supra-fisiológico crônico)"},
    {"freq":"raro","evento":"FA em idoso supratratado"}
  ]$$::jsonb,
  ARRAY['Tomar EM JEJUM, ao acordar, esperar 30–60 min antes do café','Compromisso com aderência é essencial: trocar marca exige nova dosagem TSH em 6 semanas','TSH alvo varia: geral 0,5–4; gestação 1ºT < 2,5; câncer < 0,1','Subdose causa sintomas vagos (fadiga), supradose pode causar arritmia em idoso'],
  ARRAY['TSH 6–8 semanas após início ou mudança de dose, depois anual'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=levotiroxina',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 19. PREDNISONA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'prednisona',
  'Prednisona',
  ARRAY['Meticorten', 'Predsim', 'Prednisona Genérico'],
  'Glicocorticoide sistêmico',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"5 mg, 20 mg, 50 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma exacerbada","dose":"40–60 mg VO 1x/dia","duracao":"5–7 dias (sem desmame se < 14 dias e sem cushing)"},
      {"para":"DPOC exacerbada","dose":"40 mg VO 1x/dia","duracao":"5 dias (REDUCE trial)"},
      {"para":"reativação de doença autoimune (LES, AR, vasculite)","dose":"0,5–1 mg/kg/dia VO","duracao":"variável, com desmame"},
      {"para":"polimialgia reumática","dose":"15–20 mg VO 1x/dia, depois desmame lento"},
      {"para":"arterite temporal (sem perda visual)","dose":"40–60 mg VO 1x/dia","obs":"se perda visual ou amaurose: pulsoterapia metilpred 1 g IV/dia 3 dias"},
      {"para":"reações alérgicas graves (não anafilaxia)","dose":"40–60 mg VO 1x/dia 3–5 dias"}
    ],
    "equivalencia":"5 mg prednisona = 4 mg metilprednisolona = 0,75 mg dexametasona = 20 mg hidrocortisona"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma, croup, doença autoimune","dose":"1–2 mg/kg/dia VO","max":"60 mg/dia"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"hepatopatia","ajuste":"prednisona é pro-droga (ativada no fígado), preferir prednisolona se cirrose"}
  ]$$::jsonb,
  'C',
  'Risco-benefício, evitar 1º trimestre. Doses maternas podem causar fenda palatina (raro). Em uso crônico, monitorar crescimento fetal.',
  'Compatível em doses < 20 mg/dia.',
  $$[
    {"com":"AINE","efeito":"sangramento e úlcera GI aditivos","manejo":"associar IBP"},
    {"com":"varfarina","efeito":"variável (pode aumentar ou reduzir INR)","manejo":"monitorar"},
    {"com":"hipoglicemiantes","efeito":"hiperglicemia antagonista","manejo":"ajustar"},
    {"com":"diuréticos não-poupadores K","efeito":"hipocalemia aditiva","manejo":"monitorar"},
    {"com":"vacinas vivas (febre amarela, BCG, tríplice viral)","efeito":"risco de doença vacinal","manejo":"contraindicado se ≥ 20 mg/dia por ≥ 2 semanas"},
    {"com":"rifampicina, fenitoína","efeito":"reduz nível","manejo":"aumentar dose"}
  ]$$::jsonb,
  ARRAY['infecção fúngica sistêmica não tratada','hipersensibilidade','administração de vacina viva (≥ 20 mg/dia ≥ 2 semanas)'],
  $$[
    {"freq":"comum","evento":"hiperglicemia (mesmo em não-diabético)"},
    {"freq":"comum","evento":"insônia, alteração de humor (euforia ou irritabilidade)"},
    {"freq":"comum","evento":"dispepsia, ganho de peso, retenção hídrica"},
    {"freq":"comum (uso prolongado)","evento":"síndrome de Cushing, osteoporose, fragilidade cutânea, miopatia proximal"},
    {"freq":"incomum","evento":"infecção oportunista (especialmente em ≥ 20 mg/dia ≥ 4 semanas)"},
    {"freq":"incomum","evento":"insuficiência adrenal por suspensão abrupta"},
    {"freq":"raro","evento":"psicose corticosteroide, glaucoma, catarata"}
  ]$$::jsonb,
  ARRAY['Curso < 14 dias: pode suspender abruptamente sem desmame','Curso > 14 dias ou ≥ 20 mg/dia: desmamar gradualmente para evitar insuficiência adrenal','Profilaxia: IBP se uso > 4 semanas + AINE/idoso, cálcio + vit D + bifosfonado se uso > 3 meses','Em diabético: titular hipoglicemiantes desde o início','Atenção a infecções fúngicas (estrongiloidíase em paciente com viagem ao Norte/Nordeste)'],
  ARRAY['Glicemia, PA, peso a cada visita','DEXA basal e anual se uso > 3 meses','Eletrólitos em uso prolongado'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=prednisona',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  updated_at = now();

-- ============================================================
-- 20. SALBUTAMOL (albuterol)
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'salbutamol',
  'Salbutamol (albuterol)',
  ARRAY['Aerolin', 'Aerogold', 'Salbutamol Genérico'],
  'Beta-2 agonista de curta ação (SABA)',
  ARRAY['inalatório', 'IV', 'VO'],
  $$[
    {"forma":"aerossol dosimetrado (spray)","concentracao":"100 mcg/jato"},
    {"forma":"solução para nebulização","concentracao":"5 mg/mL"},
    {"forma":"comprimido","concentracao":"2 mg, 4 mg"},
    {"forma":"xarope","concentracao":"0,4 mg/mL"},
    {"forma":"ampola IV","concentracao":"0,5 mg/mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma exacerbada / DPOC exacerbada","dose":"4–10 jatos via espaçador a cada 20 min na 1ª hora; reavaliar","obs":"GINA 2024 NÃO RECOMENDA mais SABA isolado para asma; usar budesonida-formoterol como reliever (PRN-MART)"},
      {"para":"crise asma grave (urgência)","dose":"nebulização 2,5–5 mg em 3 mL SF a cada 20 min × 3 doses ou contínua"},
      {"para":"asma manutenção (uso só de resgate)","dose":"2 jatos antes de exercício ou conforme sintomas, MAX 1 frasco/mês","obs":"uso > 3 frascos/ano = asma mal controlada (escalar)"},
      {"para":"hipercalemia","dose":"10–20 mg neb (10× dose comum), reduz K+ ~0,5 mEq/L"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"crise asma","dose":"4–8 jatos via espaçador a cada 20 min ou neb 0,15 mg/kg (max 5 mg) a cada 20 min × 3"}
    ]
  }$$::jsonb,
  $$[
    {"clcr":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  $$[
    {"contexto":"todos","ajuste":"sem ajuste"}
  ]$$::jsonb,
  'C',
  'Seguro. Uso inalatório tem absorção sistêmica baixa.',
  'Compatível.',
  $$[
    {"com":"beta-bloqueador não-seletivo (propranolol, carvedilol)","efeito":"antagoniza efeito broncodilatador","manejo":"trocar por cardiosseletivo (atenolol, bisoprolol)"},
    {"com":"diuréticos","efeito":"hipocalemia aditiva (em alta dose)","manejo":"monitorar K+ se neb contínua"},
    {"com":"digoxina","efeito":"hipocalemia potencializa toxicidade","manejo":"monitorar"},
    {"com":"IMAO ou tricíclicos","efeito":"crise hipertensiva (em IV)","manejo":"evitar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade','arritmia descompensada (relativo, IV)'],
  $$[
    {"freq":"comum","evento":"taquicardia, tremor fino"},
    {"freq":"comum","evento":"cefaleia, nervosismo"},
    {"freq":"incomum","evento":"hipocalemia (alta dose, neb contínua)"},
    {"freq":"incomum","evento":"hiperglicemia leve"},
    {"freq":"raro","evento":"arritmia (taqui supraventricular)"},
    {"freq":"raro","evento":"broncoespasmo paradoxal"}
  ]$$::jsonb,
  ARRAY['Uso de SABA ≥ 3 vezes/semana ou ≥ 1 frasco/mês = ASMA MAL CONTROLADA, escalar tratamento (ICS-formoterol)','GINA 2024: SABA isolado SEM ICS é proibido (mortalidade)','Em crise grave: associar ipratrópio nas primeiras nebulizações','Espaçador é tão eficaz quanto nebulizador em crianças e adultos cooperativos'],
  ARRAY['FC, K+ se uso intensivo / contínuo','Resposta clínica: PFE e dispneia'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=salbutamol',
  true
) ON CONFLICT (slug) DO UPDATE SET
  dose_adulto = EXCLUDED.dose_adulto,
  alertas_seguranca = EXCLUDED.alertas_seguranca,
  updated_at = now();
