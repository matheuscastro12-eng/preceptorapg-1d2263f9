-- PreceptorBook: Bloco 3 — Endo (8) + Psiq (8) = 16 drogas
-- Total após esta migration: 94 drogas

-- ============================================================
-- ENDÓCRINO
-- ============================================================

-- 79. EMPAGLIFLOZINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'empagliflozina',
  'Empagliflozina',
  ARRAY['Jardiance', 'Glyxambi (combinada)'],
  'iSGLT2 — inibidor do cotransportador sódio-glicose 2',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"10 mg"},{"forma":"comprimido","concentracao":"25 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"10 mg, podendo aumentar para 25 mg","via":"VO","frequencia":"1x/dia (manhã)","obs":"reduz HbA1c ~0,7-1%; perda peso 2-3 kg; redução PAS 3-5 mmHg"},{"para":"DM2 + DCV (prevenção CV)","dose":"10-25 mg/dia","obs":"EMPA-REG: reduziu mortalidade CV 38% — PRIMEIRA ESCOLHA neste contexto"},{"para":"IC com FE reduzida ou preservada (com ou sem DM)","dose":"10 mg/dia","obs":"EMPEROR-Reduced/EMPEROR-Preserved: reduziu hospitalização por IC. APROVADA para IC mesmo sem DM"},{"para":"DRC progressiva (com/sem DM)","dose":"10 mg/dia","obs":"EMPA-KIDNEY: reduz progressão DRC e mortalidade. Indicado se eGFR ≥20"}]}$$::jsonb,
  $$[{"clcr":"≥45","ajuste":"sem ajuste"},{"clcr":"30-45","ajuste":"ainda eficaz para IC/DRC; em DM o efeito glicêmico cai (limitar 10 mg)"},{"clcr":"20-30","ajuste":"manter para IC/DRC; sem efeito glicêmico"},{"clcr":"<20 ou diálise","ajuste":"contraindicado"}]$$::jsonb,
  'C',
  'Categoria C. Sem dados em humanos. EVITAR no 2º-3º trimestre (efeito renal fetal).',
  'Sem dados — evitar.',
  $$[{"com":"diuréticos","efeito":"depleção volume + hipotensão","manejo":"reduzir tiazídico/alça"},{"com":"insulina/sulfonilureia","efeito":"hipoglicemia","manejo":"reduzir doses"}]$$::jsonb,
  ARRAY['DM tipo 1','cetoacidose diabética prévia recorrente','ClCr <20','gestação 2º-3º trim'],
  $$[{"freq":"comum","evento":"infecção genital fúngica (5-10%, mais em ♀)"},{"freq":"comum","evento":"ITU"},{"freq":"comum","evento":"poliúria, depleção volume"},{"freq":"raro","evento":"CETOACIDOSE EUGLICÊMICA (em jejum prolongado, cirurgia, doença aguda) — suspender 3 dias antes de cirurgia"},{"freq":"raro","evento":"gangrena de Fournier (necrosante perineal — emergência)"},{"freq":"raro","evento":"AKI em depleção volêmica"}]$$::jsonb,
  ARRAY['CETOACIDOSE EUGLICÊMICA: paciente acidótico com glicemia <250 — diagnóstico difícil. SUSPENDER em jejum, doença aguda, cirurgia (3 dias antes), DCC. Voltar quando comendo normal','GANGRENA DE FOURNIER: rara mas FATAL — orientar buscar emergência se dor/edema/vermelhidão perineal','BENEFÍCIO CV/RENAL ÉPOCO INDEPENDENTE DA REDUÇÃO DE GLICEMIA — pode ser usada sem DM em IC/DRC','Em pacientes com DM1 está sendo usada off-label como adjuvante (sotagliflozina), mas alto risco CAD'],
  ARRAY['HbA1c','Função renal + eletrólitos basal e cada 6 meses','Volemia + PA','Sintomas de cetoacidose (mesmo glicemia normal)','Sinais infecção genital/perineal'],
  'Inibe seletivamente o cotransportador sódio-glicose 2 (SGLT2) no túbulo proximal renal — responsável por ~90% da reabsorção de glicose filtrada → glicosúria 60-80 g/dia → reduz glicemia, perda calórica (2-3 kg), natriurese (reduz PA), reduz pré-carga (benefício IC). Mecanismos cardiorrenais provavelmente envolvem feedback tubuloglomerular + redução fibrose miocárdica + corpos cetônicos como combustível alternativo.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=empagliflozina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 80. DAPAGLIFLOZINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dapagliflozina',
  'Dapagliflozina',
  ARRAY['Forxiga', 'Xigduo (combinada)'],
  'iSGLT2',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"5 mg"},{"forma":"comprimido","concentracao":"10 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"10 mg/dia","via":"VO","frequencia":"1x/dia"},{"para":"IC FE reduzida (com/sem DM)","dose":"10 mg/dia","obs":"DAPA-HF — reduz mortalidade e hospitalização"},{"para":"IC FE preservada","dose":"10 mg/dia","obs":"DELIVER — benefício também em FE preservada"},{"para":"DRC (com/sem DM)","dose":"10 mg/dia","obs":"DAPA-CKD — reduz progressão DRC; eGFR ≥25"}]}$$::jsonb,
  $$[{"clcr":"≥25","ajuste":"sem ajuste"},{"clcr":"<25","ajuste":"contraindicado"}]$$::jsonb,
  'C', 'Sem dados — evitar 2º-3º trim.', 'Evitar.',
  $$[{"com":"diuréticos","efeito":"hipotensão","manejo":"ajustar"}]$$::jsonb,
  ARRAY['DM1','CAD recorrente','ClCr <25','hipersensibilidade'],
  $$[{"freq":"comum","evento":"infecção genital, ITU"},{"freq":"comum","evento":"poliúria"},{"freq":"raro","evento":"cetoacidose euglicêmica, gangrena Fournier"}]$$::jsonb,
  ARRAY['Mesmas precauções que empagliflozina','Custo geralmente menor que empagliflozina no Brasil'],
  ARRAY['Função renal','HbA1c','Sinais cetoacidose'],
  'iSGLT2 com mecanismo idêntico à empagliflozina. Diferenças mínimas farmacocinéticas (meia-vida 12,9h vs 12,4h empa).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dapagliflozina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 81. SEMAGLUTIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'semaglutida',
  'Semaglutida',
  ARRAY['Ozempic (SC)', 'Rybelsus (VO)', 'Wegovy (obesidade)'],
  'aGLP1 — agonista do receptor GLP1',
  ARRAY['SC', 'VO'],
  $$[{"forma":"caneta SC","concentracao":"0,25/0,5/1/2 mg/dose"},{"forma":"comprimido","concentracao":"3/7/14 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"SC: 0,25 mg/sem × 4 sem → 0,5 mg/sem × 4 sem → 1 mg/sem (max 2 mg/sem). VO: 3 mg/dia × 30d → 7 mg/dia → 14 mg/dia","via":"SC ou VO","obs":"reduz HbA1c 1-2%, perda 5-15% peso (mais que iSGLT2)"},{"para":"DM2 + DCV","dose":"1-2 mg/sem SC","obs":"SUSTAIN-6: reduz desfecho CV. Primeira escolha em DM2 + DCV"},{"para":"obesidade (Wegovy)","dose":"escalonar até 2,4 mg/sem SC","obs":"STEP — perda 15% peso. APROVADO sem DM"}]}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  'C', 'CONTRAINDICADO — risco fetal em estudos animais. Suspender 2 meses ANTES de gestação programada.', 'CONTRAINDICADO.',
  $$[{"com":"insulina/SU","efeito":"hipoglicemia","manejo":"reduzir doses"},{"com":"VO: medicamentos com janela estreita","efeito":"reduz absorção (esvaziamento gástrico lento)","manejo":"tomar 30 min antes de outros medicamentos"}]$$::jsonb,
  ARRAY['CA medular tireoide pessoal/familiar','MEN-2','pancreatite aguda recente','gestação/lactação','retinopatia diabética grave (avaliar)'],
  $$[{"freq":"muito comum","evento":"náusea (15-20% inicial), vômito, diarreia, constipação"},{"freq":"comum","evento":"dispepsia, refluxo"},{"freq":"comum","evento":"perda peso (desejado)"},{"freq":"incomum","evento":"pancreatite aguda"},{"freq":"incomum","evento":"colelitíase (perda peso rápida)"},{"freq":"raro","evento":"CA tireoide medular (em estudos animais)"},{"freq":"raro","evento":"piora retinopatia (rápida queda HbA1c)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: CA medular de tireoide em ratos — perguntar história pessoal/familiar','PANCREATITE: dor abdominal intensa em barra → suspender e investigar lipase','Náusea é dose-dependente — escalonar lentamente, tomar antes da maior refeição','VO Rybelsus: TOMAR EM JEJUM com no máximo 120 mL água, esperar 30 min antes de outros remédios/comer','Mais potente para emagrecimento que liraglutida. Tirzepatida (GLP1+GIP, Mounjaro) é ainda mais potente'],
  ARRAY['HbA1c','Sintomas pancreatite (dor abdominal)','Sintomas tireoide (nódulo, disfagia, dispneia)','Função renal (devido náusea/desidratação)','Peso'],
  'Análogo do GLP-1 (peptídeo similar ao glucagon-1) modificado para resistir à degradação pela DPP-4 (meia-vida 7 dias). Liga ao receptor GLP-1 → estimula secreção de insulina dependente de glicose, suprime glucagon, retarda esvaziamento gástrico, aumenta saciedade central (núcleo arqueado hipotalâmico). Resultado: redução glicemia, perda de peso, redução PA, melhora desfechos CV.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=semaglutida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 82. LIRAGLUTIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'liraglutida',
  'Liraglutida',
  ARRAY['Victoza (DM2)', 'Saxenda (obesidade)'],
  'aGLP1 — análogo do GLP-1',
  ARRAY['SC'],
  $$[{"forma":"caneta SC","concentracao":"6 mg/mL — Victoza 0,6/1,2/1,8 mg/dia / Saxenda até 3 mg/dia"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"0,6 mg/dia × 1 sem → 1,2 mg/dia × 1 sem → 1,8 mg/dia","via":"SC abdominal/coxa","frequencia":"1x/dia","obs":"LEADER: redução desfecho CV em DM2 + alto risco"},{"para":"obesidade (sem DM)","dose":"escalonar 0,6 mg → até 3 mg/dia em 5 sem","via":"SC","obs":"perda peso 5-10%. Menos potente que semaglutida"}]}$$::jsonb,
  'C', 'CONTRAINDICADO. Suspender ≥1 sem antes de gestação programada.', 'CONTRAINDICADO.',
  ARRAY['CA medular tireoide pessoal/familiar','MEN-2','pancreatite aguda recente','gestação'],
  $$[{"freq":"muito comum","evento":"náusea, vômito (escalonar lento)"},{"freq":"comum","evento":"diarreia, dispepsia"},{"freq":"incomum","evento":"pancreatite aguda"},{"freq":"raro","evento":"CA medular tireoide"}]$$::jsonb,
  ARRAY['Mesmas alertas que semaglutida','Diferença: 1x/dia (vs 1x/sem semaglutida) — pior aderência, mas opção em pacientes que precisam de início rápido','Menor perda peso que semaglutida'],
  ARRAY['HbA1c','Função renal','Pancreatite (dor abdominal)','Peso'],
  'Análogo do GLP-1 com homologia 97% à molécula nativa, modificado por substituição de Lys34 + ácido graxo para ligação à albumina (resiste DPP-4, meia-vida 13h). Mesmo mecanismo de semaglutida com menor potência.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=liraglutida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 83. SITAGLIPTINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'sitagliptina',
  'Sitagliptina',
  ARRAY['Januvia', 'Janumet (combinada com metformina)'],
  'iDPP4 — inibidor da dipeptidil peptidase 4',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"25/50/100 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"100 mg/dia","via":"VO","frequencia":"1x/dia","obs":"reduz HbA1c 0,5-0,8%. Neutra em peso e hipoglicemia (sem DCV benefício)"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"100 mg/dia"},{"clcr":"30-50","ajuste":"50 mg/dia"},{"clcr":"<30 ou diálise","ajuste":"25 mg/dia"}]$$::jsonb,
  'B', 'Sem dados em humanos.', 'Evitar.',
  ARRAY['hipersensibilidade','DM1'],
  $$[{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"nasofaringite"},{"freq":"incomum","evento":"pancreatite aguda"},{"freq":"raro","evento":"penfigoide bolhoso"},{"freq":"raro","evento":"reação de hipersensibilidade grave"}]$$::jsonb,
  ARRAY['Saxagliptina/alogliptina associaram-se a hospitalização por IC (SAVOR-TIMI) — preferir sitagliptina/linagliptina se IC','Sem benefício CV (TECOS) — escolher SGLT2/GLP1 se DCV','Custo intermediário, fácil tolerância — opção em idoso frágil'],
  ARRAY['HbA1c','Função renal (ajuste)','Sintomas pancreatite'],
  'Inibe a enzima DPP-4 (dipeptidil peptidase 4) → impede degradação dos hormônios incretínicos (GLP-1 e GIP) → aumenta níveis endógenos de GLP-1 (efeito menor que aGLP1 exógeno) → estimula insulina dependente de glicose, reduz glucagon. Sem efeito significativo em peso ou esvaziamento gástrico.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sitagliptina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 84. GLIMEPIRIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'glimepirida',
  'Glimepirida',
  ARRAY['Amaryl'],
  'Sulfonilureia 2ª geração',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"1/2/4 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM2","dose":"INICIAR 1 mg, titular até 4-8 mg/dia","via":"VO","frequencia":"1x/dia (antes do café)","obs":"reduz HbA1c 1-2%. RISCO hipoglicemia + ganho peso. Linha tardia"}]}$$::jsonb,
  $${"obs":"INICIAR 0,5-1 mg. Idoso tem maior risco hipoglicemia."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"<50","ajuste":"reduzir dose, monitor hipoglicemia"},{"clcr":"<30","ajuste":"evitar"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"contraindicado"}]$$::jsonb,
  'C', 'Atravessa placenta — risco hipoglicemia neonatal. Suspender 2 sem antes do parto.', 'Sem dados — evitar.',
  ARRAY['DM1','CAD','gestação','hipersensibilidade a sulfas','hepatopatia grave','ClCr <30'],
  $$[{"freq":"muito comum","evento":"hipoglicemia (3-7%; mais grave que outras SU)"},{"freq":"comum","evento":"ganho peso 1-3 kg"},{"freq":"incomum","evento":"náusea, alteração paladar"},{"freq":"raro","evento":"agranulocitose, anemia hemolítica"},{"freq":"raro","evento":"hipersensibilidade cruzada com sulfas"}]$$::jsonb,
  ARRAY['HIPOGLICEMIA é a complicação principal — orientar paciente sobre sintomas, ter glicose de uso oral. Em idoso pode ser mascarada','Não pular refeição — sempre tomar antes do café (ou maior refeição)','Risco CV: UKPDS/ADVANCE — sem aumento desfecho CV mas SU ficou ultrapassada após SGLT2/GLP1','Glicazida MR (Diamicron MR) tem perfil mais seguro de hipoglicemia que glimepirida'],
  ARRAY['HbA1c','Glicemia capilar (especialmente idoso)','Função hepática se sintomas','Peso'],
  'Sulfonilureia de 2ª geração. Liga ao receptor SUR1 do canal de potássio ATP-sensível na célula β pancreática → fechamento do canal → despolarização → influxo Ca++ → liberação de insulina (independente de glicose, daí o risco de hipoglicemia). Aumenta também sensibilidade periférica à insulina (efeito menor).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=glimepirida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 85. HIDROCORTISONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'hidrocortisona',
  'Hidrocortisona',
  ARRAY['Solu-Cortef'],
  'Corticoide curta ação (mineralo + glico)',
  ARRAY['IV', 'IM', 'VO'],
  $$[{"forma":"frasco-ampola","concentracao":"100/500 mg"},{"forma":"comprimido","concentracao":"10/20 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"insuficiência adrenal aguda (crise addisoniana)","dose":"100 mg IV bolus + 50-100 mg 6/6h","via":"IV","obs":"PRIMEIRA ESCOLHA — possui efeito mineralocorticoide"},{"para":"reposição em insuficiência adrenal crônica","dose":"15-25 mg/dia divididos (2/3 manhã + 1/3 tarde)","via":"VO","obs":"dose de estresse (cirurgia, doença aguda): triplicar dose"},{"para":"choque séptico refratário","dose":"50 mg IV 6/6h","via":"IV","duracao":"até desmame de vasopressor","obs":"ADRENAL/APROCCHSS — reduz tempo de choque"},{"para":"asma exacerbação grave (alternativa IV)","dose":"100-200 mg IV bolus + 100 mg 6/6h","via":"IV"},{"para":"reação anafilática (coadjuvante)","dose":"200 mg IV bolus","via":"IV","obs":"NÃO substitui adrenalina"}]}$$::jsonb,
  $${"indicacoes":[{"para":"insuficiência adrenal aguda peds","dose":"50 mg/m²/dia divididos 6/6h ou 1-2 mg/kg/dose"}]}$$::jsonb,
  'C', 'Atravessa placenta — uso em curto prazo é seguro. Evitar uso prolongado 1º trim.', 'Compatível em doses fisiológicas.',
  ARRAY['infecção fúngica sistêmica não tratada','hipersensibilidade'],
  $$[{"freq":"comum (uso prolongado)","evento":"ganho peso, fácies cushingoide"},{"freq":"comum","evento":"hiperglicemia (especialmente DM)"},{"freq":"comum","evento":"hipertensão, retenção líquido (efeito mineralo)"},{"freq":"comum","evento":"insônia, irritabilidade"},{"freq":"incomum","evento":"supressão eixo HPA com uso >2 sem"},{"freq":"incomum","evento":"osteoporose, miopatia esteroide"}]$$::jsonb,
  ARRAY['DOSE DE ESTRESSE: pacientes em uso crônico de corticoide PRECISAM aumento de dose em cirurgia/doença aguda — risco crise adrenal','Não suspender abruptamente uso >2 semanas — desmame gradual','Equipotência: hidrocortisona 20 mg = prednisona 5 mg = dexametasona 0,75 mg = metilprednisolona 4 mg','Hidrocortisona é a ÚNICA com efeito mineralocorticoide significativo entre uso parenteral — preferida em insuficiência adrenal'],
  ARRAY['Glicemia (especialmente em DM)','PA','Eletrólitos (Na, K)','Sintomas adrenais (em desmame)'],
  'Corticosteroide natural com atividade mista glicocorticoide + mineralocorticoide. Liga ao receptor de glicocorticoide intracelular → translocação ao núcleo → modula transcrição genica de centenas de genes → reduz inflamação (inibe NF-κB, reduz citocinas, prostaglandinas, leucotrienos), suprime imunidade celular, aumenta gliconeogênese, redistribui gordura. Atividade mineralo (via receptor MR) → retenção Na+/H2O e excreção K+.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=hidrocortisona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 86. DEXAMETASONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dexametasona',
  'Dexametasona',
  ARRAY['Decadron'],
  'Corticoide longa ação — sem atividade mineralocorticoide',
  ARRAY['IV', 'IM', 'VO'],
  $$[{"forma":"ampola","concentracao":"4 mg/mL"},{"forma":"comprimido","concentracao":"0,5/4 mg"},{"forma":"elixir","concentracao":"0,1 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"edema cerebral (tumor, abscesso)","dose":"10 mg IV bolus + 4 mg 6/6h","via":"IV","obs":"reduz edema vasogênico — não trauma. Uso em metástase cerebral, glioma"},{"para":"COVID-19 grave (em O2 suplementar)","dose":"6 mg/dia VO ou IV","duracao":"10 dias","obs":"RECOVERY trial — reduz mortalidade em COVID com O2 (não usar em casos leves)"},{"para":"profilaxia náusea/vômito quimio","dose":"8-12 mg IV pré-quimio + 4-8 mg 12/12h × 2-3 dias","via":"IV ou VO","obs":"associar a ondansetrona"},{"para":"meningite bacteriana (adjuvante)","dose":"0,15 mg/kg IV 6/6h × 4 dias","via":"IV","obs":"INICIAR 10-20 min ANTES do ATB. Reduz sequela auditiva (S. pneumoniae) e mortalidade"},{"para":"croup (laringite obstrutiva)","dose":"0,15-0,6 mg/kg dose única","via":"VO/IM/IV","obs":"primeira escolha; reduz necessidade adrenalina/IOT"},{"para":"asma exacerbação","dose":"4-8 mg IV/IM/VO","obs":"alternativa à prednisolona — dose única longa ação"}]}$$::jsonb,
  $${"indicacoes":[{"para":"croup","dose":"0,15-0,6 mg/kg (max 16 mg) dose única VO/IM"}]}$$::jsonb,
  'C', 'Em curto prazo (ex: maturação pulmonar fetal entre 24-34 sem) é INDICADA — betametasona/dexametasona reduzem mortalidade neonatal em 50%.', 'Compatível em doses baixas.',
  ARRAY['infecção fúngica sistêmica não tratada','hipersensibilidade'],
  $$[{"freq":"comum","evento":"hiperglicemia"},{"freq":"comum","evento":"insônia, agitação, euforia"},{"freq":"comum","evento":"aumento apetite"},{"freq":"comum (uso prolongado)","evento":"síndrome cushingoide, miopatia"},{"freq":"incomum","evento":"perfuração TGI (com AINE), úlcera"},{"freq":"incomum","evento":"psicose esteroide"}]$$::jsonb,
  ARRAY['SEM EFEITO MINERALOCORTICOIDE — não é primeira escolha em insuficiência adrenal aguda','Equipotência: 0,75 mg dexametasona ≈ 5 mg prednisona ≈ 20 mg hidrocortisona','Em maturação pulmonar fetal: betametasona é mais usada no Brasil; dexametasona é alternativa equivalente','Em meningite bacteriana: SUSPENDER se cultura negar S. pneumoniae','Pode mascarar sintomas de infecção (febre, dor)'],
  ARRAY['Glicemia','PA','Sintomas neurológicos se edema cerebral','Sinais infecção (mascarados)'],
  'Corticoide sintético halogenado com atividade glicocorticoide ~25-30x maior que hidrocortisona e SEM atividade mineralocorticoide. Meia-vida biológica longa (36-72h). Liga receptor de glicocorticoide → modulação genômica e não-genômica → reduz edema (estabiliza membrana lisossomal, vasoconstrição relativa), suprime inflamação intensa, antiemético central via área postrema.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dexametasona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- PSIQUIATRIA
-- ============================================================

-- 87. SERTRALINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'sertralina',
  'Sertralina',
  ARRAY['Zoloft', 'Tolrest'],
  'ISRS — antidepressivo',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"25/50/100 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior","dose":"INICIAR 50 mg/dia, titular após 1 sem se necessário até 100-200 mg/dia","via":"VO","frequencia":"1x/dia (manhã ou noite)","obs":"resposta em 4-6 semanas. Manter ≥6-12 meses após remissão (1º episódio); indefinido se recorrente"},{"para":"transtorno de ansiedade generalizada (TAG)","dose":"INICIAR 25-50 mg, titular até 100-200 mg/dia","obs":"primeira escolha em TAG"},{"para":"transtorno do pânico","dose":"INICIAR 25 mg × 1 sem (evitar piora ansiedade) → 50 mg, titular","obs":"associar BZD curto prazo se necessário"},{"para":"TOC","dose":"50 mg → 100-200 mg/dia (doses maiores que depressão)","obs":"resposta em 8-12 sem"},{"para":"TEPT","dose":"50-200 mg/dia"}]}$$::jsonb,
  $${"obs":"INICIAR 25 mg, titular lentamente. Risco hiponatremia (SIADH)."}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir dose 50%"}]$$::jsonb,
  'C', 'Categoria C. Em 3º trim: síndrome adaptativa neonatal (irritabilidade, dificuldade alimentar). Manter se benefício > risco.', 'PRIMEIRA ESCOLHA em lactação (baixa transferência leite).',
  $$[{"com":"IMAO","efeito":"síndrome serotoninérgica fatal","manejo":"contraindicado — washout 14 dias"},{"com":"varfarina","efeito":"aumenta INR","manejo":"monitor"},{"com":"AINE/AAS","efeito":"sangramento GI","manejo":"considerar IBP"},{"com":"tramadol/triptanos","efeito":"síndrome serotoninérgica","manejo":"monitor sintomas"}]$$::jsonb,
  ARRAY['uso de IMAO atual ou < 14 dias','linezolida (IMAO)','azul de metileno IV','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"náusea (15-25%, geralmente cede em 1-2 sem)"},{"freq":"comum","evento":"diarreia, dispepsia"},{"freq":"comum","evento":"insônia ou sonolência"},{"freq":"comum","evento":"disfunção sexual (libido, anorgasmia, ejaculação retardada) — limitante em uso crônico"},{"freq":"comum","evento":"sudorese, tremor"},{"freq":"incomum","evento":"hiponatremia (SIADH, especialmente idoso)"},{"freq":"incomum","evento":"sangramento (efeito antiplaquetário)"},{"freq":"raro","evento":"síndrome serotoninérgica"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: ideação suicida em <25 anos — monitor primeiras 4-6 sem','LATÊNCIA terapêutica de 2-4 semanas — orientar paciente','SÍNDROME DESCONTINUAÇÃO: tonteira, choque elétrico, irritabilidade — desmame gradual em 2-4 sem','SUSPENDER 14 dias antes de IMAO ou outro fármaco serotoninérgico potente','Sertralina e citalopram/escitalopram = ISRS preferidos por menor interação CYP'],
  ARRAY['Resposta clínica (PHQ-9, GAD-7, HAM-D)','Ideação suicida (especialmente <25a, primeiras semanas)','Sódio sérico em idoso','Sintomas síndrome serotoninérgica em uso de outros agentes'],
  'Inibe seletivamente a recaptação de serotonina (5-HT) na fenda sináptica via bloqueio do transportador SERT → aumenta disponibilidade de 5-HT no SNC. Down-regulation de receptores 5-HT em 2-4 sem (latência terapêutica). Mínimo efeito em noradrenalina/dopamina (mais seletivo que tricíclicos). Levemente bloqueia recaptação de dopamina (efeito ativador).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sertralina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 88. FLUOXETINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'fluoxetina',
  'Fluoxetina',
  ARRAY['Prozac', 'Daforin'],
  'ISRS — antidepressivo',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"10/20 mg"},{"forma":"solução oral","concentracao":"4 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior","dose":"20-80 mg/dia (manhã)","via":"VO"},{"para":"bulimia nervosa","dose":"60 mg/dia","obs":"única ISRS aprovada para bulimia"},{"para":"TOC","dose":"40-80 mg/dia"},{"para":"TPM/TDPM","dose":"20 mg/dia (contínuo) ou apenas fase lútea","obs":"alternativa: 10-20 mg fase lútea"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥8 anos depressão/TOC","dose":"10-20 mg/dia"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir 50% e espaçar"}]$$::jsonb,
  'C', 'Categoria C. Síndrome adaptativa neonatal. Persiste no organismo do bebê por semanas (meia-vida longa).', 'Acumula no leite — preferir sertralina.',
  $$[{"com":"IMAO","efeito":"síndrome serotoninérgica","manejo":"contraindicado — washout FLUOXETINA 5 SEMANAS (meia-vida longa)"},{"com":"tamoxifeno","efeito":"reduz eficácia (inibe CYP2D6)","manejo":"evitar — preferir sertralina/escitalopram"},{"com":"varfarina","efeito":"aumenta INR","manejo":"monitor"}]$$::jsonb,
  ARRAY['uso atual de IMAO ou < 5 semanas','tamoxifeno','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"insônia, nervosismo (mais ativador que sertralina)"},{"freq":"comum","evento":"náusea, anorexia, perda peso (útil em paciente obeso/bulímico)"},{"freq":"comum","evento":"disfunção sexual"},{"freq":"comum","evento":"cefaleia, sudorese"},{"freq":"incomum","evento":"hiponatremia"}]$$::jsonb,
  ARRAY['MEIA-VIDA MUITO LONGA (4-6 dias do composto + 7-15 dias do metabólito ativo norfluoxetina) — vantagem: tolera esquecimento; desvantagem: troca para IMAO requer 5 semanas washout','Pode causar mais ATIVAÇÃO/insônia/nervosismo que sertralina — preferir manhã','EVITAR em pacientes em uso de TAMOXIFENO (CA mama) — inibe CYP2D6 e reduz conversão à forma ativa','Em adolescente: única ISRS com mais evidência (TADS) em <18 anos para depressão'],
  ARRAY['Resposta clínica','Ideação suicida','Peso (perda comum)'],
  'ISRS — bloqueia recaptação de serotonina via SERT, sem afinidade significativa por outros receptores. Diferenciais farmacocinéticos: meia-vida muito longa (norfluoxetina = metabólito ativo, t1/2 7-15 dias) → tolera esquecimentos, mas exige washout longo. Inibe potencialmente CYP2D6 e CYP3A4 (interações).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fluoxetina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 89. ESCITALOPRAM
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'escitalopram',
  'Escitalopram',
  ARRAY['Lexapro', 'Reconter'],
  'ISRS — enantiômero S-citalopram',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"10/15/20 mg"},{"forma":"gotas","concentracao":"20 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior","dose":"INICIAR 10 mg/dia, max 20 mg/dia","via":"VO","frequencia":"1x/dia"},{"para":"TAG","dose":"10-20 mg/dia","obs":"primeira escolha — perfil tolerância excelente"},{"para":"transtorno do pânico","dose":"5 mg × 1 sem → 10-20 mg/dia"}]}$$::jsonb,
  $${"obs":"max 10 mg/dia (>65 anos)."}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"max 10 mg/dia"}]$$::jsonb,
  'C', 'Sem evidência teratogenia significativa.', 'Excretado em pequena quantidade — compatível.',
  $$[{"com":"IMAO","efeito":"síndrome serotoninérgica","manejo":"contraindicado"},{"com":"omeprazol","efeito":"aumenta nível escitalopram","manejo":"monitor QT em idoso"}]$$::jsonb,
  ARRAY['IMAO < 14 dias','prolongamento QT congênito','hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, diarreia"},{"freq":"comum","evento":"insônia ou sonolência"},{"freq":"comum","evento":"disfunção sexual"},{"freq":"comum","evento":"sudorese"},{"freq":"incomum","evento":"prolongamento QT (dose-dependente)"},{"freq":"incomum","evento":"hiponatremia"}]$$::jsonb,
  ARRAY['ISRS COM MELHOR PERFIL DE TOLERÂNCIA — primeira escolha em muitos casos por menos efeitos adversos','LIMITE 20 mg/dia (idoso 10 mg) — prolongamento QT dose-dependente. FDA limitou citalopram (não escitalopram) a 40 mg/dia','Comparado ao citalopram: escitalopram é o enantiômero S puro, mais potente, dose menor, menos efeitos','Sem ativação proeminente como fluoxetina — bom para pacientes ansiosos'],
  ARRAY['Resposta clínica','ECG basal se >65a ou outros prolongadores QT','Ideação suicida'],
  'Enantiômero S do citalopram — ISRS mais seletivo conhecido. Bloqueio puro de SERT (sem afinidade por receptores α/β/H1/M). Meia-vida 27-32h. Metabolização CYP2C19 (atenção em metabolizadores lentos). Praticamente sem ação em outros transportadores → menos efeitos adversos.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=escitalopram',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 90. VENLAFAXINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'venlafaxina',
  'Venlafaxina',
  ARRAY['Efexor XR', 'Venlift OD'],
  'IRSN — inibidor recaptação serotonina + noradrenalina',
  ARRAY['VO'],
  $$[{"forma":"cápsula LP","concentracao":"37,5/75/150/225 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"depressão maior","dose":"INICIAR 37,5-75 mg/dia, titular até 150-225 mg/dia","via":"VO","frequencia":"1x/dia (com refeição)","obs":"resposta dose-dependente; 225 mg pode ser superior em depressão grave"},{"para":"TAG","dose":"75-225 mg/dia"},{"para":"transtorno do pânico","dose":"INICIAR 37,5 mg, titular"},{"para":"dor neuropática (off-label)","dose":"75-225 mg/dia"}]}$$::jsonb,
  $$[{"clcr":">30","ajuste":"sem ajuste"},{"clcr":"<30 ou diálise","ajuste":"reduzir 25-50%"}]$$::jsonb,
  $$[{"contexto":"hepatopatia leve","ajuste":"reduzir 50%"},{"contexto":"hepatopatia grave","ajuste":"evitar"}]$$::jsonb,
  'C', 'Síndrome adaptativa neonatal. Manter se benefício > risco.', 'Excretado no leite — monitor RN.',
  $$[{"com":"IMAO","efeito":"síndrome serotoninérgica","manejo":"contraindicado"},{"com":"BB/anti-hipertensivos","efeito":"resposta variável (efeito noradrenérgico próprio aumenta PA)","manejo":"monitor PA"}]$$::jsonb,
  ARRAY['IMAO < 14 dias','HAS não controlada','hipersensibilidade','glaucoma agudo'],
  $$[{"freq":"comum","evento":"náusea (mais que ISRS)"},{"freq":"comum","evento":"insônia, ansiedade, sudorese"},{"freq":"comum","evento":"AUMENTO PA dose-dependente (>150 mg)"},{"freq":"comum","evento":"disfunção sexual"},{"freq":"incomum","evento":"taquicardia, palpitação"},{"freq":"incomum","evento":"hiponatremia"}]$$::jsonb,
  ARRAY['SÍNDROME DE DESCONTINUAÇÃO INTENSA — uma das piores entre antidepressivos. Desmame muito gradual (semanas-meses). Sintomas: choque elétrico, tonteira, irritabilidade','MONITORAR PA em uso crônico (especialmente >150 mg) — pode aumentar 5-10 mmHg','Iniciar em paciente com transtorno bipolar pode precipitar mania — descartar bipolar antes','Em dor neuropática: alternativa a duloxetina/amitriptilina','Pacientes com HAS preexistente: preferir outras opções'],
  ARRAY['Resposta clínica','PA mensalmente em titulação + a cada 6 meses crônico','Ideação suicida'],
  'IRSN — bloqueio dual de SERT (recaptação serotonina) e NET (recaptação noradrenalina). Predomina ação serotoninérgica em doses ≤150 mg; noradrenérgica significativa em ≥225 mg. Metabolismo CYP2D6 → metabólito ativo desvenlafaxina (Pristiq). Aumento PA é efeito noradrenérgico dose-dependente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=venlafaxina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 91. RISPERIDONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'risperidona',
  'Risperidona',
  ARRAY['Risperdal', 'Risperdal Consta (depot)'],
  'Antipsicótico atípico (2ª geração)',
  ARRAY['VO', 'IM (depot)'],
  $$[{"forma":"comprimido","concentracao":"0,5/1/2/3/4 mg"},{"forma":"solução oral","concentracao":"1 mg/mL"},{"forma":"depot IM","concentracao":"25/37,5/50 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"esquizofrenia (1º episódio ou crônico)","dose":"INICIAR 1-2 mg/dia, titular até 4-6 mg/dia","via":"VO","frequencia":"1x/dia ou 12/12h","obs":"depot 25-50 mg IM 14/14d em pacientes com baixa aderência"},{"para":"transtorno bipolar (mania aguda)","dose":"2-6 mg/dia","obs":"associado a estabilizador (lítio/valproato)"},{"para":"agressividade/SPCD na demência","dose":"INICIAR 0,25-0,5 mg/dia","obs":"OFF-LABEL e curto prazo (<3 meses) — aumenta mortalidade em demência (FDA Black Box)"},{"para":"autismo (irritabilidade) ≥5a","dose":"0,25-2 mg/dia"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥5a autismo","dose":"<20 kg: 0,25 mg/dia inicial; ≥20 kg: 0,5 mg/dia"}]}$$::jsonb,
  $${"obs":"INICIAR 0,25-0,5 mg, titular lentamente."}$$::jsonb,
  $$[{"clcr":"<50","ajuste":"reduzir dose 50%"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir 50%"}]$$::jsonb,
  'C', 'Categoria C. Síndromes extrapiramidais e abstinência neonatal. Evitar 1º trim se possível.', 'Compatível em doses baixas — monitor RN sedação.',
  $$[{"com":"BB/anti-hipertensivos","efeito":"hipotensão","manejo":"titular"},{"com":"levodopa","efeito":"antagonismo","manejo":"evitar"},{"com":"carbamazepina","efeito":"reduz nível","manejo":"aumentar dose risperidona"}]$$::jsonb,
  ARRAY['hipersensibilidade','demência (Black Box mortalidade)','prolongamento QT congênito'],
  $$[{"freq":"muito comum","evento":"sedação"},{"freq":"comum","evento":"sintomas extrapiramidais (acatisia, parkinsonismo) — dose-dependente >4 mg"},{"freq":"comum","evento":"HIPERPROLACTINEMIA (mais que outros atípicos) — galactorreia, amenorreia, disfunção sexual"},{"freq":"comum","evento":"ganho peso (5-7 kg em 1 ano)"},{"freq":"comum","evento":"hipotensão postural"},{"freq":"incomum","evento":"síndrome metabólica (hiperglicemia, dislipidemia)"},{"freq":"raro","evento":"síndrome neuroléptica maligna"},{"freq":"raro","evento":"discinesia tardia (uso crônico)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: aumento mortalidade em pacientes idosos com psicose por demência — usar somente se outras medidas falharem','HIPERPROLACTINEMIA é mais comum com risperidona/paliperidona — se incômodo, trocar por aripiprazol/olanzapina','Síndrome metabólica menor que olanzapina/clozapina mas existe — monitor peso, glicemia, lipídios','SÍNDROME NEUROLÉPTICA MALIGNA: febre + rigidez + alteração consciência + CK elevado — emergência (mortalidade 10%)','SINTOMAS EXTRAPIRAMIDAIS dose-dependentes: tratar com biperideno (acatisia: propranolol)','Em primeiro episódio de esquizofrenia, evidência sugere doses baixas (1-3 mg) são suficientes'],
  ARRAY['Peso, glicemia, perfil lipídico (basal + 12 sem + anual)','PA postural','Sintomas extrapiramidais (escala SAS, BARS)','Prolactina sérica se sintomas','ECG (QT) em uso crônico'],
  'Antipsicótico atípico — antagonista potente de receptores D2 (efeito antipsicótico) E 5-HT2A (atípico, reduz sintomas extrapiramidais comparado a típicos). Também antagonista α1/α2 (hipotensão), H1 (sedação) e D2 hipotalâmico (hiperprolactinemia, mais que outros atípicos). Metabolismo CYP2D6 → 9-OH-risperidona ativa (= paliperidona).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=risperidona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 92. OLANZAPINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'olanzapina',
  'Olanzapina',
  ARRAY['Zyprexa'],
  'Antipsicótico atípico (2ª geração)',
  ARRAY['VO', 'IM'],
  $$[{"forma":"comprimido","concentracao":"2,5/5/10/15/20 mg"},{"forma":"orodispersível (Zydis)","concentracao":"5/10/15/20 mg"},{"forma":"ampola IM","concentracao":"10 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"esquizofrenia","dose":"INICIAR 5-10 mg/dia, titular até 10-20 mg/dia","via":"VO","frequencia":"1x/dia (noite — sedação)"},{"para":"mania aguda","dose":"10-20 mg/dia"},{"para":"agitação aguda (psicose, mania)","dose":"10 mg IM, repetir até 30 mg/dia","via":"IM","obs":"rápida ação. NÃO associar com BZD IM (risco depressão respiratória)"},{"para":"depressão bipolar (associada a fluoxetina)","dose":"6 mg + 25 mg fluoxetina (Symbyax)"}]}$$::jsonb,
  $${"obs":"INICIAR 2,5-5 mg. Mais sensível a hipotensão postural."}$$::jsonb,
  'C', 'Síndrome adaptativa neonatal. Risco diabetes gestacional pelo perfil metabólico.', 'Compatível com cautela.',
  ARRAY['hipersensibilidade','demência (Black Box)','glaucoma de ângulo fechado'],
  $$[{"freq":"muito comum","evento":"GANHO DE PESO (10-15 kg em 1 ano — mais que outros)"},{"freq":"muito comum","evento":"sedação (efeito H1)"},{"freq":"comum","evento":"hiperglicemia, diabetes de novo"},{"freq":"comum","evento":"dislipidemia (TG, LDL)"},{"freq":"comum","evento":"hipotensão postural"},{"freq":"incomum","evento":"síndrome metabólica completa"},{"freq":"raro","evento":"síndrome neuroléptica maligna"},{"freq":"raro","evento":"hepatotoxicidade"}]$$::jsonb,
  ARRAY['MAIOR GANHO DE PESO E SÍNDROME METABÓLICA entre antipsicóticos atípicos (junto com clozapina) — pesar contra benefício antes de iniciar','MENOR risco de sintomas extrapiramidais e hiperprolactinemia que risperidona — vantagem','BLACK BOX FDA: mortalidade em demência','IM olanzapina + BZD IM → risco depressão respiratória. NÃO associar — espaçar ≥1h','Em adolescentes pode ser mais propensa ao ganho metabólico — monitor rigoroso'],
  ARRAY['PESO + IMC + circunferência abdominal mensal por 6 meses, depois trimestral','Glicemia + HbA1c basal + 12 sem + anual','Perfil lipídico basal + 12 sem + anual','PA postural','Sintomas extrapiramidais (raros mas possíveis em altas doses)'],
  'Antipsicótico atípico estruturalmente similar à clozapina. Antagonista multi-receptor: D2 (antipsicótico), 5-HT2A/2C (atipia, perfil pró-metabólico), H1 (sedação intensa, ganho peso), M1-M5 (efeitos anticolinérgicos: boca seca, constipação), α1 (hipotensão). Maior afinidade por 5-HT2A do que D2 → menos efeitos extrapiramidais.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=olanzapina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 93. QUETIAPINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'quetiapina',
  'Quetiapina',
  ARRAY['Seroquel', 'Seroquel XR'],
  'Antipsicótico atípico (2ª geração)',
  ARRAY['VO'],
  $$[{"forma":"comprimido IR","concentracao":"25/100/200/300 mg"},{"forma":"comprimido XR (LP)","concentracao":"50/200/300/400 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"esquizofrenia","dose":"INICIAR 50 mg 12/12h × 1d → 100 mg 12/12h → 200-400 mg 12/12h (max 800 mg/dia). XR: 300 mg/dia → 400-800 mg/dia","via":"VO","frequencia":"12/12h IR ou 1x/dia XR (noite)"},{"para":"depressão bipolar","dose":"300 mg/dia (XR à noite)","obs":"primeira escolha junto com lítio/lurasidona"},{"para":"depressão refratária (adjuvante)","dose":"150-300 mg/dia XR","obs":"adjuvante a ISRS"},{"para":"insônia (off-label, NÃO RECOMENDADO)","dose":"25-50 mg à noite","obs":"USO INADEQUADO — risco metabólico/cardiovascular não justifica indicação isolada de insônia"}]}$$::jsonb,
  $${"obs":"INICIAR 25-50 mg, titular lentamente."}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduzir 50%, titular lento"}]$$::jsonb,
  'C', 'Sem teratogenicidade significativa em estudos. Síndrome adaptativa neonatal possível.', 'Compatível com cautela.',
  ARRAY['hipersensibilidade','demência (Black Box)','prolongamento QT'],
  $$[{"freq":"muito comum","evento":"sedação (efeito H1 forte) — limita uso diurno"},{"freq":"muito comum","evento":"hipotensão postural (especialmente titulação)"},{"freq":"comum","evento":"ganho peso (4-6 kg)"},{"freq":"comum","evento":"boca seca"},{"freq":"comum","evento":"hiperglicemia, dislipidemia (intermediário)"},{"freq":"incomum","evento":"prolongamento QT"},{"freq":"raro","evento":"síndrome neuroléptica maligna"}]$$::jsonb,
  ARRAY['SEDAÇÃO INTENSA é a característica marcante — usar à noite','Doses baixas (25-100 mg): sedação > antipsicótico (uso off-label questionável de insônia/agitação)','Doses altas (>300 mg): efeito antipsicótico via D2','Risco metabólico INTERMEDIÁRIO — menor que olanzapina/clozapina, maior que aripiprazol','Em depressão bipolar: única evidência forte entre antipsicóticos para fase depressiva (BOLDER)','Hipotensão postural exige titulação cuidadosa, especialmente em idoso'],
  ARRAY['Peso, glicemia, lipídios','PA postural','ECG basal e em titulação se >65a','Sintomas extrapiramidais (raros nesta dose)'],
  'Antipsicótico atípico — antagonista D2/5-HT2A com MAIOR afinidade por H1 (sedação intensa) e α1 (hipotensão). Afinidade D2 transitória/baixa (rápido desligamento) → menos efeitos extrapiramidais e prolactinemia. Metabólito ativo norquetiapina é inibidor de NET (efeito antidepressivo). Metabolismo CYP3A4.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=quetiapina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 94. LÍTIO (carbonato)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'litio',
  'Carbonato de lítio',
  ARRAY['Carbolitium', 'Carbolitium CR'],
  'Estabilizador de humor — íon metálico',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"300 mg"},{"forma":"comprimido CR","concentracao":"450 mg (liberação controlada)"}]$$::jsonb,
  $${"indicacoes":[{"para":"transtorno bipolar — manutenção","dose":"INICIAR 300 mg 8/8h ou 450 mg CR 12/12h, titular pela LITEMIA","via":"VO","frequencia":"8/8h ou 12/12h CR","obs":"alvo manutenção: 0,6-1,0 mEq/L. Aguda: 0,8-1,2 mEq/L. Coletar litemia 12h após última dose"},{"para":"prevenção de suicídio","dose":"manter manutenção","obs":"ÚNICO psicofármaco com evidência forte de redução de suicídio"},{"para":"depressão refratária (adjuvante)","dose":"600-900 mg/dia, alvo 0,4-0,8","obs":"adjuvante a ISRS — STAR*D"},{"para":"mania aguda","dose":"900-1800 mg/dia, alvo 0,8-1,2","obs":"associar a antipsicótico atípico em mania grave"}]}$$::jsonb,
  $${"obs":"INICIAR 150-300 mg/dia. Janela mais estreita; alvo 0,4-0,8."}$$::jsonb,
  $$[{"clcr":"30-50","ajuste":"reduzir 50-75%"},{"clcr":"<30","ajuste":"contraindicado"}]$$::jsonb,
  'D', 'CONTRAINDICADO 1º trim — anomalia de Ebstein cardíaca. Se essencial: monitor litemia rigoroso, ecocardio fetal.', 'CONTRAINDICADO — alta passagem ao leite, toxicidade neonatal.',
  $$[{"com":"AINE (exceto AAS)","efeito":"reduz excreção renal — TOXICIDADE","manejo":"contraindicação relativa, monitor litemia"},{"com":"IECA/BRA/diuréticos tiazídicos","efeito":"reduz excreção — toxicidade","manejo":"reduzir dose lítio se associação inevitável + monitor"},{"com":"ISRS/triptanos","efeito":"síndrome serotoninérgica (raro)","manejo":"monitor"}]$$::jsonb,
  ARRAY['ClCr <30','desidratação grave','hipotireoidismo não tratado','gestação 1º trim','arritmia grave','dieta hipossódica','desidratação/diarreia/vômito persistente'],
  $$[{"freq":"muito comum","evento":"tremor fino (~25%)"},{"freq":"muito comum","evento":"polidipsia, poliúria (DI nefrogênico)"},{"freq":"comum","evento":"náusea, diarreia (mais em IR)"},{"freq":"comum","evento":"ganho peso"},{"freq":"comum","evento":"hipotireoidismo (10-20% — TSH eleva)"},{"freq":"comum","evento":"acne, psoríase agravada"},{"freq":"incomum","evento":"hiperparatireoidismo, hipercalcemia"},{"freq":"raro","evento":"INTOXICAÇÃO (>1,5 mEq/L) — tremor grosseiro, ataxia, confusão, convulsão, coma. >2,5 = HEMODIÁLISE de urgência"},{"freq":"raro (uso crônico)","evento":"DRC progressiva"}]$$::jsonb,
  ARRAY['JANELA TERAPÊUTICA ESTREITA — toxicidade pode ocorrer com pequena alteração na função renal/desidratação','LITEMIA: coletar 12h após última dose, ≥5 dias após ajuste. Alvo 0,6-1,0 manutenção','INTOXICAÇÃO: >1,5 mEq/L sintomática, >2,5 = HEMODIÁLISE EMERGENCIAL. Hidratação SF 0,9% + suspender lítio','Diuréticos tiazídicos, IECA, AINE → REDUZEM excreção → toxicidade — orientar paciente sobre interações','Monitorar TSH/T4 (hipotireoidismo), Cr/eGFR (DRC), Ca++ (hiperpara), peso, ECG basal','Manter HIDRATAÇÃO + INGESTA SAL CONSTANTE — gastroenterite/exercício pesado/calor podem precipitar toxicidade','Único psicofármaco com EVIDÊNCIA forte de REDUÇÃO de SUICÍDIO em transtorno bipolar'],
  ARRAY['Litemia: a cada 5d após início/ajuste, depois trimestral','TSH/T4L semestral','Função renal (Cr, eGFR) trimestral inicialmente, depois semestral','Cálcio sérico anual','Peso','Sintomas tremor/ataxia (toxicidade)'],
  'Mecanismo molecular incompletamente compreendido. Inibe diretamente: GSK-3β (envolvida em circuitos de humor + neuroproteção), inositol monofosfatase (depleta inositol intracelular → reduz cascata IP3/PKC), múltiplos sistemas de neurotransmissores (GABA, glutamato, serotonina). Aumenta neurotrofina BDNF. Compete com Na+ em canais — daí toxicidade por desidratação/depleção sódica.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=carbonato+de+litio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
