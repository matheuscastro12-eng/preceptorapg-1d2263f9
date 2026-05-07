-- PreceptorBook: Mega bloco — Hema/Eletr/Anest (10) + Infecto extra (10) + Endo extra (10) = 30 drogas
-- Total após esta migration: 189 drogas

-- ============================================================
-- HEMATOLOGIA / ELETRÓLITOS / EMERGÊNCIA
-- ============================================================

-- 160. HEPARINA NÃO-FRACIONADA (UFH)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'heparina-nao-fracionada',
  'Heparina não-fracionada (UFH)',
  ARRAY['Liquemine','Heparina sódica'],
  'Anticoagulante (potencializador antitrombina)',
  ARRAY['IV','SC'],
  $$[{"forma":"frasco","concentracao":"5000 UI/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"TEP/TVP — anticoagulação plena","dose":"80 U/kg IV bolus + 18 U/kg/h BIC, alvo TTPa 1,5-2,5x basal","via":"IV BIC","obs":"PREFERIR HEPARINA EM: IRA grave (ClCr<30), instabilidade, cirurgia iminente, TEP maciço (rápida reversão por sulfato protamina)"},{"para":"SCA (IAM com supra ou sem supra)","dose":"60 U/kg bolus (max 4000 U) + 12 U/kg/h BIC (max 1000 U/h), alvo TTPa 50-70 seg","via":"IV BIC"},{"para":"profilaxia TVP hospitalar","dose":"5000 U SC 8/8h ou 12/12h","via":"SC","obs":"alternativa à enoxaparina em ClCr <30"},{"para":"circulação extracorpórea / hemodiálise","dose":"protocolos específicos"},{"para":"terapia ponte em peri-operatório (paciente em varfarina)","dose":"infusão até 4-6h pré-cirurgia, retomar pós"}]}$$::jsonb,
  'C','Categoria C. NÃO atravessa placenta (PM grande). SEGURA em gestação — mas enoxaparina é preferível por menor osteoporose.','Compatível.',
  ARRAY['sangramento ativo','TROMBOCITOPENIA INDUZIDA POR HEPARINA (HIT) prévia','endocardite bacteriana','HAS grave não controlada','cirurgia recente SNC/oftálmica','hipersensibilidade'],
  $$[{"freq":"comum","evento":"sangramento (epistaxe, hematúria, hematomas)"},{"freq":"comum","evento":"elevação enzimas hepáticas"},{"freq":"incomum","evento":"TROMBOCITOPENIA INDUZIDA POR HEPARINA (HIT) — 1-3% UFH (>HBPM). Tipo II é grave (paradoxal trombose)"},{"freq":"incomum (uso prolongado)","evento":"osteoporose"},{"freq":"raro","evento":"hipercalemia (suprime aldosterona)"},{"freq":"raro","evento":"reação alérgica"}]$$::jsonb,
  ARRAY['HIT (Heparin-Induced Thrombocytopenia): queda plaquetas >50% entre dia 5-10 → SUSPENDER heparina (incluindo HBPM, lavagens) IMEDIATAMENTE. Trocar para argatroban, fondaparinux, bivalirudina. NÃO transfundir plaquetas (alimenta a trombose). Sorologia anti-PF4','ANTÍDOTO: SULFATO DE PROTAMINA — 1 mg neutraliza 100 U UFH (max 50 mg dose). Para HBPM: protamina reverte ~60%','TTPa cada 6h até alvo, depois 1-2x/dia. Em IRA: TTPa pode subestimar (preferir anti-Xa)','TROMBOCITOPENIA: hemograma basal + a cada 2-3 dias até dia 14','VANTAGEM EM IRA: sem ajuste por função renal (vs HBPM)','VANTAGEM EM PERI-OP: meia-vida curta (1-2h) — mais flexível que HBPM (12h)','EM IDOSO: maior risco sangramento — usar dose mais conservadora'],
  ARRAY['TTPa (cada 6h até alvo, depois 1-2x/dia)','Hemograma + plaquetas (basal + cada 2-3d × 14d)','Sinais sangramento','Função renal','K+ (uso prolongado)'],
  'Mistura heterogênea de glicosaminoglicanos sulfatados (PM 3000-30000 Da). Liga ANTITRINOMBINA (AT) → potencia sua ação 1000x → AT inibe trombina (IIa) E fator Xa. Ratio anti-IIa:anti-Xa = 1:1 (HBPM = 1:4). Eliminação saturável: meia-vida varia com dose (1-2h em doses anticoagulantes). Não atravessa placenta (PM grande). Reversível por protamina.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=heparina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 161. VITAMINA K (FITOMENADIONA)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'vitamina-k',
  'Vitamina K1 (fitomenadiona)',
  ARRAY['Kanakion','Konakion'],
  'Vitamina lipossolúvel — antagonista da varfarina',
  ARRAY['VO','IV','IM','SC'],
  $$[{"forma":"ampola","concentracao":"10 mg/mL"},{"forma":"comprimido","concentracao":"10 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"REVERSÃO DE VARFARINA — INR alto sem sangramento","dose":"INR 4,5-10 sem sangramento: pode SUSPENDER varfarina + observar (sem vit K rotineira). INR >10 sem sangramento: 2,5-5 mg VO","via":"VO","obs":"VO é preferível em paciente sem sangramento — reverte em 24h, sem rebote excessivo"},{"para":"REVERSÃO URGENTE — sangramento maior em uso varfarina","dose":"5-10 mg IV LENTO (em 30 min) + CCP 4-fator (Kcentra) 25-50 U/kg","via":"IV","obs":"em sangramento grave/intracraniano/cirurgia urgente. CCP corrige em horas; vit K mantém efeito"},{"para":"profilaxia HEMORRAGIA RN (doença hemorrágica do RN)","dose":"1 mg IM dose única ao nascer","via":"IM","obs":"OBRIGATÓRIO em todo RN. Sem prevenção: 0,25-1,7% incidência hemorragia"},{"para":"deficiência (má absorção, colestase, antibiótico prolongado)","dose":"5-10 mg/dia VO ou 10 mg IM","via":"VO ou IM","obs":"corrigir defeito GI primário"},{"para":"intoxicação por raticida (superwarfarina — brodifacoum)","dose":"50-100 mg/dia VO × semanas-meses","obs":"meia-vida do raticida muito longa — vit K em altas doses prolongadas"}]}$$::jsonb,
  $${"indicacoes":[{"para":"profilaxia RN","dose":"1 mg IM dose única (0,5 mg em <1500g)"}]}$$::jsonb,
  'C','Categoria C — mas SEGURA. Vit K materno pré-parto não passa placenta significativamente — RN ainda precisa profilaxia.','Compatível.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"raro","evento":"REAÇÃO ANAFILACTOIDE em IV (mesmo lento) — risco fatal"},{"freq":"raro","evento":"hemólise em deficiência G6PD"},{"freq":"raro","evento":"icterícia em RN (vit K3 sintética antiga, não K1)"}]$$::jsonb,
  ARRAY['IV: ADMINISTRAR LENTO (30 min) + DILUÍDO — risco anafilactoide. Reservar para sangramento grave. PREFERIR VO se possível','VO: reverter INR em 24h, sem risco anafilaxia, mais previsível em paciente clínico','EM REVERSÃO URGENTE: vit K SOZINHA não é suficiente (efeito em horas) — precisa CCP 4-fator (Kcentra) ou plasma fresco congelado para correção imediata','RN: profilaxia OBRIGATÓRIA — recusa parental gera doença hemorrágica tardia (2-12 sem) com hemorragia intracraniana','SUPERWARFARINA (raticida): tratamento PROLONGADO (semanas-meses) + monitor INR — meia-vida longa do tóxico','EM HEPATOPATIA: pode não corrigir totalmente (síntese hepática prejudicada — defeito não é só por falta vit K)'],
  ARRAY['INR (resposta — esperar 12-24h em VO; 4-12h em IV)','Sangramento','Sinais anafilaxia em IV'],
  'Cofator essencial para a γ-CARBOXILASE hepática → carboxila resíduos de glutamato em fatores II (protrombina), VII, IX, X (cascata coagulação) e proteínas C/S — sem essa modificação, fatores não funcionam. Varfarina inibe vit K epóxido redutase (VKORC1) → depleta vit K reduzida → fatores não-carboxilados → anticoagulação. Reposição reverte. Lipossolúvel (precisa absorção biliar/gordura).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fitomenadiona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 162. GLUCONATO DE CÁLCIO IV
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'gluconato-calcio',
  'Gluconato de cálcio (IV)',
  ARRAY['Gluconato de cálcio'],
  'Repositor de cálcio / antídoto',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"100 mg/mL — 10% (10 mL = 1 g = 9 mEq Ca elementar)"}]$$::jsonb,
  $${"indicacoes":[{"para":"HIPERCALEMIA com alterações ECG (estabilizador cardíaco)","dose":"1 g (10 mL) IV em 2-5 min, repetir após 5 min se ECG não normalizar","via":"IV","obs":"PRIMEIRA MEDIDA na hipercalemia >6,5 com ECG alterado. NÃO reduz K+ (estabiliza miocárdio enquanto outras drogas reduzem K). Início <5 min, dura 30-60 min"},{"para":"HIPOCALCEMIA SINTOMÁTICA (tetania, convulsão, arritmia)","dose":"1-2 g em 100 mL SG 5% IV em 10-20 min","via":"IV","obs":"depois manutenção 0,5-2 g/h até normocalcemia"},{"para":"INTOXICAÇÃO POR SULFATO DE MAGNÉSIO","dose":"1 g IV em 3 min","via":"IV","obs":"ANTÍDOTO em intoxicação Mg em eclâmpsia (perda reflexos, depressão respiratória)"},{"para":"INTOXICAÇÃO POR BLOQUEADOR CANAL CÁLCIO / BB","dose":"1-3 g IV bolus + BIC","obs":"em overdose grave"},{"para":"hipocalcemia em transfusão maciça (citrato)","dose":"1 g a cada 4-5 unidades de hemoderivados"}]}$$::jsonb,
  $${"indicacoes":[{"para":"hipocalcemia peds","dose":"30-60 mg/kg IV LENTO em 5-10 min"}]}$$::jsonb,
  'C','Categoria C. Indicado em hipocalcemia, eclâmpsia (antídoto Mg).','Compatível.',
  ARRAY['hipercalcemia','intoxicação digitálica (potencializa toxicidade)','fibrilação ventricular','sarcoidose ativa','hiperparatireoidismo grave'],
  $$[{"freq":"comum","evento":"sensação de calor, rubor"},{"freq":"comum","evento":"hipotensão se infusão rápida"},{"freq":"incomum","evento":"bradicardia, arritmia"},{"freq":"raro","evento":"NECROSE TECIDUAL EXTRAVASAMENTO — preferir cloreto de cálcio em VC central; gluconato é menos irritante perif"},{"freq":"raro","evento":"hipercalcemia (uso excessivo)"}]$$::jsonb,
  ARRAY['EM PARADA POR HIPERCALEMIA: gluconato Ca IV é PRIMEIRA MEDIDA — antes de glicose+insulina, antes de bicarbonato. Estabiliza miocárdio em <5 min','GLUCONATO DE CÁLCIO 10% TEM 9 mg Ca elementar/mL (vs CLORETO DE CÁLCIO 10% = 27 mg/mL — 3x mais potente). Cloreto preferível em PCR/parada via central; gluconato preferível em via periférica (menos esclerosante)','EXTRAVASAMENTO: necrose tecidual — preferir via central em uso prolongado','INTOXICAÇÃO DIGITÁLICA: cálcio POTENCIALIZA toxicidade ("stone heart") — EVITAR. Em PCR digitálico: focar em magnésio, lidocaína, anticorpo antidigoxina','EM TRANSFUSÃO MACIÇA: citrato dos hemoderivados quela cálcio → hipocalcemia → hipotensão, arritmia. Repor profilaticamente'],
  ARRAY['ECG (resposta em hipercalemia)','Cálcio sérico (alvo Ca total 8,5-10,5)','Sintomas (tetania, arritmia)','Sinais extravasamento','Em ICC: cuidado sobrecarga'],
  'Sal de cálcio para infusão IV. Cálcio extracelular ELEVADO ESTABILIZA o potencial de membrana cardíaco em hipercalemia (limiar de despolarização afastado), restaurando excitabilidade normal. Repõe cálcio em hipocalcemia. Antagoniza efeitos do Mg++ na placa motora (tetania pós-MgSO4). Bloqueia influxo de Ca++ em sítios saturados (intoxicação por BCC).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=gluconato+de+calcio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 163. CLORETO DE POTÁSSIO (KCl IV)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'cloreto-potassio',
  'Cloreto de potássio (KCl)',
  ARRAY['KCl 10%','KCl 19,1%'],
  'Repositor de potássio',
  ARRAY['IV','VO'],
  $$[{"forma":"ampola 10%","concentracao":"100 mg/mL = 1,34 mEq/mL (10 mL = 13,4 mEq)"},{"forma":"ampola 19,1%","concentracao":"191 mg/mL = 2,56 mEq/mL"},{"forma":"comprimido VO","concentracao":"600 mg = 8 mEq"}]$$::jsonb,
  $${"indicacoes":[{"para":"HIPOCALEMIA (K <3,5) — VO preferível","dose":"VO: 40-100 mEq/dia divididos. IV: 10-20 mEq/h em via periférica (max 40 mEq/h em via central com monitor ECG)","via":"VO ou IV","obs":"PREFERIR VO se possível. CONCENTRAÇÃO MÁXIMA: 40 mEq/L periférica; 80 mEq/L central. NUNCA bolus IV (PCR fatal)"},{"para":"manutenção em paciente com perda persistente (diurético, vômito)","dose":"20-40 mEq/dia","obs":"corrigir causa primária"},{"para":"em CAD durante reposição insulina","dose":"K<3,3: 20-30 mEq/h ANTES de insulina; K 3,3-5,2: 20-30 mEq/L na hidratação; K>5,2: NÃO repor","obs":"CAD: insulina jogará K para dentro célula → hipocalemia grave se não repor"}]}$$::jsonb,
  'A','Categoria A em doses fisiológicas.','Compatível.',
  ARRAY['HIPERCALEMIA','IRA com oliguria','doença Addison não controlada','queimadura aguda extensa','reação cruzada','digital intoxicação'],
  $$[{"freq":"comum","evento":"náusea, dispepsia (VO)"},{"freq":"comum","evento":"flebite / dor local em via periférica"},{"freq":"incomum","evento":"hipercalemia se infusão rápida"},{"freq":"raro","evento":"PCR — bolus IV ou alta concentração rápida"},{"freq":"raro (VO)","evento":"úlcera gástrica/intestinal"}]$$::jsonb,
  ARRAY['NUNCA INFUNDIR EM BOLUS — PCR FATAL POR HIPERCALEMIA. Esse é dos erros mais fatais em hospital','MÁXIMO 10 mEq/h via PERIFÉRICA (em SF 0,9% ou SG 5% — NÃO em SG puro pois aumenta hipocalemia paradoxal por insulina endógena)','MÁXIMO 20 mEq/h via CENTRAL com monitor ECG contínuo','SE HIPOCALEMIA GRAVE (K<2,5) com arritmia: pode infundir 20 mEq/h em via central com monitor — atenção','VERIFICAR FUNÇÃO RENAL antes de cada bolus IV — em IRA o K acumula','HIPOMAGNESEMIA frequentemente coexiste com hipocalemia — repor Mg simultaneamente, sem isso a reposição K não tem efeito','VO: divisão em doses pequenas + com refeição reduz desconforto GI'],
  ARRAY['K+ sérico (4-6h pós-correção IV)','ECG durante infusão (especialmente alta velocidade)','Função renal','Mg++ (corrigir conjuntamente)','Diurese'],
  'Sal eletrolítico — fornece K+ para repor depleção intracelular/extracelular. K+ é principal cátion intracelular (98%) — gradiente Na+/K+ é fundamental para potencial de membrana. Hipocalemia → hiperexcitabilidade muscular/cardíaca (arritmias, fraqueza); hipercalemia → bloqueio cardíaco (PCR). Margem terapêutica estreita.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cloreto+de+potassio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 164. BICARBONATO DE SÓDIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'bicarbonato-sodio',
  'Bicarbonato de sódio',
  ARRAY['Bicarbonato 8,4%'],
  'Alcalinizante / antiarrítmico em intoxicação',
  ARRAY['IV','VO'],
  $$[{"forma":"ampola 8,4%","concentracao":"84 mg/mL = 1 mEq/mL (10 mL = 10 mEq)"}]$$::jsonb,
  $${"indicacoes":[{"para":"acidose metabólica grave (pH <7,1 OU bicarbonato <8 + sintomas)","dose":"1 mEq/kg IV bolus, repetir conforme gasometria (alvo pH ≥7,2)","via":"IV","obs":"USO RESTRITO. Em CAD/sepse não rotineira (pode piorar acidose intracelular)"},{"para":"intoxicação por TCA / antiarrítmico Ia (cardiotoxicidade)","dose":"1-2 mEq/kg IV bolus, repetir até QRS estreitar","via":"IV","obs":"PRIMEIRA ESCOLHA. Bolus rápido + alvo pH 7,5 + Na+ alto"},{"para":"intoxicação por salicilato","dose":"1-2 mEq/kg bolus + BIC para urinar pH ≥7,5","obs":"alcaliniza urina → aprisiona salicilato → eliminação acelerada"},{"para":"hipercalemia (alcalose desloca K para dentro célula)","dose":"50-100 mEq IV em 30 min","obs":"adjuvante em hipercalemia com acidose"},{"para":"PCR — uso questionável","dose":"1 mEq/kg IV","obs":"NÃO ROTINEIRO em PCR — apenas em PCR prolongada ou intoxicação tricíclico/hipercalemia/acidose grave"},{"para":"alcalinização urinária para nefrolitíase úrica/cistina","dose":"500-1500 mg VO 6-8/8h","obs":"alvo pH urinário 6,5-7"}]}$$::jsonb,
  'C','Categoria C. Cuidado sobrecarga sódio na gestante hipertensa.','Compatível em curto prazo.',
  ARRAY['alcalose','hipocalcemia (pode piorar)','hipocalemia (não corrigida)','sobrecarga volume / IC descompensada','HAS grave'],
  $$[{"freq":"comum","evento":"hipernatremia"},{"freq":"comum","evento":"sobrecarga volume (1 mEq = 1 mL solução 8,4% — alta osmolaridade)"},{"freq":"comum","evento":"alcalose metabólica iatrogênica"},{"freq":"comum","evento":"hipocalemia (alcalose desloca K para dentro)"},{"freq":"comum","evento":"hipocalcemia ionizada (alcalose aumenta ligação Ca-albumina)"},{"freq":"raro","evento":"acidose paradoxal SNC (CO2 difunde mais rápido que HCO3)"},{"freq":"raro","evento":"flebite, esclerose vascular"}]$$::jsonb,
  ARRAY['USO RESTRITO em acidose METABÓLICA — em CAD/sepse pode PIORAR (acidose intracelular paradoxal). Reservar para pH <7,1 com sintomas','DOIS PROBLEMAS COM BIC EM ACIDOSE: 1) gera CO2 → piora acidose se ventilação inadequada; 2) HCO3 não atravessa BHE rápido → SNC fica em acidose paradoxal','BICARBONATO 8,4% É HIPERTÔNICO — risco hipernatremia, sobrecarga osmolar, esclerose veia. Diluir em SG 5% se acesso periférico','EM INTOXICAÇÃO TRICÍCLICO: BIC é antídoto cardiotóxico — alcalose desloca tricíclico do canal Na+ + Na+ alto sobrepuja bloqueio. Alvo pH 7,5','PIORA HIPOCALCEMIA E HIPOCALEMIA — repor antes/durante','EM PCR: CONTROVERSO. AHA não recomenda rotineiramente — apenas em casos específicos (intox tricíclico, hipercalemia, acidose grave preexistente)'],
  ARRAY['Gasometria + lactato','Eletrólitos (Na+, K+, Ca++)','Sobrecarga volume (PA, ausculta pulmonar)','pH urinário em alcalinização'],
  'Base — neutraliza H+ formando água + CO2 (eliminado pelos pulmões). Aumenta pH plasmático. Em intoxicação por TCA: alcalose desloca o fármaco do bloqueio dos canais Na+ cardíacos + Na+ alto sobrepuja o bloqueio. Em alcalinização urinária: aumenta pH urinário, aprisiona ácidos fracos (salicilato, fenobarbital, metotrexato em alta dose).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=bicarbonato+de+sodio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 165. MANITOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'manitol',
  'Manitol',
  ARRAY['Manitol 20%'],
  'Diurético osmótico',
  ARRAY['IV'],
  $$[{"forma":"frasco 20%","concentracao":"200 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"HIPERTENSÃO INTRACRANIANA (TCE, AVC hemorrágico, edema cerebral)","dose":"0,5-1 g/kg IV em 15-30 min, repetir cada 4-6h","via":"IV","obs":"reduz PIC em <30 min, dura 4-6h. Alvo: PIC <22 mmHg, osmolaridade <320 mOsm/L. Solução salina hipertônica 3% é alternativa"},{"para":"glaucoma agudo (adjuvante)","dose":"1-2 g/kg IV em 30 min","obs":"reduz PIO via desidratação humor aquoso"},{"para":"síndrome compartimental rabdomiólise","dose":"0,25-1 g/kg IV","obs":"força diurese + alcaliniza urina"},{"para":"prevenção LRA por contraste (controverso)","dose":"NÃO ROTINEIRO","obs":"hidratação SF 0,9% é melhor"}]}$$::jsonb,
  $${"indicacoes":[{"para":"HIC peds","dose":"0,25-1 g/kg IV em 20-30 min"}]}$$::jsonb,
  $$[{"clcr":"<30","ajuste":"contraindicado em IRA oligúrica"}]$$::jsonb,
  'C','Categoria C. Pode causar desidratação fetal.','Sem dados.',
  ARRAY['IRA anúrica/oligúrica','desidratação grave','sangramento intracraniano ATIVO (controverso — pode aumentar com sangue) — uso ainda recomendado em TCE','IC descompensada','edema pulmonar'],
  $$[{"freq":"comum","evento":"desidratação, sede"},{"freq":"comum","evento":"distúrbio eletrolítico (hipernatremia, hipocalemia)"},{"freq":"comum","evento":"diurese profusa"},{"freq":"incomum","evento":"sobrecarga volume INICIAL → edema pulmonar (puxa água do interstício para vaso)"},{"freq":"incomum","evento":"insuficiência renal aguda (dose alta)"},{"freq":"raro","evento":"acidose metabólica"}]$$::jsonb,
  ARRAY['EFEITO BIFÁSICO: 1) PUXA água do interstício para vaso → AUMENTA volemia (cuidado IC, edema agudo pulmão); 2) excreção urinária → desidratação','OSMOLARIDADE SÉRICA: monitor — alvo <320 mOsm/L. Acima disso: risco IRA por dano tubular (manitol gap)','SUSPENDER se: oligúria, osmolaridade >320, gap osmolar alto, IC descompensada, hipernatremia grave','EM PIC ELEVADA: alternar com SOLUÇÃO SALINA HIPERTÔNICA (3%) — estudo SAH-3 e HypoSAH sugerem equivalência ou superioridade da SSH em alguns cenários','TCE COM HIPOTENSÃO: cuidado — preferir SSH (que repõe Na e volume) ou cristaloide','EM IRA: contraindicado — manitol não eliminado se torna nefrotóxico','PASSAR POR FILTRO 5 µm — pode cristalizar em ampola fria (aquecer e agitar antes)'],
  ARRAY['PIC (em paciente neurocrítico)','PA + FC','Diurese horária','Eletrólitos (Na+, K+) cada 6h','Osmolaridade sérica + gap osmolar','Função renal'],
  'Diurético osmótico — açúcar (manitol 6 carbonos) NÃO REABSORVIDO no túbulo renal. Aumenta osmolaridade plasmática → puxa água do interstício/células para o vaso (efeito imediato — útil em hipertensão intracraniana). Filtrado nos glomérulos sem reabsorção → carrega água + Na+ + K+ por arrasto osmótico → diurese. Não atravessa BHE intacta — daí mecanismo cerebral é via osmolaridade plasmática.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=manitol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 166. ROCURÔNIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'rocuronio',
  'Rocurônio',
  ARRAY['Esmeron','Rocuronium'],
  'Bloqueador neuromuscular não-despolarizante',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"10 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"INTUBAÇÃO RÁPIDA (alternativa à succinilcolina)","dose":"1,2 mg/kg IV bolus (paralisia em 60 seg, dura 30-90 min)","via":"IV","obs":"ALTERNATIVA à succinilcolina em pacientes com risco hipertermia maligna, hipercalemia, queimadura. PRECISA SUGAMADEX disponível para reverter rapidamente"},{"para":"intubação eletiva / cirurgia","dose":"0,6 mg/kg IV (paralisia em 90 seg, dura 30 min)","via":"IV"},{"para":"manutenção bloqueio cirurgia longa","dose":"BIC 0,3-0,6 mg/kg/h","via":"IV BIC"}]}$$::jsonb,
  $${"indicacoes":[{"para":"intubação peds","dose":"0,6-1,2 mg/kg IV"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"prolongamento ação — reduzir dose"}]$$::jsonb,
  'B','Categoria B. Não atravessa placenta significativamente em dose padrão.','Compatível em uso pontual.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"taquicardia leve (efeito vagolítico)"},{"freq":"incomum","evento":"reação alérgica/anafilática (rocurônio é o BNM mais alergênico)"},{"freq":"raro","evento":"prolongamento bloqueio (em hepatopata)"}]$$::jsonb,
  ARRAY['ANAFILAXIA POR ROCURÔNIO: incidência ~1:2000-5000. Triptase basal + pesquisa anti-rocurônio IgE em suspeita','SUGAMADEX: reverte rocurônio em 2-3 min mesmo em bloqueio profundo (4 mg/kg) — vantagem ÚNICA do rocurônio sobre outros BNM. Em emergência via aérea perdida: 16 mg/kg sugamadex','EM ISR sem sugamadex: succinilcolina é preferível (curta ação, recuperação espontânea em 5-10 min). COM sugamadex: rocurônio é equivalente ou superior','EM HEPATOPATIA: meia-vida prolongada — usar dose menor + monitor TOF','SEMPRE TER PLANO B (via aérea cirúrgica) antes de paralisar paciente','MONITOR TOF (Train of Four) é padrão para guiar reversão'],
  ARRAY['TOF (Train of Four — monitor neuromuscular)','SatO2 + capnografia','PA + FC','Sinais anafilaxia'],
  'BLOQUEADOR NÃO-DESPOLARIZANTE (aminoesteroide). ANTAGONIZA competitivamente os receptores nicotínicos da placa motora → impede despolarização → paralisia FLÁCIDA (sem fasciculação inicial). Reversível: 1) competição da acetilcolina (neostigmina + atropina/glicopirrolato), 2) ENCAPSULAMENTO físico pelo SUGAMADEX (γ-ciclodextrina modificada).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=rocuronio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 167. SUGAMADEX
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'sugamadex',
  'Sugamadex',
  ARRAY['Bridion'],
  'Reversor seletivo de bloqueio neuromuscular (rocurônio/vecurônio)',
  ARRAY['IV'],
  $$[{"forma":"frasco","concentracao":"100 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"reversão BLOQUEIO MODERADO (TOF >2)","dose":"2 mg/kg IV bolus","via":"IV","obs":"reversão em 1-2 min"},{"para":"reversão BLOQUEIO PROFUNDO (TOF 0, PTC ≥1)","dose":"4 mg/kg IV bolus","via":"IV","obs":"reversão em 2-3 min mesmo em bloqueio profundo"},{"para":"reversão IMEDIATA pós-INDUÇÃO (emergência via aérea perdida)","dose":"16 mg/kg IV bolus","via":"IV","obs":"reverte rocurônio em <3 min mesmo logo após indução. ÚNICO BNM com reversão imediata possível"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥2 anos","dose":"mesma dose adulto (mg/kg)"}]}$$::jsonb,
  $$[{"clcr":">30","ajuste":"sem ajuste"},{"clcr":"<30","ajuste":"limitada experiência — usar apenas se necessário"}]$$::jsonb,
  'C','Categoria C. Sem dados em humanos suficientes.','Sem dados.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, vômito"},{"freq":"comum","evento":"hipotensão, bradicardia"},{"freq":"incomum","evento":"reação alérgica (incluindo anafilaxia)"},{"freq":"incomum","evento":"recurarização (raro com dose adequada)"},{"freq":"raro","evento":"prolongamento QT (transitório)"}]$$::jsonb,
  ARRAY['REVOLUÇÃO EM ANESTESIA: permite uso seguro de rocurônio em ISR (antes só succinilcolina) e reversão imediata se via aérea perdida','REVERSÃO IMEDIATA com 16 mg/kg: única opção em "cannot intubate, cannot ventilate" pós-indução com rocurônio','BRADICARDIA pode ocorrer — atropina disponível','RECURARIZAÇÃO (re-bloqueio) é rara mas possível — monitor pós','LIGAÇÃO HORMONAL: pode reduzir eficácia de CONTRACEPTIVOS HORMONAIS por ~24h. Orientar paciente uso de barreira ou método não hormonal por 7 dias','MUITO CARO — uso seletivo nos casos onde o benefício justifica'],
  ARRAY['TOF antes (diagnosticar bloqueio)','TOF após (confirmar reversão)','SatO2 + capnografia','PA + FC (bradicardia, hipotensão)','Sinais anafilaxia'],
  'γ-CICLODEXTRINA modificada — anel oligossacarídico que ENCAPSULA fisicamente moléculas de rocurônio (e vecurônio) em complexo 1:1 → remove BNM da junção neuromuscular → reverte bloqueio. NÃO TEM AÇÃO em receptores. Não reverte succinilcolina, atracúrio, cisatracúrio (estrutura química diferente). Eliminação 100% renal do complexo intacto.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sugamadex',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 168. ERITROPOIETINA (alfa)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'eritropoetina-alfa',
  'Eritropoetina alfa (EPO)',
  ARRAY['Hemax','Eprex','Alfaepoetina'],
  'Estimulante eritropoiese (ESA)',
  ARRAY['SC','IV'],
  $$[{"forma":"seringa","concentracao":"1000/2000/4000/10000 UI"}]$$::jsonb,
  $${"indicacoes":[{"para":"anemia em DRC dialítica","dose":"50-100 UI/kg SC 3x/sem, ajustar para Hb 10-11,5 (NÃO acima de 11,5)","via":"SC ou IV em hemodiálise","obs":"ALVO Hb 10-11,5 — acima disso aumenta mortalidade CV (TREAT, CHOIR, CREATE)"},{"para":"anemia em DRC pré-dialítica","dose":"50-100 UI/kg SC 1-3x/sem","obs":"manter Hb 10-11,5"},{"para":"anemia induzida por quimioterapia","dose":"40000 UI SC 1x/sem","duracao":"durante quimio","obs":"em paciente com Hb <10 + quimio mielossupressora não-curativa. Avaliar trombose"},{"para":"pré-cirúrgico (cirurgia ortopédica) — reduz transfusão","dose":"600 UI/kg SC 4 doses (21, 14, 7 dias e dia da cirurgia)","obs":"em Hb 10-13"},{"para":"prematuro / RN com anemia da prematuridade","dose":"protocolo neonatal específico"}]}$$::jsonb,
  'C','Categoria C. Sem evidência teratogenia significativa.','Compatível.',
  ARRAY['HAS NÃO CONTROLADA','aplasia eritrocitária pura (PRCA) prévia por anti-EPO','tumor sólido com intenção curativa (controversa — pode estimular crescimento tumoral)','hipersensibilidade'],
  $$[{"freq":"comum","evento":"HAS / piora de HAS prévia"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"trombose vascular acesso (FAV em DRC)"},{"freq":"incomum","evento":"convulsão (associada à HAS)"},{"freq":"incomum","evento":"AVC, TEV, IAM (especialmente Hb >12)"},{"freq":"raro","evento":"PRCA por anti-EPO (rara mas grave — Eprex)"}]$$::jsonb,
  ARRAY['ALVO Hb 10-11,5 g/dL — NÃO ACIMA. Hb >12 aumenta mortalidade CV/AVC/TEV (TREAT, CREATE, CHOIR)','PRECISA FERRO ADEQUADO antes/durante — sem ferro, EPO não funciona. SUPLEMENTAR ferro IV (sacarato/carboximaltose) em dialítico. Ferritina alvo 200-500, sat. transferrina >20%','HAS: monitorar PA. Ajustar/suspender EPO se HAS não controlada','RESISTÊNCIA À EPO: investigar — deficiência de ferro, vit B12/folato, inflamação ativa, hiperparatireoidismo, alumínio','EM CÂNCER CURATIVO: cuidado — pode estimular crescimento tumoral em alguns RCTs (mama, cabeça/pescoço, linfoma). Discutir caso a caso','PRCA POR ANTI-EPO: queda Hb refratária + reticulocitopenia → suspender EPO, IST nunca usar. Era mais frequente com Eprex (formulação alterada)'],
  ARRAY['Hb cada 2 sem na titulação, depois mensal','Ferritina + sat. transferrina trimestral','PA','TGO/TGP','Função renal','Sinais trombose'],
  'Glicoproteína recombinante = eritropoetina humana. Liga ao receptor de EPO (EPOR) nos progenitores eritroides na medula óssea → ativa JAK2 → STAT5 → estimula proliferação + diferenciação + reduz apoptose dos eritroblastos → aumenta produção de hemácias. Efeito visível em 2-3 sem (vida útil hemácia 120 dias). Sem efeito em outras linhagens.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=eritropoetina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 169. ATROPINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'atropina',
  'Atropina (sulfato)',
  ARRAY['Atropina','Atrovet'],
  'Antimuscarínico (anticolinérgico)',
  ARRAY['IV','IM','SC','VO','colírio','inalat'],
  $$[{"forma":"ampola","concentracao":"0,25 mg/mL ou 0,5 mg/mL"},{"forma":"colírio","concentracao":"1%"}]$$::jsonb,
  $${"indicacoes":[{"para":"BRADICARDIA SINTOMÁTICA / BAV","dose":"0,5-1 mg IV bolus, repetir cada 3-5 min, max 3 mg","via":"IV","obs":"PRIMEIRA LINHA em bradicardia sintomática. Se sem resposta: dopamina/epinefrina BIC ou marcapasso transcutâneo"},{"para":"PCR — assistolia/AESP — NÃO RECOMENDADA","obs":"AHA REMOVEU atropina rotineira de PCR (sem evidência) — apenas em bradicardia pré-PCR"},{"para":"intoxicação por organofosforado / carbamato (inseticida)","dose":"2-5 mg IV bolus, REPETIR EM ATÉ 5 MIN com DOSES DOBRADAS até atropinização (broncosecreção seca, FC >80, midríase)","via":"IV","obs":"DOSES MUITO ALTAS — pode precisar gramas. Associar pralidoxima"},{"para":"pré-medicação anestésica (reduzir secreção)","dose":"0,4-0,6 mg IM 30 min pré","obs":"raro hoje (anestésicos modernos)"},{"para":"pré-medicação para succinilcolina em peds","dose":"0,02 mg/kg IV","obs":"prevenir bradicardia em <5a ou em 2ª dose"},{"para":"midríase oftalmo (refração / uveíte)","dose":"colírio 1% — 1 gota","via":"colírio","obs":"midríase prolongada (até 10 dias) — uso restrito"}]}$$::jsonb,
  $${"indicacoes":[{"para":"bradicardia peds","dose":"0,02 mg/kg IV (min 0,1 mg / max 0,5 mg)"}]}$$::jsonb,
  'C','Categoria C. Atravessa placenta. Cuidado em bradicardia fetal.','Pequenas quantidades — compatível.',
  ARRAY['glaucoma de ângulo fechado','retenção urinária / HBP grave','obstrução TGI','taquiarritmia (relativa)','tireotoxicose','hipersensibilidade'],
  $$[{"freq":"comum","evento":"taquicardia (efeito desejado em bradicardia, indesejado em outros)"},{"freq":"comum","evento":"BOCA SECA (efeito clássico)"},{"freq":"comum","evento":"midríase, visão borrada"},{"freq":"comum","evento":"retenção urinária"},{"freq":"comum","evento":"constipação"},{"freq":"incomum","evento":"DELIRIUM ANTICOLINÉRGICO (idoso) — agitação, alucinação, hipertermia"},{"freq":"raro","evento":"hipertermia (sudorese suprimida)"}]$$::jsonb,
  ARRAY['MNEMÔNICO ANTICOLINÉRGICO: "Hot as a hare, dry as a bone, red as a beet, mad as a hatter, blind as a bat" — orienta diagnóstico de overdose anticolinérgica','EM ORGANOFOSFORADO: doses MUITO ALTAS necessárias — meta clínica é ATROPINIZAÇÃO (broncosecreção seca, FC >80, midríase). Pode precisar 100+ mg em 24h','PRALIDOXIMA é coadjuvante em organofosforado — reativa acetilcolinesterase. Atropina sozinha não é suficiente','EM IDOSO: alta sensibilidade — causar delirium anticolinérgico (cuidado uso pré-medicação)','EM PEDS: pré-medicação para succinilcolina ou em bradicardia sintomática','DOSES MUITO BAIXAS (<0,5 mg) podem causar BRADICARDIA PARADOXAL (efeito antagônico central) — usar dose adequada','MARCAPASSO TRANSCUTÂNEO se atropina não funcionar em bradicardia sintomática'],
  ARRAY['ECG (FC, ritmo)','PA','Sintomas anticolinérgicos','Diurese (retenção)','Em organofosforado: secreções, FC, miose'],
  'Antagonista COMPETITIVO dos receptores muscarínicos da acetilcolina (M1-M5). Bloqueia ações parassimpáticas: 1) coração (taquicardia, ↑condução AV); 2) brônquios (broncodilatação, redução secreção); 3) glândulas (boca/pele secas); 4) olho (midríase, cicloplegia); 5) bexiga (retenção urinária); 6) TGI (redução motilidade, constipação); 7) SNC (em altas doses: delirium anticolinérgico).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=atropina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- INFECTO ADICIONAL
-- ============================================================

-- 170. VALACICLOVIR
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'valaciclovir',
  'Valaciclovir',
  ARRAY['Valtrex'],
  'Antiviral — pró-droga do aciclovir',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"500 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"herpes genital — primário","dose":"1 g 12/12h × 7-10 dias","via":"VO","obs":"alternativa mais cômoda ao aciclovir VO"},{"para":"herpes genital — recorrência","dose":"500 mg 12/12h × 3 dias","via":"VO","obs":"iniciar nas primeiras 24h"},{"para":"supressão crônica HSV","dose":"500 mg 1x/dia","via":"VO"},{"para":"herpes zoster","dose":"1 g 8/8h × 7 dias","via":"VO","obs":"INICIAR <72h. PREFERÍVEL ao aciclovir 800 mg 5x/dia (adesão)"},{"para":"profilaxia CMV pós-transplante","dose":"2 g 4x/dia","via":"VO","obs":"em pacientes selecionados de baixo risco"}]}$$::jsonb,
  $$[{"clcr":">30","ajuste":"sem ajuste"},{"clcr":"10-30","ajuste":"reduzir 50% e intervalo 12-24h"},{"clcr":"<10","ajuste":"500 mg 24/24h"}]$$::jsonb,
  'B','Segura.','Compatível.',
  ARRAY['hipersensibilidade ao aciclovir / valaciclovir'],
  $$[{"freq":"comum","evento":"náusea, cefaleia"},{"freq":"incomum","evento":"insuficiência renal aguda (cristalúria)"},{"freq":"incomum","evento":"sintomas neurológicos em IRA/idoso"},{"freq":"raro","evento":"púrpura trombótica trombocitopênica (em imunossuprimidos)"}]$$::jsonb,
  ARRAY['BIODISPONIBILIDADE 55% (vs 15-20% aciclovir VO) — mesmo efeito clínico com dose menor + intervalo maior. Adesão melhor','EM PACIENTE IMUNOCOMPETENTE: valaciclovir é preferível ao aciclovir VO por melhor adesão','HIDRATAÇÃO: orientar paciente — risco IRA por cristalúria em desidratação','EM HERPES ZOSTER >50A: PRESCREVER nas primeiras 72h reduz neuralgia pós-herpética em 40%','SUPRESSÃO CRÔNICA: indicada se ≥6 episódios/ano. Reduz transmissão para parceiro 50%'],
  ARRAY['Função renal','Hidratação','Resposta clínica'],
  'Pró-droga: éster L-valil do aciclovir → hidrolisada por enzimas hepatoesterases → libera ACICLOVIR + valina → mesmo mecanismo que aciclovir (fosforilação por TK viral, inibição DNA polimerase viral, terminação cadeia DNA). Vantagem: biodisponibilidade VO 3-5x maior → doses menos frequentes.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=valaciclovir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 171. ANFOTERICINA B (lipossomal)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'anfotericina-b-lipossomal',
  'Anfotericina B lipossomal (L-AmB)',
  ARRAY['AmBisome','Anforicin'],
  'Antifúngico poliênico',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"50 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"micose sistêmica grave (criptococose, candidíase invasiva, aspergilose, histoplasmose, mucormicose)","dose":"3-5 mg/kg/dia IV em 2-4h","via":"IV","duracao":"2-6 semanas","obs":"PRIMEIRA ESCOLHA em micose grave/imunossuprimido. Lipossomal tem MENOR nefrotoxicidade que deoxicolato"},{"para":"meningite criptocócica em HIV — INDUÇÃO","dose":"3-4 mg/kg/dia + flucitosina 100 mg/kg/dia × 2 sem","via":"IV + VO","obs":"associar flucitosina (sinergia). Manutenção com fluconazol 400 mg/dia × 8 sem + supressão crônica"},{"para":"leishmaniose visceral (calazar)","dose":"3 mg/kg/dia × 5d + dia 14 e 21 (total 21 mg/kg)","via":"IV","obs":"PRIMEIRA ESCOLHA no Brasil (PCDT MS) — superior a antimoniato"},{"para":"infecção fúngica em neutropenia febril refratária","dose":"3-5 mg/kg/dia","via":"IV"},{"para":"prevenção infecção fúngica em transplante","dose":"1 mg/kg/dia","via":"IV"}]}$$::jsonb,
  'B','Categoria B. Em micose grave/leishmaniose: indicada (risco materno-fetal de não tratar > efeito).','Sem dados suficientes.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"REAÇÃO INFUSIONAL (febre, calafrios, mialgia, taquicardia, hipotensão) — pré-medicar"},{"freq":"comum","evento":"NEFROTOXICIDADE (menor que deoxicolato — ainda existe)"},{"freq":"comum","evento":"hipocalemia, hipomagnesemia"},{"freq":"comum","evento":"anemia"},{"freq":"incomum","evento":"hepatotoxicidade"},{"freq":"raro","evento":"arritmia"}]$$::jsonb,
  ARRAY['LIPOSSOMAL >> DEOXICOLATO (formulação tradicional) — MUITO MENOR nefro-, oto-, hepatotoxicidade. Custo maior mas justifica em paciente vulnerável','PRÉ-MEDICAR: paracetamol 500-1000 mg + difenidramina 25-50 mg + considerar hidrocortisona 25 mg IV — reduz reação infusional','HIDRATAÇÃO 500-1000 mL SF 0,9% pré e pós — reduz nefrotoxicidade','MONITOR: K+, Mg++, Cr antes de cada dose — repor agressivamente. Hipocalemia profunda comum','LEISHMANIOSE VISCERAL no Brasil: PRIMEIRA ESCOLHA é L-AmB. Antimoniato pentavalente (glucantime) caiu para 2ª linha por toxicidade','NÃO CONFUNDIR formulações: deoxicolato (1 mg/kg, mais nefrotóxica), lipossomal (3-5 mg/kg, menos nefro), complexo lipídico (5 mg/kg, intermediária)'],
  ARRAY['Cr + eletrólitos (K+, Mg++) antes cada dose','Hemograma','TGO/TGP semanal','Sinais reação infusional','Resposta clínica + cultura/antígeno'],
  'Antifúngico poliênico — liga IRREVERSIVELMENTE ao ergosterol da membrana fúngica → forma poros → rompe permeabilidade → morte fúngica. Em humanos, alguma ligação ao colesterol (efeitos colaterais — formulação lipossomal reduz captação por células saudáveis). Espectro AMPLO: Candida, Cryptococcus, Aspergillus, Mucorales, Histoplasma, Blastomyces, Paracoccidioides, Leishmania.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=anfotericina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 172. DOLUTEGRAVIR
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dolutegravir',
  'Dolutegravir (DTG)',
  ARRAY['Tivicay','em combinação com TDF+3TC'],
  'Antirretroviral — INSTI (inibidor da integrase)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"50 mg"},{"forma":"associação TDF+3TC+DTG","concentracao":"300+300+50 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"HIV — TARV inicial (PRIMEIRA ESCOLHA SUS)","dose":"50 mg/dia (em comprimido único TDF+3TC+DTG noite)","via":"VO","frequencia":"1x/dia","duracao":"contínuo","obs":"PRIMEIRA ESCOLHA — alta barreira genética, eficácia, tolerância. Brasil: comprimido único noite. Tomar com refeição se possível"},{"para":"HIV — em pacientes que falharam outros esquemas","dose":"50 mg 12/12h em uso com indutores (rifampicina, efavirenz)","via":"VO","obs":"dobrar dose para superar indução"},{"para":"PEP HIV","dose":"50 mg/dia + TDF+3TC × 28 dias","obs":"em conjunto com TDF+3TC"}]}$$::jsonb,
  'B (revisado de C)','Categoria B atualizada (2020). Estudo Tsepamo inicialmente sugeriu DTN — dados subsequentes (>250000 expostos) tranquilizaram. PODE USAR EM GESTAÇÃO (incluindo concepção). Suplementar ácido fólico.','Compatível em paciente com TARV; em HIV+: Brasil orienta fórmula (UNAIDS).',
  ARRAY['uso de dofetilida (interação grave)','hipersensibilidade'],
  $$[{"freq":"comum","evento":"insônia, alteração sono"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"náusea, diarreia"},{"freq":"comum","evento":"GANHO DE PESO (especialmente em mulher, negros)"},{"freq":"incomum","evento":"alteração humor, depressão (especialmente em paciente com história)"},{"freq":"incomum","evento":"hepatotoxicidade"},{"freq":"raro","evento":"reação hipersensibilidade grave"}]$$::jsonb,
  ARRAY['PRIMEIRA ESCOLHA na TARV inicial mundialmente — alta barreira genética + tolerância + 1x/dia','GANHO DE PESO é efeito notável de INSTI (especialmente DTG, BIC) — diferente de NNRTI. Discutir com paciente','EFAVIRENZ tinha medo de DTN — DTG inicialmente também (Tsepamo) mas dados atualizados são tranquilizadores. AGORA RECOMENDADO em gestação','RIFAMPICINA REDUZ DTG → dobrar dose (50 mg 12/12h) durante TB','POLIVALENTE Mg++/Al++/Ca++ (antiácidos, suplementos) reduzem absorção — espaçar 2h','RECEPTOR DOPAMINA D2: pode causar alterações neuropsiquiátricas em pacientes vulneráveis'],
  ARRAY['Carga viral HIV (basal + 4-6 sem após início + 12 sem)','CD4','Função renal + hepática','Sintomas neuropsiquiátricos','Peso','Adesão'],
  'INSTI (inibidor da INTEGRASE do HIV) — bloqueia transferência de fita: integrase viral cliva DNA viral e o INSERE no genoma do hospedeiro. DTG bloqueia essa etapa essencial. Alta barreira genética (precisa múltiplas mutações para resistência). Penetração SNC boa. Eliminação hepática (CYP3A4 e UGT1A1 — daí interações).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dolutegravir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 173. CLOROQUINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'cloroquina',
  'Cloroquina',
  ARRAY['Cloroquina'],
  'Antimalárico 4-aminoquinolina',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"150 mg base (250 mg sal)"}]$$::jsonb,
  $${"indicacoes":[{"para":"malária por P. vivax / P. ovale / P. malariae","dose":"600 mg base D1 + 450 mg base 6h depois + 450 mg base D2 + D3 (total 1500 mg em 3 dias)","via":"VO","obs":"em P. vivax/ovale: ASSOCIAR primaquina 30 mg/dia × 7-14 dias (ou tafenoquina dose única) — eliminar hipnozoítos hepáticos. Em P. falciparum: RESISTÊNCIA — usar artemisinina (PNCM)"},{"para":"profilaxia em viajante (área cloroquina-sensível)","dose":"300 mg base/sem","duracao":"1 sem antes + durante + 4 sem após exposição","obs":"poucas áreas cloroquina-sensíveis hoje (algumas no Caribe, México, Centro/Sul América). Maioria precisa mefloquina ou doxiciclina"},{"para":"COVID-19","dose":"NÃO RECOMENDADA","obs":"SEM EFICÁCIA comprovada (RECOVERY, SOLIDARITY). NÃO PRESCREVER"}]}$$::jsonb,
  $${"indicacoes":[{"para":"malária peds","dose":"10 mg base/kg D1 + 5 mg base/kg D2-D3"}]}$$::jsonb,
  'C','Categoria C — pode usar em gestante com malária (risco materno-fetal de malária >> efeitos cloroquina).','Compatível.',
  ARRAY['retinopatia prévia','hipersensibilidade','epilepsia (relativa)','psoríase (pode exacerbar)'],
  $$[{"freq":"comum","evento":"náusea, dor abdominal"},{"freq":"comum","evento":"prurido (especialmente em afrodescendentes)"},{"freq":"incomum","evento":"hipoglicemia"},{"freq":"incomum (uso prolongado)","evento":"RETINOPATIA"},{"freq":"raro","evento":"prolongamento QT, torsades"},{"freq":"raro","evento":"cardiomiopatia (uso prolongado alta dose)"}]$$::jsonb,
  ARRAY['NÃO É TRATAMENTO PARA COVID-19 — evidência conclusiva (RCTs negativos). Risco arritmia desnecessário','RESISTÊNCIA EM P. FALCIPARUM: cloroquina NÃO funciona — usar artemether-lumefantrina, artesunato + mefloquina (PNCM Brasil)','EM P. VIVAX: ASSOCIAR primaquina ou tafenoquina (eliminar hipnozoítos hepáticos) — sem isso recidiva 30-50%','OVERDOSE GRAVE: arritmia ventricular, hipotensão, parada cardíaca — emergência. Tratamento: diazepam IV (paradoxalmente protetor cardíaco), epinefrina, ECG monitorado','HIDROXICLOROQUINA é mais segura em uso prolongado (LES, AR) — preferir nessas indicações'],
  ARRAY['Função visual em uso prolongado','Glicemia em DM','ECG (QT) em alto risco','Resposta parasitemia em malária'],
  'Antimalárico 4-aminoquinolina. Concentra no vacúolo digestivo do plasmódio (quando o parasita digere hemoglobina) → impede polimerização do heme tóxico em hemozoína (cristal inerte) → heme livre acumula → mata o parasita. Não age contra hipnozoítos hepáticos (P. vivax/ovale). Resistência por mutações no transportador PfCRT.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cloroquina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 174. PRAZIQUANTEL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'praziquantel',
  'Praziquantel',
  ARRAY['Cisticid','Praziquantel'],
  'Antiparasitário (anti-helmíntico — trematódeos e cestódeos)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"500/600 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"esquistossomose mansônica (S. mansoni — Brasil)","dose":"50 mg/kg DOSE ÚNICA VO (peds 60 mg/kg)","via":"VO","frequencia":"dose única","obs":"PRIMEIRA ESCOLHA. Eficaz contra adulto. Dose única. Em casos refratários: repetir em 6 sem"},{"para":"esquistossomose (outras espécies)","dose":"40-60 mg/kg dose única (S. haematobium, S. japonicum)","obs":"Schistosoma haematobium é endêmico no Egito/África"},{"para":"teníase (Taenia solium, T. saginata)","dose":"5-10 mg/kg dose única","via":"VO","obs":"alternativa: niclosamida 2 g dose única"},{"para":"NEUROCISTICERCOSE (com cuidado)","dose":"50 mg/kg/dia × 14-30 dias","via":"VO","obs":"associar dexametasona + anticonvulsivante. Ressonância antes/durante. ALBENDAZOL é PRIMEIRA escolha em neurocisticercose"},{"para":"hidatidose (cistos pequenos)","dose":"50-60 mg/kg/dia × 21 dias","obs":"adjuvante a cirurgia. Albendazol é preferível"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥4a esquistossomose","dose":"60 mg/kg dose única"}]}$$::jsonb,
  'B','Categoria B. SEGURO em gestação — OMS recomenda esquistossomose em gestante após 1º trim.','Compatível com cautela.',
  ARRAY['cisticercose ocular (pode causar lesão definitiva por reação inflamatória)','hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, vômito"},{"freq":"comum","evento":"dor abdominal"},{"freq":"comum","evento":"cefaleia, tonteira"},{"freq":"comum","evento":"sonolência, mal-estar"},{"freq":"incomum (em alta carga)","evento":"reação Mazzotti — febre, urticária, prurido (resposta às toxinas dos vermes mortos)"}]$$::jsonb,
  ARRAY['DOSE ÚNICA — orientar paciente que não precisa repetir desnecessariamente','TOMAR APÓS REFEIÇÃO LEVE — reduz desconforto GI','EM ESQUISTOSSOMOSE INTESTINAL CRÔNICA com fibrose hepática: praziquantel não reverte fibrose mas previne progressão','EM NEUROCISTICERCOSE: piora inflamatória aguda nas primeiras 1-2 sem com morte do parasita — sempre associar dexametasona + reavaliar com RM','CISTICERCOSE OCULAR: NÃO DAR PRAZIQUANTEL/ALBENDAZOL ANTES de cirurgia oftalmológica — destruição parasita causa reação inflamatória que destrói visão','EM ÁREA ENDÊMICA (Brasil — Vale do Aço, MG, NE): tratamento em massa de comunidades reduz prevalência'],
  ARRAY['EPF de controle 1-3 meses pós','Sintomas','Em neurocisticercose: imagem (RM/TC) seriada','Eosinofilia (cai pós-tratamento)'],
  'Aumenta a permeabilidade ao Ca++ na membrana do parasita → contração muscular tetânica → paralisia espástica do helminto → solta-se da parede intestinal/vasos → eliminado por peristaltismo. Também causa vacuolização do tegumento → exposição de antígenos → ataque imunológico. Eficaz contra trematódeos (Schistosoma, Fasciola — esta com menor eficácia) e cestódeos (Taenia, Echinococcus, Diphyllobothrium).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=praziquantel',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- ENDOCRINO ADICIONAL
-- ============================================================

-- 175. METIMAZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'metimazol',
  'Metimazol (tiamazol)',
  ARRAY['Tapazol','Tiamazol'],
  'Tireostático',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"5/10 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"hipertireoidismo (Graves) — manejo inicial","dose":"INICIAR conforme T4L: 1-1,5x normal: 10 mg/dia; 1,5-2x: 20 mg/dia; >2x: 30 mg/dia. Manutenção: 5-10 mg/dia","via":"VO","frequencia":"1x/dia","duracao":"12-18 meses (Graves) — visando remissão","obs":"PRIMEIRA ESCOLHA fora do 1º trim de gestação. Mais eficaz que PTU, menos hepatotoxicidade"},{"para":"preparo cirúrgico (tireoidectomia)","dose":"30-40 mg/dia × 2-3 sem (até eutireoideo)","obs":"associar BB + iodeto de potássio 7 dias pré-cirurgia"},{"para":"crise tireotóxica","dose":"60-100 mg/dia divididos","obs":"associar PTU (que bloqueia conversão T4→T3) + Lugol + BB + corticoide + UTI"}]}$$::jsonb,
  $${"indicacoes":[{"para":"hipertireoidismo peds","dose":"0,2-0,5 mg/kg/dia"}]}$$::jsonb,
  'D','Categoria D — APLASIA CUTIS, defeitos congênitos no 1º trim. NO 1º TRIM USAR PTU. Em 2º-3º trim: voltar para metimazol (seguro).','Compatível em doses baixas (≤20 mg/dia) — monitor função tireoide RN.',
  ARRAY['hipersensibilidade','agranulocitose prévia por tireostático','hepatopatia ativa','gestação 1º trim'],
  $$[{"freq":"comum","evento":"rash cutâneo benigno"},{"freq":"comum","evento":"náusea, alteração paladar"},{"freq":"incomum","evento":"artralgia"},{"freq":"raro (0,2-0,5%)","evento":"AGRANULOCITOSE — geralmente nos primeiros 90 dias"},{"freq":"raro","evento":"hepatotoxicidade colestática"},{"freq":"raro","evento":"vasculite ANCA+"}]$$::jsonb,
  ARRAY['AGRANULOCITOSE: 0,2-0,5%, geralmente primeiros 90 dias — ORIENTAR PACIENTE buscar emergência se FEBRE + ODINOFAGIA. Coletar hemograma. SUSPENDER tireostático se confirmada','HEPATOTOXICIDADE: monitor TGO/TGP. Suspender se >3x basal','TRATAMENTO 12-18 MESES + tentar suspender — 30-50% remitem (melhor em mulher, jovem, TRAb baixo, doença leve, bócio pequeno). Se TRAb persistente alto: indicar tratamento definitivo (radioiodo/cirurgia)','EM 1º TRIMESTRE GESTAÇÃO: USAR PTU (metimazol = aplasia cutis, atresia coana). EM 2º-3º TRIM: trocar para metimazol (PTU = hepatite fulminante)','EM CRISE TIREOTÓXICA: PTU > metimazol (PTU bloqueia conversão T4→T3 perifericamente — efeito mais rápido em crise)'],
  ARRAY['TSH/T4L cada 4-6 sem na titulação, depois cada 2-3 meses','Hemograma basal + 1 mês (rastreio agranulocitose)','TGO/TGP basal + a cada 3 meses','Sintomas (rash, febre, odinofagia)','TRAb periódico (orienta remissão)'],
  'Tionamida — inibe a TIREOPEROXIDASE (TPO) que catalisa: 1) oxidação do iodeto a iodo; 2) iodação dos resíduos de tirosina na tireoglobulina; 3) acoplamento de iodotirosinas (MIT/DIT) para formar T3/T4. Resultado: bloqueia síntese de hormônios tireoidianos (sem efeito no estoque já formado — daí latência ~2-4 sem). NÃO inibe conversão periférica T4→T3 (PTU sim).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metimazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 176. PROPILTIOURACIL (PTU)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'propiltiouracil',
  'Propiltiouracil (PTU)',
  ARRAY['Propiltiouracil'],
  'Tireostático',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"100 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"hipertireoidismo no 1º TRIMESTRE de gestação","dose":"100-150 mg 8/8h, ajustar por T4L","via":"VO","obs":"ÚNICA INDICAÇÃO PREFERENCIAL — evita aplasia cutis do metimazol. Trocar para metimazol no 2º trim (risco hepatite PTU)"},{"para":"crise tireotóxica","dose":"200-400 mg 4/4h","via":"VO ou via SNG","obs":"PREFERÍVEL ao metimazol em crise por bloquear CONVERSÃO PERIFÉRICA T4→T3 (efeito mais rápido)"},{"para":"intolerância/alergia a metimazol","dose":"100-200 mg 8/8h","via":"VO","obs":"ALTERNATIVA. Maior risco hepatotoxicidade — monitor"}]}$$::jsonb,
  'D','Categoria D — em 1º TRIM é PREFERÍVEL ao metimazol (sem aplasia cutis). 2º-3º trim: trocar para metimazol (risco hepatite PTU).','Compatível com cautela.',
  ARRAY['hipersensibilidade','hepatopatia ativa','agranulocitose prévia por tireostático'],
  $$[{"freq":"comum","evento":"rash cutâneo"},{"freq":"comum","evento":"náusea, dispepsia"},{"freq":"incomum","evento":"AGRANULOCITOSE (similar metimazol)"},{"freq":"raro (FDA Black Box)","evento":"HEPATOTOXICIDADE GRAVE / hepatite fulminante (PTU >> metimazol)"},{"freq":"raro","evento":"vasculite ANCA+ (mais comum que metimazol)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: HEPATITE FULMINANTE → indicação RESTRITA. USAR APENAS quando metimazol contraindicado (1º trim, crise tireotóxica, alergia)','EM CRISE TIREOTÓXICA: PTU é PREFERÍVEL (bloqueia conversão T4→T3 → efeito periférico mais rápido). Após estabilização: trocar para metimazol','MONITOR HEPÁTICO RIGOROSO: TGO/TGP basal + cada 2 sem inicialmente, depois mensal. SUSPENDER se TGO/TGP >3x normal','3X AO DIA — adesão pior que metimazol 1x/dia. Outra razão para preferir metimazol fora das indicações específicas','VASCULITE ANCA+: pode aparecer em uso prolongado — investigar se sintomas (artralgia, hemoptise, hematuria, púrpura)','EM AMAMENTAÇÃO: passa menos ao leite que metimazol em doses baixas'],
  ARRAY['TSH/T4L como metimazol','Hemograma','TGO/TGP a cada 2-4 sem','Sintomas (rash, febre, dor HCD, urina escura)','ANCA se sintomas vasculíticos'],
  'Tionamida — inibe TIREOPEROXIDASE (TPO) (= metimazol). EFEITO ADICIONAL: bloqueia a 5-DESIODINASE TIPO 1 perifericamente → reduz conversão T4 → T3 (mais ativo) → efeito clínico mais rápido em crise tireotóxica. Por isso preferível em crise. Maior afinidade hepática + metabólitos hepatotóxicos = mais risco hepatite fulminante.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=propiltiouracil',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 177. INSULINA GLARGINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'insulina-glargina',
  'Insulina glargina (basal — análogo longo)',
  ARRAY['Lantus','Toujeo (U300)','Basaglar'],
  'Insulina basal análoga (24h)',
  ARRAY['SC'],
  $$[{"forma":"caneta U100","concentracao":"100 UI/mL (Lantus, Basaglar)"},{"forma":"caneta U300","concentracao":"300 UI/mL (Toujeo)"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM1 — basal em esquema basal-bolus","dose":"INICIAR 0,2-0,4 U/kg/dia, ajustar pela glicemia jejum","via":"SC","frequencia":"1x/dia (mesmo horário)","obs":"PRIMEIRA ESCOLHA basal em DM1. Associar a insulina rápida pré-refeições"},{"para":"DM2 — adição em paciente com mau controle","dose":"INICIAR 10 U OU 0,1-0,2 U/kg ao deitar, ajustar 2 U cada 3 dias até glicemia jejum 80-130","via":"SC","frequencia":"1x/dia","obs":"em paciente com HbA1c >9% ou em uso de ≥2 orais sem controle"},{"para":"transição NPH → glargina","dose":"reduzir dose total NPH em 20% e dar como glargina","obs":"glargina tem menor risco de hipoglicemia noturna que NPH"}]}$$::jsonb,
  $${"indicacoes":[{"para":"DM1 peds","dose":"0,2-0,4 U/kg/dia"}]}$$::jsonb,
  'B (Lantus)','Categoria B. Pode ser usada em gestação — mas NPH e detemir têm mais experiência. Em DM gestacional/DM tipo 1: recomendação atual aceita glargina.','Compatível.',
  ARRAY['hipoglicemia ativa','hipersensibilidade'],
  $$[{"freq":"comum","evento":"HIPOGLICEMIA (menos noturna que NPH)"},{"freq":"comum","evento":"reação no local de aplicação (eritema, lipodistrofia)"},{"freq":"comum","evento":"ganho peso"},{"freq":"incomum","evento":"edema (retenção sódio)"}]$$::jsonb,
  ARRAY['HORÁRIO FIXO 1X/DIA — qualquer hora, mas SEMPRE o mesmo (manhã ou noite)','NÃO MISTURAR no mesmo seringa com insulina rápida (pH ácido glargina precipitaria)','GLARGINA U300 (Toujeo) tem menor risco hipoglicemia que U100, ação mais estável','RODAR LOCAIS DE APLICAÇÃO (abdome, coxa, glúteo, braço) — evitar lipodistrofia','HIPOGLICEMIA: glicose VO 15 g (3 balas/1 colher açúcar/200 mL suco) — orientar paciente. Sintomas: tremor, sudorese, fome, taquicardia, confusão','GLARGINA + SGLT2/GLP1 em DM2: combinação eficaz para reduzir hipoglicemia + perda peso','TRANSIÇÃO NPH 12/12h → GLARGINA 1x/dia: reduzir dose total em 20% (NPH tem pico, glargina não)'],
  ARRAY['Glicemia jejum (alvo 80-130 mg/dL)','HbA1c trimestral','Hipoglicemia (frequência, gravidade)','Local de aplicação (lipodistrofia)','Peso'],
  'Análogo de insulina humana com modificações: substituição Asn21A→Gly + adição 2 Arg na cadeia B → ponto isoelétrico próximo ao pH 7 → precipita em microcristais no tecido SC → liberação lenta e constante por 22-24h sem pico significativo. Mesma ação biológica da insulina endógena (receptor de insulina → GLUT-4 → captação glicose).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=insulina+glargina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 178. INSULINA LISPRO (rápida análoga)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'insulina-lispro',
  'Insulina lispro / asparte / glulisina (análogos rápidos)',
  ARRAY['Humalog (lispro)','NovoRapid (asparte)','Apidra (glulisina)'],
  'Insulina rápida análoga (bolus pré-prandial)',
  ARRAY['SC','IV'],
  $$[{"forma":"caneta","concentracao":"100 UI/mL"},{"forma":"frasco","concentracao":"100 UI/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"DM1 — bolus pré-refeição","dose":"contagem de carboidratos: ~1 U/10-15g CHO + correção (1U para cada 30-50 mg/dL acima alvo)","via":"SC ABDOME","frequencia":"3 refeições principais","obs":"INICIAR 5-15 MIN ANTES da refeição (vs insulina regular 30 min antes — vantagem)"},{"para":"DM2 com mau controle pós-prandial","dose":"adicionar bolus pré-refeição mais hiperglicêmica","obs":"basal-bolus em paciente que precisa intensificar"},{"para":"infusão IV em CAD/UTI","dose":"0,1 U/kg/h BIC","via":"IV BIC","obs":"alternativa à insulina regular em alguns protocolos UTI"},{"para":"bomba de infusão contínua subcutânea (BICS)","dose":"basal contínuo + bolus por refeição (programa)","obs":"em DM1 difícil controle"}]}$$::jsonb,
  $${"indicacoes":[{"para":"DM1 peds bolus pré-refeição","dose":"~1 U/10-15g CHO conforme contagem"}]}$$::jsonb,
  'B','Categoria B. Compatível em gestação (mais experiência com asparte/lispro do que com glulisina).','Compatível.',
  ARRAY['hipoglicemia ativa','hipersensibilidade'],
  $$[{"freq":"comum","evento":"HIPOGLICEMIA"},{"freq":"comum","evento":"reação no local"},{"freq":"comum","evento":"ganho peso"}]$$::jsonb,
  ARRAY['INÍCIO RÁPIDO (5-15 min) e PICO em 1-2h — aplicar 5-15 min ANTES da refeição (ou imediatamente após em peds que pode não comer todo)','VANTAGEM SOBRE REGULAR (que precisa 30 min antes): mais conveniente, melhor controle pós-prandial, menos hipoglicemia tardia','PODE MISTURAR com NPH na mesma seringa (lispro/asparte podem; glargina NÃO)','EM CAD: insulina regular IV é padrão (mais experiência); lispro/asparte IV têm dados crescentes','BOMBA DE INFUSÃO: análogos rápidos são preferíveis (regular não funciona bem)','TROCA REGULAR → ANÁLOGO: dose 1:1, mas timing muda (regular 30 min antes; análogo 5-15 min antes)'],
  ARRAY['Glicemia capilar pré e 1-2h pós-refeição','HbA1c','Hipoglicemias','Lipodistrofia'],
  'Análogo de insulina humana com inversão Lys-Pro (lispro) ou substituição Asp/Glu/Lys (asparte/glulisina) → impede formação de hexâmeros (que retardam absorção) → permanece como monômeros/dímeros → absorção SC RÁPIDA (15 min vs 30-60 min insulina regular). Mesma ação biológica. Pico 1-2h, duração 3-5h.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=insulina+lispro',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 179. CALCITRIOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'calcitriol',
  'Calcitriol (1,25-OH-D3)',
  ARRAY['Rocaltrol'],
  'Vitamina D ativa',
  ARRAY['VO','IV'],
  $$[{"forma":"cápsula","concentracao":"0,25/0,5 mcg"},{"forma":"ampola","concentracao":"1 mcg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"hipocalcemia em IRC dialítica","dose":"0,25-1 mcg/dia VO ou 1-2 mcg IV pós-HD 3x/sem","via":"VO ou IV","obs":"em DRC, conversão renal de 25-OH-D em 1,25-OH-D está prejudicada (perda 1α-hidroxilase) — repor a forma ativa"},{"para":"HIPERPARATIREOIDISMO SECUNDÁRIO em DRC","dose":"0,25-1 mcg/dia VO, ajustar PTH alvo","via":"VO","obs":"controla PTH (alvo 2-9x normal em diálise). Cuidado hipercalcemia"},{"para":"hipoparatireoidismo (cirúrgico, congênito)","dose":"0,25-1 mcg/dia + cálcio","via":"VO","obs":"reposição vitalícia"},{"para":"raquitismo / osteomalácia resistente","dose":"0,5-1 mcg/dia","via":"VO"}]}$$::jsonb,
  'C','Categoria C. Hipercalcemia materna pode prejudicar feto. Usar somente se necessário.','Excretada no leite — monitor RN.',
  ARRAY['hipercalcemia','intoxicação vit D','sarcoidose / granulomatose ativa'],
  $$[{"freq":"comum","evento":"hipercalcemia"},{"freq":"comum","evento":"hiperfosfatemia (em DRC)"},{"freq":"incomum","evento":"calcificação metastática"},{"freq":"raro","evento":"intoxicação vit D"}]$$::jsonb,
  ARRAY['DIFERENTE de COLECALCIFEROL: calcitriol é a FORMA ATIVA — uso apenas em paciente com defeito de ativação (DRC, hipoparatireoidismo). Em deficiência simples: usar colecalciferol 1000-2000 UI/dia','MONITOR RIGOROSO Ca + PO4 + PTH em DRC — risco calcificação vascular se hiperfosfatemia + hipercalcemia (calcifilaxia)','EM DRC: forma ativa via VO ≠ ativa renal — paciente dialítico precisa calcitriol/paricalcitol/calcifediol (não funciona com colecalciferol em alguns)','MEIA-VIDA CURTA (4-6h) — efeito rápido, ajuste de dose por exame frequente','CINACALCETE (calcimimético) é alternativa em hiperpara 2º refratário'],
  ARRAY['Cálcio sérico cada 1-2 sem inicialmente','PTH cada 1-3 meses','Fosfato','Função renal','25-OH-D + 1,25-OH-D em casos específicos'],
  'Forma ATIVA da vitamina D (1α,25-di-hidroxi-vitamina D3 = calcitriol). Liga RECEPTOR DE VITAMINA D (VDR) nuclear → modulação genômica → 1) AUMENTA absorção intestinal cálcio + fósforo (via TRPV6, calbindina), 2) reabsorção tubular cálcio, 3) mobilização óssea (estimula osteoclasto, depois osteoblasto), 4) feedback negativo na produção de PTH. Não precisa ativação renal.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=calcitriol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
