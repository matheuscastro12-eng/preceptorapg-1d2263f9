-- PreceptorBook: Bloco 5 — Hema (3) + Infecto especial (5) + Gineco/obstetrícia (4) = 12 drogas
-- Total após esta migration: 121 drogas

-- ============================================================
-- HEMATOLOGIA
-- ============================================================

-- 110. SULFATO FERROSO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'sulfato-ferroso',
  'Sulfato ferroso',
  ARRAY['Hemofer', 'Sulferbel'],
  'Repositor de ferro oral',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"40-65 mg ferro elementar (300-325 mg sulfato)"},{"forma":"gotas pediátricas","concentracao":"25 mg/mL ferro elementar"}]$$::jsonb,
  $${"indicacoes":[{"para":"anemia ferropriva — tratamento","dose":"100-200 mg ferro elementar/dia (1-2 cp 3x/dia OU 1 cp em dias alternados)","via":"VO (em jejum, com vit C/suco cítrico)","frequencia":"DIAS ALTERNADOS é tão eficaz quanto diário e melhor tolerado (estudo 2017)","duracao":"3 meses APÓS normalizar Hb (repor estoque)","obs":"resposta esperada: ↑Hb 1 g/dL em 2-4 sem"},{"para":"profilaxia gestação","dose":"40-60 mg ferro elementar/dia","duracao":"a partir 20ª sem até 3 meses pós-parto","obs":"OMS recomenda em gestante mesmo sem anemia (anemia gestacional Hb <11 g/dL)"},{"para":"profilaxia lactente baixo peso/prematuro","dose":"2-4 mg/kg/dia"}]}$$::jsonb,
  $${"indicacoes":[{"para":"anemia peds 6m-3a","dose":"3-6 mg/kg/dia ferro elementar"}]}$$::jsonb,
  'A', 'Categoria A. Indicado.', 'Compatível.',
  $$[{"com":"laticínios/cálcio","efeito":"reduz absorção ~50%","manejo":"espaçar 2h"},{"com":"chá/café/tanino","efeito":"reduz absorção","manejo":"espaçar 2h"},{"com":"IBP/anti-H2","efeito":"reduz absorção (precisa pH ácido)","manejo":"espaçar 2h"},{"com":"levotiroxina","efeito":"reduz absorção","manejo":"espaçar 4h"},{"com":"quinolonas/tetraciclinas","efeito":"quela formando complexos","manejo":"espaçar 4h"}]$$::jsonb,
  ARRAY['hemocromatose','sobrecarga ferro','transfusão recente repetida','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"DESCONFORTO GI (até 50%) — náusea, dispepsia, dor abdominal"},{"freq":"muito comum","evento":"CONSTIPAÇÃO ou diarreia"},{"freq":"muito comum","evento":"ESCURECIMENTO DE FEZES (não confundir com melena)"},{"freq":"comum","evento":"escurecimento de dentes (em crianças com solução)"},{"freq":"raro","evento":"INTOXICAÇÃO em criança que ingere acidentalmente — emergência (>20 mg/kg)"}]$$::jsonb,
  ARRAY['DOSAGEM EM FERRO ELEMENTAR — não sulfato. 1 cp 300 mg sulfato = ~60 mg ferro elementar','DIAS ALTERNADOS: estudo Stoffel 2017 mostrou que dose em dias alternados é IGUAL eficácia + melhor tolerância (hepcidina permite mais absorção a cada dose)','TOMAR EM JEJUM com vit C (suco cítrico) potencializa absorção','LACTANTE COM TROCAS GI: trocar para outra forma (ferro polimaltose, sacarato IV, carboximaltose)','REFRATÁRIO ao oral: investigar má absorção (celíaca, H. pylori), perda continuada, e considerar EV','EV em IRC, perda crônica refratária, gestação >34 sem com anemia grave: ferro sacarato 100-200 mg até 1g acumulado, ou carboximaltose 750-1000 mg dose única','INTOXICAÇÃO PEDS: vermelho cereja → palidez → IR → choque. Antídoto: deferoxamina'],
  ARRAY['Hemoglobina 4 sem após início (esperar ↑1 g/dL)','Ferritina e saturação após 3 meses','Reticulócitos 7-10d (resposta inicial)','Sintomas GI'],
  'Sal ferroso (Fe2+) — forma absorvida ativamente nos enterócitos do duodeno via DMT-1 (transportador divalente metálico). Absorção depende de pH ácido (precisa estômago) e regulação por HEPCIDINA hepática (proteína-mestre da homeostase do ferro). No enterócito, ferro é oxidado a Fe3+ e exportado pela ferroportina à circulação ligado à transferrina. Reposição corrige eritropoese deficiente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sulfato+ferroso',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 111. ÁCIDO FÓLICO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'acido-folico',
  'Ácido fólico (folato)',
  ARRAY['Endofolin', 'Folacin'],
  'Vitamina B9 — antianêmico',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"5 mg"},{"forma":"comprimido","concentracao":"0,4 mg (400 mcg)"}]$$::jsonb,
  $${"indicacoes":[{"para":"profilaxia defeito tubo neural — preconcepcional/gestação","dose":"400-800 mcg/dia (0,4-0,8 mg)","via":"VO","duracao":"INICIAR 1-3 meses ANTES da concepção até 12ª sem (mínimo)","obs":"em risco alto (DTN prévio, anti-epiléptico, MTX prévio): 4-5 mg/dia"},{"para":"anemia megaloblástica por deficiência de folato","dose":"5 mg/dia × 4 meses","via":"VO","obs":"INVESTIGAR e DESCARTAR deficiência de B12 antes (folato sozinho corrige hematológico mas mascara progressão neurológica de B12)"},{"para":"associado ao metotrexato (proteção)","dose":"5 mg 1x/SEMANA (24h após MTX)","via":"VO","obs":"reduz toxicidade GI/hematológica do MTX sem perder eficácia"},{"para":"síndrome alcoólica/desnutrição","dose":"1-5 mg/dia","obs":"comum em alcoólico crônico"}]}$$::jsonb,
  $${"indicacoes":[{"para":"deficiência peds","dose":"1-5 mg/dia"}]}$$::jsonb,
  'A', 'A — INDICADO. Reduz DTN em 70-80%. Política pública de fortificação de farinhas no Brasil (2002).', 'Compatível.',
  ARRAY['anemia perniciosa não corrigida (corrigir B12 ANTES — risco progressão neurológica)','tumor folato-dependente','hipersensibilidade'],
  $$[{"freq":"raro","evento":"reação alérgica"},{"freq":"raro","evento":"náusea, dispepsia"},{"freq":"raro (megadose)","evento":"perda apetite, distúrbio sono"}]$$::jsonb,
  ARRAY['SEMPRE descartar deficiência de B12 ANTES de iniciar folato em anemia megaloblástica — corrigir folato isolado mascara progressão neurológica de B12 (mielose funicular)','Em GESTAÇÃO: começar PRÉ-CONCEPCIONAL (1-3 meses antes) — DTN forma-se na 4ª sem, antes da gestante saber que está grávida','Anti-epiléptico (valproato, fenitoína, carbamazepina) → necessidade aumentada (5 mg/dia)','EM ALTO RISCO DTN (filho prévio com DTN, paciente com mielomeningocele, em uso de antiepiléptico): 4-5 mg/dia, NÃO 0,4 mg','Folato (5-MTHF) é a forma ativa — em paciente com polimorfismo MTHFR, pode ser mais eficaz'],
  ARRAY['Resposta hematológica (Hb, VCM, reticulócitos)','Sintomas neurológicos (descartar B12)','Em gestação: USG morfológico'],
  'Vitamina B9 — convertida em tetra-hidrofolato (THF) → cofator essencial para transferência de unidades 1-carbono em síntese de PURINAS, TIMIDILATO (DNA), e remetilação de homocisteína a metionina. Deficiência → anemia megaloblástica (eritropoese ineficaz por bloqueio na síntese de DNA), hiper-homocisteinemia, defeito de fechamento do tubo neural na gestação (4ª sem).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=acido+folico',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 112. CIANOCOBALAMINA (B12)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'cianocobalamina',
  'Cianocobalamina (vitamina B12)',
  ARRAY['Cobavital', 'Citoneurin (B1+B6+B12)'],
  'Vitamina B12 — antianêmico',
  ARRAY['IM', 'VO', 'SC'],
  $$[{"forma":"ampola IM","concentracao":"1000 mcg/mL"},{"forma":"comprimido","concentracao":"500/1000 mcg"}]$$::jsonb,
  $${"indicacoes":[{"para":"deficiência B12 (anemia perniciosa, gastrectomia, vegano estrito, idoso atrofia gástrica)","dose":"ATAQUE: 1000 mcg IM 1x/dia × 1 sem → 1000 mcg IM 1x/sem × 4 sem → 1000 mcg IM mensal indefinidamente","via":"IM","frequencia":"semanal → mensal","obs":"alternativa VO em altas doses (1000-2000 mcg/dia) também eficaz, exceto em má absorção grave"},{"para":"manutenção VO","dose":"1000-2000 mcg/dia","via":"VO","obs":"absorção passiva ~1% sem fator intrínseco — alta dose oral compensa deficiência de FI"},{"para":"neuropatia/mielopatia por deficiência B12","dose":"protocolo intensivo IM por 2-3 meses","obs":"reversibilidade depende da duração — pode demorar meses"}]}$$::jsonb,
  'A', 'Categoria A. Indicado.', 'Compatível.',
  ARRAY['hipersensibilidade ao cobalto','doença de Leber'],
  $$[{"freq":"comum","evento":"acne (especialmente em uso prolongado)"},{"freq":"comum","evento":"dor local pós-injeção"},{"freq":"incomum","evento":"hipocalemia transitória (correção rápida da anemia)"},{"freq":"raro","evento":"reação alérgica"}]$$::jsonb,
  ARRAY['DEFICIÊNCIA B12 É SUBDIAGNOSTICADA — pesquisar em: anemia megaloblástica, neuropatia inexplicada, demência reversível, idoso, vegano, pós-gastrectomia/bariátrica, uso crônico metformina/IBP','Sintomas NEUROLÓGICOS (parestesia, ataxia, demência, mielose funicular) podem ser IRREVERSÍVEIS se demorar a tratar','HOMOCISTEÍNA + ÁCIDO METILMALÔNICO ↑↑ confirmam deficiência tecidual mesmo com B12 sérico normal-baixo','SCHILLING TEST está obsoleto — pesquisar anti-fator intrínseco (perniciosa) ou anti-células parietais','HIPOCALEMIA pode ocorrer no início do tratamento (correção da eritropoese consome K)','Cianocobalamina vs hidroxicobalamina: hidroxi tem meia-vida mais longa, preferida em alguns países'],
  ARRAY['B12 sérica + ácido metilmalônico (confirmação tecidual)','Hb + reticulócitos (resposta hematológica)','Sintomas neurológicos','Potássio sérico no início','Anti-FI (anemia perniciosa)'],
  'Cobalamina = cofator essencial para 2 enzimas: 1) METIL-MALONIL-CoA mutase (catabolismo de propionato → succinato — falha causa acúmulo de ác metilmalônico, neuropatia/mielopatia); 2) METIONINA SINTASE (regenera metionina + THF a partir de homocisteína + 5-metil-THF — falha causa acúmulo de homocisteína e "armadilha de folato"). Deficiência → anemia megaloblástica + degeneração combinada subaguda da medula.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cianocobalamina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- INFECTO ESPECIAL
