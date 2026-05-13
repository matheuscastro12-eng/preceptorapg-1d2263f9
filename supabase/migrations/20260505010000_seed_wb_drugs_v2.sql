-- Phase 2.2 (continuação): seed de mais 30 drogas essenciais cobrindo
-- as classes mais usadas no Brasil (ambulatório + emergência).
-- Mesmo formato do v1: dose_adulto.indicacoes[], ajuste_renal[].clcr,
-- interacoes[].com/efeito/manejo, efeitos_adversos[].freq/evento.
-- Re-seedável via ON CONFLICT por slug.

-- ============================================================
-- 21. AMOXICILINA (sem clavulanato)
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'amoxicilina',
  'Amoxicilina',
  ARRAY['Amoxil', 'Velamox', 'Hiconcil', 'Amoxicilina Genérico'],
  'Penicilina semi-sintética',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"cápsula","concentracao":"500 mg"},
    {"forma":"comprimido","concentracao":"500 mg, 875 mg"},
    {"forma":"suspensão","concentracao":"50 mg/mL, 250 mg/5 mL, 400 mg/5 mL"},
    {"forma":"frasco-ampola IV","concentracao":"500 mg, 1 g"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"PAC leve em adulto sem comorbidade","dose":"1 g VO 8/8h","duracao":"5 dias"},
      {"para":"otite média aguda","dose":"875 mg VO 12/12h","duracao":"5–10 dias"},
      {"para":"sinusite bacteriana","dose":"875 mg VO 12/12h","duracao":"5–10 dias"},
      {"para":"erradicação H. pylori (terapia tripla)","dose":"1 g VO 12/12h + claritro 500 mg + IBP","duracao":"14 dias"},
      {"para":"profilaxia endocardite (procedimento dentário em alto risco)","dose":"2 g VO dose única 1h antes"},
      {"para":"faringoamigdalite estreptocócica","dose":"500 mg VO 12/12h","duracao":"10 dias"}
    ],
    "max_dia":"3 g/dia (até 6 g em infecção grave)"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção comunitária leve a moderada","dose":"40–50 mg/kg/dia VO div 8/8h","max":"500 mg/dose"},
      {"para":"otite média aguda (alta dose)","dose":"80–90 mg/kg/dia VO div 12/12h","max":"4 g/dia","obs":"primeira escolha em < 2a ou recorrente"}
    ]
  }$$::jsonb,
  $${"obs":"Mesma dose adulta, ajustar pela função renal."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"10–30","ajuste":"500 mg 12/12h"},
    {"clcr":"<10","ajuste":"500 mg 24/24h"},
    {"clcr":"hemodiálise","ajuste":"dose após sessão"}
  ]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Segura em todos os trimestres. Antibiótico de escolha em ITU gestacional sensível.',
  'Compatível.',
  $$[
    {"com":"alopurinol","efeito":"aumenta risco de rash","manejo":"orientar paciente, não suspende"},
    {"com":"varfarina","efeito":"prolonga TP em alguns pacientes","manejo":"monitorar INR no início e fim do tratamento"},
    {"com":"metotrexato","efeito":"reduz clearance renal do MTX","manejo":"monitorar hemograma, especialmente em alta dose"},
    {"com":"contraceptivos orais","efeito":"redução teórica de eficácia (evidência fraca)","manejo":"orientar barreira na 1ª semana se usuária preocupada"},
    {"com":"probenecida","efeito":"prolonga meia-vida (compete na excreção tubular)","manejo":"reduzir dose se possível"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a beta-lactâmicos','mononucleose infecciosa (rash em 80%)','história prévia de anafilaxia a penicilina'],
  $$[
    {"freq":"comum","evento":"diarreia, náusea"},
    {"freq":"comum","evento":"rash maculopapular não-alérgico (especialmente em mononucleose)"},
    {"freq":"incomum","evento":"candidíase oral ou vaginal"},
    {"freq":"raro","evento":"colite por C. difficile"},
    {"freq":"raro","evento":"anafilaxia"},
    {"freq":"raro","evento":"nefrite intersticial aguda (alta dose IV)"}
  ]$$::jsonb,
  ARRAY['Rash em mononucleose NÃO é alergia verdadeira','Não cobre S. aureus produtor de penicilinase, Klebsiella, anaeróbios','Não tem ação contra Mycoplasma, Legionella ou Chlamydia (não cobrir PAC com atípicos)'],
  ARRAY['Função renal em uso prolongado','Hemograma se uso > 10 dias'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=amoxicilina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 22. CEFTRIAXONA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'ceftriaxona',
  'Ceftriaxona',
  ARRAY['Rocefin', 'Ceftriax', 'Triaxin', 'Ceftriaxona Genérico'],
  'Cefalosporina de 3ª geração',
  ARRAY['IV', 'IM'],
  $$[
    {"forma":"frasco-ampola","concentracao":"500 mg, 1 g, 2 g"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"PAC moderada (internação)","dose":"1 g IV 1x/dia","duracao":"5–7 dias"},
      {"para":"PAC grave/UTI","dose":"2 g IV 1x/dia","duracao":"7–10 dias"},
      {"para":"meningite bacteriana adulta","dose":"2 g IV 12/12h","duracao":"10–14 dias","obs":"associar dexa 10 mg IV 6/6h por 4 dias se pneumococo"},
      {"para":"pielonefrite/ITU complicada","dose":"1 g IV 1x/dia","duracao":"7–14 dias"},
      {"para":"gonorreia","dose":"500 mg IM dose única + azitromicina 1 g VO","obs":"atualização CDC 2020"},
      {"para":"endocardite empírica","dose":"2 g IV 1x/dia","duracao":"4–6 semanas conforme germe"},
      {"para":"colangite/colecistite aguda","dose":"1–2 g IV 1x/dia + metronidazol 500 mg IV 8/8h"},
      {"para":"febre tifoide","dose":"2 g IV 1x/dia","duracao":"10–14 dias"}
    ],
    "max_dia":"4 g/dia"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção moderada-grave","dose":"50–75 mg/kg/dia IV/IM 1x/dia","max":"2 g/dia"},
      {"para":"meningite","dose":"100 mg/kg/dia IV div 12/12h","max":"4 g/dia"}
    ],
    "atencao":"NÃO usar em RN com hiperbilirrubinemia (desloca bilirrubina da albumina, risco kernicterus). NÃO administrar com solução cálcica em < 28 dias (precipitação fatal)."
  }$$::jsonb,
  $${"obs":"Mesma dose, eliminação biliar permite uso em DRC."}$$::jsonb,
  $$[
    {"clcr":">10","ajuste":"sem ajuste"},
    {"clcr":"<10 + insuficiência hepática","ajuste":"max 2 g/dia, monitorar nível"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia + DRC","ajuste":"max 2 g/dia"}]$$::jsonb,
  'B',
  'Segura em todos os trimestres.',
  'Compatível (concentração mínima no leite).',
  $$[
    {"com":"soluções cálcicas IV (Ringer lactato, gluconato de cálcio)","efeito":"PRECIPITAÇÃO em RN — fatal","manejo":"em < 28 dias, NUNCA administrar; em > 28 dias, separar 48h ou usar Y-site diferente"},
    {"com":"varfarina","efeito":"potencializa efeito anticoagulante","manejo":"monitorar INR"},
    {"com":"álcool","efeito":"reação dissulfiram-like","manejo":"orientar abstinência"},
    {"com":"aminoglicosídeos","efeito":"sinergia para enterococo, mas potencial nefro/oto","manejo":"monitorar função renal"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a cefalosporinas','história de anafilaxia a penicilina (reação cruzada 5–10%)','RN < 28 dias com hiperbilirrubinemia (risco kernicterus)','RN com Ringer lactato ou cálcio IV'],
  $$[
    {"freq":"comum","evento":"diarreia"},
    {"freq":"comum","evento":"flebite no local da infusão"},
    {"freq":"incomum","evento":"rash, eosinofilia"},
    {"freq":"incomum","evento":"colelitíase reversível (pseudo-cálculos por ceftriaxona biliar)"},
    {"freq":"raro","evento":"pancreatite, nefrolitíase"},
    {"freq":"raro","evento":"reação imunoalérgica grave: anemia hemolítica, neutropenia"},
    {"freq":"raro","evento":"colite por C. difficile"}
  ]$$::jsonb,
  ARRAY['Reconstituir com SF 0,9% ou SG 5%, NUNCA com solução cálcica','IM dolorosa, considerar diluir em lidocaína 1% sem vasoconstritor','Pseudo-litíase em uso prolongado: regride após suspensão','Não cobre Pseudomonas, MRSA, enterococo, anaeróbios','Excelente penetração SNC (1ª linha em meningite empírica)'],
  ARRAY['Função renal e hepática em uso > 10 dias','Hemograma se reação alérgica ou febre persistente','US abdominal se dor em hipocôndrio direito (pseudo-litíase)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ceftriaxona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 23. VANCOMICINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'vancomicina',
  'Vancomicina',
  ARRAY['Vancocina', 'Vancomicina Genérico'],
  'Glicopeptídeo (parede celular gram-positiva)',
  ARRAY['IV', 'VO (apenas para C. difficile)'],
  $$[
    {"forma":"frasco-ampola IV","concentracao":"500 mg, 1 g"},
    {"forma":"cápsula VO","concentracao":"125 mg, 250 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção sistêmica por gram-positivo (MRSA, Streptococcus resistente)","dose":"15–20 mg/kg IV (max 2 g) 12/12h ou 8/8h conforme nível","obs":"diluir em SF 0,9% ou SG 5% (5 mg/mL), infundir em ≥ 60 min/g"},
      {"para":"endocardite por MRSA ou estafilococo resistente","dose":"15–20 mg/kg IV 8/8h ou 12/12h","duracao":"4–6 semanas, conforme válvula"},
      {"para":"meningite por gram-positivo resistente","dose":"15–20 mg/kg IV 8/8h, com dose de ataque 25–30 mg/kg","obs":"associar ceftriaxona; usar maior dose por penetração SNC limitada"},
      {"para":"colite C. difficile (1ª escolha)","dose":"125 mg VO 6/6h","duracao":"10 dias","obs":"VO age localmente; IV não trata C. difficile"},
      {"para":"C. difficile fulminante","dose":"500 mg VO 6/6h ± metronidazol IV"},
      {"para":"profilaxia cirúrgica em alergia a beta-lactâmicos","dose":"15 mg/kg IV (max 2 g) iniciada 60–120 min antes da incisão"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção gram-positivo grave","dose":"60 mg/kg/dia IV div 6/6h","max":"4 g/dia"},
      {"para":"meningite","dose":"60 mg/kg/dia IV div 6/6h"}
    ]
  }$$::jsonb,
  $${"obs":"Reduzir dose conforme função renal (declínio fisiológico). Monitor de nível obrigatório."}$$::jsonb,
  $$[
    {"clcr":">90","ajuste":"15–20 mg/kg 8/8 ou 12/12h"},
    {"clcr":"50–90","ajuste":"15–20 mg/kg 12/12h"},
    {"clcr":"30–50","ajuste":"15–20 mg/kg 24/24h"},
    {"clcr":"10–30","ajuste":"15 mg/kg 48–72/72h ou monitor nível"},
    {"clcr":"hemodiálise","ajuste":"15–20 mg/kg após sessão; monitor nível"},
    {"clcr":"CRRT","ajuste":"dose individualizada por farmacocinético"}
  ]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste hepático"}]$$::jsonb,
  'C',
  'Usar se claramente necessário. Evitar 1º trimestre se possível.',
  'Compatível (absorção oral mínima pelo lactente).',
  $$[
    {"com":"aminoglicosídeos (gentamicina, amicacina)","efeito":"nefrotoxicidade aditiva","manejo":"monitorar Cr e nível diariamente"},
    {"com":"piperacilina-tazobactam","efeito":"nefrotoxicidade aditiva (controverso)","manejo":"considerar substituir por cefepime ou meropenem se uso > 72h"},
    {"com":"furosemida","efeito":"ototoxicidade aditiva (alta dose)","manejo":"infundir lento, considerar trocar"},
    {"com":"contraste iodado","efeito":"nefrotoxicidade aditiva","manejo":"hidratar, monitorar Cr"},
    {"com":"anestésicos / bloqueadores neuromusculares","efeito":"bloqueio prolongado","manejo":"monitorar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade prévia','reação anafilática prévia documentada'],
  $$[
    {"freq":"comum","evento":"síndrome do homem vermelho (rash + prurido + flush) por infusão rápida"},
    {"freq":"comum","evento":"flebite no local da infusão"},
    {"freq":"incomum","evento":"nefrotoxicidade dose-dependente (5–10%)"},
    {"freq":"incomum","evento":"ototoxicidade (especialmente em níveis > 30 mg/L sustentados)"},
    {"freq":"incomum","evento":"trombocitopenia, neutropenia"},
    {"freq":"raro","evento":"DRESS (reação grave com eosinofilia)"},
    {"freq":"raro","evento":"anafilaxia verdadeira"}
  ]$$::jsonb,
  ARRAY['Síndrome do homem vermelho NÃO é alergia, é histaminérgica por infusão rápida — desacelerar infusão','Vale (vancocinemia mínima) ideal: 15–20 mg/L em infecção grave; AUC24h 400–600 mg·h/L é o alvo moderno (IDSA 2020)','Monitorar nível antes da 4ª dose e a cada 3–7 dias','VO NÃO é absorvido — usar APENAS para C. difficile colônico','Não cobre gram-negativo, anaeróbios, atípicos'],
  ARRAY['Vale antes da 4ª dose, depois 3/3–7/7 dias','Função renal diária','Hemograma com plaquetas semanal','Audiometria se uso > 14 dias ou > 65 anos'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=vancomicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 24. CLINDAMICINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'clindamicina',
  'Clindamicina',
  ARRAY['Dalacin C', 'Cleocin', 'Clindamicina Genérico'],
  'Lincosamida (ribossomo 50S)',
  ARRAY['VO', 'IV', 'tópico'],
  $$[
    {"forma":"cápsula","concentracao":"75 mg, 150 mg, 300 mg"},
    {"forma":"ampola IV","concentracao":"150 mg/mL"},
    {"forma":"creme vaginal","concentracao":"20 mg/g"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"celulite/erisipela com cobertura MRSA-CA","dose":"300–450 mg VO 6/6h","duracao":"5–10 dias"},
      {"para":"infecção pele/partes moles grave","dose":"600 mg IV 8/8h","duracao":"7–14 dias"},
      {"para":"fasceíte necrotizante (associada a beta-lactâmico)","dose":"900 mg IV 8/8h","obs":"reduz produção de toxina por estreptococo (efeito anti-toxina)"},
      {"para":"abscesso pulmonar / pneumonia aspirativa","dose":"600 mg IV 8/8h ou 300–450 mg VO 6/6h"},
      {"para":"profilaxia endocardite em alergia a penicilina","dose":"600 mg VO ou IV dose única 1h antes do procedimento"},
      {"para":"acne (uso tópico)","dose":"gel 1% 2x/dia"},
      {"para":"vaginose bacteriana (uso vaginal)","dose":"creme 2% 5g intravaginal noite × 7 dias"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"infecção comunitária","dose":"20–40 mg/kg/dia VO div 6/6 ou 8/8h","max":"450 mg/dose"},
      {"para":"infecção grave (IV)","dose":"25–40 mg/kg/dia IV div 6/6 ou 8/8h","max":"600 mg/dose"}
    ]
  }$$::jsonb,
  $${"obs":"Sem ajuste rotineiro por idade."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste (eliminação hepática)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose"}]$$::jsonb,
  'B',
  'Segura em todos os trimestres. Uso comum em obstetrícia (corioamnionite, profilaxia GBS em alergia a penicilina).',
  'Compatível.',
  $$[
    {"com":"bloqueadores neuromusculares (succinilcolina, rocurônio)","efeito":"prolonga bloqueio","manejo":"monitorar TOF"},
    {"com":"eritromicina","efeito":"antagonismo (mesmo sítio ribossomal)","manejo":"NÃO combinar"},
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a clindamicina ou lincomicina','colite pseudomembranosa prévia','história de doença GI grave (relativo)'],
  $$[
    {"freq":"comum","evento":"diarreia (até 30%)"},
    {"freq":"incomum","evento":"COLITE POR C. DIFFICILE — clindamicina é o ATB de maior risco; pode aparecer até 8 semanas após o tratamento"},
    {"freq":"incomum","evento":"rash"},
    {"freq":"raro","evento":"hepatotoxicidade"},
    {"freq":"raro","evento":"síndrome de Stevens-Johnson"},
    {"freq":"raro","evento":"agranulocitose"}
  ]$$::jsonb,
  ARRAY['Maior fator de risco isolado para C. difficile entre todos os antibióticos','Suspender e investigar imediatamente se diarreia com sangue, febre ou desidratação','IV: infundir em ≥ 30 min (bolus rápido pode causar parada cardíaca)','Cobre MRSA comunitário (CA-MRSA), anaeróbios da boca; NÃO cobre enterobactérias gram-negativas'],
  ARRAY['Função hepática se uso > 10 dias','Sintomas GI: diarreia profusa = parar e investigar C. difficile'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=clindamicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 25. SULFAMETOXAZOL + TRIMETOPRIM (BACTRIM)
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'sulfametoxazol-trimetoprim',
  'Sulfametoxazol + Trimetoprim (SMX-TMP)',
  ARRAY['Bactrim', 'Septra', 'Bactrin'],
  'Sulfa + diaminopirimidina (sinergia em via do folato)',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"comprimido","concentracao":"400/80 mg"},
    {"forma":"comprimido F","concentracao":"800/160 mg (forte/duplo)"},
    {"forma":"suspensão","concentracao":"200/40 mg / 5 mL"},
    {"forma":"ampola IV","concentracao":"400/80 mg / 5 mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"ITU não complicada (mulher)","dose":"800/160 mg VO 12/12h","duracao":"3 dias","obs":"se resistência local < 20%"},
      {"para":"ITU complicada / pielonefrite","dose":"800/160 mg VO 12/12h","duracao":"7–14 dias"},
      {"para":"profilaxia ITU recorrente","dose":"200/40 mg VO 1x/noite ou pós-coital","duracao":"6 meses"},
      {"para":"infecção pele MRSA-CA (1ª escolha em ambulatório)","dose":"800/160 mg VO 12/12h","duracao":"7 dias"},
      {"para":"pneumocistose (PCP) tratamento","dose":"15–20 mg/kg/dia (TMP) IV ou VO div 6/6 ou 8/8h","duracao":"21 dias","obs":"adicionar prednisona se PaO2 < 70 ou A-a > 35"},
      {"para":"pneumocistose profilaxia","dose":"800/160 mg VO 1x/dia ou 3x/semana"},
      {"para":"toxoplasmose cerebral (alternativa)","dose":"5 mg/kg/dose (TMP) VO 12/12h","duracao":"6 semanas"},
      {"para":"nocardiose","dose":"15 mg/kg/dia (TMP) IV/VO div 6/6h","duracao":"6–12 meses"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"ITU / OMA","dose":"6–10 mg/kg/dia (TMP) VO div 12/12h","max":"160 mg TMP/dose"},
      {"para":"PCP profilaxia","dose":"5 mg/kg/dia (TMP) VO 1x/dia"}
    ],
    "atencao":"Evitar < 2 meses (risco kernicterus por deslocar bilirrubina)."
  }$$::jsonb,
  $${"obs":"Maior risco de hipercalemia e nefrotoxicidade. Reduzir dose 50% se clcr 15–30."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"15–30","ajuste":"reduzir 50% da dose"},
    {"clcr":"<15","ajuste":"contraindicado (relativo) ou reduzir 75%"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"contraindicado"}]$$::jsonb,
  'C/D',
  'EVITAR 1º TRIMESTRE (defeitos do tubo neural por antifolato) e 3º TRIMESTRE (kernicterus). 2º trimestre: usar com cautela e ácido fólico.',
  'Evitar em RN < 2 meses, ictérico ou prematuro.',
  $$[
    {"com":"varfarina","efeito":"INR ↑ até 4× (inibição CYP2C9 + deslocamento proteico)","manejo":"reduzir varfarina 50% e monitorar INR a cada 3 dias"},
    {"com":"metotrexato","efeito":"toxicidade hematológica grave (efeito antifolato aditivo)","manejo":"NÃO combinar"},
    {"com":"IECA / BRA / espironolactona","efeito":"hipercalemia grave (especialmente em idoso)","manejo":"monitorar K+ em 3–5 dias"},
    {"com":"sulfonilureias (glibenclamida)","efeito":"hipoglicemia","manejo":"monitorar glicemia"},
    {"com":"fenitoína","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"ciclosporina","efeito":"nefrotoxicidade aditiva","manejo":"monitorar Cr"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a sulfas','deficiência G6PD (anemia hemolítica)','anemia megaloblástica por deficiência de folato','clcr < 15 (relativo)','RN < 2 meses, ictérico ou prematuro','3º trimestre gestação','hepatopatia grave'],
  $$[
    {"freq":"comum","evento":"náusea, rash leve"},
    {"freq":"comum","evento":"hipercalemia (efeito tipo amilorida do TMP)"},
    {"freq":"comum","evento":"aumento leve de creatinina (TMP inibe secreção tubular, sem afetar TFG real)"},
    {"freq":"incomum","evento":"hiponatremia, hipoglicemia"},
    {"freq":"incomum","evento":"colestase, hepatite"},
    {"freq":"raro","evento":"síndrome de Stevens-Johnson / NET (uma das principais causas)"},
    {"freq":"raro","evento":"anemia hemolítica em G6PD-deficiente"},
    {"freq":"raro","evento":"agranulocitose, anemia aplástica"},
    {"freq":"raro","evento":"meningite asséptica"}
  ]$$::jsonb,
  ARRAY['SUSPENDER ao primeiro sinal de rash em mucosa, descamação ou bolha (risco SSJ/NET)','Verificar K+ em pacientes em IECA/BRA/espironolactona em 3–5 dias','Hidratar bem para evitar cristalúria','Aumento de Cr de até 0,4 mg/dL é esperado e benigno (efeito tubular do TMP)','Cobre MRSA-CA, mas não estreptococo grupo A — evitar em erisipela'],
  ARRAY['Hemograma e função renal/hepática + K+ a cada 5–7 dias se uso > 14 dias'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sulfametoxazol+trimetoprim',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 26. DOXICICLINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'doxiciclina',
  'Doxiciclina',
  ARRAY['Vibramicina', 'Doxitec', 'Doxiciclina Genérico'],
  'Tetraciclina',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"cápsula","concentracao":"100 mg"},
    {"forma":"ampola IV","concentracao":"100 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DPI / DST inflamatória pélvica (com ceftriaxona)","dose":"100 mg VO 12/12h","duracao":"14 dias"},
      {"para":"PAC ambulatorial (alternativa em alergia a beta-lactâmico)","dose":"100 mg VO 12/12h","duracao":"5–7 dias"},
      {"para":"infecção MRSA-CA pele","dose":"100 mg VO 12/12h","duracao":"7 dias"},
      {"para":"clamídia / uretrite","dose":"100 mg VO 12/12h","duracao":"7 dias","obs":"alternativa à azitromicina"},
      {"para":"sífilis primária/secundária com alergia a penicilina","dose":"100 mg VO 12/12h","duracao":"14 dias","obs":"penicilina é primeira escolha"},
      {"para":"acne severa (uso prolongado)","dose":"100 mg VO 1x/dia","duracao":"3–6 meses"},
      {"para":"profilaxia malária (Plasmodium falciparum em viagem)","dose":"100 mg VO 1x/dia","duracao":"1–2 dias antes até 4 sem após"},
      {"para":"leptospirose (forma leve ambulatorial)","dose":"100 mg VO 12/12h","duracao":"7 dias"},
      {"para":"doença de Lyme","dose":"100 mg VO 12/12h","duracao":"10–21 dias"},
      {"para":"riquetsioses (febre maculosa brasileira)","dose":"100 mg VO ou IV 12/12h","duracao":"até 3 dias após defervescência (mín 7 dias)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"riquetsiose / DST","dose":"4,4 mg/kg/dia VO div 12/12h","max":"100 mg/dose","obs":"AAP 2021: pode ser usada em < 8 anos por curso curto (rickettsiose) sem risco significativo de manchas dentárias"}
    ],
    "atencao":"Tradicionalmente evitada < 8 anos por descoloração dentária; em rickettsiose é o tratamento de escolha mesmo em criança."
  }$$::jsonb,
  $${"obs":"Evitar tomar deitado e antes de dormir (risco esofagite)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste (eliminação não-renal)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"cautela"}]$$::jsonb,
  'D',
  'CONTRAINDICADA (descoloração dentária fetal a partir de 16 semanas, hepatotoxicidade materna em alta dose IV).',
  'Evitar (passa para o leite, descoloração dentária do lactente).',
  $$[
    {"com":"antiácidos / cálcio / ferro / magnésio / sucralfato / lácteos","efeito":"reduz absorção em até 80%","manejo":"separar 2h antes ou 6h depois"},
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},
    {"com":"isotretinoína","efeito":"hipertensão intracraniana benigna aditiva","manejo":"NÃO combinar"},
    {"com":"contraceptivos orais","efeito":"redução teórica de eficácia","manejo":"orientar barreira na 1ª semana"},
    {"com":"rifampicina, fenitoína, carbamazepina","efeito":"reduz nível","manejo":"aumentar dose ou trocar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a tetraciclinas','gestação (relativo, evitar)','crianças < 8 anos exceto rickettsiose','hepatopatia grave'],
  $$[
    {"freq":"comum","evento":"náusea, dor epigástrica"},
    {"freq":"comum","evento":"esofagite (especialmente se tomar deitado)"},
    {"freq":"comum","evento":"fotossensibilidade (orientar fotoproteção)"},
    {"freq":"incomum","evento":"candidíase oral ou vaginal"},
    {"freq":"raro","evento":"hipertensão intracraniana benigna (cefaleia, visão turva, papiledema)"},
    {"freq":"raro","evento":"hepatotoxicidade (especialmente em altas doses IV)"},
    {"freq":"raro","evento":"DRESS, descoloração dentária fetal"}
  ]$$::jsonb,
  ARRAY['Tomar com bastante água, em pé, NUNCA deitado (esofagite ulcerativa)','Fotoproteção rigorosa em uso prolongado','Cobre Rickettsia, Borrelia, Mycoplasma, Chlamydia, Leptospira (1ª linha em rickettsiose)','Não cobre estreptococo do grupo A nem enterococo','AAP 2021: relaxou restrição < 8 anos para rickettsioses (mancha dentária mínima em curso curto)'],
  ARRAY['Hemograma e função hepática se uso > 30 dias'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=doxiciclina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 27. NITROFURANTOÍNA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'nitrofurantoina',
  'Nitrofurantoína',
  ARRAY['Macrodantina', 'Nitrofurantoína Genérico'],
  'Nitrofurano (uso urinário)',
  ARRAY['VO'],
  $$[
    {"forma":"cápsula","concentracao":"100 mg (macrocristal)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"cistite aguda não complicada (mulher)","dose":"100 mg VO 6/6h","duracao":"5 dias","obs":"PRIMEIRA linha (IDSA/SBPT) — sem resistência cruzada com beta-lactâmicos"},
      {"para":"profilaxia ITU recorrente","dose":"50–100 mg VO 1x/noite","duracao":"6 meses"},
      {"para":"profilaxia ITU pós-coital","dose":"50–100 mg VO após relação"}
    ],
    "obs_geral":"NÃO tratar pielonefrite (concentração tecidual baixa). USO EXCLUSIVAMENTE URINÁRIO."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"cistite (≥ 1 mês)","dose":"5–7 mg/kg/dia VO div 6/6h","max":"100 mg/dose"}
    ],
    "atencao":"Contraindicada em < 1 mês (anemia hemolítica)."
  }$$::jsonb,
  $${"obs":"Beers Criteria: EVITAR em ≥ 65 anos com clcr < 60 (ineficaz e tóxica). Reavaliar idoso já em uso prolongado."}$$::jsonb,
  $$[
    {"clcr":">60","ajuste":"sem ajuste"},
    {"clcr":"<60","ajuste":"INEFICAZ — concentração urinária inadequada; trocar por outro ATB"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"contraindicado"}]$$::jsonb,
  'B',
  'Segura. Evitar a partir de 38 semanas e periparto (risco anemia hemolítica neonatal por imaturidade enzimática).',
  'Evitar em RN < 1 mês ou com deficiência de G6PD.',
  $$[
    {"com":"antiácidos com magnésio","efeito":"reduz absorção","manejo":"separar 2h"},
    {"com":"probenecida / sulfimpirazona","efeito":"aumenta nível sistêmico (toxicidade) e reduz urinário (eficácia)","manejo":"NÃO combinar"}
  ]$$::jsonb,
  ARRAY['clcr < 60','deficiência de G6PD','RN < 1 mês','3º trimestre tardio (≥ 38 semanas)','hepatopatia prévia ou neuropatia periférica por nitrofurano','anúria/oligúria'],
  $$[
    {"freq":"comum","evento":"náusea, anorexia (tomar com alimento)"},
    {"freq":"comum","evento":"urina amarelo-marrom (benigno)"},
    {"freq":"incomum","evento":"cefaleia, tontura"},
    {"freq":"incomum (uso prolongado > 6 meses)","evento":"pneumonite intersticial crônica / fibrose pulmonar"},
    {"freq":"raro","evento":"pneumonite aguda alérgica (febre + tosse + dispneia em 1ª semana)"},
    {"freq":"raro","evento":"hepatite autoimune crônica"},
    {"freq":"raro","evento":"neuropatia periférica (uso prolongado em DRC)"},
    {"freq":"raro","evento":"anemia hemolítica em G6PD-deficiente"}
  ]$$::jsonb,
  ARRAY['Tomar com alimento para reduzir náusea','Suspender se tosse/dispneia novas (pneumonite)','Em uso > 6 meses (profilaxia): RX tórax basal e a cada 6 meses','Não tratar pielonefrite, prostatite, ITU em homem ou ITU complicada','Beers Criteria 2023: evitar em > 65 com clcr < 60'],
  ARRAY['RX tórax e função hepática a cada 6 meses se uso prolongado'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=nitrofurantoina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 28. ENALAPRIL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'enalapril',
  'Maleato de enalapril',
  ARRAY['Renitec', 'Vasopril', 'Eupressin', 'Enalapril Genérico'],
  'Inibidor da enzima conversora de angiotensina (IECA)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"5 mg, 10 mg, 20 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS","dose":"5–10 mg VO 1x/dia titular até 20 mg 12/12h","obs":"meia-vida 11h, frequentemente 12/12h em uso real"},
      {"para":"IC FEr","dose":"2,5 mg VO 12/12h titular até 10–20 mg 12/12h (CONSENSUS, SOLVD)","obs":"reduz mortalidade"},
      {"para":"pós-IAM com disfunção VE","dose":"2,5 mg VO 12/12h titular","obs":"iniciar 24–48h pós-IAM"},
      {"para":"nefropatia diabética / não-diabética","dose":"5–10 mg VO 1x/dia titular","obs":"reduz progressão"}
    ],
    "max_dia":"40 mg/dia"
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS / IC pediátrica","dose":"0,1 mg/kg/dia VO 1x ou 12/12h titular","max":"0,5 mg/kg/dia ou 40 mg/dia"}
    ]
  }$$::jsonb,
  $${"obs":"Iniciar com 2,5 mg/dia e titular gradualmente — risco de hipotensão na 1ª dose."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"10–30","ajuste":"iniciar 2,5 mg 1x/dia, titular"},
    {"clcr":"<10","ajuste":"iniciar 2,5 mg em dias alternados"},
    {"clcr":"hemodiálise","ajuste":"2,5 mg/dia"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"sem ajuste, monitorar"}]$$::jsonb,
  'D',
  'CONTRAINDICADO em todos os trimestres. Causa oligoidrâmnio, IRA neonatal, hipoplasia pulmonar, contratura/hipoplasia craniana.',
  'Compatível em RN a termo (preferir captopril por meia-vida curta se necessário).',
  $$[
    {"com":"AINE","efeito":"reduz efeito anti-HTN + IRA","manejo":"evitar uso crônico de AINE"},
    {"com":"diuréticos poupadores de K (espironolactona, amilorida) / suplemento K","efeito":"hipercalemia","manejo":"monitorar K+ a cada 1–2 semanas"},
    {"com":"lítio","efeito":"aumenta nível","manejo":"monitorar litemia"},
    {"com":"BRA (losartana)","efeito":"duplo bloqueio SRAA — IRA, hiperK","manejo":"NÃO combinar"},
    {"com":"sacubitril (sacubitril/valsartan)","efeito":"angioedema grave","manejo":"separar 36h ao trocar"},
    {"com":"alopurinol","efeito":"síndrome semelhante a Stevens-Johnson","manejo":"monitorar pele"},
    {"com":"insulina/sulfonilureia","efeito":"potencializa hipoglicemia","manejo":"monitorar glicemia"}
  ]$$::jsonb,
  ARRAY['gestação (todos os trimestres)','angioedema prévio por IECA','hipersensibilidade','estenose bilateral de artéria renal','hipercalemia > 5,5 não corrigida','hiperaldosteronismo primário'],
  $$[
    {"freq":"comum (10–20%)","evento":"tosse seca persistente (bradicinina)"},
    {"freq":"comum","evento":"hipotensão postural"},
    {"freq":"comum","evento":"hipercalemia leve"},
    {"freq":"incomum","evento":"piora função renal (estenose bilateral)"},
    {"freq":"incomum","evento":"hiponatremia"},
    {"freq":"raro","evento":"angioedema (1:200, mais comum em afrodescendentes)"},
    {"freq":"raro","evento":"agranulocitose, neutropenia"},
    {"freq":"raro","evento":"hepatotoxicidade colestática"}
  ]$$::jsonb,
  ARRAY['Causa tosse em até 20% — substituir por BRA (losartana) se intolerável','Suspender em diarreia/desidratação grave (risco IRA)','Verificar Cr e K+ 1–2 semanas após início','Angioedema é emergência: suspender PERMANENTEMENTE; não trocar por BRA sem cuidado','Em afrodescendente: BRA pode ser preferencial pelo risco de angioedema'],
  ARRAY['Cr e K+ basais e 1–2 semanas após mudança de dose'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=enalapril',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 29. ATENOLOL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'atenolol',
  'Atenolol',
  ARRAY['Atenol', 'Ablok', 'Atenolol Genérico'],
  'Beta-bloqueador cardiosseletivo (β1)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"25 mg, 50 mg, 100 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS (NÃO 1ª linha em idoso ou sem cardiopatia, ESC 2023)","dose":"25–50 mg VO 1x/dia titular até 100 mg 1x/dia","obs":"meia-vida 6–9h pode justificar 12/12h em alguns; preferir bisoprolol/carvedilol em IC"},
      {"para":"angina estável","dose":"50–100 mg VO 1x/dia"},
      {"para":"controle FC em FA","dose":"25–100 mg VO 1x/dia"},
      {"para":"profilaxia enxaqueca","dose":"50–100 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"HAS / arritmia","dose":"0,5–1 mg/kg/dia VO 1x/dia titular","max":"2 mg/kg/dia"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de bradicardia e fadiga. Iniciar 25 mg/dia."}$$::jsonb,
  $$[
    {"clcr":">35","ajuste":"sem ajuste"},
    {"clcr":"15–35","ajuste":"max 50 mg/dia"},
    {"clcr":"<15","ajuste":"max 25 mg/dia ou em dias alternados"},
    {"clcr":"hemodiálise","ajuste":"25–50 mg após sessão"}
  ]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste hepático (eliminação renal)"}]$$::jsonb,
  'D',
  'Evitar (preferir labetalol ou metoprolol). Risco de RCIU e bradicardia neonatal.',
  'Evitar (concentra no leite, risco bradicardia neonatal).',
  $$[
    {"com":"verapamil ou diltiazem","efeito":"bradicardia grave, BAV","manejo":"NÃO combinar"},
    {"com":"clonidina","efeito":"hipertensão rebote se suspensão de clonidina","manejo":"suspender atenolol primeiro"},
    {"com":"insulina/hipoglicemiante","efeito":"mascara hipoglicemia (taquicardia)","manejo":"orientar diabético; preferir cardiosseletivo (atenolol ok)"},
    {"com":"AINE","efeito":"reduz efeito anti-HTN","manejo":"evitar uso crônico"},
    {"com":"epinefrina","efeito":"hipertensão paradoxal (alfa sem oposição)","manejo":"cuidado em anestesia local"}
  ]$$::jsonb,
  ARRAY['BAV 2º ou 3º grau sem MP','bradicardia < 50 bpm sintomática','choque cardiogênico','asma grave','hipotensão','feocromocitoma sem alfa-bloqueio prévio'],
  $$[
    {"freq":"comum","evento":"fadiga, tontura"},
    {"freq":"comum","evento":"bradicardia, frio em extremidades"},
    {"freq":"incomum","evento":"broncoespasmo (cardiosseletividade reduz mas não anula)"},
    {"freq":"incomum","evento":"depressão, distúrbio do sono, pesadelos"},
    {"freq":"incomum","evento":"disfunção erétil"},
    {"freq":"raro","evento":"piora claudicação intermitente"}
  ]$$::jsonb,
  ARRAY['NÃO suspender abruptamente (risco rebote anginoso e hipertensivo) — desmamar em 1–2 semanas','Em DM: pode mascarar taquicardia da hipoglicemia; sintomas vagais (sudorese) preservados','ESC/ACC removeu beta-bloqueador como 1ª linha em HAS sem cardiopatia (especialmente idoso)','Atenolol é hidrofílico — atravessa pouco BHE, menos pesadelos que propranolol'],
  ARRAY['FC, PA, sinais de descompensação'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=atenolol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 30. SINVASTATINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'sinvastatina',
  'Sinvastatina',
  ARRAY['Zocor', 'Sinvalip', 'Vaslip', 'Sinvastatina Genérico'],
  'Estatina (HMG-CoA redutase) — moderada intensidade',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"10 mg, 20 mg, 40 mg, 80 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"prevenção CV moderada intensidade","dose":"20–40 mg VO 1x/noite","obs":"meia-vida curta — TOMAR À NOITE quando síntese de colesterol é maior"},
      {"para":"prevenção secundária CV","dose":"40 mg VO 1x/noite (max indicado)","obs":"sinva 80 mg foi RESTRITA pela FDA em 2011 por rabdomiólise; preferir atorva 40–80 mg"},
      {"para":"hipercolesterolemia heterozigótica","dose":"40 mg VO 1x/noite"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"hipercolesterolemia familiar (≥ 10a)","dose":"10 mg VO 1x/noite, max 20 mg"}
    ]
  }$$::jsonb,
  $${"obs":"Risco aumentado de miopatia em > 65a — preferir doses moderadas (≤ 40 mg)."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"iniciar 5 mg/dia, max 10 mg/dia (risco miopatia)"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia ativa, TGO/TGP > 3x LSN persistente","ajuste":"contraindicado"}]$$::jsonb,
  'X',
  'CONTRAINDICADA. Suspender pré-concepção.',
  'Contraindicada.',
  $$[
    {"com":"anlodipino","efeito":"aumenta sinva — limitar 20 mg","manejo":"max sinva 20 mg/dia se anlo concomitante"},
    {"com":"diltiazem, verapamil","efeito":"aumenta sinva — limitar 10 mg","manejo":"max sinva 10 mg/dia"},
    {"com":"amiodarona","efeito":"aumenta sinva — limitar 20 mg","manejo":"max sinva 20 mg/dia"},
    {"com":"claritromicina, eritromicina, itraconazol, cetoconazol, ciclosporina, ritonavir","efeito":"rabdomiólise","manejo":"NÃO combinar; suspender sinva durante curso de claritro/cetoconazol"},
    {"com":"gemfibrozila","efeito":"rabdomiólise (maior do que com atorva)","manejo":"CONTRAINDICADO; preferir fenofibrato"},
    {"com":"varfarina","efeito":"potencializa","manejo":"monitorar INR"},
    {"com":"sucos pomelo (grapefruit)","efeito":"aumenta nível","manejo":"evitar grandes quantidades"},
    {"com":"colchicina","efeito":"miopatia aditiva (DRC)","manejo":"cautela"}
  ]$$::jsonb,
  ARRAY['gestação','lactação','hepatopatia ativa','TGO/TGP > 3x LSN persistente','rabdomiólise prévia por estatina','uso concomitante com gemfibrozila ou inibidores potentes do CYP3A4'],
  $$[
    {"freq":"comum","evento":"mialgia (5–10%)"},
    {"freq":"incomum","evento":"miopatia (CK > 10x LSN)"},
    {"freq":"raro","evento":"rabdomiólise (especialmente sinva 80 mg ou em interações)"},
    {"freq":"comum","evento":"hepatotoxicidade leve (TGO/TGP < 3x), reversível"},
    {"freq":"incomum","evento":"hiperglicemia leve, novo DM"},
    {"freq":"raro","evento":"miopatia necrosante autoimune"},
    {"freq":"raro","evento":"síndrome de neuropatia periférica"}
  ]$$::jsonb,
  ARRAY['Sinva 80 mg DESCONTINUADA pela FDA — usar atorvastatina/rosuvastatina se precisar alta intensidade','Tomar à noite (síntese hepática colesterol pico noturno)','Verificar lista de interações por CYP3A4 ANTES de prescrever','Mialgia leve não exige suspensão; CK > 10x ou sintomas graves: parar'],
  ARRAY['Lipidograma 4–12 sem após início e a cada 6–12 meses','TGO/TGP basal','CK só se sintomas musculares'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sinvastatina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 31. ESPIRONOLACTONA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'espironolactona',
  'Espironolactona',
  ARRAY['Aldactone', 'Aldosterin', 'Espironolactona Genérico'],
  'Antagonista do receptor mineralocorticoide (poupador de K+)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"25 mg, 50 mg, 100 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"IC FEr (FE ≤ 40%, NYHA II–IV)","dose":"12,5–25 mg VO 1x/dia titular até 25–50 mg 1x/dia (RALES, EMPHASIS-HF)","obs":"reduz mortalidade; titular se K+ < 5,0"},
      {"para":"HAS resistente (4ª droga após IECA/BRA + BCC + tiazídico)","dose":"25 mg VO 1x/dia titular até 50 mg (PATHWAY-2)"},
      {"para":"hiperaldosteronismo primário","dose":"100–400 mg VO 1x/dia"},
      {"para":"ascite cirrótica","dose":"100 mg VO 1x/dia titular até 400 mg, sempre com furosemida 40 mg (proporção 100:40)"},
      {"para":"hirsutismo / acne (off-label, mulher)","dose":"50–200 mg VO 1x/dia"},
      {"para":"síndrome dos ovários policísticos","dose":"50–100 mg VO 1x/dia (hirsutismo)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"edema/ascite","dose":"1–3 mg/kg/dia VO 1x ou 12/12h"}
    ]
  }$$::jsonb,
  $${"obs":"Risco maior de hipercalemia e ginecomastia. Iniciar 12,5 mg/dia."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"30–50","ajuste":"max 25 mg/dia, monitorar K+ semanal"},
    {"clcr":"<30","ajuste":"contraindicado em IC; usar com cautela em ascite"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"sem ajuste, é tratamento de ascite"}]$$::jsonb,
  'C',
  'Cautela. Risco teórico de feminização de feto masculino.',
  'Compatível.',
  $$[
    {"com":"IECA / BRA","efeito":"hipercalemia grave","manejo":"verificar K+ basal e em 1, 4 e 12 semanas"},
    {"com":"AINE","efeito":"reduz efeito + nefrotoxicidade","manejo":"evitar uso crônico"},
    {"com":"suplemento de K+ / sucos ricos em K","efeito":"hipercalemia","manejo":"orientar dieta"},
    {"com":"digoxina","efeito":"aumenta nível digital","manejo":"monitorar"},
    {"com":"lítio","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"trimetoprim / heparina","efeito":"hipercalemia aditiva","manejo":"monitorar K+"}
  ]$$::jsonb,
  ARRAY['hipercalemia > 5,0','clcr < 30','doença de Addison','anúria','gestação (relativo)','uso concomitante com eplerenona'],
  $$[
    {"freq":"comum","evento":"hipercalemia (causa mais comum de suspensão)"},
    {"freq":"comum","evento":"ginecomastia dolorosa em homem (até 10%, dose-dependente)"},
    {"freq":"comum","evento":"distúrbio menstrual / amenorreia em mulher"},
    {"freq":"incomum","evento":"hiponatremia, acidose metabólica hiperclorêmica"},
    {"freq":"incomum","evento":"impotência, redução de libido"},
    {"freq":"raro","evento":"hepatite, agranulocitose"}
  ]$$::jsonb,
  ARRAY['Verificar K+ e Cr basais e em 1, 4, 12 semanas após início ou aumento de dose','Suspender se K+ > 5,5 ou Cr ↑ > 30%','Em IC, é o terceiro pilar (junto com IECA + beta-bloq) — não esquecer','Ginecomastia dolorosa: trocar por eplerenona se disponível'],
  ARRAY['K+ e Cr a cada 1, 4, 12 semanas no início; depois 4–6/4–6 meses','Sintomas de hipercalemia (parestesia, fraqueza)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=espironolactona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 32. CLOPIDOGREL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'clopidogrel',
  'Clopidogrel',
  ARRAY['Plavix', 'Iscover', 'Clopidogrel Genérico'],
  'Antiplaquetário tienopiridínico (inibidor P2Y12)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"75 mg, 300 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"SCA com intervenção (DAPT com AAS)","dose":"ataque 600 mg VO + manutenção 75 mg/dia VO","duracao":"12 meses (DAPT)","obs":"ticagrelor é preferido em SCA (PLATO); clopi se não tolera ticagrelor"},
      {"para":"SCA sem intervenção / pós-trombolítico","dose":"ataque 300 mg + 75 mg/dia","duracao":"12 meses"},
      {"para":"prevenção secundária DAOP / DAC estável","dose":"75 mg VO 1x/dia (perpétuo)"},
      {"para":"AVC isquêmico não-cardioembólico (alternativa ao AAS)","dose":"75 mg VO 1x/dia"},
      {"para":"AVC menor / AIT alto risco (CHANCE/POINT)","dose":"DAPT com AAS por 21 dias + manutenção monoterapia","duracao":"21 dias DAPT"},
      {"para":"alergia a AAS","dose":"75 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${"indicacoes":[]}$$::jsonb,
  $${"obs":"Maior risco de sangramento. Em ≥ 75 anos pós-IAM: pular dose de ataque, manutenção 75 mg/dia (CLARITY-TIMI)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"contraindicado"}]$$::jsonb,
  'B',
  'Sem dados suficientes — usar se necessário (cardiologia).',
  'Sem dados — evitar.',
  $$[
    {"com":"omeprazol / esomeprazol","efeito":"reduz ativação do clopi (inibição CYP2C19)","manejo":"preferir pantoprazol em paciente cardiológico em DAPT"},
    {"com":"AAS","efeito":"sinergia (DAPT) + risco hemorrágico","manejo":"associar IBP em > 60a ou risco GI"},
    {"com":"AINE","efeito":"sangramento aditivo","manejo":"evitar uso crônico"},
    {"com":"varfarina / DOACs","efeito":"sangramento grave (terapia tripla)","manejo":"limitar duração ao mínimo (1–6 meses)"},
    {"com":"ISRS","efeito":"sangramento aditivo","manejo":"associar IBP"}
  ]$$::jsonb,
  ARRAY['sangramento ativo','úlcera péptica ativa','AVC hemorrágico','hipersensibilidade','hepatopatia grave','7 dias antes de cirurgia eletiva (5 dias mínimo)'],
  $$[
    {"freq":"comum","evento":"hematoma fácil, equimose"},
    {"freq":"comum","evento":"sangramento GI (especialmente em DAPT)"},
    {"freq":"incomum","evento":"púrpura trombocitopênica trombótica (PTT, raro mas grave)"},
    {"freq":"incomum","evento":"dispepsia, diarreia"},
    {"freq":"raro","evento":"agranulocitose, anemia aplástica"},
    {"freq":"raro","evento":"hepatotoxicidade"}
  ]$$::jsonb,
  ARRAY['Suspender 5 dias antes de cirurgia eletiva (NÃO suspender em stent recente — discutir com cardio)','BLACK BOX FDA: pacientes com má-metabolização CYP2C19 (genotípica) têm resposta reduzida — em SCA preferir ticagrelor/prasugrel','Não usar com omeprazol em SCA — preferir pantoprazol'],
  ARRAY['Hemograma se sangramento ou febre','Hb/Ht periódico em DAPT'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=clopidogrel',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 33. VARFARINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'varfarina',
  'Varfarina sódica',
  ARRAY['Marevan', 'Coumadin', 'Varfarina Genérico'],
  'Anticoagulante oral (inibidor vitamina K — fatores II, VII, IX, X)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"1 mg, 2,5 mg, 5 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"FA não-valvar (em pacientes elegíveis a varfarina)","dose":"5 mg VO 1x/dia (3 mg em > 80a, hepatopata, baixo peso) titular pelo INR","obs":"meta INR 2,0–3,0; DOACs preferidos pela maioria das diretrizes salvo válvula mecânica/estenose mitral grave"},
      {"para":"prótese valvar mecânica","dose":"titular pelo INR","obs":"meta 2,5–3,5 (válvula mitral) ou 2,0–3,0 (aórtica baixa risco)"},
      {"para":"TEV (TEP / TVP)","dose":"5 mg/dia, sobreposto a heparina por ≥ 5 dias até INR > 2,0 em 2 dias consecutivos","duracao":"3 meses (provocado), 6+ meses (não-provocado), tempo indeterminado em recorrência"},
      {"para":"profilaxia TEV em paciente com SAF / câncer","dose":"titular pelo INR (alvo 2,0–3,0)"}
    ],
    "obs_geral":"INR semanal até estabilizar, depois mensal."
  }$$::jsonb,
  $${"indicacoes":[]}$$::jsonb,
  $${"obs":"Iniciar com dose mais baixa (2,5–3 mg/dia). Maior sensibilidade. Sangramento intracraniano dobra com a idade."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste, mas DRC ↑ sangramento — preferir DOAC se possível"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir dose, monitorar INR"}]$$::jsonb,
  'X',
  'CONTRAINDICADA (especialmente 6–12 semanas — embriopatia: hipoplasia nasal, atrofia ótica, anomalias SNC). Trocar por heparina antes da concepção.',
  'Compatível (não atravessa o leite em quantidade significativa).',
  $$[
    {"com":"AINE / AAS / antiplaquetário","efeito":"sangramento aditivo + GI","manejo":"evitar combinações; se necessário, IBP"},
    {"com":"amiodarona","efeito":"INR ↑ até 4× (inibe CYP2C9)","manejo":"reduzir varfa 30–50%"},
    {"com":"sulfametoxazol-trimetoprim","efeito":"INR ↑ marcado","manejo":"reduzir varfa 50% e checar INR em 3 dias"},
    {"com":"metronidazol, fluconazol, claritromicina","efeito":"INR ↑","manejo":"monitorar de perto"},
    {"com":"rifampicina, carbamazepina, fenitoína, fenobarbital","efeito":"INR ↓ (induz CYP)","manejo":"aumentar dose"},
    {"com":"álcool agudo","efeito":"INR ↑ (inibição aguda)","manejo":"evitar binge drinking"},
    {"com":"álcool crônico","efeito":"INR ↓ (indução crônica)","manejo":"orientar consistência"},
    {"com":"alimentos ricos em vitamina K (couve, espinafre, brócolis)","efeito":"reduz efeito","manejo":"manter consumo CONSISTENTE, não evitar"},
    {"com":"chá-verde, ginseng","efeito":"reduz INR","manejo":"orientar"},
    {"com":"Ginkgo biloba, gengibre, alho em alta dose","efeito":"sangramento","manejo":"orientar"}
  ]$$::jsonb,
  ARRAY['gestação','sangramento ativo grave','HAS maligna não controlada','úlcera péptica ativa','aneurisma cerebral','endocardite bacteriana','recente cirurgia ocular ou neurológica','plaquetas < 50k','aderência impossível ou paciente com risco social alto'],
  $$[
    {"freq":"comum","evento":"sangramento (1–3% maior/ano)"},
    {"freq":"comum","evento":"hematomas, epistaxe, sangramento gengival"},
    {"freq":"incomum","evento":"sangramento GI ou urinário"},
    {"freq":"raro (1:5000)","evento":"necrose cutânea por varfarina (deficiência de proteína C/S — primeiros dias)"},
    {"freq":"raro","evento":"síndrome do dedo roxo (microêmbolos de colesterol)"},
    {"freq":"raro","evento":"alopecia"},
    {"freq":"raro","evento":"hemorragia intracraniana (mortalidade 50%)"}
  ]$$::jsonb,
  ARRAY['Reverter sangramento maior: complexo protrombínico + vit K 10 mg IV','INR > 4,5 sem sangramento: suspender + 1–5 mg vit K oral','SEMPRE sobrepor com heparina nos primeiros 5 dias (estado pró-trombótico inicial — proteína C cai antes dos fatores II/X)','Risco de sangramento aumenta exponencialmente com INR > 4 e em ≥ 75 anos','DOACs (rivaroxabana, apixabana, dabigatrana) substituem varfa em FA não-valvar e TEV não-câncer'],
  ARRAY['INR semanal até estabilizar (≥ 2 medidas consecutivas em alvo), depois mensal','Hemograma e função hepática anual','Sintomas de sangramento (urina, fezes, sangramento espontâneo)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=varfarina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 34. ENOXAPARINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'enoxaparina',
  'Enoxaparina sódica',
  ARRAY['Clexane', 'Versa', 'Heptron', 'Enoxaparina Genérico'],
  'Heparina de baixo peso molecular (HBPM)',
  ARRAY['SC', 'IV (uso restrito)'],
  $$[
    {"forma":"seringa preenchida","concentracao":"20 mg, 40 mg, 60 mg, 80 mg, 100 mg, 120 mg, 150 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"profilaxia TEV em paciente clínico","dose":"40 mg SC 1x/dia","duracao":"até alta ou redução do risco"},
      {"para":"profilaxia TEV em cirurgia geral / ortopédica","dose":"40 mg SC 1x/dia (alto risco) ou 20 mg SC 1x/dia (risco moderado)","obs":"em ortopédica major: estender 14–35 dias"},
      {"para":"tratamento TEV (TEP/TVP)","dose":"1 mg/kg SC 12/12h ou 1,5 mg/kg SC 1x/dia"},
      {"para":"SCA com supra (associada a trombolítico)","dose":"30 mg IV bolus + 1 mg/kg SC 12/12h (≥ 75a: sem bolus, 0,75 mg/kg SC 12/12h)"},
      {"para":"SCA sem supra","dose":"1 mg/kg SC 12/12h","duracao":"até alta hospitalar ou ICP"},
      {"para":"trombose / TEP em gestante","dose":"1 mg/kg SC 12/12h (preferida à varfarina)"},
      {"para":"ponte de anticoagulação (peri-operatório de varfarina)","dose":"1 mg/kg SC 12/12h"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"profilaxia / tratamento TEV","dose":"profilaxia 0,5 mg/kg SC 12/12h; tratamento 1–1,5 mg/kg SC 12/12h"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de sangramento. Reduzir dose se peso < 50 kg ou clcr < 30."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"15–30","ajuste":"profilaxia 30 mg SC 1x/dia; tratamento 1 mg/kg SC 1x/dia"},
    {"clcr":"<15","ajuste":"contraindicada (relativo); preferir HNF com monitor TTPa"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Anticoagulante de ESCOLHA na gestação (varfarina e DOACs contraindicados).',
  'Compatível.',
  $$[
    {"com":"AINE / AAS / antiplaquetário","efeito":"sangramento aditivo","manejo":"avaliar risco-benefício"},
    {"com":"varfarina / heparina","efeito":"NÃO usar concomitantemente (exceto no overlap inicial planejado)","manejo":"sobreposição programada"},
    {"com":"trombolíticos","efeito":"sangramento maciço","manejo":"protocolar conforme indicação"}
  ]$$::jsonb,
  ARRAY['sangramento ativo grave','plaquetas < 100k','HIT (trombocitopenia induzida por heparina) prévia','endocardite bacteriana','HAS maligna não controlada','retinopatia diabética grave','úlcera péptica ativa','clcr < 15 (relativo)','24h pós-bloqueio neuroaxial em dose terapêutica'],
  $$[
    {"freq":"comum","evento":"hematoma no local da injeção"},
    {"freq":"comum","evento":"sangramento (depende da dose)"},
    {"freq":"incomum","evento":"trombocitopenia leve transitória"},
    {"freq":"raro (1–2%)","evento":"HIT — paradoxal, com trombose, plaquetopenia 5–14 dias após início"},
    {"freq":"raro","evento":"hipercalemia (inibe síntese aldosterona)"},
    {"freq":"raro","evento":"osteoporose em uso prolongado > 3 meses"},
    {"freq":"raro","evento":"hematoma espinhal (associação com punção neuroaxial)"}
  ]$$::jsonb,
  ARRAY['Reversão parcial: protamina 1 mg neutraliza ~1 mg de enoxa nas últimas 8h (eficácia ~60%)','Aplicar SC na lateral do abdome, alternando lados; NÃO esfregar','Verificar plaquetas em 4–14 dias pós-início (HIT)','BLACK BOX FDA: hematoma espinhal após anestesia neuroaxial — separar 12h (profilaxia) ou 24h (tratamento)','HIT: suspender HEPARINA e iniciar argatroban/fondaparinux'],
  ARRAY['Plaquetas em 4 e 14 dias','Hb/Ht','Função renal periódica','Anti-Xa em obeso, gestante, DRC ou peso extremos'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=enoxaparina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 35. RIVAROXABANA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'rivaroxabana',
  'Rivaroxabana',
  ARRAY['Xarelto', 'Rivaroxabana Genérico'],
  'Anticoagulante oral direto (inibidor fator Xa)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"2,5 mg, 10 mg, 15 mg, 20 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"FA não-valvar","dose":"20 mg VO 1x/dia (com refeição)","obs":"15 mg/dia se clcr 15–49"},
      {"para":"TEV agudo","dose":"15 mg VO 12/12h por 21 dias → 20 mg VO 1x/dia","duracao":"3–6 meses ou estendido"},
      {"para":"prevenção TEV após 6 meses (extensão)","dose":"10 mg VO 1x/dia"},
      {"para":"profilaxia TEV pós-artroplastia (quadril)","dose":"10 mg VO 1x/dia","duracao":"35 dias"},
      {"para":"profilaxia TEV pós-artroplastia (joelho)","dose":"10 mg VO 1x/dia","duracao":"12 dias"},
      {"para":"DAC/DAOP estável (com AAS) — redução eventos","dose":"2,5 mg VO 12/12h + AAS 100 mg/dia (COMPASS)","obs":"adultos com alto risco isquêmico"}
    ],
    "obs_geral":"Tomar 15 mg e 20 mg COM ALIMENTO (aumenta absorção em 39%)."
  }$$::jsonb,
  $${"indicacoes":[]}$$::jsonb,
  $${"obs":"Sem ajuste por idade isoladamente, mas verificar clcr (declínio fisiológico)."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"15–49","ajuste":"FA: 15 mg/dia; TEV: dose plena nos primeiros 21 dias, depois 15 mg/dia"},
    {"clcr":"<15","ajuste":"NÃO usar"}
  ]$$::jsonb,
  $$[
    {"contexto":"Child-Pugh A","ajuste":"sem ajuste"},
    {"contexto":"Child-Pugh B/C","ajuste":"contraindicado (coagulopatia hepática)"}
  ]$$::jsonb,
  'C',
  'CONTRAINDICADA (atravessa placenta, relatos de sangramento fetal). Trocar por HBPM.',
  'Evitar (passa para o leite).',
  $$[
    {"com":"itraconazol, cetoconazol, ritonavir (inibidores potentes CYP3A4 + P-gp)","efeito":"aumenta nível, sangramento","manejo":"NÃO combinar"},
    {"com":"rifampicina, carbamazepina, fenitoína, hipérico (St. John''s)","efeito":"reduz nível, falha terapêutica","manejo":"NÃO combinar"},
    {"com":"AAS / AINE / antiplaquetários","efeito":"sangramento aditivo","manejo":"avaliar risco-benefício; usar AAS baixa dose se necessário"},
    {"com":"ISRS","efeito":"sangramento GI aditivo","manejo":"associar IBP"},
    {"com":"varfarina, HBPM, HNF","efeito":"sangramento","manejo":"NÃO combinar (exceto na transição programada)"}
  ]$$::jsonb,
  ARRAY['sangramento ativo','válvula cardíaca mecânica (varfarina obrigatória)','SAF triplo positivo (DOACs inferiores)','clcr < 15','Child-Pugh B/C','gestação','lesões com alto risco hemorrágico','endocardite bacteriana'],
  $$[
    {"freq":"comum","evento":"sangramento (epistaxe, hematoma, sangramento gengival)"},
    {"freq":"incomum","evento":"sangramento GI maior (mais que apixabana e dabigatrana)"},
    {"freq":"raro","evento":"hemorragia intracraniana (menor que varfarina)"},
    {"freq":"incomum","evento":"anemia"},
    {"freq":"raro","evento":"síndrome de Stevens-Johnson, agranulocitose"}
  ]$$::jsonb,
  ARRAY['NÃO precisa monitorar INR/TTPa, mas NÃO há reversor universal disponível no Brasil (andexanet alfa não está no SUS)','Em sangramento maior: suporte (volume, transfusão), CCP 25–50 U/kg, considerar fator VIIa','Suspender 24h antes de cirurgia de baixo risco hemorrágico, 48h em alto risco','Falha de aderência cancela o benefício pela meia-vida curta (5–13h)','Em FA com SAF: NÃO usar DOAC — varfarina é mandatória'],
  ARRAY['Função renal a cada 6–12 meses (mais frequente se DRC ou idoso)','Hb/Ht periódico','Hemograma se sangramento'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=rivaroxabana',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 36. BUDESONIDA + FORMOTEROL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'budesonida-formoterol',
  'Budesonida + Formoterol',
  ARRAY['Symbicort', 'Vannair', 'Foraseq', 'Alenia'],
  'Corticoide inalatório (ICS) + LABA (β2-agonista de longa)',
  ARRAY['inalatório'],
  $$[
    {"forma":"turbuhaler","concentracao":"100/6, 200/6, 400/12 mcg/dose"},
    {"forma":"aerossol pressurizado","concentracao":"50/3, 100/3, 200/6 mcg/jato"},
    {"forma":"cápsula DPI (Foraseq)","concentracao":"200/6, 400/12 mcg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma adulto/adolescente — MART (manutenção + alívio)","dose":"200/6 mcg 1–2 inalações 12/12h + ATÉ 6 inalações de alívio nas crises","obs":"GINA 2024 — preferencial. SUBSTITUI o uso isolado de SABA"},
      {"para":"asma — PRN reliever em leve","dose":"200/6 mcg 1 inalação SOS","obs":"dose máxima total 12 inalações/dia ocasional, 8 inalações/dia regular"},
      {"para":"asma — manutenção fixa","dose":"200/6 ou 400/12 mcg 1–2 inalações 12/12h"},
      {"para":"DPOC","dose":"320/9 mcg (Symbicort 200/6 com 2 inalações ou 400/12 com 1) 12/12h","obs":"considerar somente em fenótipo eosinofílico ou exacerbações frequentes (GOLD 2024)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma ≥ 6 anos","dose":"100/6 ou 200/6 mcg 1–2 inalações 12/12h"}
    ]
  }$$::jsonb,
  $${"obs":"Usar menor dose efetiva (risco maior de osteoporose, glaucoma, equimose)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste (absorção sistêmica baixa)"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"cautela com formoterol (metabolizado no fígado)"}]$$::jsonb,
  'B',
  'Asma na gestação MAL controlada é mais perigosa que ICS. Manter tratamento.',
  'Compatível.',
  $$[
    {"com":"beta-bloqueador não-seletivo (propranolol)","efeito":"antagoniza broncodilatação","manejo":"trocar por cardiosseletivo"},
    {"com":"diuréticos / xantinas / corticoides sistêmicos","efeito":"hipocalemia aditiva (alta dose)","manejo":"monitorar K+"},
    {"com":"inibidores potentes CYP3A4 (cetoconazol, ritonavir)","efeito":"aumenta nível corticoide → Cushing iatrogênico","manejo":"evitar uso prolongado"},
    {"com":"QT-prolongadores","efeito":"arritmia em alta dose","manejo":"cautela"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a budesonida ou formoterol','tuberculose pulmonar ativa não tratada (relativo)','infecção fúngica respiratória ativa'],
  $$[
    {"freq":"comum","evento":"candidíase oral (orientar enxágue/escovação após uso)"},
    {"freq":"comum","evento":"disfonia, irritação faríngea"},
    {"freq":"incomum","evento":"tremor fino, palpitação (formoterol)"},
    {"freq":"incomum","evento":"cefaleia"},
    {"freq":"raro","evento":"broncoespasmo paradoxal"},
    {"freq":"raro (uso crônico alta dose)","evento":"supressão adrenal, osteoporose, glaucoma, catarata"}
  ]$$::jsonb,
  ARRAY['Orientar enxágue bucal após cada uso (candidíase + disfonia)','GINA 2024: ICS-formoterol como reliever ÚNICO substitui SABA isolado','Usar espaçador no aerossol pressurizado (deposição pulmonar 4–10× maior)','Escalar / desescalar a cada 3 meses conforme controle (questionário ACT ou ACQ)'],
  ARRAY['Controle clínico (ACT/ACQ) trimestral','Espirometria anual','Crescimento em criança','Densitometria se uso prolongado alta dose'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=budesonida+formoterol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 37. IPRATRÓPIO
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'ipratropio',
  'Brometo de ipratrópio',
  ARRAY['Atrovent', 'Ipratrópio Genérico'],
  'Antimuscarínico de curta ação (SAMA)',
  ARRAY['inalatório'],
  $$[
    {"forma":"solução para nebulização","concentracao":"0,25 mg/mL"},
    {"forma":"aerossol pressurizado","concentracao":"20 mcg/jato"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma exacerbação grave (associado a SABA)","dose":"neb 0,5 mg + salbutamol nas 3 primeiras nebulizações","obs":"benefício adicional só em crise grave"},
      {"para":"DPOC exacerbação","dose":"neb 0,5 mg 6/6h ou aerossol 4 jatos 6/6h"},
      {"para":"DPOC manutenção (alternativa em paciente sem LAMA disponível)","dose":"4 jatos 6/6h"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"asma exacerbação grave","dose":"neb 0,25 mg + SABA 6/6h ou 8/8h"}
    ]
  }$$::jsonb,
  $${"obs":"Sem ajuste rotineiro. Cuidado com glaucoma de ângulo fechado e retenção urinária por HPB."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'B',
  'Seguro.',
  'Compatível.',
  $$[
    {"com":"outros anticolinérgicos (oxibutinina, antidepressivos tricíclicos)","efeito":"efeitos atropínicos aditivos","manejo":"orientar paciente"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade ao ipratrópio ou atropina'],
  $$[
    {"freq":"comum","evento":"boca seca, gosto metálico"},
    {"freq":"incomum","evento":"midríase, glaucoma agudo (cuidado com nebulização sem máscara apropriada)"},
    {"freq":"incomum","evento":"retenção urinária em paciente com HPB"},
    {"freq":"raro","evento":"broncoespasmo paradoxal"}
  ]$$::jsonb,
  ARRAY['Em nebulização: usar bocal ou máscara com proteção ocular (risco glaucoma)','Não há benefício em manutenção crônica de ASMA (apenas exacerbação)','Em DPOC, LAMA (tiotrópio) é preferível para manutenção'],
  ARRAY['Resposta clínica (PFE, dispneia, ausculta)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ipratropio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 38. LORATADINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'loratadina',
  'Loratadina',
  ARRAY['Claritin', 'Loranil', 'Loratadina Genérico'],
  'Anti-histamínico H1 de 2ª geração (não-sedativo)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"10 mg"},
    {"forma":"xarope","concentracao":"1 mg/mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"rinite alérgica","dose":"10 mg VO 1x/dia"},
      {"para":"urticária crônica","dose":"10 mg VO 1x/dia, podendo escalar até 4× (40 mg) em refratária (EAACI/GA²LEN)"},
      {"para":"prurido alérgico","dose":"10 mg VO 1x/dia"},
      {"para":"alergia leve a picadas / alimentos","dose":"10 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"rinite/urticária ≥ 2 anos","dose":"5 mg VO 1x/dia (2–5 anos); 10 mg VO 1x/dia (≥ 6 anos)"}
    ]
  }$$::jsonb,
  $${"obs":"Sem ajuste. Vantagem sobre 1ª geração: não sedativa, não cai e fratura."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"10 mg em dias alternados"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose pela metade ou usar em dias alternados"}]$$::jsonb,
  'B',
  'Segura. Anti-histamínico de escolha em gestante.',
  'Compatível.',
  $$[
    {"com":"inibidores potentes CYP3A4 (cetoconazol, eritromicina)","efeito":"aumenta nível, raramente clinicamente significativo","manejo":"monitorar"},
    {"com":"álcool, sedativos","efeito":"sedação aditiva (mínima — loratadina é não-sedativa)","manejo":"orientar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade'],
  $$[
    {"freq":"incomum","evento":"cefaleia, fadiga leve"},
    {"freq":"incomum","evento":"boca seca"},
    {"freq":"raro","evento":"taquicardia"},
    {"freq":"raro","evento":"convulsão (uso prolongado em altas doses)"}
  ]$$::jsonb,
  ARRAY['Anti-histamínicos 1ª geração (difenidramina, dexclorfeniramina) são SEDATIVOS — Beers Criteria proíbe em > 65a','Usar 2ª geração (loratadina, desloratadina, fexofenadina, cetirizina, ebastina) sempre que possível','Não causa prolongamento QT (diferente da terfenadina/astemizol, retirados do mercado)'],
  ARRAY['Resposta clínica (sintomas alérgicos)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=loratadina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 39. INSULINA NPH
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'insulina-nph',
  'Insulina humana NPH',
  ARRAY['Humulin N', 'Novolin N', 'Insulatard'],
  'Insulina de ação intermediária (basal)',
  ARRAY['SC'],
  $$[
    {"forma":"frasco","concentracao":"100 UI/mL — frasco 10 mL"},
    {"forma":"refil/caneta","concentracao":"100 UI/mL — 3 mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM2 — basalização","dose":"0,1–0,2 U/kg/dia SC bedtime, titular 2 U a cada 3 dias até GJ < 130","obs":"se hipoglicemia noturna, dividir 2/3 manhã + 1/3 noite"},
      {"para":"DM1 — basal-bolus","dose":"~50% da dose diária total como basal SC 12/12h","obs":"DM1: análogos de longa (glargina, degludeca) são preferíveis (menos hipoglicemia)"},
      {"para":"DM gestacional","dose":"0,2 U/kg/dia SC iniciante, ajustar pela glicemia capilar","obs":"insulina NPH é primeira linha em DMG no SUS"},
      {"para":"hiperglicemia hospitalar","dose":"esquema basal-bolus ou 50% da dose ambulatorial em internação"}
    ],
    "obs_geral":"Pico em 4–10h, duração 10–18h. Aspecto LEITOSO (homogeneizar antes de aplicar)."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM1 / DM2 pediátrico","dose":"0,5–1 U/kg/dia SC dividido em 2–4 aplicações","obs":"basal-bolus com análogos é padrão moderno"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de hipoglicemia. Iniciar com doses menores (0,1 U/kg/dia) e titular lentamente."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"10–50","ajuste":"reduzir 25%"},
    {"clcr":"<10","ajuste":"reduzir 50%"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir dose conforme glicemia"}]$$::jsonb,
  'B',
  'Pilar do tratamento do DMG e DM em gestante. Sem risco fetal.',
  'Compatível.',
  $$[
    {"com":"beta-bloqueador","efeito":"mascara hipoglicemia (sintomas adrenérgicos)","manejo":"orientar; preferir cardiosseletivo se possível"},
    {"com":"corticoide / simpaticomimético / tiazídico","efeito":"hiperglicemia antagonista","manejo":"aumentar dose insulina"},
    {"com":"álcool","efeito":"hipoglicemia tardia","manejo":"orientar"},
    {"com":"hipoglicemiante oral","efeito":"sinergia (esperada)","manejo":"reduzir dose conforme glicemia"}
  ]$$::jsonb,
  ARRAY['hipoglicemia','hipersensibilidade ao princípio ativo (raro)'],
  $$[
    {"freq":"comum","evento":"hipoglicemia"},
    {"freq":"comum","evento":"ganho de peso (anabolizante)"},
    {"freq":"comum","evento":"reação no local da injeção (vermelhidão, lipohipertrofia)"},
    {"freq":"incomum","evento":"edema insulínico (transitório, no início ou após otimização)"},
    {"freq":"raro","evento":"reação alérgica sistêmica"}
  ]$$::jsonb,
  ARRAY['Aplicação SC: alternar locais (abdome, coxa, braço, glúteo) para evitar lipohipertrofia (que prejudica absorção)','Manter sob refrigeração (2–8°C) até abrir; depois pode ficar em temperatura ambiente por 28 dias','Homogeneizar (rolar entre as mãos) antes de aplicar — NÃO agitar','Em hospitalizado: NUNCA "esquecer" basal mesmo se NPO (risco CAD em DM1)','Hipoglicemia: 15g de carboidrato simples (suco, glicose), reverificar em 15 min'],
  ARRAY['Glicemia capilar antes das refeições e bedtime','HbA1c trimestral até estabilizar','Complicações DM (anual): fundoscopia, microalbuminúria, monofilamento','Locais de aplicação (lipohipertrofia)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=insulina+nph',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 40. INSULINA REGULAR (rápida)
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'insulina-regular',
  'Insulina humana regular',
  ARRAY['Humulin R', 'Novolin R'],
  'Insulina de ação rápida (bolus)',
  ARRAY['SC', 'IV (CAD/EHH/UTI)', 'IM (CAD se sem acesso IV)'],
  $$[
    {"forma":"frasco","concentracao":"100 UI/mL — frasco 10 mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"prandial em DM (bolus)","dose":"4–6 U SC 30 min antes das refeições, titular pela glicemia 2h pós-prandial","obs":"análogos rápidos (lispro, asparte) atuam em 5–15 min e são preferíveis"},
      {"para":"correção em DM hospitalizado","dose":"esquema escalonado: cada ~50 mg/dL acima de 150 → 1 U adicional"},
      {"para":"CAD — após volume e K+","dose":"BIC IV 0,1 U/kg/h (ou 0,14 sem bolus); meta queda 50–75 mg/dL/h","obs":"infusão regular EV: 50 U em 50 mL SF = 1 U/mL"},
      {"para":"EHH","dose":"BIC IV 0,05–0,1 U/kg/h após volume","obs":"queda mais lenta que CAD"},
      {"para":"hipercalemia (junto com glicose)","dose":"10 U IV regular + 25 g glicose IV","obs":"shift intracelular K+, queda 0,5–1,2 mEq/L em 1h"}
    ],
    "obs_geral":"Início 30 min, pico 2–4h, duração 6–8h. Aspecto LÍMPIDO (transparente)."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM pediátrico bolus","dose":"0,5–1 U/kg/dia SC dividido em ≥ 3 aplicações pré-prandial","obs":"análogos preferíveis"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de hipoglicemia. Análogos rápidos preferíveis (menos hipoglicemia tardia)."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"10–50","ajuste":"reduzir 25%"},
    {"clcr":"<10","ajuste":"reduzir 50%"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir conforme glicemia"}]$$::jsonb,
  'B',
  'Segura. Atravessa pouco a placenta.',
  'Compatível.',
  $$[
    {"com":"beta-bloqueador","efeito":"mascara hipoglicemia","manejo":"orientar"},
    {"com":"corticoide / simpaticomimético","efeito":"hiperglicemia","manejo":"aumentar dose"},
    {"com":"álcool","efeito":"hipoglicemia tardia","manejo":"orientar"}
  ]$$::jsonb,
  ARRAY['hipoglicemia','hipersensibilidade'],
  $$[
    {"freq":"comum","evento":"hipoglicemia (incluindo tardia 4–6h após bolus)"},
    {"freq":"comum","evento":"ganho de peso"},
    {"freq":"comum","evento":"lipohipertrofia"},
    {"freq":"incomum","evento":"reação no local da injeção"}
  ]$$::jsonb,
  ARRAY['Em CAD: SEMPRE corrigir K+ ANTES de iniciar insulina (insulina causa shift intracelular, risco arritmia se K+ < 3,3)','BIC IV: titular pela glicemia capilar 1/1h; queda > 100 mg/dL/h = reduzir; < 50 mg/dL/h = aumentar','Quando glicemia atingir 250 em CAD: trocar para SG 5% + insulina, manter até resolução','Aspecto sempre LÍMPIDO; frascos turvos descartar','SC absorção: abdome > braço > coxa > glúteo'],
  ARRAY['Glicemia capilar 1/1h em BIC IV','Eletrólitos a cada 2–4h em CAD','HbA1c em ambulatorial'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=insulina+regular',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 41. GLIBENCLAMIDA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'glibenclamida',
  'Glibenclamida',
  ARRAY['Daonil', 'Glibenclamida Genérico'],
  'Sulfonilureia de 2ª geração',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"5 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM2 (3ª–4ª linha em paciente sem cardiopatia)","dose":"2,5–5 mg VO 1x/dia titular até 20 mg/dia (max 20 mg)","obs":"NÃO é primeira escolha (SBD/ADA priorizam metformina + iSGLT2/GLP-1). Considerar gliclazida (menos hipoglicemia)"}
    ],
    "obs_geral":"Tomar 30 min antes do café da manhã."
  }$$::jsonb,
  $${"indicacoes":[]}$$::jsonb,
  $${"obs":"BEERS CRITERIA: EVITAR em ≥ 65 anos por risco de hipoglicemia grave prolongada. Preferir gliclazida ou outras classes."}$$::jsonb,
  $$[
    {"clcr":">60","ajuste":"sem ajuste"},
    {"clcr":"30–60","ajuste":"reduzir dose 50%"},
    {"clcr":"<30","ajuste":"contraindicada (acúmulo, hipoglicemia prolongada)"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"contraindicada"}]$$::jsonb,
  'C',
  'Evitar (preferir insulina ou metformina). Risco hipoglicemia neonatal.',
  'Evitar (relatos hipoglicemia neonatal).',
  $$[
    {"com":"beta-bloqueador","efeito":"mascara hipoglicemia","manejo":"orientar"},
    {"com":"sulfa, fluconazol, cetoconazol","efeito":"hipoglicemia grave","manejo":"reduzir dose ou trocar ATB"},
    {"com":"varfarina","efeito":"INR ↑","manejo":"monitorar"},
    {"com":"AINE / aspirina alta dose","efeito":"hipoglicemia","manejo":"monitorar"},
    {"com":"corticoides","efeito":"hiperglicemia","manejo":"aumentar dose ou trocar"},
    {"com":"álcool","efeito":"reação dissulfiram-like + hipoglicemia","manejo":"evitar binge"}
  ]$$::jsonb,
  ARRAY['DM1','CAD/EHH','clcr < 30','hepatopatia grave','hipersensibilidade a sulfas','gestação','idoso frágil (relativo)'],
  $$[
    {"freq":"comum","evento":"hipoglicemia (especialmente prolongada e perigosa em idoso)"},
    {"freq":"comum","evento":"ganho de peso"},
    {"freq":"incomum","evento":"reação alérgica cruzada com sulfas"},
    {"freq":"raro","evento":"anemia hemolítica em G6PD"},
    {"freq":"raro","evento":"colestase, hepatite"}
  ]$$::jsonb,
  ARRAY['Hipoglicemia por glibenclamida pode durar > 24h e exigir internação com infusão de glicose','PROIBIDA em idoso pelo Beers Criteria — preferir gliclazida (menos hipoglicemia) ou outras classes','Se hipoglicemia: além de glicose, considerar octreotide em casos refratários','Não tem benefício CV (UKPDS) — diferente de iSGLT2 e GLP-1'],
  ARRAY['HbA1c trimestral','Glicemia capilar (especialmente em jejum)','Função renal anual'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=glibenclamida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 42. DAPAGLIFLOZINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'dapagliflozina',
  'Dapagliflozina',
  ARRAY['Forxiga', 'Dapagliflozina Genérico'],
  'Inibidor SGLT2 (iSGLT2)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"5 mg, 10 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"DM2 (2ª linha após metformina, especialmente com DCV/DRC/IC)","dose":"10 mg VO 1x/dia"},
      {"para":"IC com FE reduzida ou preservada (mesmo sem DM)","dose":"10 mg VO 1x/dia (DAPA-HF, DELIVER)","obs":"reduz mortalidade e hospitalização"},
      {"para":"DRC com proteinúria (com ou sem DM)","dose":"10 mg VO 1x/dia (DAPA-CKD)","obs":"reduz progressão para diálise"}
    ]
  }$$::jsonb,
  $${"indicacoes":[]}$$::jsonb,
  $${"obs":"Aumenta risco de depleção volêmica em frágil. Iniciar 5 mg em desidratado."}$$::jsonb,
  $$[
    {"clcr":">45","ajuste":"sem ajuste"},
    {"clcr":"25–45","ajuste":"manter 10 mg/dia (efeito CV/renal preservado mesmo se efeito glicêmico atenuado)"},
    {"clcr":"<25","ajuste":"NÃO iniciar; manter se já em uso e tolera"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"5 mg/dia"}]$$::jsonb,
  'C',
  'Evitar — sem dados em humanos, dados animais sugerem efeito renal fetal.',
  'Evitar.',
  $$[
    {"com":"diurético","efeito":"hipotensão / depleção volêmica","manejo":"reduzir diurético se necessário"},
    {"com":"insulina / sulfonilureia","efeito":"hipoglicemia","manejo":"reduzir dose insulina ~20%"}
  ]$$::jsonb,
  ARRAY['DM1 (risco CAD euglicêmica)','clcr < 25','gestação','hipotensão sintomática','desidratação'],
  $$[
    {"freq":"comum","evento":"infecção genital (candidíase)"},
    {"freq":"comum","evento":"poliúria, sede"},
    {"freq":"incomum","evento":"ITU"},
    {"freq":"incomum","evento":"depleção volêmica, hipotensão"},
    {"freq":"raro (mas grave)","evento":"CAD EUGLICÊMICA (especialmente DM1, jejum prolongado, pós-cirúrgico)"},
    {"freq":"raro","evento":"gangrena de Fournier (FDA black box)"},
    {"freq":"raro","evento":"fratura óssea (aumento em alguns estudos)"}
  ]$$::jsonb,
  ARRAY['SUSPENDER 3 dias antes de cirurgia maior, jejum > 24h, doença aguda (risco CAD euglicêmica)','Orientar higiene genital (candidíase é a EA mais comum)','Em IC: o iSGLT2 mostrou benefício mesmo SEM diabetes (DAPA-HF, EMPEROR-Reduced)','Em DRC: dapa preserva TFG independente de glicemia (DAPA-CKD)','Não usa em DM1 fora de protocolo (CAD)'],
  ARRAY['Função renal a cada 3–6 meses','HbA1c trimestral','Sintomas genitourinários'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dapagliflozina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 43. SERTRALINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'sertralina',
  'Sertralina',
  ARRAY['Zoloft', 'Tolrest', 'Sertralina Genérico'],
  'Inibidor seletivo da recaptação de serotonina (ISRS)',
  ARRAY['VO'],
  $$[
    {"forma":"comprimido","concentracao":"25 mg, 50 mg, 100 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"depressão maior","dose":"25–50 mg VO 1x/dia titular até 100–200 mg/dia"},
      {"para":"transtorno de ansiedade generalizada","dose":"25 mg VO 1x/dia titular até 100 mg/dia"},
      {"para":"transtorno do pânico","dose":"iniciar 12,5–25 mg/dia (evitar piora ansiedade), titular lento"},
      {"para":"TOC","dose":"50 mg VO titular até 200 mg/dia"},
      {"para":"TEPT","dose":"50 mg VO titular até 200 mg/dia"},
      {"para":"transtorno disfórico pré-menstrual","dose":"50–150 mg VO 1x/dia (uso contínuo ou luteal)"},
      {"para":"depressão pós-parto","dose":"25–50 mg/dia titular","obs":"sertralina é PRIMEIRA escolha em lactação"}
    ],
    "obs_geral":"Resposta clínica em 4–6 semanas; manter ≥ 6 meses após remissão (12–24 meses se recorrente)."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"TOC ≥ 6 anos","dose":"25 mg VO 1x/dia titular até 200 mg/dia"},
      {"para":"depressão (off-label)","dose":"25–50 mg/dia"}
    ],
    "atencao":"BLACK BOX FDA: aumento de ideação suicida em < 24 anos no início — monitorar de perto nas primeiras 4 semanas."
  }$$::jsonb,
  $${"obs":"Iniciar 25 mg/dia. Mais lento na titulação. Cuidar hiponatremia (SIADH)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"Child-Pugh A/B","ajuste":"reduzir 50%"}, {"contexto":"Child-Pugh C","ajuste":"contraindicada"}]$$::jsonb,
  'C',
  'Pode ser usada se necessário (dados de segurança razoáveis). Risco persistente baixo de hipertensão pulmonar persistente neonatal.',
  'Compatível — PRIMEIRA escolha em lactação (concentração mínima no leite).',
  $$[
    {"com":"IMAO","efeito":"síndrome serotoninérgica fatal","manejo":"separar 14 dias"},
    {"com":"linezolida, azul de metileno","efeito":"síndrome serotoninérgica","manejo":"contraindicado"},
    {"com":"varfarina","efeito":"INR ↑","manejo":"monitorar"},
    {"com":"AAS / AINE / antiplaquetários","efeito":"sangramento GI aditivo","manejo":"associar IBP em > 60a"},
    {"com":"tramadol","efeito":"convulsão + síndrome serotoninérgica","manejo":"evitar"},
    {"com":"triptanos","efeito":"síndrome serotoninérgica","manejo":"cautela"},
    {"com":"QT-prolongadores","efeito":"sertra é o ISRS de menor risco QT","manejo":"monitorar se múltiplos"}
  ]$$::jsonb,
  ARRAY['uso de IMAO há < 14 dias','hipersensibilidade','síndrome serotoninérgica conhecida'],
  $$[
    {"freq":"comum (1ª–2ª semana)","evento":"náusea, diarreia, cefaleia, insônia (geralmente transitória)"},
    {"freq":"comum","evento":"disfunção sexual (até 50%) — anorgasmia, libido reduzida"},
    {"freq":"comum","evento":"sudorese, tremor leve"},
    {"freq":"incomum","evento":"hiponatremia / SIADH (especialmente idoso)"},
    {"freq":"incomum","evento":"sangramento GI (associado a AINE)"},
    {"freq":"raro","evento":"síndrome serotoninérgica (com associações)"},
    {"freq":"raro","evento":"prolongamento QT (mínimo entre ISRS)"},
    {"freq":"raro","evento":"síndrome de descontinuação se suspensão abrupta"}
  ]$$::jsonb,
  ARRAY['BLACK BOX FDA: ideação suicida em < 24a — monitorar visitas frequentes nas primeiras 4 semanas','Suspender lentamente (10–25% a cada 2–4 semanas) — síndrome de descontinuação','Em > 65a: dosar Na+ basal e em 4 semanas (SIADH)','Tomar à noite se sedativo, manhã se ativador (sertra é neutra)','Período de "washout" 14 dias se troca para/de IMAO'],
  ARRAY['Resposta clínica (PHQ-9, GAD-7) a cada 2–4 semanas no início','Na+ basal e em 4 semanas (idoso)','Risco suicida em adolescente / jovem'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sertralina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 44. FLUOXETINA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'fluoxetina',
  'Fluoxetina',
  ARRAY['Prozac', 'Daforin', 'Fluoxetina Genérico'],
  'Inibidor seletivo da recaptação de serotonina (ISRS)',
  ARRAY['VO'],
  $$[
    {"forma":"cápsula","concentracao":"10 mg, 20 mg"},
    {"forma":"comprimido","concentracao":"20 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"depressão maior","dose":"20 mg VO 1x/dia titular até 80 mg/dia"},
      {"para":"TOC","dose":"20 mg VO titular até 60–80 mg/dia"},
      {"para":"bulimia nervosa","dose":"60 mg VO 1x/dia (única dose com aprovação FDA específica)"},
      {"para":"transtorno disfórico pré-menstrual","dose":"20 mg VO 1x/dia (contínuo ou só na fase luteal)"},
      {"para":"transtorno do pânico","dose":"iniciar 5–10 mg, titular lento"}
    ],
    "obs_geral":"Meia-vida longa (4–6 dias do metabólito) — perdoa esquecimentos. Mais ATIVADORA — tomar pela MANHÃ."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"depressão / TOC ≥ 8 anos","dose":"10–20 mg VO 1x/dia"}
    ],
    "atencao":"BLACK BOX FDA: ideação suicida — monitorar."
  }$$::jsonb,
  $${"obs":"Cautela — meia-vida longa = acúmulo. Sertra ou citalopram (cuidado QT) preferíveis em > 65a."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir 50%"}]$$::jsonb,
  'C',
  'Risco baixo. Possível em gestação se necessário.',
  'Atinge concentração maior no leite que sertra — preferir sertra em lactação.',
  $$[
    {"com":"IMAO","efeito":"síndrome serotoninérgica","manejo":"separar 5 SEMANAS após suspender fluoxetina (meia-vida longa)"},
    {"com":"varfarina","efeito":"INR ↑ marcado (inibe CYP2C9)","manejo":"reduzir varfa, monitorar"},
    {"com":"tramadol, triptanos","efeito":"síndrome serotoninérgica","manejo":"cautela"},
    {"com":"tamoxifeno","efeito":"reduz ativação (inibe CYP2D6)","manejo":"escolher outro ISRS em paciente oncológica"},
    {"com":"haloperidol, risperidona, antipsicóticos","efeito":"aumenta nível","manejo":"monitorar"}
  ]$$::jsonb,
  ARRAY['uso de IMAO há < 5 SEMANAS','hipersensibilidade'],
  $$[
    {"freq":"comum","evento":"insônia (tomar pela manhã)"},
    {"freq":"comum","evento":"náusea, anorexia, perda de peso (diferente de outros ISRS)"},
    {"freq":"comum","evento":"disfunção sexual"},
    {"freq":"comum","evento":"ansiedade nas primeiras semanas (ativadora)"},
    {"freq":"incomum","evento":"hiponatremia"},
    {"freq":"raro","evento":"síndrome serotoninérgica"}
  ]$$::jsonb,
  ARRAY['Tomar PELA MANHÃ (ativadora — pode causar insônia se à noite)','Meia-vida longa (norfluoxetina 4–6 dias) facilita troca: NÃO precisa desmame se trocar para outro ISRS, mas exige 5 sem para IMAO','Em paciente com tamoxifeno: trocar (inibe CYP2D6 que ativa o tamoxifeno)','Mais relacionada a perda de peso que outros ISRS (paroxetina é a que mais ganha)'],
  ARRAY['Resposta clínica','Peso','Na+ em idoso'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fluoxetina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 45. CLONAZEPAM
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'clonazepam',
  'Clonazepam',
  ARRAY['Rivotril', 'Klonopin', 'Clonazepam Genérico'],
  'Benzodiazepínico de ação intermediária-longa',
  ARRAY['VO', 'sublingual'],
  $$[
    {"forma":"comprimido","concentracao":"0,5 mg, 2 mg"},
    {"forma":"gotas","concentracao":"2,5 mg/mL (1 gota = 0,1 mg)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"transtorno do pânico","dose":"0,25–0,5 mg VO 12/12h titular até 1–4 mg/dia","obs":"USO TRANSITÓRIO (4–8 semanas) durante titulação de ISRS; preferir SOS"},
      {"para":"crise epiléptica focal/mioclonia","dose":"0,5–4 mg VO/dia divididos","obs":"valproato/lamotrigina são preferíveis crônicos"},
      {"para":"insônia transitória","dose":"NÃO indicado (Beers/AGS contraindicam BZD para insônia)"},
      {"para":"síndrome das pernas inquietas","dose":"0,25–0,5 mg VO bedtime","obs":"3ª linha após dopaminérgicos / ferro / pregabalina"}
    ],
    "obs_geral":"USO RESTRITO E TRANSITÓRIO. Tolerância e dependência aparecem em 4 semanas."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"epilepsia","dose":"0,01–0,03 mg/kg/dia VO div 8/8h titular","max":"0,1–0,2 mg/kg/dia"}
    ]
  }$$::jsonb,
  $${"obs":"BEERS CRITERIA: EVITAR — risco quedas, fraturas, delírio, declínio cognitivo. Se já em uso, desmamar lentamente."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir 50%"}]$$::jsonb,
  'D',
  'Evitar 1º trimestre (fenda labial associada a BZD). Periparto: depressão respiratória neonatal e síndrome de abstinência.',
  'Evitar (passa para o leite, sedação do RN).',
  $$[
    {"com":"opioides","efeito":"DEPRESSÃO RESPIRATÓRIA, MORTE","manejo":"FDA Black Box — evitar combinação"},
    {"com":"álcool","efeito":"depressão SNC aditiva","manejo":"evitar"},
    {"com":"outros depressores SNC (zolpidem, antipsicóticos)","efeito":"sedação aditiva","manejo":"evitar"},
    {"com":"contraceptivos / valproato / fluoxetina","efeito":"aumentam nível","manejo":"monitorar"},
    {"com":"rifampicina, fenitoína, carbamazepina","efeito":"reduzem nível","manejo":"monitorar resposta"}
  ]$$::jsonb,
  ARRAY['miastenia gravis','glaucoma de ângulo fechado','insuficiência respiratória grave','apneia do sono grave','hepatopatia grave','intoxicação por álcool ou depressor SNC','idoso frágil (relativo)'],
  $$[
    {"freq":"comum","evento":"sedação, sonolência diurna"},
    {"freq":"comum","evento":"ataxia, fraqueza muscular"},
    {"freq":"comum (uso > 4 semanas)","evento":"tolerância e dependência física"},
    {"freq":"incomum","evento":"reação paradoxal (agitação) — especialmente em idoso e criança"},
    {"freq":"incomum","evento":"amnésia anterógrada"},
    {"freq":"raro","evento":"depressão respiratória (em alta dose ou com opioide)"},
    {"freq":"raro","evento":"síndrome de abstinência se suspensão abrupta (convulsão, ansiedade rebote)"}
  ]$$::jsonb,
  ARRAY['BLACK BOX FDA 2020: dependência mesmo em uso curto e em dose terapêutica','NUNCA combinar com opioide (alerta de morte)','SUSPENDER LENTAMENTE: 10–25% a cada 1–2 semanas (mais lento se uso > 6 meses) — risco convulsão','Em idoso: prescrever é exceção, com indicação clara, dose mínima, duração definida','Antídoto: flumazenil 0,2 mg IV (cuidado: pode precipitar abstinência)'],
  ARRAY['Aderência, sinais de tolerância','Função cognitiva em idoso','Plano de desmame'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=clonazepam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 46. DIAZEPAM
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'diazepam',
  'Diazepam',
  ARRAY['Valium', 'Diazepam Genérico', 'Diazefast'],
  'Benzodiazepínico de ação longa',
  ARRAY['VO', 'IV', 'IM', 'retal'],
  $$[
    {"forma":"comprimido","concentracao":"5 mg, 10 mg"},
    {"forma":"ampola","concentracao":"5 mg/mL (2 mL = 10 mg)"},
    {"forma":"solução retal","concentracao":"5 mg, 10 mg"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"crise convulsiva (status epilepticus)","dose":"5–10 mg IV/retal, repetir em 5 min se necessário (max 30 mg)","obs":"midazolam IM 10 mg é alternativa pré-hospitalar (RAMPART)"},
      {"para":"abstinência alcoólica","dose":"10–20 mg VO 6/6h conforme CIWA, titular para sintomas"},
      {"para":"espasmo muscular agudo","dose":"5–10 mg VO 6/6 ou 8/8h por curta duração"},
      {"para":"sedação pré-procedimento (endoscopia)","dose":"5–10 mg IV"}
    ],
    "obs_geral":"USO TRANSITÓRIO. Meia-vida MUITO longa (20–100h ativos)."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"convulsão febril prolongada","dose":"0,3–0,5 mg/kg retal ou IV"},
      {"para":"status epilepticus","dose":"0,2–0,5 mg/kg IV (max 10 mg)"}
    ]
  }$$::jsonb,
  $${"obs":"BEERS CRITERIA: EVITAR — meia-vida longa em idoso causa acumulo, quedas, delirium. Se necessário, lorazepam (curto)."}$$::jsonb,
  $$[
    {"clcr":">10","ajuste":"sem ajuste"},
    {"clcr":"<10","ajuste":"reduzir 50%"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir significativamente; preferir lorazepam ou oxazepam (sem metabolismo hepático)"}]$$::jsonb,
  'D',
  'Evitar 1º trimestre (fenda labial). Risco de abstinência neonatal e floppy infant syndrome.',
  'Evitar (acúmulo no RN, sedação, perda de peso).',
  $$[
    {"com":"opioides","efeito":"depressão respiratória / morte","manejo":"FDA Black Box — evitar"},
    {"com":"álcool","efeito":"depressão SNC aditiva","manejo":"evitar"},
    {"com":"omeprazol, fluconazol, cimetidina","efeito":"aumenta nível","manejo":"reduzir dose"},
    {"com":"rifampicina","efeito":"reduz nível","manejo":"aumentar dose"}
  ]$$::jsonb,
  ARRAY['miastenia gravis','glaucoma de ângulo fechado','insuficiência respiratória grave','apneia do sono','hepatopatia grave','intoxicação por álcool ou depressor SNC','idoso frágil','crianças < 6 meses (relativo)'],
  $$[
    {"freq":"comum","evento":"sedação, ataxia"},
    {"freq":"comum","evento":"amnésia anterógrada"},
    {"freq":"incomum","evento":"reação paradoxal (especialmente idoso, criança)"},
    {"freq":"incomum","evento":"hipotensão IV"},
    {"freq":"raro","evento":"depressão respiratória (especialmente IV rápido ou com opioide)"},
    {"freq":"raro","evento":"trombose venosa local com IV"}
  ]$$::jsonb,
  ARRAY['IV: infundir lentamente (≤ 5 mg/min); preferir veia calibrosa (risco trombose)','Em status epilepticus: lorazepam IV é PREFERIDO (menos recorrência, maior duração de ação anticonvulsivante)','Suspensão: reduzir 10–25% a cada 1–2 semanas — risco convulsão se brusco','Em uso > 4 semanas: dependência física certa; programar desmame'],
  ARRAY['Sinais vitais (especialmente em IV)','Função respiratória se opioide concomitante'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=diazepam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 47. TRAMADOL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'tramadol',
  'Cloridrato de tramadol',
  ARRAY['Tramal', 'Tramadon', 'Tramadol Genérico'],
  'Opioide fraco + inibidor de recaptação serotonina/noradrenalina',
  ARRAY['VO', 'IV', 'IM'],
  $$[
    {"forma":"cápsula","concentracao":"50 mg"},
    {"forma":"comprimido SR","concentracao":"100 mg, 200 mg (liberação prolongada)"},
    {"forma":"ampola","concentracao":"50 mg/mL (1 mL = 50 mg)"},
    {"forma":"gotas","concentracao":"100 mg/mL (2 gotas = 5 mg)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor moderada a intensa (curta duração)","dose":"50–100 mg VO 6/6h ou 8/8h","max_dia":"400 mg"},
      {"para":"dor pós-operatória","dose":"100 mg IV 6/6h (lentamente, 2 min)","max":"400 mg/dia"},
      {"para":"dor crônica (uso restrito)","dose":"SR 100–200 mg VO 12/12h","obs":"avaliar desmame periodicamente"},
      {"para":"dor em idoso","dose":"50 mg VO 6/6h titular","max":"300 mg/dia"}
    ],
    "obs_geral":"Iniciar com dose baixa, especialmente em virgem de opioide. Tolerância cruzada parcial com morfina."
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"dor pediátrica > 12a","dose":"1–2 mg/kg/dose VO 6/6h","max":"100 mg/dose"}
    ],
    "atencao":"BLACK BOX FDA: contraindicado em < 12 anos (mortes pós-tonsilectomia em metabolizadores ultra-rápidos CYP2D6)."
  }$$::jsonb,
  $${"obs":"Reduzir dose 50% (acúmulo + risco confusão e quedas). Max 300 mg/dia."}$$::jsonb,
  $$[
    {"clcr":">30","ajuste":"sem ajuste"},
    {"clcr":"<30","ajuste":"max 200 mg/dia, intervalos 12/12h"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"50 mg 12/12h"}]$$::jsonb,
  'C',
  'Evitar (depressão respiratória neonatal, abstinência).',
  'Evitar — passa para o leite; relatos morte em RN de mães metabolizadoras ultra-rápidas.',
  $$[
    {"com":"ISRS / IRSN / IMAO / linezolida","efeito":"síndrome serotoninérgica","manejo":"evitar combinação"},
    {"com":"BZD, álcool, opioides, sedativos","efeito":"depressão SNC e respiratória","manejo":"FDA Black Box: evitar (risco morte)"},
    {"com":"ondansetrona","efeito":"reduz analgesia (5HT3 antagonismo)","manejo":"trocar antiemético"},
    {"com":"varfarina","efeito":"INR ↑","manejo":"monitorar"},
    {"com":"carbamazepina","efeito":"reduz nível tramadol","manejo":"monitorar resposta"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade','intoxicação por álcool, BZD, opioides ou outros depressores','epilepsia não controlada (reduz limiar)','uso concomitante ou < 14 dias de IMAO','idade < 12 anos','pós-tonsilectomia/adenoidectomia em < 18 anos'],
  $$[
    {"freq":"comum","evento":"náusea, vômito, constipação, sudorese"},
    {"freq":"comum","evento":"tontura, sonolência"},
    {"freq":"incomum","evento":"prurido, boca seca"},
    {"freq":"incomum","evento":"convulsão (especialmente em alta dose, etilismo, epilepsia)"},
    {"freq":"raro","evento":"síndrome serotoninérgica"},
    {"freq":"raro","evento":"depressão respiratória (especialmente metabolizador ultra-rápido CYP2D6 ou com opioide/BZD)"},
    {"freq":"raro","evento":"hipoglicemia"}
  ]$$::jsonb,
  ARRAY['BLACK BOX FDA: morte em < 12a e em pós-tonsilectomia (variabilidade CYP2D6)','Pode reduzir limiar convulsivo: cautela em epiléptico, etilista, TCE','Não combinar com BZD ou outros opioides','Síndrome serotoninérgica: evitar com ISRS, especialmente fluoxetina','Programar desmame se uso > 1 semana'],
  ARRAY['Resposta analgésica','Sinais de depressão SNC','Função intestinal (laxante profilático em uso prolongado)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=tramadol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 48. ACICLOVIR
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'aciclovir',
  'Aciclovir',
  ARRAY['Zovirax', 'Aciclovir Genérico'],
  'Antiviral nucleosídeo (HSV, VZV)',
  ARRAY['VO', 'IV', 'tópico'],
  $$[
    {"forma":"comprimido","concentracao":"200 mg, 400 mg"},
    {"forma":"frasco-ampola IV","concentracao":"250 mg, 500 mg"},
    {"forma":"creme tópico","concentracao":"50 mg/g (5%)"},
    {"forma":"pomada oftálmica","concentracao":"30 mg/g (3%)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"herpes genital primário","dose":"400 mg VO 8/8h ou 200 mg 5x/dia","duracao":"7–10 dias"},
      {"para":"herpes genital recorrência","dose":"400 mg VO 8/8h","duracao":"5 dias"},
      {"para":"profilaxia herpes recorrente","dose":"400 mg VO 12/12h (uso crônico)"},
      {"para":"herpes labial","dose":"creme 5x/dia","duracao":"4 dias","obs":"benefício marginal — preferir abordagem expectante"},
      {"para":"varicela imunocompetente","dose":"800 mg VO 4×/dia × 7 dias se ≥ 13a","obs":"benefício se iniciado < 24h dos primeiros sintomas"},
      {"para":"varicela imunossuprimido / encefalite herpética / herpes neonatal","dose":"10 mg/kg IV 8/8h","duracao":"14–21 dias"},
      {"para":"herpes zoster (zóster oftálmico, dermátomos múltiplos, idoso)","dose":"800 mg VO 5×/dia","duracao":"7 dias","obs":"valaciclovir 1 g 8/8h é mais conveniente"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"herpes neonatal / encefalite","dose":"60 mg/kg/dia IV div 8/8h","duracao":"14–21 dias"},
      {"para":"varicela em criança","dose":"20 mg/kg/dose VO 4×/dia (max 800 mg/dose)","duracao":"5 dias"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de neurotoxicidade. Reduzir dose conforme clcr."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"25–50","ajuste":"intervalo 12/12h"},
    {"clcr":"10–25","ajuste":"intervalo 24/24h"},
    {"clcr":"<10","ajuste":"50% da dose 24/24h"},
    {"clcr":"hemodiálise","ajuste":"dose após sessão"}
  ]$$::jsonb,
  $$[{"contexto":"todos","ajuste":"sem ajuste hepático"}]$$::jsonb,
  'B',
  'Seguro em todos os trimestres.',
  'Compatível.',
  $$[
    {"com":"probenecida","efeito":"aumenta nível (compete na excreção)","manejo":"considerar reduzir dose"},
    {"com":"AINE","efeito":"nefrotoxicidade aditiva","manejo":"hidratar bem"},
    {"com":"micofenolato, ciclosporina","efeito":"aumenta nível dos imunossupressores","manejo":"monitorar"},
    {"com":"tenofovir","efeito":"nefrotoxicidade aditiva","manejo":"monitorar Cr"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade ao aciclovir ou valaciclovir','encefalopatia prévia por aciclovir'],
  $$[
    {"freq":"comum (IV)","evento":"flebite, irritação no local"},
    {"freq":"incomum","evento":"náusea, cefaleia"},
    {"freq":"incomum (IV)","evento":"cristalúria → IRA (hidratação inadequada)"},
    {"freq":"raro","evento":"neurotoxicidade (mioclonia, alucinação, encefalopatia) — especialmente DRC e idoso"},
    {"freq":"raro","evento":"trombocitopenia, anemia"}
  ]$$::jsonb,
  ARRAY['IV: infundir em ≥ 1 hora COM hidratação adequada (prevenir cristalúria) — ≥ 200 mL SF antes da dose','Verificar função renal antes e durante uso IV','Em DRC: usar valaciclovir VO 1 g 8/8h é alternativa com ajuste similar','Eficaz contra HSV, VZV; CMV requer ganciclovir/valganciclovir'],
  ARRAY['Função renal e hidratação durante IV','Sintomas SNC em DRC','Sítio de aplicação tópica (ardor)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=aciclovir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 49. FLUCONAZOL
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'fluconazol',
  'Fluconazol',
  ARRAY['Zoltec', 'Diflucan', 'Fluconazol Genérico'],
  'Antifúngico azólico (síntese de ergosterol)',
  ARRAY['VO', 'IV'],
  $$[
    {"forma":"cápsula","concentracao":"50 mg, 100 mg, 150 mg, 200 mg"},
    {"forma":"frasco IV","concentracao":"2 mg/mL (50, 100, 200 mL)"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"candidíase vulvovaginal não-complicada","dose":"150 mg VO dose única"},
      {"para":"candidíase vulvovaginal recorrente","dose":"150 mg VO 3 doses (dia 1, 4, 7) → 150 mg 1x/sem por 6 meses"},
      {"para":"candidíase oral / esofágica","dose":"200 mg dose 1, depois 100 mg/dia VO","duracao":"7–14 dias (oral) / 14–21 dias (esofágica)"},
      {"para":"candidemia / candidíase invasiva","dose":"800 mg IV ataque, depois 400 mg/dia","duracao":"14 dias após cultura negativa","obs":"considerar equinocandina (caspofungina) como 1ª linha em UTI"},
      {"para":"meningite criptocócica (consolidação)","dose":"400–800 mg/dia VO ou IV","duracao":"8 semanas após indução com anfo B"},
      {"para":"profilaxia em neutropenia febril","dose":"400 mg VO 1x/dia"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"candidíase","dose":"6–12 mg/kg/dia VO/IV 1x/dia","max":"800 mg/dia"}
    ]
  }$$::jsonb,
  $${"obs":"Sem ajuste por idade. Monitorar QTc e função hepática."}$$::jsonb,
  $$[
    {"clcr":">50","ajuste":"sem ajuste"},
    {"clcr":"<50","ajuste":"50% da dose"},
    {"clcr":"hemodiálise","ajuste":"100% da dose após sessão (3x/sem)"}
  ]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose, monitorar TGO/TGP"}]$$::jsonb,
  'C',
  'Dose única (150 mg) parece segura. Doses repetidas/altas: malformações craniofaciais e cardíacas → CONTRAINDICADO em uso crônico.',
  'Compatível.',
  $$[
    {"com":"varfarina","efeito":"INR ↑ marcado (inibe CYP2C9)","manejo":"reduzir varfa 50% e checar INR em 3 dias"},
    {"com":"sinvastatina, atorvastatina","efeito":"miopatia/rabdomiólise","manejo":"limitar dose ou trocar por pravastatina"},
    {"com":"sulfonilureias (glibenclamida)","efeito":"hipoglicemia","manejo":"monitorar glicemia"},
    {"com":"fenitoína, carbamazepina","efeito":"aumenta nível","manejo":"monitorar"},
    {"com":"QT-prolongadores (haloperidol, metadona, ondansetrona, quinolonas)","efeito":"torsade","manejo":"evitar; ECG basal"},
    {"com":"tacrolimus, ciclosporina","efeito":"aumenta nível imunossupressor","manejo":"monitorar nível"},
    {"com":"rifampicina","efeito":"reduz nível flu","manejo":"aumentar dose"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade a azólicos','QTc prolongado','uso concomitante com QT-prolongadores potentes (eritromicina IV, pimozida)','gestação para uso crônico ou alta dose'],
  $$[
    {"freq":"comum","evento":"náusea, cefaleia, dor abdominal"},
    {"freq":"comum","evento":"rash"},
    {"freq":"incomum","evento":"hepatotoxicidade leve a grave (raramente fatal)"},
    {"freq":"incomum","evento":"prolongamento QT, torsade"},
    {"freq":"raro","evento":"síndrome de Stevens-Johnson, NET"},
    {"freq":"raro","evento":"alopecia (uso prolongado)"}
  ]$$::jsonb,
  ARRAY['Verificar lista de interações por CYP — fluconazol é um dos azólicos com MAIS interações','Em uso > 14 dias: dosar TGO/TGP','Em paciente cardiopata: ECG basal antes de iniciar dose alta','NÃO usa para Aspergillus, Mucor, C. krusei, C. glabrata (resistência)'],
  ARRAY['TGO/TGP semanal se uso > 14 dias','ECG se cardiopata ou QT-prolongadores','Sintomas hepáticos (icterícia)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fluconazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();

-- ============================================================
-- 50. ONDANSETRONA
-- ============================================================
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  bula_fonte_url, published
) VALUES (
  'ondansetrona',
  'Ondansetrona',
  ARRAY['Vonau', 'Zofran', 'Ondansetrona Genérico'],
  'Antagonista do receptor 5-HT3 (antiemético)',
  ARRAY['VO', 'IV', 'IM', 'sublingual'],
  $$[
    {"forma":"comprimido","concentracao":"4 mg, 8 mg"},
    {"forma":"comprimido bucal Flash","concentracao":"4 mg, 8 mg"},
    {"forma":"ampola","concentracao":"2 mg/mL (2 mL = 4 mg; 4 mL = 8 mg)"},
    {"forma":"solução oral","concentracao":"4 mg/5 mL"}
  ]$$::jsonb,
  $${
    "indicacoes":[
      {"para":"náusea/vômito pós-operatório (PONV)","dose":"4 mg IV ao final da cirurgia","obs":"profilaxia"},
      {"para":"náusea/vômito por quimioterapia (CINV) altamente emetogênica","dose":"8 mg IV antes da quimio + 8 mg IV/VO 12/12h por 1–2 dias","obs":"associar dexa + neurocinina (aprepitanto)"},
      {"para":"náusea/vômito por radioterapia","dose":"8 mg VO 1–2h antes de cada sessão"},
      {"para":"hiperêmese gravídica","dose":"4–8 mg VO ou IV 8/8h","obs":"FDA: evidência de risco fetal limitada (categoria B); usar se outras medidas falharem"},
      {"para":"gastroenterite com vômito (off-label, criança)","dose":"4 mg VO sublingual","obs":"reduz hospitalização (Cochrane)"}
    ]
  }$$::jsonb,
  $${
    "indicacoes":[
      {"para":"vômito por CINV ou pós-op","dose":"0,15 mg/kg/dose IV (max 16 mg/dose)"}
    ]
  }$$::jsonb,
  $${"obs":"Maior risco de QT-prolongamento. Não exceder 8 mg IV em > 75a (FDA 2012)."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"Child-Pugh ≥ B","ajuste":"max 8 mg/dia"}]$$::jsonb,
  'B',
  'Sem evidência forte de teratogenicidade. Pode ser usada em hiperêmese refratária (avaliar 1º trimestre).',
  'Compatível.',
  $$[
    {"com":"QT-prolongadores (haloperidol, metadona, citalopram, quinolonas, claritromicina)","efeito":"torsade de pointes","manejo":"evitar; se necessário, ECG basal e monitor"},
    {"com":"tramadol","efeito":"reduz analgesia","manejo":"trocar antiemético"},
    {"com":"apomorfina","efeito":"hipotensão grave","manejo":"contraindicado"},
    {"com":"ISRS / IMAO","efeito":"síndrome serotoninérgica (raro)","manejo":"monitorar"}
  ]$$::jsonb,
  ARRAY['hipersensibilidade','uso concomitante com apomorfina','QT longo congênito'],
  $$[
    {"freq":"comum","evento":"cefaleia, constipação"},
    {"freq":"comum","evento":"sensação de calor, flush"},
    {"freq":"incomum","evento":"prolongamento QT, bradicardia"},
    {"freq":"incomum","evento":"elevação de TGO/TGP transitória"},
    {"freq":"raro","evento":"torsade de pointes"},
    {"freq":"raro","evento":"reação extrapiramidal (especialmente em criança)"},
    {"freq":"raro","evento":"síndrome serotoninérgica (com ISRS)"}
  ]$$::jsonb,
  ARRAY['FDA 2012: max 16 mg IV dose única (acima disso, risco QT)','> 75a: max 8 mg IV','Em paciente cardiopata em uso de QT-prolongadores: ECG basal','Não causa sedação (ao contrário de metoclopramida ou anti-histamínicos)','Em hiperêmese gravídica: 1ª linha é piridoxina+doxilamina, depois metoclopramida; ondansetrona quando refratário'],
  ARRAY['ECG se múltiplos QT-prolongadores ou cardiopata','Função intestinal (constipação)'],
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ondansetrona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, updated_at = now();
