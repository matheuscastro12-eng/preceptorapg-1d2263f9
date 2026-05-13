-- PreceptorBook: Prescrições crônicas (5 doenças)
-- HAS, DM2, dislipidemia, FA-controle, profilaxia TVP hospitalar

-- 1. HAS — manejo crônico
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'has-manejo-cronico',
  'Hipertensão arterial — manejo crônico',
  'Hipertensão arterial',
  'Adulto com HAS estágio 1-2 confirmada (PA ≥ 140/90 em ≥ 2 medidas)',
  'Ambulatorial',
  'Meta PA <130/80 (alto risco) ou <140/90 (baixo risco). Início simultâneo de 2 drogas se PAS ≥160 ou PAS ≥20/PAD ≥10 acima da meta. IECA/BRA + tiazídico ou BCC são primeira linha.',
  $$[
    {"droga":"Losartana","dose":"50 mg","via":"VO","frequencia":"1x/dia (manhã)","duracao":"contínuo","obs":"titular até 100 mg/dia. Alternativa: enalapril 10-40 mg 12/12h. IECA/BRA é 1ª linha em <60a, DM, doença renal, IC","drug_slug":"losartana"},
    {"droga":"Hidroclorotiazida","dose":"12,5-25 mg","via":"VO","frequencia":"1x/dia (manhã)","duracao":"contínuo","obs":"associar à losartana se PA não controlada com monoterapia. Alternativa: indapamida 1,5 mg","drug_slug":"hidroclorotiazida"},
    {"droga":"Anlodipino","dose":"5-10 mg","via":"VO","frequencia":"1x/dia","obs":"3ª droga ou alternativa ao tiazídico (negros, idosos respondem bem). Edema MMII em 10-20%","drug_slug":"anlodipino"},
    {"droga":"Espironolactona (resistente)","dose":"25-50 mg","via":"VO","frequencia":"1x/dia","obs":"4ª droga em HAS resistente. Cuidado: hipercalemia (monitor K+). Tem benefício mortalidade em IC","drug_slug":"espironolactona"},
    {"droga":"Carvedilol/metoprolol (BB)","dose":"carvedilol 6,25-25 mg 12/12h ou metoprolol 25-100 mg 12/12h","via":"VO","obs":"BB NÃO é 1ª linha em HAS isolada. Indicar se: IC, pós-IAM, FA, angina, jovem com taquicardia","drug_slug":"metoprolol"}
  ]$$::jsonb,
  ARRAY[
    'MEV ANTES de droga em estágio 1 baixo risco: dieta DASH, redução sódio (<2g/dia), exercício 150 min/sem, perda de peso (5-10%), redução álcool, cessar tabaco',
    'MAPA/MRPA confirmam diagnóstico e descartam HAS do avental branco (~20%) e mascarada',
    'Investigar HAS secundária se: <30 ou >55 anos, refratária, hipocalemia espontânea, sopro abdominal, paroxismos sintomáticos',
    'Reavaliar a cada 4-6 semanas até meta atingida; depois 3-6 meses'
  ],
  ARRAY['EAS + microalbuminúria','Função renal + eletrólitos','Glicemia jejum + HbA1c','Perfil lipídico','TSH','ECG','Eco TT (se HVE suspeita)','Fundoscopia em casos selecionados'],
  ARRAY['Hipotensão postural em idosos — começar com metade da dose','IECA/BRA: tosse seca em 10-15% (IECA) — trocar por BRA. Não associar IECA + BRA (ON-TARGET — sem benefício, mais eventos adversos)','Espironolactona em homens: ginecomastia em 5-10%; alternativa: eplerenona','Tiazídico: hipocalemia, hiperuricemia, hiperglicemia leve — monitor'],
  'Diretriz Brasileira de HAS SBC 2020',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-116-03-0516/0066-782X-abc-116-03-0516.pdf',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. DM2 — manejo inicial
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'dm2-manejo-cronico',
  'Diabetes mellitus tipo 2 — manejo crônico',
  'Diabetes mellitus',
  'Adulto com DM2 (HbA1c ≥ 6,5% confirmada)',
  'Ambulatorial',
  'Metformina é primeira linha. Se HbA1c >1,5% acima da meta ou DCV/DRC/IC: já iniciar 2ª droga (preferir SGLT2/GLP1).',
  $$[
    {"droga":"Metformina","dose":"INICIAR 500 mg, titular 500 mg/semana até 1 g 12/12h ou 850 mg 12/12h","via":"VO (com refeição)","frequencia":"12/12h","duracao":"contínuo","obs":"PRIMEIRA LINHA. Suspender se ClCr <30. Reduzir 50% se ClCr 30-45. Suspender 48h pré-contraste IV","drug_slug":"metformina"},
    {"droga":"Empagliflozina (iSGLT2)","dose":"10-25 mg","via":"VO","frequencia":"1x/dia (manhã)","obs":"PRIMEIRA ESCOLHA se DM2 + DCV estabelecida ou IC ou DRC (eGFR ≥20). Reduz mortalidade CV, internação por IC, progressão DRC. Alternativa: dapagliflozina 10 mg"},
    {"droga":"Semaglutida (aGLP1)","dose":"0,25 mg/sem × 4 sem → 0,5 mg/sem × 4 sem → 1 mg/sem","via":"SC","frequencia":"1x/sem","obs":"PRIMEIRA ESCOLHA se DM2 + DCV ou obesidade (perda peso 5-15%). Náusea inicial. Alternativa: liraglutida 0,6→1,2→1,8 mg/dia"},
    {"droga":"Sitagliptina (iDPP4)","dose":"100 mg","via":"VO","frequencia":"1x/dia","obs":"alternativa neutra em peso/hipoglicemia. SEM benefício CV (diferente de SGLT2/GLP1). Reduzir se IRA"},
    {"droga":"Glimepirida (sulfonilureia)","dose":"1-4 mg","via":"VO","frequencia":"1x/dia (manhã)","obs":"baixo custo mas RISCO hipoglicemia (especialmente idoso) e ganho de peso. Linha tardia"},
    {"droga":"Insulina basal (NPH ou glargina)","dose":"INICIAR 0,1-0,2 U/kg ao deitar","via":"SC","frequencia":"1x/dia (NPH 12/12h se necessário)","obs":"se HbA1c >9% ou sintomas hiperglicemia ou em uso de >2 orais não controlado. Glargina tem menos hipoglicemia noturna","drug_slug":"insulina-nph"}
  ]$$::jsonb,
  ARRAY[
    'Meta HbA1c <7% (geral); <6,5% se jovem/sem comorbidade; <8% se idoso frágil/expectativa limitada',
    'MEV: dieta com redução de carboidrato simples, perda de peso 5-10%, exercício 150 min/sem',
    'AUTOMONITORIZAÇÃO: usuários de insulina antes de cada refeição + ao deitar; não-usuários: jejum 1-2x/sem',
    'Rastreio complicações: oftalmologista anual, microalbuminúria anual, exame de pés cada consulta'
  ],
  ARRAY['HbA1c a cada 3-6 meses','Glicemia jejum','Microalbuminúria + creatinina (DRC)','Perfil lipídico','TSH (associação tireoidite em DM1)','Fundoscopia anual','Exame de pés (sensibilidade vibratória, monofilamento)'],
  ARRAY['SGLT2: cetoacidose euglicêmica em jejum prolongado/cirurgia (suspender 3 dias antes); ITU/genital 5-10%','GLP1: pancreatite, contraindicado em CA medular tireoide ou MEN2','Metformina: acidose lática rara mas grave em IRA — suspender se ClCr <30','Hipoglicemia: orientar sintomas + tratamento (15g carbo simples)','METAS PA + estatina + AAS (se DCV) tão importantes quanto controle glicêmico'],
  'SBD 2024 / ADA Standards 2024',
  'https://diabetes.org.br/diretrizes',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. Dislipidemia — prevenção CV
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'dislipidemia-prevencao',
  'Dislipidemia — prevenção CV primária e secundária',
  'Dislipidemia',
  'Adulto com risco CV ≥ 7,5% em 10 anos (calculadora CVD-Brasil/SBC) ou DCV estabelecida',
  'Ambulatorial',
  'Estatina é base. Intensidade e meta LDL guiadas por risco CV. Adicionar ezetimiba ou iPCSK9 se meta não atingida.',
  $$[
    {"droga":"Atorvastatina alta intensidade","dose":"40-80 mg","via":"VO","frequencia":"1x/dia (noite)","obs":"PRIMEIRA ESCOLHA em alto risco / DCV. Reduz LDL ~50%. Meta LDL: <50 mg/dL (muito alto risco), <70 (alto), <100 (intermediário), <130 (baixo)","drug_slug":"atorvastatina"},
    {"droga":"Sinvastatina (intensidade moderada)","dose":"20-40 mg","via":"VO","frequencia":"1x/dia (noite)","obs":"alternativa em risco baixo-moderado. NÃO ultrapassar 40 mg (maior risco miopatia). Reduz LDL 30-40%","drug_slug":"sinvastatina"},
    {"droga":"Ezetimiba","dose":"10 mg","via":"VO","frequencia":"1x/dia","obs":"adicionar se meta não atingida com estatina máxima (IMPROVE-IT). Reduz LDL 15-20% adicional"},
    {"droga":"Evolocumab/alirocumab (iPCSK9)","dose":"140 mg SC 14/14d ou 420 mg/mês","via":"SC","obs":"se DCV alto risco e meta não atingida apesar de estatina+ezetimiba. CARO (~R$1500/mês). Reduz LDL ~60% adicional"},
    {"droga":"Fenofibrato (hipertrigliceridemia)","dose":"160-200 mg","via":"VO","frequencia":"1x/dia","obs":"se TG >500 mg/dL (risco pancreatite) APÓS otimizar estilo de vida. Em DM com TG alto + HDL baixo: pode beneficiar (FIELD)"},
    {"droga":"Ômega-3 EPA (icosapent etil)","dose":"2 g 12/12h","via":"VO","obs":"em alto risco com TG 135-499 + DCV ou DM (REDUCE-IT) — reduz desfechos CV. Não confundir com mistura de ômega-3 OTC"}
  ]$$::jsonb,
  ARRAY[
    'CALCULAR risco CV em 10 anos (SBC/CVD-Brasil ou ASCVD) ANTES de prescrever',
    'Estratificação muito alto risco: DCV estabelecida, DM com lesão orgão-alvo, DRC com eGFR<30, hipercolesterolemia familiar',
    'Reavaliar em 4-12 semanas após início (LDL + TGO/TGP + CK se sintomas musculares)',
    'MEV: dieta mediterrânea/DASH, perda de peso 5-10%, exercício, parar de fumar — antes/junto à estatina'
  ],
  ARRAY['Perfil lipídico jejum (basal e 4-12 sem após início)','TGO/TGP basal','CK se sintomas musculares (NÃO rotineiro)','Glicemia (estatina aumenta risco DM ~10%)','TSH (descartar hipotireoidismo como causa)','Lipoproteína(a) — uma vez na vida'],
  ARRAY['MIOPATIA: dor muscular + CK >10x = rabdomiólise (raro mas grave). Suspender, rever interações','HEPATOTOXICIDADE: TGO/TGP >3x → suspender ou reduzir','Interações: sinvastatina + amiodarona/verapamil/diltiazem aumenta risco miopatia (limitar a 20 mg)','GESTAÇÃO: estatina CONTRAINDICADA — orientar contracepção','Não usar suco de toranja (grapefruit) com sinvastatina/atorvastatina'],
  'Diretriz Brasileira Dislipidemia SBC 2017 / ESC 2019',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-109-2-supl-1-0001/0066-782X-abc-109-2-supl-1-0001.pdf',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. FA — controle de FC e anticoagulação
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'fa-controle-anticoagulacao',
  'Fibrilação atrial — controle de FC e anticoagulação',
  'Fibrilação atrial',
  'FA paroxística/persistente/permanente (não-valvar)',
  'Ambulatorial',
  'CHA2DS2-VASc ≥2 (♂) ou ≥3 (♀) → anticoagular. Controle de FC com BB/BCC em maioria; controle de ritmo em sintomáticos.',
  $$[
    {"droga":"Apixabana (DOAC) — anticoagulação","dose":"5 mg 12/12h (2,5 mg 12/12h se ≥2: idade ≥80, peso ≤60 kg, Cr ≥1,5)","via":"VO","obs":"PRIMEIRA ESCOLHA em FA não-valvar. Menor sangramento que varfarina","drug_slug":"apixabana"},
    {"droga":"Rivaroxabana (alternativa DOAC)","dose":"20 mg/dia (15 mg se ClCr 30-50)","via":"VO (com refeição)","obs":"alternativa. Tomar com refeição (absorção)","drug_slug":"rivaroxabana"},
    {"droga":"Varfarina","dose":"5 mg/dia, ajustar pelo INR","via":"VO","obs":"OBRIGATÓRIA se: FA valvar (estenose mitral reumática), prótese mecânica, ClCr <15. Alvo INR 2-3","drug_slug":"varfarina"},
    {"droga":"Metoprolol (controle FC) — primeira escolha","dose":"25-100 mg 12/12h","via":"VO","obs":"meta FC <110 (lenient — RACE II) ou <80 (rígido) se sintomático. Alternativa: bisoprolol 2,5-10 mg","drug_slug":"metoprolol"},
    {"droga":"Diltiazem (alternativa controle FC)","dose":"180-360 mg/dia (LP) ou 30-60 mg 6/6h","via":"VO","obs":"se BB contraindicado (asma) — não usar em IC FE reduzida"},
    {"droga":"Amiodarona (controle ritmo)","dose":"manutenção 100-200 mg/dia VO","via":"VO","obs":"opção em FA com IC ou FE reduzida — outros antiarrítmicos contraindicados. Alta toxicidade extracardíaca","drug_slug":"amiodarona"},
    {"droga":"Digoxina (3ª linha)","dose":"0,125 mg/dia","via":"VO","obs":"adjuvante em IC + FA não controlada. Não usar isolada em pacientes ativos (não controla FC no exercício)","drug_slug":"digoxina"}
  ]$$::jsonb,
  ARRAY[
    'CHA2DS2-VASc: IC=1, HAS=1, idade≥75=2 (65-74=1), DM=1, AVC/AIT=2, vasculopatia=1, sexo♀=1',
    'HAS-BLED para risco de sangramento: NÃO contraindica anticoagulação, ajusta vigilância',
    'Cardioversão elétrica/química em FA <48h sem anticoagulação prévia OU >48h com 3 sem AC ou eco TE excluindo trombo',
    'ABLAÇÃO POR CATETER em FA paroxística sintomática refratária — superior a antiarrítmicos em RCT'
  ],
  ARRAY['ECG (confirmar FA)','Eco TT (FE, valvopatia, trombo átrio)','TSH (FA por hipertireoidismo)','Função renal + eletrólitos','Hemograma + INR (varfarina)','Eco TE se cardioversão >48h sem AC'],
  ARRAY['NÃO usar DOAC em prótese valvar mecânica (RE-ALIGN: dabigatrana piorou desfechos) ou estenose mitral reumática','Verapamil/diltiazem CONTRAINDICADOS em IC FE reduzida','BB IV em FA aguda apenas se hemodinamicamente estável','HAS-BLED ≥3: vigilância rigorosa, NÃO contraindica anticoagulação','Quedas frequentes em idoso: NÃO contraindica anticoagulação por si só (benefício > risco)'],
  'ESC FA 2020 / SBC 2016',
  'https://academic.oup.com/eurheartj/article/42/5/373/5899003',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. Profilaxia TVP — paciente hospitalizado clínico
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'profilaxia-tvp-hospitalar',
  'Profilaxia de TVP — paciente clínico hospitalizado',
  'Tromboembolismo venoso',
  'Adulto internado com Padua ≥4 ou IMPROVE ≥2 (alto risco) ou cirúrgico moderado-alto risco',
  'Enfermaria / UTI',
  'Heparina ou enoxaparina é padrão. Em alto risco sangramento: profilaxia mecânica (compressão pneumática).',
  $$[
    {"droga":"Enoxaparina (preferida)","dose":"40 mg SC 1x/dia (30 mg 12/12h em cirurgia ortopédica/trauma)","via":"SC","frequencia":"1x/dia","duracao":"durante toda internação","obs":"PRIMEIRA ESCOLHA. Reduzir para 30 mg/dia se ClCr <30. Em obesidade IMC >40: 40 mg 12/12h"},
    {"droga":"Heparina não-fracionada (UFH)","dose":"5000 U SC 8/8h ou 12/12h","via":"SC","frequencia":"8/8h","duracao":"durante toda internação","obs":"alternativa se ClCr <30 (sem ajuste). Mais risco de trombocitopenia induzida por heparina (HIT)"},
    {"droga":"Fondaparinux","dose":"2,5 mg SC 1x/dia","via":"SC","obs":"alternativa em pacientes com história de HIT. Não usar se ClCr <30"},
    {"droga":"Compressão pneumática intermitente","obs":"PRIMEIRA ESCOLHA se contraindicação à profilaxia química (sangramento ativo, trombocitopenia <50k, hemorragia intracraniana <14d)"},
    {"droga":"Meias elásticas de compressão graduada","obs":"adjuvante OU se sangramento contraindica química. Sozinha é insuficiente em pacientes alto risco"},
    {"droga":"Apixabana ou rivaroxabana (extensão pós-alta — selecionados)","dose":"apixabana 2,5 mg 12/12h ou rivaroxabana 10 mg/dia","duracao":"30-39 dias","obs":"em paciente clínico com IMPROVE-VTE alto + IMPROVE-Bleed baixo (MAGELLAN, MARINER) — uso seletivo, não rotineiro"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAÇÃO em todo paciente internado: escore PADUA (clínico) ou Caprini (cirúrgico)',
    'Aplicação CONTÍNUA durante toda internação — interromper só se sangramento ou queda plaquetas',
    'Estimular DEAMBULAÇÃO precoce + hidratação',
    'Pós-cirurgia ortopédica maior: profilaxia ESTENDIDA 28-35 dias após alta (apixabana/rivaroxabana ou enoxaparina)'
  ],
  ARRAY['Hemograma + plaquetas (basal + 5-10º dia se UFH — rastreio HIT)','Função renal + ClCr','Coagulograma basal','Sinais de sangramento','Sinais de TVP/TEP'],
  ARRAY['CONTRAINDICAÇÕES profilaxia química: sangramento ativo, plaquetas <50k, hemorragia intracraniana <14d, AVCh recente, HAS não controlada >180/110, anestesia neuroaxial recente (4-12h pré e 4h pós)','HIT: queda plaquetas >50% entre dia 5-10 de heparina → suspender e trocar para argatroban/fondaparinux. NÃO transfundir plaquetas','Em ClCr <30: PREFERIR UFH (sem ajuste) ou enoxaparina 30 mg/dia','Filtro de veia cava: SOMENTE se contraindicação absoluta + alto risco TVP'],
  'CHEST 2018 — Antithrombotic Therapy for VTE Prevention',
  'https://journal.chestnet.org/article/S0012-3692(18)32566-6/fulltext',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
