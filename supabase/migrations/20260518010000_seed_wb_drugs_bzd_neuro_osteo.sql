-- PreceptorBook: Bloco 7 — BZDs (4) + Hipnótico (1) + Psiq adicional (2) + Anticonvulsivante (2) + Osteo (3) = 12 drogas
-- Total após esta migration: 145 drogas

-- 134. CLONAZEPAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'clonazepam',
  'Clonazepam',
  ARRAY['Rivotril','Clopam'],
  'Benzodiazepínico longa ação',
  ARRAY['VO','sublingual'],
  $$[{"forma":"comprimido","concentracao":"0,5/2 mg"},{"forma":"gotas","concentracao":"2,5 mg/mL (1 gota = 0,1 mg)"}]$$::jsonb,
  $${"indicacoes":[{"para":"transtorno do pânico (uso curto)","dose":"0,25-1 mg 12/12h","via":"VO","duracao":"≤2-4 sem (ponte até ISRS agir)","obs":"USO LIMITADO. Risco dependência. NÃO primeira escolha em manutenção"},{"para":"epilepsia (mioclônica, ausência atípica)","dose":"INICIAR 0,5-1 mg/dia, titular até 4-8 mg/dia","via":"VO","obs":"adjuvante"},{"para":"abstinência alcoólica grave","dose":"0,5-2 mg 8/8h, titular pela CIWA","via":"VO","obs":"diazepam é alternativa; lorazepam preferido em hepatopatia"},{"para":"agitação aguda","dose":"0,5-2 mg sublingual ou VO","obs":"USO RACIONAL — não cronificar"}]}$$::jsonb,
  $${"obs":"INICIAR 0,25 mg. Risco quedas, deterioração cognitiva, demência (uso crônico). EVITAR CRÔNICO."}$$::jsonb,
  'D','Categoria D — fenda palatina, malformações em 1º trim. Síndrome adaptativa neonatal + abstinência se uso 3º trim. EVITAR.','Sedação RN — evitar ou usar dose mínima.',
  ARRAY['miastenia gravis','glaucoma de ângulo fechado agudo','depressão respiratória grave','apneia do sono não tratada','hepatopatia grave','dependência prévia','gestação 1º trim'],
  $$[{"freq":"muito comum","evento":"sedação, sonolência diurna"},{"freq":"comum","evento":"alteração cognitiva, memória"},{"freq":"comum","evento":"ataxia, queda (idoso)"},{"freq":"comum","evento":"dependência física + tolerância (uso >2-4 sem)"},{"freq":"incomum","evento":"depressão (paradoxal/agravamento)"},{"freq":"raro","evento":"depressão respiratória (com opioides/álcool)"},{"freq":"raro","evento":"reação paradoxal (agitação)"}]$$::jsonb,
  ARRAY['BZD CRÔNICO É ARMADILHA — em ≥2-4 sem cria dependência. Em idoso aumenta queda 50%, demência, mortalidade. NÃO INICIAR em paciente sem indicação clara e plano de saída','BZD + OPIOIDE = depressão respiratória (FDA Black Box) — coprescrição traz mortalidade','SUSPENSÃO ABRUPTA = abstinência grave (insônia rebote, ansiedade, convulsão) — desmamar 10-25% da dose por sem','MEIA-VIDA LONGA (30-40h) — acumula em idoso. Preferir lorazepam (curta, sem metabólito ativo) em hepatopatia','PACIENTES IDOSOS COM INSÔNIA: NÃO usar BZD — preferir higiene do sono + TCC. Se insistir: zolpidem dose baixa por 2 sem máximo','RECEITA ESPECIAL CONTROLADA (B1) no Brasil — válida 30 dias'],
  ARRAY['Sinais dependência / abuso','Quedas (idoso)','Função cognitiva','Sintomas psiquiátricos (depressão, ideação)','Plano de desmame'],
  'BZD longa ação — liga ao sítio benzodiazepínico do receptor GABA-A → potencia (allosterismo positivo) ação do GABA → aumenta frequência de abertura do canal de cloro → hiperpolarização neuronal → inibição. Efeitos: ansiolítico, sedativo, hipnótico, anticonvulsivante, miorrelaxante, amnésico. Lipossolubilidade alta = boa BHE. Meia-vida 30-40h.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=clonazepam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 135. DIAZEPAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'diazepam',
  'Diazepam',
  ARRAY['Valium','Diazepam'],
  'Benzodiazepínico longa ação',
  ARRAY['VO','IV','IM','retal'],
  $$[{"forma":"comprimido","concentracao":"5/10 mg"},{"forma":"ampola","concentracao":"5 mg/mL (10 mg/2mL)"},{"forma":"gel retal","concentracao":"5/10/20 mg (Diastat)"}]$$::jsonb,
  $${"indicacoes":[{"para":"crise convulsiva / status epilepticus","dose":"10 mg IV em 2 min, repetir 1x se persistir após 5 min. Sem acesso: midazolam IM/IN preferível","via":"IV","obs":"PRIMEIRA LINHA. Após BZD: fenitoína/levetiracetam"},{"para":"abstinência alcoólica","dose":"10-20 mg VO 4-6/6h conforme CIWA, titular","via":"VO","duracao":"3-7 dias com desmame","obs":"primeira escolha em hepatopatia leve. Evitar em hepatopatia grave (lorazepam preferível)"},{"para":"crise convulsiva peds (febril prolongada / status)","dose":"0,3-0,5 mg/kg retal (Diastat) ou 0,25-0,4 mg/kg IV","via":"retal ou IV"},{"para":"sedação procedimento (curto)","dose":"5-10 mg IV titular","obs":"sedação leve para procedimento"}]}$$::jsonb,
  $${"indicacoes":[{"para":"crise febril prolongada","dose":"0,5 mg/kg retal (max 10 mg)"}]}$$::jsonb,
  $${"obs":"reduzir 50%. Acumula em idoso (meia-vida >50h em ≥80a)."}$$::jsonb,
  'D','Mesmas restrições que clonazepam.','Sedação RN.',
  ARRAY['miastenia gravis','glaucoma agudo','depressão respiratória grave','apneia sono','dependência prévia'],
  $$[{"freq":"muito comum","evento":"sedação"},{"freq":"comum","evento":"ataxia, deterioração cognitiva"},{"freq":"comum","evento":"dependência física"},{"freq":"raro","evento":"depressão respiratória"}]$$::jsonb,
  ARRAY['DIAZEPAM IV NÃO USAR EM SOLUÇÃO IM — absorção errática. Em IM emergência: midazolam é melhor','MEIA-VIDA MUITO LONGA: composto + metabólitos ativos (desmetildiazepam) — acumula em uso crônico, idoso, hepatopata','VANTAGEM EM ABSTINÊNCIA ALCOÓLICA: meia-vida longa = desmame "natural"','RETAL (Diastat): útil em crise convulsiva pediátrica em casa — alternativa quando não há acesso IV','RECEITA B1 — receita especial controlada'],
  ARRAY['Função respiratória','Sinais dependência','Função hepática (acumula em hepatopata)'],
  'BZD longa ação — mesmo mecanismo do clonazepam (potencializador alostérico GABA-A). Diferenças farmacocinéticas: absorção VO rápida (boa para IM ruim), metabólitos ativos (desmetildiazepam, oxazepam) com meia-vida muito longa (até 100h) → acumula. Início rápido IV (~2 min) — útil em status epilepticus.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=diazepam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 136. LORAZEPAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'lorazepam',
  'Lorazepam',
  ARRAY['Lorax','Ativan'],
  'Benzodiazepínico ação intermediária',
  ARRAY['VO','IV','IM','sublingual'],
  $$[{"forma":"comprimido","concentracao":"1/2 mg"},{"forma":"ampola","concentracao":"4 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"status epilepticus (1ª linha)","dose":"4 mg IV em 2 min (0,1 mg/kg peds)","via":"IV","obs":"PREFERÍVEL ao diazepam em status (meia-vida cerebral mais longa, menos acúmulo periférico)"},{"para":"abstinência alcoólica em hepatopata","dose":"1-2 mg VO/IV 4-6/6h","via":"VO ou IV","obs":"PRIMEIRA ESCOLHA em hepatopatia (não tem metabólito ativo, glicuronidação direta)"},{"para":"náusea antecipatória pré-quimio","dose":"0,5-1 mg VO/SL 30 min antes","obs":"adjuvante a antieméticos primários"},{"para":"agitação aguda / pânico","dose":"0,5-2 mg VO/SL/IM","obs":"uso curto"},{"para":"sedação UTI (alternativa)","dose":"1-4 mg/h BIC","obs":"alternativa a midazolam — menos acúmulo. NÃO PREFERIDA em UTI atualmente (preferir dexmedetomidina/propofol)"}]}$$::jsonb,
  $${"obs":"reduzir 50%."}$$::jsonb,
  'D','Categoria D.','Sedação RN.',
  ARRAY['miastenia gravis','glaucoma agudo','depressão respiratória grave'],
  $$[{"freq":"comum","evento":"sedação, ataxia"},{"freq":"comum","evento":"dependência física"},{"freq":"raro","evento":"acidose lática (BIC altas doses — propilenoglicol veículo)"}]$$::jsonb,
  ARRAY['SEM METABÓLITO ATIVO — vantagem em IDOSO e HEPATOPATIA (glicuronidação direta, não CYP)','PROPILENOGLICOL como veículo IV em altas doses prolongadas → acidose lática + IRA. Monitor em BIC >10 mg/h ≥48h','PREFERÊNCIA EM STATUS EPILEPTICUS — guidelines 2016 (Neurocritical Care Society): lorazepam IV é 1ª linha junto com midazolam IM','MEIA-VIDA INTERMEDIÁRIA (10-20h) — boa para uso pontual sem acúmulo'],
  ARRAY['Lactato em BIC alta dose','Função hepática','Dependência'],
  'BZD intermediária ação. Mesmo mecanismo (potencializador GABA-A). Vantagem: glicuronidação direta hepática (sem fase I do CYP) → sem metabólito ativo, eliminação previsível em hepatopatia/idoso. Meia-vida 10-20h. Boa biodisponibilidade SL/IV.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=lorazepam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 137. ALPRAZOLAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'alprazolam',
  'Alprazolam',
  ARRAY['Frontal','Apraz'],
  'Benzodiazepínico curta ação',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"0,25/0,5/1/2 mg"},{"forma":"comprimido XR","concentracao":"0,5/1/2/3 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"transtorno do pânico (uso curto)","dose":"0,25-0,5 mg 8/8h, titular até 1-4 mg/dia (max 10 mg/dia)","via":"VO","duracao":"≤2-4 sem (ponte até ISRS)","obs":"NÃO PRIMEIRA ESCOLHA. Risco dependência ALTO (curta ação = mais reforçador)"},{"para":"ansiedade situacional","dose":"0,25-0,5 mg dose única antes do gatilho","obs":"SOS — não cronificar"}]}$$::jsonb,
  $${"obs":"INICIAR 0,125-0,25 mg. Alta sensibilidade."}$$::jsonb,
  'D','Categoria D — fenda palatina relatada.','Evitar.',
  ARRAY['glaucoma agudo','dependência prévia','depressão respiratória','miastenia'],
  $$[{"freq":"muito comum","evento":"sedação"},{"freq":"muito comum","evento":"DEPENDÊNCIA (alta — curta meia-vida = reforçador)"},{"freq":"comum","evento":"alteração cognitiva"},{"freq":"comum","evento":"insônia rebote (entre doses ou após suspensão)"}]$$::jsonb,
  ARRAY['ALPRAZOLAM TEM MAIOR POTENCIAL DE DEPENDÊNCIA entre BZDs — meia-vida curta + alta potência = reforçamento intenso','Em uso crônico: SUSPENSÃO ABRUPTA → abstinência GRAVE (convulsão, psicose). Desmame muito gradual','RECEITA B1 controlada. Brasil tem alta prescrição inadequada — atenção ao uso','SEM USO CRÔNICO RECOMENDÁVEL — preferir ISRS em ansiedade/pânico de longo prazo'],
  ARRAY['Sinais abuso/dependência','Plano de desmame','Sintomas rebote'],
  'BZD curta-intermediária ação (meia-vida 6-12h). Mesmo mecanismo dos BZDs. Diferenças: alta potência (1 mg ≈ 10 mg diazepam), curta ação → maior reforçamento (sensação de "sem proteção" entre doses).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=alprazolam',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 138. ZOLPIDEM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'zolpidem',
  'Zolpidem',
  ARRAY['Stilnox','Zolp'],
  'Hipnótico não-benzodiazepínico (Z-drug)',
  ARRAY['VO','sublingual'],
  $$[{"forma":"comprimido","concentracao":"5/10 mg"},{"forma":"sublingual","concentracao":"5 mg"},{"forma":"CR (controlled release)","concentracao":"6,25/12,5 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"insônia primária — uso curto","dose":"5-10 mg ao deitar (ir direto à cama, depois mín 7-8h sono)","via":"VO ou SL","duracao":"≤2-4 SEMANAS","obs":"USO CURTO. Em mulher: máx 5 mg (eliminação mais lenta — FDA 2013)"}]}$$::jsonb,
  $${"obs":"5 mg max (idoso, mulher)."}$$::jsonb,
  'C','Categoria C. Sem evidência teratogenia significativa, mas evitar.','Compatível em curto prazo.',
  ARRAY['hipersensibilidade','apneia sono não tratada','miastenia gravis','depressão respiratória grave','dependência prévia'],
  $$[{"freq":"comum","evento":"sonolência diurna residual"},{"freq":"comum","evento":"cefaleia"},{"freq":"incomum","evento":"COMPORTAMENTO COMPLEXO DURANTE O SONO (sonambulismo, dirigir/comer dormindo, sexo dormindo) — Black Box FDA 2019. SUSPENDER se ocorrer"},{"freq":"incomum","evento":"amnésia"},{"freq":"raro","evento":"dependência (menor que BZD mas existe)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA 2019: COMPORTAMENTO COMPLEXO durante o sono — sonambulismo, dirigir, comer, sexo. SUSPENDER após qualquer episódio. Acidentes e mortes documentadas','MULHER metaboliza mais lento — FDA reduziu dose feminina (5 mg max regular, 6,25 mg CR) por sonolência diurna ↑','EFEITO PARADOXAL EM IDOSO — quedas, confusão. Preferir trazodona 25-50 mg ou melatonina 0,5-3 mg em idoso','TOMAR JÁ NA CAMA — efeito em 15-30 min. Não levantar para outras tarefas após','USO PROLONGADO causa dependência apesar do marketing — não cronificar'],
  ARRAY['Eficácia (qualidade sono subjetiva)','Comportamento durante sono (perguntar)','Sonolência diurna','Dependência'],
  'Z-drug — agonista SELETIVO da subunidade ω1 (α1) do receptor GABA-A → efeito hipnótico predominante (vs ansiolítico/miorrelaxante/anticonvulsivante dos BZDs). Início rápido (15-30 min), meia-vida curta (1,5-3h) → menos sonolência residual. Mesmo sítio receptor BZD → flumazenil reverte.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=zolpidem',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 139. BUPROPIONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'bupropiona',
  'Bupropiona',
  ARRAY['Wellbutrin','Bup','Zetron'],
  'Antidepressivo IRND (inibidor recaptação noradrenalina + dopamina)',
  ARRAY['VO'],
  $$[{"forma":"comprimido SR","concentracao":"150 mg"},{"forma":"comprimido XL","concentracao":"150/300 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior","dose":"INICIAR 150 mg/dia × 4 dias → 300 mg/dia (XL 1x/dia ou SR 12/12h). Max 450 mg/dia","via":"VO","frequencia":"1x/dia (XL) ou 12/12h (SR)","obs":"VANTAGEM: SEM disfunção sexual + SEM ganho de peso (vs ISRS). Útil em depressão atípica/com fadiga"},{"para":"cessação tabagismo","dose":"150 mg/dia × 3-7 dias → 150 mg 12/12h × 7-12 sem","via":"VO","obs":"INICIAR 1-2 sem ANTES do dia D (parar de fumar). Efeito independente da depressão. Alternativa: vareniclina (mais eficaz)"},{"para":"TDAH adulto (off-label)","dose":"150-450 mg/dia"},{"para":"disfunção sexual induzida por ISRS (adjuvante)","dose":"75-150 mg/dia adicionado ao ISRS"}]}$$::jsonb,
  'C','Categoria C. Sem evidência teratogenia clara; alguns dados sugerem aumento defeito cardíaco — evitar 1º trim se possível.','Compatível com cautela.',
  ARRAY['EPILEPSIA (reduz limiar convulsivo)','BULIMIA / anorexia (risco convulsão)','suspensão abrupta de álcool/BZD','TCE recente','tumor SNC','uso de IMAO <14d'],
  $$[{"freq":"muito comum","evento":"insônia (dose noturna agrava)"},{"freq":"comum","evento":"boca seca, cefaleia"},{"freq":"comum","evento":"náusea (cede)"},{"freq":"comum","evento":"agitação, ansiedade"},{"freq":"comum","evento":"perda peso leve"},{"freq":"incomum","evento":"taquicardia, HAS"},{"freq":"raro (<0,1% se dose ≤300 mg/dia)","evento":"CONVULSÃO (dose-dependente — >450 mg sobe muito)"}]$$::jsonb,
  ARRAY['CONVULSÃO é risco principal — limitar dose <450 mg/dia. EVITAR em paciente com história de convulsão, bulimia, anorexia, abstinência álcool/BZD','TOMAR PELA MANHÃ (insônia ↑↑ se à noite)','SEM EFEITO SEROTONINÉRGICO — sem disfunção sexual, sem ganho peso. Alternativa em paciente intolerante a ISRS','EM DEPRESSÃO COM ANSIEDADE/AGITAÇÃO: pode piorar — preferir ISRS','VANTAGEM EM CESSAÇÃO TABAGISMO: efeito em receptores nicotínicos contribui'],
  ARRAY['Resposta clínica','PA','Sintomas convulsivos','Comportamento (ideação suicida)'],
  'IRND — inibe recaptação de NORADRENALINA e DOPAMINA via NET e DAT. Mínimo efeito serotoninérgico → sem disfunção sexual, sem ganho peso. Também antagonista de receptores nicotínicos da acetilcolina (αβ4) — daí utilidade em cessação tabagismo. Reduz limiar convulsivo dose-dependente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=bupropiona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 140. MIRTAZAPINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'mirtazapina',
  'Mirtazapina',
  ARRAY['Remeron','Razapina'],
  'Antidepressivo NaSSA (noradrenérgico e serotoninérgico específico)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"15/30/45 mg"},{"forma":"orodispersível","concentracao":"15/30/45 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior (com insônia/perda peso/agitação)","dose":"INICIAR 15-30 mg ao deitar, max 45 mg","via":"VO","frequencia":"1x/dia (noite)","obs":"VANTAGEM: melhora INSÔNIA e GANHA PESO (útil em paciente desnutrido, idoso anoréxico). Resposta mais rápida que ISRS"},{"para":"insônia com depressão","dose":"7,5-15 mg ao deitar","obs":"baixa dose tem mais efeito sedativo (paradoxal — dose maior é menos sedativa)"},{"para":"náusea refratária / paliativos","dose":"15-30 mg/dia","obs":"efeito 5-HT3 antagonista útil"}]}$$::jsonb,
  $${"obs":"INICIAR 7,5-15 mg. Sedação/queda."}$$::jsonb,
  'C','Categoria C. Sem evidência teratogenia significativa.','Compatível com cautela.',
  ARRAY['IMAO <14 dias','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"GANHO DE PESO (efeito anti-H1)"},{"freq":"muito comum","evento":"sedação (especialmente em doses baixas)"},{"freq":"comum","evento":"boca seca, constipação"},{"freq":"comum","evento":"aumento apetite"},{"freq":"comum","evento":"tontura"},{"freq":"incomum","evento":"hipertrigliceridemia, ↑colesterol"},{"freq":"raro","evento":"agranulocitose (1:10000) — orientar paciente sobre febre + dor garganta"},{"freq":"raro","evento":"síndrome serotoninérgica"}]$$::jsonb,
  ARRAY['DOSES BAIXAS (7,5-15 mg) MAIS SEDATIVAS que altas — paradoxal (efeito H1 saturado em baixa dose; efeito noradrenérgico contrabalança em altas)','VANTAGEM CLÍNICA EM: idoso anoréxico, paciente com insônia + depressão, paciente que perdeu peso por depressão','SEM DISFUNÇÃO SEXUAL ou ganho peso secundário a serotonina (vs ISRS — vantagem)','AGRANULOCITOSE rara mas grave — orientar sobre febre + odinofagia → hemograma','Pode ser usado em conjunto com ISRS em depressão refratária (combinação Califórnia rocket fuel)','Em IDOSO: mirtazapina é boa escolha (sem disfunção cognitiva, melhora apetite + sono)'],
  ARRAY['Resposta clínica','Peso, perfil lipídico','Hemograma se febre','Glicemia (paciente em risco metabólico)'],
  'Antagonista de α2-adrenérgicos pré-sinápticos → AUMENTA liberação de noradrenalina e serotonina. Antagonista 5-HT2 e 5-HT3 → ação preferencial via 5-HT1A (efeito antidepressivo + ansiolítico, sem disfunção sexual / náusea / agitação). Forte antagonista H1 → sedação + ganho peso. Sem efeito em recaptação (vs ISRS/IRSN).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=mirtazapina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 141. CARBAMAZEPINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'carbamazepina',
  'Carbamazepina',
  ARRAY['Tegretol','Tegretard'],
  'Anticonvulsivante / estabilizador humor',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"200/400 mg"},{"forma":"suspensão","concentracao":"20 mg/mL"},{"forma":"CR","concentracao":"200/400 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"NEURALGIA DO TRIGÊMEO (1ª escolha)","dose":"INICIAR 100-200 mg 12/12h, titular até 600-1200 mg/dia","via":"VO","obs":"PRIMEIRA ESCOLHA — alívio em 50-90%. Alternativa: oxcarbazepina (mais tolerada)"},{"para":"epilepsia focal (com ou sem generalização)","dose":"INICIAR 200 mg 12/12h, titular 200 mg/sem até 800-1200 mg/dia (alvo nível 4-12 mcg/mL)","via":"VO"},{"para":"transtorno bipolar (mania, manutenção)","dose":"400-1200 mg/dia divididos","obs":"alternativa ao lítio/valproato"}]}$$::jsonb,
  $${"indicacoes":[{"para":"epilepsia peds","dose":"10-20 mg/kg/dia, titular"}]}$$::jsonb,
  'D','Categoria D — DTN (espinha bífida 1-2%), defeitos cardíacos, anomalia craniofacial. Suplementar ácido fólico 4-5 mg/dia. Em mulher idade fértil: preferir lamotrigina/levetiracetam.','Compatível em curto prazo, monitor RN.',
  $$[{"com":"contraceptivos hormonais","efeito":"REDUZ EFICÁCIA (indução CYP3A4) — falha contraceptiva","manejo":"método barreira + contraceptivo doses maiores"},{"com":"varfarina, DOAC","efeito":"reduz nível","manejo":"monitor INR/ajustar"},{"com":"valproato","efeito":"interação complexa — reduz CBZ + aumenta epóxido tóxico","manejo":"monitor"},{"com":"macrolídeo (claritromicina, eritromicina)","efeito":"aumenta nível CBZ","manejo":"monitor toxicidade"}]$$::jsonb,
  ARRAY['BAV','porfiria','aplasia medular prévia','uso de IMAO <14d','gestação 1º trim (se possível alternativa)','hipersensibilidade'],
  $$[{"freq":"comum","evento":"tontura, sedação, ataxia (especialmente início/dose alta)"},{"freq":"comum","evento":"náusea, vômito"},{"freq":"comum","evento":"diplopia"},{"freq":"comum","evento":"hiponatremia (SIADH — especialmente idoso)"},{"freq":"incomum","evento":"leucopenia, trombocitopenia"},{"freq":"raro","evento":"APLASIA MEDULAR (1:200000)"},{"freq":"raro","evento":"SJS/TEN — risco aumentado HLA-B*1502 (asiático). Rastrear ANTES"},{"freq":"raro","evento":"hepatite, pancreatite"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: SJS/TEN — risco MUITO aumentado em portadores HLA-B*1502 (até 10x). RASTREAR antes em descendência asiática/han chinesa','HIPONATREMIA por SIADH é comum em idoso — monitor Na sérico semestral','POTENTE INDUTOR CYP3A4/2C9 — reduz contraceptivos, varfarina, DOAC, corticoide, antifúngicos azólicos. AUTOINDUÇÃO: nível cai em 2-4 sem (precisa ajustar)','MONITOR HEMOGRAMA mensalmente nos 3 meses iniciais — leucopenia transitória comum, mas raro evoluir para aplasia','RECEITA controlada B1 no Brasil','GESTANTE: evitar — preferir lamotrigina/levetiracetam. Se essencial: suplementar ácido fólico 4-5 mg/dia + USG morfológico'],
  ARRAY['Nível sérico (alvo 4-12 mcg/mL)','Hemograma mensal × 3 meses, depois trimestral','Sódio sérico semestral','TGO/TGP basal + a cada 3 meses','Sintomas SJS (rash novo)','HLA-B*1502 em descendência asiática'],
  'Bloqueia canais de sódio voltagem-dependentes em estado inativo → impede disparos repetitivos de neurônios hiperexcitáveis → estabiliza membrana. Reduz transmissão sináptica em circuitos epileptogênicos e dor neuropática (trigêmeo). Auto-induz seu próprio metabolismo via CYP3A4.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=carbamazepina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 142. LAMOTRIGINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'lamotrigina',
  'Lamotrigina',
  ARRAY['Lamictal','Lamitor'],
  'Anticonvulsivante / estabilizador humor',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"25/50/100 mg"},{"forma":"comprimido dispersível","concentracao":"5/25/100 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"epilepsia focal e generalizada","dose":"TITULAÇÃO LENTA OBRIGATÓRIA: 25 mg/dia × 2 sem → 50 mg/dia × 2 sem → 100 mg/dia × 1 sem → 200 mg/dia (manutenção)","via":"VO","frequencia":"1-2x/dia","obs":"alternativa em mulher idade fértil (perfil teratogenia favorável)"},{"para":"transtorno bipolar — fase depressiva","dose":"mesma titulação acima, alvo 200 mg/dia","via":"VO","obs":"ESPECÍFICO para depressão bipolar — eficácia em mania é menor (carbamazepina/valproato/lítio melhor)"},{"para":"síndrome Lennox-Gastaut, ausência atípica","dose":"conforme titulação"}]}$$::jsonb,
  $$[{"clcr":"<30","ajuste":"considerar reduzir dose"}]$$::jsonb,
  $$[{"contexto":"hepatopatia moderada","ajuste":"reduzir 50%"},{"contexto":"hepatopatia grave","ajuste":"reduzir 75%"}]$$::jsonb,
  'C','Categoria C. PERFIL FAVORÁVEL — sem aumento de DTN ou outras malformações em estudos. Preferida em mulher idade fértil. Suplementar ácido fólico 1 mg.','Excretada no leite — RN podem ter sintomas (rash, sedação). Monitor.',
  ARRAY['hipersensibilidade','reação cutânea grave prévia a anticonvulsivante'],
  $$[{"freq":"comum","evento":"rash maculopapular benigno (cede)"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"diplopia, visão borrada"},{"freq":"comum","evento":"náusea"},{"freq":"raro (~0,1-0,3%)","evento":"SJS / TEN / DRESS — em titulação rápida ou interação com valproato. RISCO MAIOR PRIMEIROS 2 MESES"},{"freq":"raro","evento":"meningite asséptica"},{"freq":"raro","evento":"hepatotoxicidade"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: REAÇÃO CUTÂNEA GRAVE (SJS/TEN/DRESS) — risco maior em: 1) titulação rápida (DOBRO em 2 sem em vez de 4), 2) associação com VALPROATO (que aumenta nível lamo 100%), 3) primeiros 2 MESES','TITULAÇÃO LENTA é OBRIGATÓRIA — qualquer rash novo nas primeiras 8 sem → SUSPENDER imediatamente, avaliar urgência','SE ASSOCIAR VALPROATO: titular MAIS LENTAMENTE ainda (12,5 mg/dia × 2 sem → 25 mg/dia × 2 sem → 50 mg/dia)','SE INTERROMPER >5 DIAS: precisa titular novamente do zero','PERFIL FAVORÁVEL EM GESTAÇÃO — opção em mulher idade fértil, MAS necessidade aumenta 2-3x na gestação (estrogênio induz glicuronidação) — monitor nível e ajustar'],
  ARRAY['Sintomas cutâneos (rash → suspender)','Sintomas neurológicos','Nível sérico em titulação/gestação (alvo 2-15 mcg/mL)','Função hepática'],
  'Bloqueia canais de sódio voltagem-dependentes em estado inativo (similar carbamazepina) → estabiliza membrana neuronal → reduz liberação de glutamato. Mecanismo adicional em depressão bipolar provavelmente via redução de glutamato em circuitos límbicos. Glicuronidação direta — sem CYP, sem auto-indução, sem interações maiores (exceto valproato que inibe glicuronidação).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=lamotrigina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- OSTEOPOROSE / METABOLISMO ÓSSEO
-- ============================================================

-- 143. ALENDRONATO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'alendronato',
  'Alendronato',
  ARRAY['Fosamax','Alendronato'],
  'Bisfosfonato — antirreabsortivo',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"10 mg (diário) / 70 mg (semanal)"}]$$::jsonb,
  $${"indicacoes":[{"para":"osteoporose pós-menopausa","dose":"70 mg 1x/SEMANA OU 10 mg/dia","via":"VO em jejum (≥30 min antes café), com 200 mL ÁGUA, em pé/sentado","duracao":"5 anos (reavaliação) → ≥10 anos se alto risco fratura","obs":"PRIMEIRA ESCOLHA. Reduz fratura vertebral 50%, quadril 50%"},{"para":"osteoporose induzida por corticoide","dose":"5-10 mg/dia ou 70 mg/sem","obs":"em paciente em uso de corticoide ≥3 meses dose ≥7,5 mg prednisona — profilaxia"},{"para":"doença de Paget","dose":"40 mg/dia × 6 meses","obs":"reduz dor + remodelamento ósseo"},{"para":"osteoporose homem","dose":"10 mg/dia ou 70 mg/sem","obs":"redução fratura comprovada"}]}$$::jsonb,
  $$[{"clcr":"<35","ajuste":"contraindicado"}]$$::jsonb,
  'C','Categoria C — acumula em osso (atravessa placenta possível, efeito desconhecido feto). EVITAR em mulher idade fértil sem contracepção segura.','Sem dados — evitar.',
  ARRAY['esofagite, hérnia hiato sintomática','incapacidade ficar ereto 30 min','hipocalcemia não corrigida','ClCr <35','obstrução esofágica/acalasia'],
  $$[{"freq":"comum","evento":"dispepsia, esofagite"},{"freq":"comum","evento":"dor abdominal"},{"freq":"comum","evento":"dor musculoesquelética"},{"freq":"incomum","evento":"OSTEONECROSE DE MANDÍBULA (uso prolongado, sobretudo IV em câncer)"},{"freq":"incomum","evento":"fratura ATÍPICA do fêmur (uso >5a) — dor coxa progressiva → Rx + RM"},{"freq":"raro","evento":"esofagite ulcerativa, perfuração"}]$$::jsonb,
  ARRAY['TÉCNICA DE ADMINISTRAÇÃO É CRÍTICA: jejum, ≥30 min antes café, 200 mL água, EM PÉ/SENTADO 30 min — não fazer = esofagite','OSTEONECROSE MANDÍBULA: rara em VO osteoporose; mais em IV (câncer). Avaliação dental ANTES de iniciar. Evitar procedimentos invasivos durante uso','FRATURA ATÍPICA FÊMUR: uso >5 anos. Dor PROGRESSIVA na coxa pode ser pré-fratura — Rx + RM','REAVALIAR após 5 anos de uso — em paciente com risco baixo: pausa terapêutica (drug holiday) 1-3 anos. Em alto risco: continuar até 10 anos','SUPLEMENTAR cálcio (1000-1200 mg/dia) + vit D (800-2000 UI/dia) — osso precisa para se mineralizar','EM IRC ClCr <35: contraindicado — risco hipocalcemia'],
  ARRAY['DEXA basal + a cada 1-2 anos','Cálcio + 25-OH-vit D anual','Função renal','Sintomas dispepsia / dor coxa / dor mandíbula','Avaliação dental basal'],
  'Bisfosfonato — análogo de pirofosfato. Liga-se à HIDROXIAPATITA do osso → INCORPORADO ao osso → quando osteoclasto reabsorve a região, ingere o fármaco → bisfosfonato INIBE FARNESILA-PIROFOSFATO SINTASE (via mevalonato) no osteoclasto → APOPTOSE do osteoclasto → reduz reabsorção óssea. Aumenta DMO. Meia-vida em osso é DÉCADAS (efeito persiste após suspensão).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=alendronato',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 144. COLECALCIFEROL (vit D3)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'colecalciferol',
  'Colecalciferol (vitamina D3)',
  ARRAY['DePura','Addera D3'],
  'Vitamina D — repositor',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"1000/2000/7000/50000 UI"},{"forma":"gotas","concentracao":"200 UI/gota"}]$$::jsonb,
  $${"indicacoes":[{"para":"deficiência (25-OH-D <20 ng/mL)","dose":"50000 UI 1x/sem × 8 semanas (ataque) → 1000-2000 UI/dia (manutenção)","via":"VO","obs":"reavaliar 25-OH-D em 3 meses. Alvo 30-50 ng/mL"},{"para":"insuficiência (25-OH-D 20-30)","dose":"1000-2000 UI/dia × 3 meses","obs":"manutenção depois"},{"para":"profilaxia/manutenção (≥50a)","dose":"1000-2000 UI/dia","via":"VO","obs":"junto com cálcio em osteoporose"},{"para":"profilaxia em lactente","dose":"400 UI/dia desde nascimento","obs":"prevenir raquitismo"},{"para":"pré-natal","dose":"600-1000 UI/dia","obs":"em conjunto com sulfato ferroso e ácido fólico"}]}$$::jsonb,
  $${"indicacoes":[{"para":"raquitismo / deficiência peds","dose":"2000-5000 UI/dia × 6-8 sem"}]}$$::jsonb,
  $${"obs":"1000-2000 UI/dia + cálcio em osteoporose."}$$::jsonb,
  'A','Categoria A em doses fisiológicas. INDICADA em pré-natal.','Compatível.',
  ARRAY['hipercalcemia','intoxicação vitamina D prévia','sarcoidose / granulomatose ativa (risco hipercalcemia)','litíase renal hipercalciúrica'],
  $$[{"freq":"raro (overdose)","evento":"hipercalcemia → náusea, vômito, polidipsia, poliúria, confusão"},{"freq":"raro","evento":"nefrolitíase"},{"freq":"raro","evento":"intoxicação (>10000 UI/dia crônico)"}]$$::jsonb,
  ARRAY['DEFICIÊNCIA DE VIT D É EPIDÊMICA — 50-80% da população em alguns estudos. Rastrear se grupo de risco (idoso, baixa exposição solar, obeso, IRC, doença GI absorção)','MEGADOSE BRASILEIRA (50000 UI/sem × 8 sem) é eficaz e segura — alternativa: 7000 UI/dia × 8 sem','EVIDÊNCIA RECENTE: suplementação de vit D em paciente sem deficiência NÃO reduz fraturas (VITAL trial), eventos CV ou câncer. Repor em DEFICIENTES','ALVO 30-50 ng/mL — não buscar valores muito altos (>100 = toxicidade)','VIT D2 (ergocalciferol, alimentos vegetais) é menos potente que D3 (animal). Preferir D3','EM SARCOIDOSE/TB: risco hipercalcemia por conversão extra-renal (macrófagos com 1α-hidroxilase) — evitar reposição rotineira'],
  ARRAY['25-OH-vitamina D (basal + 3 meses pós-início)','Cálcio sérico (em altas doses ou risco)','PTH (hiperparatireoidismo secundário em deficiência)','Função renal'],
  'Pró-hormônio. Síntese cutânea (UVB → 7-deidrocolesterol → vit D3). Ativação: D3 → 25-OH-D no FÍGADO (forma de estoque, dosada laboratorialmente) → 1,25-(OH)2-D (CALCITRIOL) no RIM (forma ativa hormonal). Liga receptor VDR nuclear → aumenta absorção intestinal cálcio + fósforo, reabsorção tubular cálcio, mobilização óssea — homeostase de cálcio + mineralização óssea.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=colecalciferol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 145. CARBONATO DE CÁLCIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'carbonato-calcio',
  'Carbonato de cálcio',
  ARRAY['Calcium','Os-Cal'],
  'Repositor de cálcio / antiácido',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"500/600/1250 mg de carbonato (= 200/240/500 mg cálcio elementar)"}]$$::jsonb,
  $${"indicacoes":[{"para":"reposição cálcio em osteoporose","dose":"500-600 mg cálcio elementar 12/12h ou 8/8h (com refeição)","via":"VO","obs":"Total 1000-1200 mg/dia (DRI). Combinar com vit D 800-2000 UI/dia. Cálcio dietético é PREFERÍVEL — suplementar apenas se ingesta insuficiente"},{"para":"hipocalcemia leve (oral)","dose":"500-1500 mg cálcio elementar/dia divididos","via":"VO","obs":"em hipocalcemia grave: gluconato cálcio IV"},{"para":"quelante de fósforo em IRC","dose":"500-1500 mg JUNTO às refeições","via":"VO","obs":"em IRC dialítico com hiperfosfatemia. Sevelamer/lantânio são alternativas sem cálcio (calcimimético em hiperpara)"},{"para":"DRGE/dispepsia (antiácido)","dose":"500-1500 mg conforme sintoma","obs":"alívio rápido, ação curta"}]}$$::jsonb,
  $${"indicacoes":[{"para":"reposição peds","dose":"500-1000 mg cálcio elementar/dia"}]}$$::jsonb,
  'A','Categoria A em doses fisiológicas.','Compatível.',
  ARRAY['hipercalcemia','hipercalciúria','litíase renal cálcica recorrente','sarcoidose','intoxicação vit D'],
  $$[{"freq":"comum","evento":"constipação"},{"freq":"comum","evento":"flatulência, distensão"},{"freq":"incomum","evento":"hipercalcemia (uso excessivo)"},{"freq":"incomum","evento":"nefrolitíase em hipercalciúricos"},{"freq":"raro","evento":"síndrome leite-álcali (cálcio + álcali = HAS, alcalose, IRA)"}]$$::jsonb,
  ARRAY['CÁLCIO DIETÉTICO É MELHOR — laticínios (1 copo leite = 300 mg). Suplementar apenas se ingesta inadequada','TOMAR COM REFEIÇÃO — carbonato precisa ácido gástrico para absorção. CITRATO de cálcio absorve melhor em jejum/IBP/idoso','DOSES DIVIDIDAS: absorção intestinal limitada por dose (~500 mg/vez) — dividir em 2-3 doses','SUPLEMENTAÇÃO ROTINEIRA EM POPULAÇÃO SAUDÁVEL NÃO REDUZ FRATURAS (algumas meta-análises) — apenas em deficiência alimentar','EM DEFICIÊNCIA DE VIT D: corrigir vit D ANTES — se não, cálcio fica não absorvido','REDUZ ABSORÇÃO de levotiroxina, ferro, quinolonas, tetraciclinas, bisfosfonatos — espaçar 2-4h'],
  ARRAY['Cálcio sérico anual','Cálcio urinário 24h se nefrolitíase','Função renal','PTH se hiperparatireoidismo suspeito'],
  'Sal de cálcio — fornece cálcio elementar para reposição (40% por peso de carbonato). Absorção intestinal duodenal ATIVA via canal TRPV6 (vit D-dependente) e PASSIVA paracelular nos demais segmentos. Em doses elevadas, predomina absorção paracelular. Como antiácido: neutraliza HCl (reação ácido-base direta).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=carbonato+de+calcio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