-- ============================================================

-- 113. OSELTAMIVIR
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'oseltamivir',
  'Oseltamivir',
  ARRAY['Tamiflu'],
  'Antiviral — inibidor da neuraminidase (anti-influenza)',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"30/45/75 mg"},{"forma":"suspensão oral","concentracao":"6 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"INFLUENZA — tratamento (sintomas <48h)","dose":"75 mg 12/12h","via":"VO","duracao":"5 dias","obs":"BENEFÍCIO MAIOR se iniciado <48h sintomas (reduz duração 0,5-1 dia, reduz complicações em alto risco). FAIXA prioritária: gestante, idoso, comorbidade, criança <2a"},{"para":"INFLUENZA — profilaxia pós-exposição","dose":"75 mg/dia × 7-10 dias","via":"VO","obs":"em alto risco com exposição. Não substitui vacina"},{"para":"INFLUENZA grave hospitalizada","dose":"75 mg 12/12h × 5-10 dias (até clínica)","obs":"considerar dose dupla 150 mg 12/12h em imunossuprimidos/grave (sem evidência forte)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥1 ano","dose":"≤15 kg: 30 mg 12/12h; 15-23 kg: 45 mg 12/12h; 23-40 kg: 60 mg 12/12h; >40 kg: 75 mg 12/12h × 5d"}]}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste"},{"clcr":"30-60","ajuste":"30 mg 12/12h"},{"clcr":"10-30","ajuste":"30 mg/dia"},{"clcr":"<10/diálise","ajuste":"30 mg pós-HD"}]$$::jsonb,
  'C', 'Sem evidência teratogenia. Indicado em gestante com influenza confirmada/suspeita (alto risco de complicação grave/morte por influenza na gestação).', 'Compatível.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, vômito (cede após 1-2 doses, melhora com alimento)"},{"freq":"comum","evento":"cefaleia"},{"freq":"incomum","evento":"diarreia, dor abdominal"},{"freq":"raro","evento":"ALTERAÇÕES NEUROPSIQUIÁTRICAS (delirium, automutilação, comportamento bizarro) — relatado em peds japoneses; FDA monitor"},{"freq":"raro","evento":"reação cutânea grave (SJS, eritema multiforme)"}]$$::jsonb,
  ARRAY['JANELA TERAPÊUTICA: <48h sintomas é o ideal — após 48h benefício pequeno em paciente de baixo risco. Em ALTO RISCO (gestante, idoso, comorbidade), tratar mesmo após 48h','GESTANTE com influenza tem morbimortalidade aumentada — TRATAR mesmo só com suspeita (não esperar PCR)','PROFILAXIA NÃO substitui VACINA — vacina é estratégia primária','Brasil: SUS distribui em clínicas de gripe durante surtos. Categoria suspeita SRAG/influenza','Resistência a oseltamivir é incomum (<5%) em sazonal H1N1/H3N2; H7N9 e B podem ter mais resistência','EM PEDS: alerta sobre eventos neuropsiquiátricos — orientar família observar comportamento'],
  ARRAY['Sintomas (febre, mialgia, tosse)','Função renal (idoso)','Comportamento (peds — eventos neuropsiq)'],
  'Pró-droga ativada por esterases hepáticas a oseltamivir-carboxilato → inibe seletivamente a NEURAMINIDASE viral do Influenza A e B → impede liberação dos vírions recém-formados da célula infectada (o vírus fica preso na célula) → reduz disseminação. Não impede infecção inicial; reduz duração e gravidade. Sem efeito em outros vírus respiratórios.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=oseltamivir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 114. ACICLOVIR
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'aciclovir',
  'Aciclovir',
  ARRAY['Zovirax'],
  'Antiviral — análogo de nucleosídeo (anti-HSV/VZV)',
  ARRAY['VO', 'IV', 'tópico'],
  $$[{"forma":"comprimido","concentracao":"200/400 mg"},{"forma":"frasco-ampola IV","concentracao":"250 mg"},{"forma":"creme tópico","concentracao":"50 mg/g"}]$$::jsonb,
  $${"indicacoes":[{"para":"HERPES SIMPLES genital — primeiro episódio","dose":"400 mg 8/8h × 7-10 dias","via":"VO","obs":"alternativa: valaciclovir 1 g 12/12h × 7-10d (melhor adesão)"},{"para":"HSV recorrente","dose":"400 mg 8/8h × 5 dias OU 800 mg 12/12h × 5 dias","via":"VO","obs":"iniciar nas primeiras 24h dos sintomas"},{"para":"supressão crônica HSV (≥6 episódios/ano)","dose":"400 mg 12/12h","via":"VO","duracao":"avaliar a cada 12 meses"},{"para":"HERPES ZOSTER","dose":"800 mg 5x/dia × 7-10 dias","via":"VO","obs":"INICIAR <72h. Em ≥50a OU paciente imunossuprimido. Reduz neuralgia pós-herpética. Valaciclovir 1 g 8/8h é alternativa melhor"},{"para":"HSV/VZV em IMUNOSSUPRIMIDO ou ENCEFALITE","dose":"10-15 mg/kg IV 8/8h × 14-21 dias","via":"IV","obs":"hidratação adequada (cristalúria). Encefalite por HSV: tratar IMEDIATAMENTE empírico se suspeita"},{"para":"varicela em gestante/imunossuprimido/adulto >12a","dose":"800 mg 5x/dia × 7d","via":"VO","obs":"INICIAR <24h do rash"}]}$$::jsonb,
  $${"indicacoes":[{"para":"varicela peds (apenas alto risco)","dose":"20 mg/kg/dose 6/6h, max 800 mg/dose × 5 dias"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"25-50","ajuste":"intervalo 12/12h"},{"clcr":"10-25","ajuste":"intervalo 24/24h"},{"clcr":"<10","ajuste":"reduzir dose 50% e 24/24h"}]$$::jsonb,
  'B', 'Categoria B. Sem evidência teratogenia. Pode usar em gestante.', 'Compatível.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, vômito"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum (IV)","evento":"flebite"},{"freq":"incomum","evento":"INSUFICIÊNCIA RENAL AGUDA (cristalúria) — especialmente em desidratação ou IV rápido"},{"freq":"incomum","evento":"NEUROTOXICIDADE (alucinação, tremor, mioclonia, convulsão) — em IRA ou idoso"},{"freq":"raro","evento":"trombocitopenia"}]$$::jsonb,
  ARRAY['HIDRATAÇÃO ADEQUADA antes/durante uso IV — risco cristalúria + IRA','EM IRA prévia: ajustar dose RIGOROSAMENTE — neurotoxicidade é dose-dependente. Sintomas: alucinação visual/auditiva, tremor, confusão','VALACICLOVIR (pró-droga, biodisponibilidade 55%) é alternativa para melhor adesão (12/12h em vez de 5x/dia)','HERPES ZOSTER em <50 anos sem sintomas oculares/neurológicos: tratar não é obrigatório se >72h e paciente saudável','PARTO COM HSV ATIVO: cesariana se lesões ativas → reduz transmissão neonatal','AMAMENTAÇÃO com lesão peri-mamilar: ordenhar e descartar até cura'],
  ARRAY['Função renal (basal e durante uso IV)','Hidratação','Sintomas neurológicos (idoso, IRA)','Resposta clínica (lesões cicatrizando 5-10d)'],
  'Análogo nucleosídico do GUANOSINA. Fosforilação inicial pela TIMIDINA QUINASE VIRAL (TK) — só presente em células infectadas, daí seletividade — depois por quinases celulares a aciclovir-trifosfato → INIBE COMPETITIVAMENTE a DNA polimerase viral E é incorporado na cadeia de DNA viral nascente, terminando-a. Eficácia: HSV-1 > HSV-2 > VZV >> EBV. Sem ação em CMV (citomegalovírus precisa ganciclovir).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=aciclovir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 115. FLUCONAZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'fluconazol',
  'Fluconazol',
  ARRAY['Zoltec', 'Diflucan'],
  'Antifúngico triazólico',
  ARRAY['VO', 'IV'],
  $$[{"forma":"cápsula","concentracao":"100/150 mg"},{"forma":"frasco-ampola","concentracao":"2 mg/mL (100/200 mg)"}]$$::jsonb,
  $${"indicacoes":[{"para":"candidíase vulvovaginal não-complicada","dose":"150 mg DOSE ÚNICA","via":"VO","obs":"alternativa tópica miconazol/clotrimazol 7d"},{"para":"candidíase vulvovaginal recorrente (≥4/ano)","dose":"150 mg D1, D4 e D7 → 150 mg/sem × 6 meses","via":"VO"},{"para":"candidíase orofaríngea/esofágica","dose":"100-200 mg/dia VO/IV × 7-14 dias","via":"VO ou IV"},{"para":"candidemia/candidíase invasiva","dose":"800 mg ATAQUE + 400 mg/dia","via":"IV","duracao":"≥14 dias após hemocultura negativa","obs":"em paciente estável sem azol prévio. Em UTI/instável: equinocandina (caspofungina/anidulafungina) é primeira"},{"para":"meningite criptocócica (manutenção pós-anfo+flucitosina)","dose":"400 mg/dia","duracao":"≥10 sem indução; manutenção 200 mg/dia × ≥1 ano (HIV)","obs":"em consolidação após anfotericina lipossomal"},{"para":"profilaxia em transplante de MO/imunossuprimidos","dose":"400 mg/dia"}]}$$::jsonb,
  $${"indicacoes":[{"para":"candidíase peds","dose":"6 mg/kg D1 → 3-6 mg/kg/dia"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"<50","ajuste":"reduzir 50%"},{"clcr":"diálise","ajuste":"dose plena após HD"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"considerar reduzir/evitar"}]$$::jsonb,
  'D', 'Em altas doses (≥400 mg/dia) no 1º trim: malformações múltiplas. EVITAR em 1º trim. Em vulvovaginite recorrente: dose única 150 mg foi associada a aumento aborto espontâneo — preferir tópico em gestante.', 'Compatível em curto prazo.',
  $$[{"com":"varfarina","efeito":"aumenta INR","manejo":"reduzir varfarina, monitor"},{"com":"sinvastatina/atorvastatina","efeito":"miopatia (CYP3A4)","manejo":"limitar dose estatina"},{"com":"sulfonilureia","efeito":"hipoglicemia","manejo":"monitor glicemia"},{"com":"prolongadores QT","efeito":"torsades","manejo":"evitar associação"}]$$::jsonb,
  ARRAY['hipersensibilidade','prolongamento QT congênito','uso concomitante de cisaprida/terfenadina/pimozida (retiradas) ou outros prolongadores QT'],
  $$[{"freq":"comum","evento":"náusea, dor abdominal"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"alteração paladar"},{"freq":"incomum","evento":"hepatotoxicidade (TGO/TGP elevados)"},{"freq":"incomum","evento":"PROLONGAMENTO QT (especialmente altas doses)"},{"freq":"raro","evento":"SJS/TEN"},{"freq":"raro","evento":"alopécia (uso prolongado >150 mg/dia)"}]$$::jsonb,
  ARRAY['INTERAÇÃO importante via inibição CYP3A4, CYP2C9, CYP2C19 — aumenta nível de muitas drogas (varfarina, sinvastatina, fenitoína, sulfonilureia)','HEPATOTOXICIDADE: monitor TGO/TGP. Suspender se >3x basal','PROLONGAMENTO QT: dose-dependente. Cuidado em paciente com hipocalemia/hipomagnesemia ou outros prolongadores','Em vulvovaginite RECORRENTE: identificar fatores predisponentes (DM, ATB recente, gestação, imunossupressão)','Resistência crescente em Candida non-albicans (C. krusei intrinsecamente resistente; C. glabrata reduzida) — preferir equinocandina em UTI/grave'],
  ARRAY['Função hepática (basal e a cada 2 sem em uso prolongado)','Função renal (ajuste)','ECG (QT) em alto risco','Resposta clínica + culturas'],
  'Triazol — inibe a 14-α-DEMETILASE FÚNGICA (CYP fúngico, dependente de heme) → bloqueia conversão de lanosterol em ergosterol (esterol fundamental da membrana fúngica) → ergosterol depletado + esteróis tóxicos acumulados → membrana fúngica desestabilizada. Fungistático para a maioria. Boa penetração SNC e LCR (vantagem em meningite). Eliminação renal.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=fluconazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 116. ISONIAZIDA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'isoniazida',
  'Isoniazida (INH)',
  ARRAY['Isoniazida', 'em RHZE: Coxcip-4'],
  'Antituberculose 1ª linha',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"100 mg"},{"forma":"em RHZE","concentracao":"75 mg + R 150 + Z 400 + E 275"}]$$::jsonb,
  $${"indicacoes":[{"para":"TB pulmonar — fase intensiva (em RHZE)","dose":"5 mg/kg/dia (max 300 mg) — habitualmente 150 mg em RHZE","via":"VO","frequencia":"1x/dia em jejum","duracao":"2 meses (fase intensiva)","obs":"esquema do PNCT/MS: 4 drogas 2m + 2 drogas (RH) 4m"},{"para":"TB latente (ILTB)","dose":"5 mg/kg/dia (max 300 mg)","via":"VO","duracao":"6-9 meses","obs":"alternativa: 3HP (rifapentina 900 mg + INH 900 mg 1x/sem × 12 doses) ou 4R (rifampicina 4 meses)"},{"para":"profilaxia primária PVHIV / PPD positivo / contato bacilífero","dose":"5 mg/kg/dia (max 300 mg) × 6-9 meses"}]}$$::jsonb,
  $${"indicacoes":[{"para":"peds TB","dose":"10 mg/kg/dia (max 300 mg)"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia ativa","ajuste":"contraindicado"}]$$::jsonb,
  'C', 'Considerada SEGURA em gestação. TB ativa não tratada é mais perigosa. Suplementar piridoxina 25-50 mg/dia (risco neuropatia gestante).', 'Compatível.',
  $$[{"com":"álcool","efeito":"hepatotoxicidade ↑↑","manejo":"abstinência durante tratamento"},{"com":"fenitoína/carbamazepina","efeito":"aumenta nível anticonvulsivante","manejo":"monitor nível"},{"com":"acetaminofeno","efeito":"hepatotoxicidade (induzido CYP)","manejo":"limitar paracetamol"}]$$::jsonb,
  ARRAY['hepatopatia ativa grave','hipersensibilidade','reação prévia grave a INH'],
  $$[{"freq":"comum","evento":"elevação enzimas hepáticas (assintomática) — 10-20%"},{"freq":"comum","evento":"NEUROPATIA PERIFÉRICA — prevenir com piridoxina 25-50 mg/dia"},{"freq":"incomum","evento":"HEPATITE clínica (1%) — risco aumentado >35a, etilismo, gestação, pós-parto"},{"freq":"incomum","evento":"reação cutânea, febre"},{"freq":"raro","evento":"síndrome lúpus-like, anemia hemolítica"},{"freq":"raro","evento":"convulsão (em overdose)"}]$$::jsonb,
  ARRAY['HEPATITE INDUZIDA: monitor TGO/TGP basal + sintomas. Suspender se TGO >5x basal sem sintomas, >3x com sintomas','PIRIDOXINA (vit B6) 25-50 mg/dia: PROFILAXIA NEUROPATIA — INDICADA em gestante, lactante, alcoólatra, desnutrido, DM, IRC, HIV','EM TB: NUNCA usar isolada (risco resistência) — sempre em esquema múltiplo (RHZE)','TB LATENTE: risco evolução TB ativa em PVHIV é 7-10%/ano sem tratamento; 0,5%/ano com INH','ETILISTA + INH = ALTÍSSIMO risco hepatotoxicidade — abstinência absoluta','OVERDOSE: convulsão refratária + acidose lática — antídoto piridoxina IV em altas doses (1 g por g de INH ingerido)'],
  ARRAY['TGO/TGP basal + mensal','Sintomas hepatite (anorexia, náusea, icterícia, dor HCD)','Sintomas neuropatia periférica','Adesão (DOT — dose observada)'],
  'Pró-droga ativada pela CATALASE-PEROXIDASE micobacteriana (KatG) → forma adutos com NADH → INIBE INHA (enoil-acil-carrier-protein redutase) → bloqueia síntese de ÁCIDO MICÓLICO (componente essencial parede celular do M. tuberculosis). Bactericida em micobactérias em divisão. Mutação em KatG = resistência à isoniazida. INH é também inibidor da MAO + atravessa BHE.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=isoniazida',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 117. RIFAMPICINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'rifampicina',
  'Rifampicina (RIF)',
  ARRAY['Rifaldin', 'em RHZE: Coxcip-4'],
  'Antituberculose / antibiótico — inibidor RNA polimerase',
  ARRAY['VO', 'IV'],
  $$[{"forma":"cápsula","concentracao":"300 mg"},{"forma":"em RHZE","concentracao":"R 150 + H 75 + Z 400 + E 275"}]$$::jsonb,
  $${"indicacoes":[{"para":"TB — esquema básico (em RHZE/RH)","dose":"10 mg/kg/dia (max 600 mg)","via":"VO","frequencia":"1x/dia EM JEJUM","duracao":"6 meses (2RHZE + 4RH)"},{"para":"hanseníase multibacilar","dose":"600 mg supervisionada mensal + dapsona 100 mg/dia","duracao":"12 meses (PB) ou 24 meses (MB)"},{"para":"TB latente — esquema 4R","dose":"10 mg/kg/dia (max 600 mg)","duracao":"4 meses","obs":"alternativa a INH 6-9 meses; esquema mais curto, melhor adesão"},{"para":"profilaxia meningite meningocócica (contatos)","dose":"600 mg 12/12h × 2 dias","via":"VO"},{"para":"endocardite estafilocócica (S. aureus prótese valvar)","dose":"300-450 mg 8/8h","obs":"sempre associada a vanco/oxa + gentamicina (escapa de monoterapia)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"peds TB","dose":"15 mg/kg/dia (max 600 mg)"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"contraindicado"}]$$::jsonb,
  'C', 'Categoria C. Sem evidência teratogenia significativa. Risco de hemorragia neonatal (vit K materna nos últimos meses)',
  'Compatível.',
  $$[{"com":"contraceptivos hormonais","efeito":"REDUZ EFICÁCIA (indução CYP3A4) — falha contraceptiva","manejo":"orientar método de barreira adicional"},{"com":"varfarina","efeito":"reduz INR (indução)","manejo":"aumentar dose varfarina"},{"com":"DOACs (apixabana, rivaroxabana)","efeito":"reduz nível","manejo":"contraindicado"},{"com":"corticoide","efeito":"reduz nível","manejo":"aumentar dose corticoide 50-100%"},{"com":"DAA hepatite C","efeito":"reduz eficácia","manejo":"contraindicado"},{"com":"ISRS, antipsicóticos","efeito":"reduz nível","manejo":"monitor"}]$$::jsonb,
  ARRAY['hepatopatia ativa grave','hipersensibilidade','uso de DOAC','uso de DAA hepC'],
  $$[{"freq":"muito comum","evento":"COLORAÇÃO LARANJA-AVERMELHADA da urina, suor, lágrima, saliva (BENIGNO — orientar paciente, mancha lentes de contato)"},{"freq":"comum","evento":"hepatite (mais que isoniazida em monoterapia)"},{"freq":"comum","evento":"dor abdominal, náusea"},{"freq":"comum","evento":"reação cutânea, prurido"},{"freq":"incomum","evento":"PLAQUETOPENIA imune"},{"freq":"incomum","evento":"síndrome flu-like (em uso intermitente — não no regime diário do PNCT)"},{"freq":"raro","evento":"insuficiência renal aguda (nefrite intersticial)"}]$$::jsonb,
  ARRAY['INDUTOR POTENTE de CYP3A4 + outros — REDUZ NÍVEL DE MUITAS DROGAS — verificar TODAS as medicações do paciente. Reduz: contraceptivo (FALHA), varfarina, corticoide, antifúngicos azólicos, DAA, DOAC, etc','CONTRACEPTIVO HORMONAL: orientar BARREIRA adicional — falha de pílula com rifampicina é frequente','URINA LARANJA: orientar paciente, manchamento de lentes de contato','HEPATOTOXICIDADE: monitor enzimas, suspender em sintomas','TROMBOCITOPENIA imune: hemorragia → suspender, não retomar','EM ESQUEMA RHZE do MS Brasil: dose por peso. <20kg, 20-35, 36-50, 51-70, >70 — comprimido único'],
  ARRAY['TGO/TGP basal + mensal','Hemograma (plaquetas, hemólise)','Função renal','Adesão (DOT)','Pesquisa baciloscopia mensal'],
  'Inibe RNA polimerase DNA-dependente bacteriana → bloqueia transcrição → bactericida. Liga subunidade β da RNApol. Mutação no rpoB = resistência (MDR-TB). Espectro amplo: M. tuberculosis, M. leprae, gram+ (S. aureus, especialmente em biofilmes/prótese), Neisseria, Haemophilus. Atravessa BHE bem (útil em meningite TB). Potente INDUTOR do CYP3A4/2B6/2C19/2C9 hepático → causa interação com inúmeras drogas.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=rifampicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- GINECO / OBSTETRÍCIA
-- ============================================================

-- 118. SULFATO DE MAGNÉSIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'sulfato-magnesio',
  'Sulfato de magnésio',
  ARRAY['Sulfato de magnésio'],
  'Anticonvulsivante (eclâmpsia) / broncodilatador / repositor',
  ARRAY['IV', 'IM'],
  $$[{"forma":"ampola 50%","concentracao":"5 g/10 mL"},{"forma":"ampola 10%","concentracao":"1 g/10 mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"ECLÂMPSIA / pré-eclâmpsia grave (profilaxia/tratamento de convulsão)","dose":"PROTOCOLO ZUSPAN: 4 g IV em 20 min (ATAQUE) + 1-2 g/h BIC × 24h pós-parto OU pós-última crise. ALTERNATIVO PRITCHARD: 4 g IV + 10 g IM (5g em cada glúteo) → 5 g IM 4/4h × 24h","via":"IV (Zuspan) ou IM (Pritchard)","duracao":"24h após resolução","obs":"PRIMEIRA ESCOLHA — superior a fenitoína/diazepam (Magpie trial)"},{"para":"asma exacerbação grave (refratária)","dose":"2 g IV em 20 min (peds 25-50 mg/kg, max 2 g)","via":"IV","obs":"se PFE <40% predito após 1h tratamento + SatO2 <92%. Dose única"},{"para":"torsades de pointes","dose":"2 g IV em 1-2 min","via":"IV","obs":"primeira escolha mesmo com Mg normal"},{"para":"hipomagnesemia sintomática","dose":"2-4 g IV em 1-2h","via":"IV","obs":"correção lenta, monitor reflexos"},{"para":"NEUROPROTEÇÃO FETAL (parto pré-termo <32 sem)","dose":"4 g IV ataque + 1 g/h × ≤24h","obs":"reduz paralisia cerebral. INICIAR 4-6h ANTES parto"}]}$$::jsonb,
  $${"indicacoes":[{"para":"asma peds","dose":"25-50 mg/kg IV em 20 min, max 2 g"}]}$$::jsonb,
  $$[{"clcr":"<30","ajuste":"reduzir 50%, monitor mais frequente"}]$$::jsonb,
  'A', 'A — INDICADO em eclâmpsia. Atravessa placenta — neonato pode ter hipotonia/depressão respiratória se dose alta materna no parto.', 'Compatível.',
  ARRAY['miastenia gravis','BAV','IRA grave (relativa)'],
  $$[{"freq":"comum","evento":"rubor facial, sensação de calor (durante ataque)"},{"freq":"comum","evento":"náusea, vômito"},{"freq":"comum","evento":"sonolência, fraqueza muscular"},{"freq":"incomum","evento":"hiporreflexia (sinal de toxicidade)"},{"freq":"raro","evento":"DEPRESSÃO RESPIRATÓRIA, parada respiratória (toxicidade)"},{"freq":"raro","evento":"BAV, parada cardíaca"}]$$::jsonb,
  ARRAY['MONITORAR a cada 1h durante uso: 1) REFLEXO PATELAR (se ABOLIDO = toxicidade), 2) FR ≥12-16/min, 3) DIURESE ≥30 mL/h (excreção renal). Se qualquer alterado: SUSPENDER e reavaliar','ANTÍDOTO: GLUCONATO DE CÁLCIO 1 g IV (10 mL a 10%) em 3 min — sempre disponível à beira do leito','NÍVEL TERAPÊUTICO 4-7 mEq/L (4,8-8,4 mg/dL); >10 mEq/L = perda reflexos; >15 = depressão respiratória; >25 = parada cardíaca','PRITCHARD ALTERNATIVO em caso de inviabilidade IV (10 g IM + 5 g IM 4/4h) — útil em ambiente sem BIC','EM PARTO COM Mg ALTO: neonato pode ter HIPOTONIA + DEPRESSÃO RESPIRATÓRIA — atenção neonatologia'],
  ARRAY['Reflexo patelar (cada 1h)','FR (cada 1h, sentinela <12)','Diurese (≥30 mL/h)','Magnesemia em casos atípicos','PA + FC fetal'],
  'Cofator de muitas reações enzimáticas. Em altas doses parenterais: 1) BLOQUEIA receptores NMDA glutamatérgicos no SNC (anticonvulsivante seletivo do córtex, sem sedar — vantagem em eclâmpsia). 2) BLOQUEIA canais Ca++ voltagem-dependentes → vasodilatação, broncodilatação. 3) ANTAGONISMO COMPETITIVO de Ca++ na placa motora → relaxamento muscular (daí toxicidade neuromuscular).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=sulfato+de+magnesio',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 119. MISOPROSTOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'misoprostol',
  'Misoprostol',
  ARRAY['Cytotec', 'Prostokos'],
  'Análogo de prostaglandina E1',
  ARRAY['VO', 'sublingual', 'vaginal', 'retal'],
  $$[{"forma":"comprimido vaginal","concentracao":"25 mcg (Prostokos — uso obstétrico)"},{"forma":"comprimido","concentracao":"200 mcg"}]$$::jsonb,
  $${"indicacoes":[{"para":"hemorragia pós-parto (atonia uterina) — ROTA","dose":"800 mcg sublingual ou retal","via":"sublingual ou retal","obs":"PRIMEIRA ESCOLHA é OCITOCINA 10 UI IM/IV. Misoprostol é alternativa ou adjuvante quando oxitocina indisponível"},{"para":"indução do parto a termo","dose":"25 mcg vaginal a cada 4-6h, max 6 doses/24h","via":"vaginal","obs":"em colo desfavorável (Bishop <6). Cuidado risco taquissistolia + ruptura uterina (especialmente cesárea prévia)"},{"para":"abortamento legal/incompleto/retido (ate 12 sem)","dose":"800 mcg vaginal ou sublingual, repetir 3-12h até 3 doses","via":"vaginal/sublingual","obs":"OMS protocolo. ASSOCIAR a mifepristona 200 mg VO 24-48h antes (mais eficaz)"},{"para":"abortamento 12-22 sem","dose":"400 mcg 3/3h","obs":"protocolo OMS"},{"para":"prevenção úlcera por AINE","dose":"100-200 mcg 8/8h","via":"VO","obs":"alternativa a IBP (caro e diarreia frequente — pouco usado)"},{"para":"colo desfavorável pré-procedimento (DIU, AMIU, histeroscopia)","dose":"400 mcg vaginal 3-12h antes","obs":"facilita procedimento"}]}$$::jsonb,
  'X', 'X — em GESTAÇÃO desejada (não-abortiva): contraindicado (abortivo, malformações se falha). Em INDUÇÃO/aborto legal: indicação específica, com supervisão.', 'Excretado em pequena quantidade.',
  ARRAY['gestação NÃO-DESEJADA-abortar (uso fora indicação)','suspeita ruptura uterina','cesárea prévia (em indução parto — relativa, doses baixas em ambiente hospitalar)','hipersensibilidade a prostaglandinas','desproporção feto-pélvica'],
  $$[{"freq":"muito comum","evento":"cólica abdominal, sangramento (esperado em uso obstétrico)"},{"freq":"comum","evento":"diarreia, náusea, vômito"},{"freq":"comum","evento":"febre, calafrios"},{"freq":"comum (em indução)","evento":"taquissistolia uterina (>5 contrações/10 min)"},{"freq":"raro","evento":"RUPTURA UTERINA (cesárea prévia, miomectomia)"},{"freq":"raro","evento":"embolia amniótica"}]$$::jsonb,
  ARRAY['NO BRASIL: USO RESTRITO HOSPITALAR (Anvisa) — controle especial. Apresentação Prostokos 25 mcg = exclusiva uso obstétrico hospitalar','RUPTURA UTERINA: alto risco em cesárea prévia + indução com misoprostol — preferir oxitocina em pós-cesárea. Doses BAIXAS (25 mcg) reduzem mas não eliminam risco','TAQUISSISTOLIA: monitor cardiotocografia + uterino. Suspender se >5 contrações/10 min ou desacelerações','HEMORRAGIA PÓS-PARTO: oxitocina é primeira escolha. Misoprostol é coadjuvante','EM INDUÇÃO: NÃO aplicar se BCF não-tranquilizador, polidrâmnio, gestação múltipla — relativa contraindicação'],
  ARRAY['Cardiotocografia em indução','BCF, dinâmica uterina','Sangramento','Sinais ruptura uterina'],
  'Análogo sintético da prostaglandina E1 (PGE1) → liga receptores EP2/EP3 na musculatura uterina → contração uterina + amolecimento e dilatação do colo. Também inibe secreção ácida gástrica e protege mucosa (uso original — úlcera por AINE). Eficaz por todas as vias (VO, SL, vaginal, retal) — vaginal/sublingual têm maior biodisponibilidade obstétrica.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=misoprostol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 120. LEVONORGESTREL (anticoncepção emergência)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'levonorgestrel-emergencia',
  'Levonorgestrel (anticoncepção de emergência)',
  ARRAY['Pilem', 'Postinor', 'Norlevo'],
  'Progestagênio — anticoncepção pós-coito',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"0,75 mg (2 cp) ou 1,5 mg (1 cp dose única)"}]$$::jsonb,
  $${"indicacoes":[{"para":"anticoncepção de emergência (pós-coito desprotegido)","dose":"1,5 mg dose única (1 cp 1,5 mg OU 2 cp 0,75 mg juntos)","via":"VO","frequencia":"DOSE ÚNICA","duracao":"até 72h pós-coito (eficácia decrescente até 120h)","obs":"eficácia: 95% se <24h; 85% 25-48h; 58% 49-72h. Alternativa: ulipristal 30 mg até 120h (melhor eficácia tardia). DIU CU é o mais eficaz (até 120h)"},{"para":"anticoncepção contínua (raro — minipílula)","dose":"35 mcg/dia (Cerazette outras formulações)","obs":"para lactante / contraindicação a estrogênio"}]}$$::jsonb,
  'X em gestação confirmada (mas se gestação já estabelecida, sem efeito teratogênico — não age após implantação)', 'Não é abortivo após implantação. Sem efeito em gestação já implantada.', 'Compatível.',
  ARRAY['gestação confirmada (sem efeito, mas contraindicada formalmente)','sangramento vaginal sem causa definida','hipersensibilidade'],
  $$[{"freq":"comum","evento":"sangramento de privação (irregular)"},{"freq":"comum","evento":"náusea, vômito (se vômito <2h da dose, repetir)"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"dor mamária"},{"freq":"incomum","evento":"atraso menstrual"},{"freq":"raro","evento":"falha (≈2-3% — gestação subsequente)"}]$$::jsonb,
  ARRAY['ANTICONCEPÇÃO DE EMERGÊNCIA NÃO É ABORTIVA — age inibindo/atrasando ovulação. Sem efeito após implantação','EFICÁCIA CAI COM TEMPO — orientar buscar nas primeiras 24h. Após 72h: ulipristal (até 120h) ou DIU Cu','SE VÔMITO <2h da dose: REPETIR a dose','MENSTRUAÇÃO: pode atrasar 7 dias (esperado); se >7d atraso → fazer beta-HCG','NÃO substitui anticoncepção regular — orientar contracepção contínua + preservativo (DST)','MÉTODOS MAIS EFICAZES PÓS-COITO: 1) DIU de cobre (eficácia 99%, até 120h), 2) Ulipristal 30 mg (até 120h, melhor que LNG após 72h), 3) Levonorgestrel (até 72h)','LACTANTE: pode usar — interrupção breve (8h pós-dose) é orientação conservadora'],
  ARRAY['Beta-HCG se atraso >7d ou sintomas gestacionais','Sangramento (esperado irregular)','Orientação anticoncepção contínua'],
  'Progestagênio sintético em alta dose. Mecanismo principal: ATRASA OU INIBE A OVULAÇÃO (via supressão do pico de LH) se administrado ANTES da ovulação. Efeitos adicionais propostos (não consensuais): muco cervical hostil, alteração endometrial, alteração tubária. NÃO age após fertilização/implantação (não é abortivo). Eficácia depende do tempo desde coito (mais alta <24h).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=levonorgestrel',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 121. TENOFOVIR
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'tenofovir',
  'Tenofovir (TDF / TAF)',
  ARRAY['Viread (TDF)', 'Vemlidy (TAF)', 'em Truvada/Descovy combinada com FTC'],
  'Antirretroviral / antihepatite B — INRT (inibidor da transcriptase reversa, análogo nucleotídeo)',
  ARRAY['VO'],
  $$[{"forma":"comprimido TDF","concentracao":"245-300 mg"},{"forma":"comprimido TAF","concentracao":"25 mg"},{"forma":"Truvada (TDF+FTC)","concentracao":"300+200 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"HIV — TARV (em esquema TDF+3TC+DTG)","dose":"TDF 300 mg/dia (em comprimido único TDF+3TC+DTG dose única noite)","via":"VO","frequencia":"1x/dia","obs":"BASE do TARV no SUS — Diretriz MS 2024. TAF é alternativa em DRC/osso"},{"para":"HEPATITE B crônica","dose":"TDF 300 mg/dia OU TAF 25 mg/dia","via":"VO","duracao":"contínuo","obs":"TAF preferido em DRC/osteopenia"},{"para":"PrEP (profilaxia pré-exposição HIV)","dose":"TDF+FTC 300+200 mg/dia (Truvada)","via":"VO","obs":"protocolo SUS — distribuição gratuita. Esquema diário OU sob demanda 2-1-1 (HSH)"},{"para":"PEP (profilaxia pós-exposição) HIV","dose":"TDF+3TC 300+300 mg + DTG 50 mg, todos 1x/dia","duracao":"28 dias","obs":"INICIAR <72h da exposição. Avaliar fonte. Sorologia HIV, HBV, HCV basal + 4 sem + 12 sem"},{"para":"profilaxia transmissão vertical HBV (gestante HBeAg+ ou DNA HBV alto)","dose":"TDF 300 mg/dia 28 sem até 4-12 sem pós-parto","obs":"associar imunoglobulina + vacina HBV no neonato"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"30-50","ajuste":"TDF 300 mg cada 48h ou trocar para TAF"},{"clcr":"<30","ajuste":"TDF contraindicado; TAF tem ajuste"}]$$::jsonb,
  'B', 'Categoria B. SEGURO em gestação. Indicado em HIV+gestação e em HBV gestante alto risco transmissão.', 'Compatível em mulher HIV+ se TARV continuada (mesmo se em uso). Em HIV: amamentação tem risco — orientar fórmula no Brasil (UNAIDS).',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, diarreia (cede)"},{"freq":"comum","evento":"cefaleia"},{"freq":"incomum (TDF)","evento":"NEFROTOXICIDADE (síndrome de Fanconi, NTA, redução eGFR)"},{"freq":"incomum (TDF)","evento":"OSTEOPENIA / OSTEOPOROSE (uso prolongado)"},{"freq":"incomum","evento":"acidose lática (raro mas grave)"},{"freq":"raro","evento":"hepatomegalia + esteatose"},{"freq":"raro (TDF)","evento":"síndrome de Fanconi (proteinúria, glicosúria, hipofosfatemia)"}]$$::jsonb,
  ARRAY['TDF vs TAF: TAF (tenofovir alafenamida) tem MENOR toxicidade renal/óssea — preferir em DRC, idoso, osteoporose. SUS predominantemente usa TDF (custo)','REATIVAÇÃO HBV ao suspender: paciente HBV+ NÃO PODE PARAR TDF abruptamente — risco hepatite fulminante','PrEP: orientação importante — adesão diária é crítica. Sob demanda 2-1-1 só em HSH com sexo programado','PEP: <72h da exposição — quanto antes, melhor. Idealmente 1-2h','HIV+GESTAÇÃO: TDF é seguro e indicado. Carga viral indetectável reduz transmissão vertical de 25% para <1%','SOROLOGIA basal HIV/HBV/HCV antes PrEP (PrEP em paciente com HIV não diagnosticado pode selecionar resistência)'],
  ARRAY['Função renal (creatinina, eGFR, urina I com proteinúria/glicosúria) basal + trimestral','Carga viral HIV (em TARV)','HBeAg, HBV-DNA (em hep B)','DEXA em uso prolongado / osteoporose','Sorologia HIV trimestral em PrEP'],
  'INRT (inibidor da transcriptase reversa, análogo nucleotídeo de adenosina). Após fosforilação intracelular a tenofovir-difosfato → inibe COMPETITIVAMENTE a transcriptase reversa do HIV-1/HIV-2 e a polimerase do HBV → bloqueia replicação viral por TERMINAÇÃO DE CADEIA (não tem 3-OH para alongamento). TAF é pró-droga com ativação intracelular preferencial → menor concentração plasmática → menos toxicidade renal/óssea com mesma eficácia.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=tenofovir',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
