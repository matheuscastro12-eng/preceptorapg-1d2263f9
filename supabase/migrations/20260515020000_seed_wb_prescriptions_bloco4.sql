-- PreceptorBook: Prescrições Bloco 4 (6 doenças)
-- Asma manutenção, DRGE/úlcera, gota aguda+crônica, AR, NV quimio, dor neuropática

-- 1. ASMA — manutenção (GINA 2024)
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'asma-manutencao',
  'Asma — manutenção (GINA 2024)',
  'Asma',
  'Adolescente/adulto com asma persistente leve, moderada ou grave',
  'Ambulatorial',
  'GINA 2024: ICS-formoterol como SOS e manutenção (MART) é primeira escolha em todos os steps. Salbutamol isolado SOS está OBSOLETO.',
  $$[
    {"droga":"Step 1-2: ICS-formoterol baixa dose (MART)","dose":"budesonida 200 + formoterol 6 mcg — 1 puff SOS (até 8/dia)","via":"INALAT","obs":"sem manutenção fixa em step 1-2 leve. Em ≥2 sintomas/sem: 1 puff manutenção 12/12h + SOS","drug_slug":"formoterol"},
    {"droga":"Step 3: ICS-formoterol baixa dose manutenção","dose":"budesonida 200/formoterol 6 mcg 1 puff 12/12h + SOS pelo mesmo dispositivo","via":"INALAT","obs":"esquema MART. Se má aderência: ICS+LABA convencional 12/12h + salbutamol SOS"},
    {"droga":"Step 4: ICS-formoterol moderada dose","dose":"budesonida 200/formoterol 6 mcg 2 puffs 12/12h + SOS","obs":"ou trocar por dose moderada de outro ICS+LABA"},
    {"droga":"Step 5: + LAMA + biológico (asma grave)","dose":"adicionar tiotrópio 5 mcg/dia (Respimat) e considerar biológico","via":"INALAT + SC","obs":"biológicos: anti-IgE (omalizumabe), anti-IL5 (mepolizumabe), anti-IL4Rα (dupilumabe). Encaminhar especialista","drug_slug":"tiotropio"},
    {"droga":"Salbutamol (alternativa SOS)","dose":"100 mcg 2 puffs SOS","via":"INALAT","obs":"NÃO recomendado isoladamente em asma — sempre com CI. Em <12a permanece como SOS","drug_slug":"salbutamol"},
    {"droga":"Fluticasona furoato (CI alternativa)","dose":"100-200 mcg/dia (Ellipta) ou propionato 100-500 mcg 12/12h","via":"INALAT","obs":"alternativa em paciente que não tolera ou não tem acesso a ICS-formoterol","drug_slug":"fluticasona"},
    {"droga":"Montelucaste (3ª linha)","dose":"10 mg/dia","obs":"alternativa em paciente que não usa inalatório. NÃO 1ª linha. Black Box ideação suicida","drug_slug":"montelucaste"},
    {"droga":"Corticoide oral (último recurso)","dose":"prednisona 5-10 mg/dia","obs":"ASMA GRAVE refratária — buscar minimizar com biológicos. Efeitos adversos crônicos importantes"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAÇÃO ACT/ACQ a cada consulta — meta: bem controlado',
    'Técnica inalatória CADA CONSULTA (taxa erro >50%)',
    'Identificar e evitar gatilhos: alérgenos, AINE, refluxo, exercício, sinusopatia, tabagismo (ativo/passivo)',
    'PLANO DE AÇÃO ESCRITO: como reconhecer piora + escalonamento de medicação',
    'STEP-DOWN: tentar a cada 3 meses se controlado',
    'Vacinas: influenza anual + pneumocócica + COVID'
  ],
  ARRAY['Espirometria com BD (basal + anual)','PFE peak flow (em casa se grave)','Eosinófilos sanguíneos (orientar biológico)','IgE total (omalizumabe)','Rx tórax inicial','Avaliação alergista se persistir mal controlado'],
  ARRAY['SALBUTAMOL ISOLADO COMO SOS = ULTRAPASSADO (GINA 2019+) — aumenta mortalidade. Sempre com CI','LABA EM MONOTERAPIA EM ASMA = MORTE — Black Box. SEMPRE com CI','EM EXACERBAÇÃO: corticoide sistêmico precoce + altas doses ICS continuadas + reavaliação 24-72h','HIPOSSATURAÇÃO em asma é PRÉ-PARADA — não adiar IOT/UTI','Ferro/B12: anti-IgE (omalizumabe) só após eosinofilia + sensibilização aérea documentada'],
  'GINA 2024',
  'https://ginasthma.org/2024-gina-main-report/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. DRGE / DOENÇA ÚLCERO-PÉPTICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'drge-ulcera-peptica',
  'DRGE / Úlcera péptica — manejo',
  'Doença do refluxo / úlcera péptica',
  'Adulto com pirose/regurgitação (DRGE) ou epigastralgia + dispepsia (úlcera)',
  'Ambulatorial',
  'IBP 4-8 sem em DRGE não complicada. Em úlcera + H. pylori: erradicação obrigatória. Reavaliar e desmamar — IBP crônico tem efeitos adversos.',
  $$[
    {"droga":"Pantoprazol (1ª escolha em SCA + clopidogrel)","dose":"40 mg/dia (30 min antes café)","via":"VO","duracao":"DRGE: 4-8 sem; úlcera: 4-8 sem; manutenção: dose menor (20 mg) tentando step-down","obs":"alternativas: omeprazol 20-40 mg, esomeprazol 20-40 mg, lansoprazol 30 mg","drug_slug":"pantoprazol"},
    {"droga":"H. pylori — esquema tripla 14 dias (1ª linha)","dose":"omeprazol 20 mg 12/12h + amoxicilina 1 g 12/12h + claritromicina 500 mg 12/12h × 14 dias","via":"VO","obs":"se resistência claritro >15% (Brasil): preferir esquema quádruplo com bismuto","drug_slug":"amoxicilina"},
    {"droga":"H. pylori — quádruplo com bismuto (regiões alta resistência)","dose":"IBP 12/12h + bismuto 524 mg 6/6h + tetraciclina 500 mg 6/6h + metronidazol 500 mg 8/8h × 14 dias","via":"VO","obs":"alternativa em alta resistência ou falha de 1ª linha","drug_slug":"metronidazol"},
    {"droga":"Antiácidos (alívio sintomático)","dose":"hidróxido de magnésio + alumínio: 10-15 mL 1h após refeições e ao deitar","via":"VO","obs":"alívio rápido. Não tratar fisiopatologia"},
    {"droga":"Anti-H2 (alternativa)","dose":"famotidina 20-40 mg 12/12h (ranitidina foi retirada)","via":"VO","obs":"menos eficaz que IBP. Útil em DRGE noturno se sintomas persistirem com IBP"},
    {"droga":"Cisaprida/domperidona — NÃO RECOMENDADOS rotineiramente","obs":"cisaprida foi RETIRADA do mercado (arritmia). Domperidona uso restrito (QT)"},
    {"droga":"Sintomáticos DRGE refratária","obs":"considerar fundoplicatura (Nissen) em refratária + esofagite grave + paciente jovem"}
  ]$$::jsonb,
  ARRAY[
    'MEV: emagrecer (5-10%), elevar cabeceira 15 cm, evitar refeição <3h antes deitar, evitar gatilhos (gordura, café, álcool, hortelã, chocolate, cítricos)',
    'PARAR DE FUMAR — fator de risco para refluxo refratário',
    'EDA é OBRIGATÓRIA em: ≥45-50a com sintomas novos, sinais alarme (anemia, perda peso, disfagia, sangramento, vômito persistente, história familiar CA gástrico)',
    'TESTE H. PYLORI antes de tratamento empírico em úlcera ou em DRGE refratária com sintomas dispépticos',
    'CONFIRMAR ERRADICAÇÃO H. pylori 4-6 sem após esquema (urease respiratória ou antígeno fecal — não sorologia)'
  ],
  ARRAY['EDA com biópsia (úlcera, sinais alarme, refratário)','Teste H. pylori (urease respiratória, antígeno fecal, ou biópsia EDA)','Hemograma (anemia)','pH-metria 24h em DRGE atípico/refratário','Manometria se suspeita acalasia'],
  ARRAY['IBP CRÔNICO (>1 ano alta dose): risco osteoporose/fratura, deficiência B12/Mg/Fe, infecção entérica (C. difficile), pneumonia, nefrite intersticial — REAVALIAR sempre','SUSPENSÃO ABRUPTA de IBP crônico → efeito rebote (hipersecreção ácida) → desmamar gradualmente','EM SCA + clopidogrel: PANTOPRAZOL é preferível (omeprazol/esomeprazol reduzem ativação clopidogrel via CYP2C19)','EDA OBRIGATÓRIA em sinais alarme — CA gástrico tem incidência alta no Brasil','Erradicação H. pylori reduz risco CA gástrico em quem tem mucosa de risco'],
  'Diretriz Brasileira DRGE 2018 / Maastricht VI 2022',
  'https://gut.bmj.com/content/71/9/1724',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. GOTA — crise aguda + manejo crônico
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'gota-aguda-cronica',
  'Gota — crise aguda e manejo crônico',
  'Gota',
  'Adulto com mono/oligoartrite aguda + cristais de urato (clínica + análise líquido sinovial)',
  'Ambulatorial / PA (crise)',
  'Crise aguda: AINE/colchicina/corticoide. Manutenção urato-redutora (alopurinol) é INDEPENDENTE e DEVE iniciar mesmo durante crise (manter se já em uso).',
  $$[
    {"droga":"Naproxeno (AINE — crise aguda 1ª escolha)","dose":"500 mg 12/12h","via":"VO","duracao":"5-7 dias (até resolução)","obs":"associar IBP se risco GI. CONTRAINDICADO em DRC, IC, úlcera ativa"},
    {"droga":"Colchicina (alternativa crise aguda)","dose":"1,2 mg ataque + 0,6 mg 1h depois (max 1,8 mg/dia 1º dia) → 0,6 mg 1-2x/dia até resolução","via":"VO","duracao":"≤5 dias","obs":"INICIAR <24-36h da crise. Diarreia limitante","drug_slug":"colchicina"},
    {"droga":"Corticoide sistêmico (3ª linha crise)","dose":"prednisona 30-50 mg/dia × 5-7 dias OU triamcinolona intra-articular 10-40 mg","via":"VO ou IA","obs":"escolha em DRC, anticoagulado, intolerante a colchicina/AINE. Cuidado glicemia"},
    {"droga":"Alopurinol (urato-redutor — crônico)","dose":"INICIAR 100 mg/dia, titular 100 mg cada 2-4 sem até alvo (max 800 mg/dia, geralmente 300-600 mg). Em DRC: começar 50-100 mg, ajustar","via":"VO","frequencia":"1x/dia","duracao":"contínuo, vitalício se ≥2 crises/ano ou tofos","obs":"meta: ác úrico < 6 mg/dL (geral) ou < 5 (tofáceo). NÃO INICIAR durante crise; MANTER se já em uso","drug_slug":"alopurinol"},
    {"droga":"Profilaxia anti-flare ao iniciar alopurinol","dose":"colchicina 0,5-0,6 mg 1-2x/dia OU naproxeno 250 mg 12/12h","duracao":"3-6 meses","obs":"reduz crises de mobilização durante redução de urato"},
    {"droga":"Febuxostate (alternativa em alergia/falha alopurinol)","dose":"40-80 mg/dia","via":"VO","obs":"caro. CARES trial: maior mortalidade CV vs alopurinol — preferir alopurinol"},
    {"droga":"Pegloticase (último recurso)","dose":"8 mg IV cada 2 sem","via":"IV","obs":"em gota tofácea refratária. Risco anafilaxia"}
  ]$$::jsonb,
  ARRAY[
    'CONFIRMAR diagnóstico com PUNÇÃO articular (cristais negativamente birrefringentes em microscopia luz polarizada) — padrão ouro',
    'CRISE: imobilização articular + GELO + repouso',
    'NÃO INICIAR alopurinol durante crise aguda (pode prolongar/piorar) — esperar 1-2 sem após resolução',
    'JÁ EM USO de alopurinol: NÃO interromper durante crise',
    'MEV: redução peso, álcool (especialmente cerveja), reduzir purinas (vísceras, frutos do mar), aumentar laticínio com baixa gordura, hidratação',
    'TRATAR comorbidades: HAS (evitar tiazídico — preferir losartana/anlodipino), DM, dislipidemia',
    'INICIAR urato-redutor se: ≥2 crises/ano, tofo, nefrolitíase, DRC est ≥2'
  ],
  ARRAY['Ácido úrico sérico (basal + cada 2-4 sem na titulação alopurinol → trimestral)','Função renal','Análise líquido sinovial (cristais)','Rx articulações com tofo (erosão clássica em saca-bocado)','HLA-B*5801 (asiáticos antes alopurinol)'],
  ARRAY['ALOPURINOL: SCAR/DRESS é a complicação mais temida — qualquer rash novo nas primeiras 8 sem → suspender','TIAZÍDICO eleva ácido úrico — evitar em paciente com gota; preferir losartana (efeito uricosúrico leve)','HIPERTENSÃO + GOTA: losartana > anlodipino > tiazídico/BB','PROFILAXIA com colchicina 3-6 meses ao iniciar alopurinol é OBRIGATÓRIA — sem ela, crises de mobilização são frequentes','CONFIRMAR diagnóstico com cristais — gota mimetiza séptica (artrite séptica é emergência diferente)'],
  'ACR Guideline 2020 / EULAR 2016',
  'https://onlinelibrary.wiley.com/doi/10.1002/art.41247',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. ARTRITE REUMATOIDE — manejo inicial
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'artrite-reumatoide-inicial',
  'Artrite reumatoide — manejo inicial (treat-to-target)',
  'Artrite reumatoide',
  'Adulto com critérios ACR/EULAR 2010 ≥6 (poliartrite simétrica + FR/anti-CCP + sinovite >6 sem + reagente fase aguda)',
  'Ambulatorial (reumatologia)',
  'TRATAR PARA META (DAS-28 < 3,2 ou remissão). Iniciar metotrexato em até 3 meses. Step-up rápido se sem resposta em 3-6 meses.',
  $$[
    {"droga":"Metotrexato (DMARD 1ª linha)","dose":"INICIAR 7,5-15 mg/SEMANA, titular até 15-25 mg/sem (subcutâneo se >15 mg ou intolerância oral)","via":"VO ou SC","frequencia":"1x POR SEMANA","duracao":"contínuo","obs":"BASE do tratamento. SEMPRE associar ácido fólico 5 mg/sem (24h após). DOSE SEMANAL — confusão com diária = óbito","drug_slug":"metotrexato"},
    {"droga":"Ácido fólico","dose":"5 mg 1x/sem (24h após MTX)","via":"VO","obs":"OBRIGATÓRIO — reduz toxicidade MTX sem perder eficácia"},
    {"droga":"Hidroxicloroquina (DMARD leve / combinação)","dose":"400 mg/dia (≤5 mg/kg/dia)","via":"VO","obs":"em monoterapia para AR leve OU combinada com MTX (esquema BeSt). Avaliar oftalmo basal + anual após 5a","drug_slug":"hidroxicloroquina"},
    {"droga":"Sulfassalazina (DMARD alternativo)","dose":"INICIAR 500 mg/dia, titular até 1-3 g/dia divididos","via":"VO","obs":"alternativa se MTX contraindicado. Útil em combinação (MTX+SSZ+HCQ — terapia tripla)"},
    {"droga":"Leflunomida (alternativa)","dose":"100 mg/dia × 3 dias (ataque) → 10-20 mg/dia","via":"VO","obs":"alternativa ao MTX. CONTRAINDICADO em gestação (3 anos pós — washout colestiramina)"},
    {"droga":"Corticoide ponte","dose":"prednisona 7,5-15 mg/dia","via":"VO","duracao":"3-6 meses (ponte até DMARD agir)","obs":"reduzir e suspender. Não usar como manutenção crônica"},
    {"droga":"AINE para sintomas","dose":"naproxeno 500 mg 12/12h ou ibuprofeno 600 mg 8/8h","via":"VO","obs":"sintomático. NÃO modifica doença"},
    {"droga":"Biológico/sintético-alvo (em falha 2 DMARDs)","obs":"anti-TNF (adalimumabe, etanercept, infliximabe), anti-IL6 (tocilizumabe), anti-CD20 (rituximabe), JAK-i (tofacitinibe, baricitinibe). Decisão com reumatologista. Rastreio TB latente, hepatites, neoplasias ANTES"}
  ]$$::jsonb,
  ARRAY[
    'TREAT-TO-TARGET: meta DAS-28 <3,2 (baixa atividade) ou <2,6 (remissão). Reavaliar 3-6 meses, ajustar agressivamente',
    'JANELA DE OPORTUNIDADE: tratar nos primeiros 3-6 meses muda história natural — reduz erosão articular',
    'EDUCAÇÃO + fisioterapia + reabilitação ocupacional + atividade física',
    'PROFILAXIA CV: AR aumenta risco IAM/AVC 50% — controlar HAS, dislipidemia, parar de fumar',
    'OSTEOPOROSE: rastrear DEXA. Cálcio 1g + Vit D 800-1000 UI. Bifosfonato se T-score ≤-2,5 ou fratura prévia',
    'VACINAS: atualizar ANTES de biológico/imunossupressor. Influenza anual, pneumocócica, HBV, HZV, HPV, COVID. Atenuadas (febre amarela, BCG, varicela) CONTRAINDICADAS em uso'
  ],
  ARRAY['FR + anti-CCP','Hemograma + VHS + PCR (atividade)','Função hepática + renal','Beta-HCG mulher idade fértil','Sorologias HIV, HBV, HCV','PPD/IGRA (TB latente — antes de biológico)','Rx mãos/pés (erosões basal + 6m + 12m)','USG/RM articular (sinovite subclínica)'],
  ARRAY['MTX: DOSE SEMANAL — erro diário causa óbitos. Receita CLARA','MTX: TERATOGÊNICO — anticoncepção ≥3 meses. PNEUMONITE — tosse seca → suspender + Rx','BIOLÓGICO + INFECÇÃO ATIVA = CONTRAINDICADO. Rastrear TB latente/HBV ANTES','RITUXIMABE + REATIVAÇÃO HBV: rastrear HBsAg/anti-HBc — profilaxia entecavir se anti-HBc+','GESTAÇÃO: MTX, leflunomida, JAK-i CONTRAINDICADOS. HCQ + sulfassalazina + alguns biológicos podem ser usados','EVITAR vacinas atenuadas em uso de biológico/MTX dose alta'],
  'ACR 2021 / EULAR 2022',
  'https://www.rheumatology.org/Practice-Quality/Clinical-Support/Clinical-Practice-Guidelines/Rheumatoid-Arthritis',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. NÁUSEA/VÔMITO INDUZIDO POR QUIMIOTERAPIA (CINV)
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'cinv-nausea-quimio',
  'Náusea/vômito induzido por quimioterapia (CINV)',
  'Náuseas e vômitos',
  'Paciente em quimioterapia com risco emetogênico moderado-alto',
  'Hospital-dia / Enfermaria',
  'Tripé padrão para alta emetogenicidade: 5-HT3 + corticoide + NK1. Antiemético DEVE preceder a quimio em 30-60 min.',
  $$[
    {"droga":"Ondansetrona (5-HT3)","dose":"8-16 mg IV ou VO 30 min PRÉ-quimio + 8 mg 12/12h × 1-3 dias pós","via":"IV ou VO","obs":"PRIMEIRA LINHA. Limite 16 mg IV dose única (FDA — QT). Alternativa: granisetrona 1 mg, palonosetrona 0,25 mg (longa ação)","drug_slug":"ondansetrona"},
    {"droga":"Dexametasona (corticoide)","dose":"12 mg IV/VO 30 min pré-quimio (alta emetog) + 8 mg/dia × 2-3 dias","via":"IV ou VO","obs":"ESSENCIAL — sinérgica com 5-HT3 e NK1. Cuidado glicemia em DM","drug_slug":"dexametasona"},
    {"droga":"Aprepitanto (NK1 — alta emetog)","dose":"125 mg VO D1 + 80 mg/dia D2-D3","via":"VO","obs":"em quimio altamente emetogênica (cisplatina, ciclofosfamida >1500 mg/m², AC). Alternativa IV: fosaprepitanto 150 mg D1 dose única"},
    {"droga":"Olanzapina (potencialização)","dose":"5-10 mg/dia VO × 4 dias pré + pós","via":"VO","obs":"adjuvante em alta emetog (NCCN nível 1). Sedação é efeito desejável","drug_slug":"olanzapina"},
    {"droga":"Metoclopramida (resgate)","dose":"10 mg IV/VO 8/8h","via":"VO ou IV","obs":"se vômito apesar de 5-HT3+corticoide. Limitar uso por discinesia tardia","drug_slug":"metoclopramida"},
    {"droga":"Lorazepam (ansiedade antecipatória)","dose":"0,5-1 mg VO/SL","via":"VO","obs":"náusea antecipatória condicionada — TCC + ansiolítico"},
    {"droga":"Hidratação","obs":"manter hidratação, especialmente após cisplatina (proteção renal — SF 0,9% 1L pré + pós)"}
  ]$$::jsonb,
  ARRAY[
    'IDENTIFICAR risco emetogênico do esquema: alta (>90% — cisplatina, AC), moderada (30-90%), baixa (10-30%), mínima (<10%)',
    'PROFILAXIA é mais eficaz que tratar vômito instalado — DAR antes da quimio',
    'CINV agudo (24h): bem controlado por 5-HT3+corticoide+NK1',
    'CINV TARDIO (24-120h): mais difícil — palonosetrona ou aprepitanto cobrem essa fase',
    'CINV ANTECIPATÓRIO: condicionamento clássico — orientação + TCC + lorazepam'
  ],
  ARRAY['Hemograma (mielossupressão)','Função renal + eletrólitos (cisplatina nefrotóxica)','Função hepática','ECG se risco QT (vômito + 5-HT3 + outros prolongadores)'],
  ARRAY['ONDANSETRONA dose única IV ≤16 mg em adultos (FDA — QT) — torsades em pacientes com hipocalemia/hipomagnesemia','DEXAMETASONA: limitar duração para evitar efeitos crônicos. Cuidado glicemia em DM','METOCLOPRAMIDA: risco discinesia tardia em uso prolongado — não cronificar','APREPITANTO: interage com warfarina, contraceptivos orais e dexametasona (reduz dose dexa 50%)','HIDRATAÇÃO PRÉ E PÓS CISPLATINA é crucial para nefroproteção','EM PEDS: ondansetrona é base; aprepitanto a partir de 6 meses; olanzapina off-label'],
  'NCCN 2024 / ASCO 2020',
  'https://ascopubs.org/doi/10.1200/JCO.20.01296',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 6. DOR NEUROPÁTICA CRÔNICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'dor-neuropatica-cronica',
  'Dor neuropática crônica',
  'Dor neuropática',
  'Dor com características neuropáticas (DN4 ≥4, queimação, choques, alodinia, distribuição em território nervoso)',
  'Ambulatorial',
  'Gabapentinoides ou ADT/IRSN são primeira linha. Opioide é último recurso em refratária. Adjuvantes não-medicamentosos sempre.',
  $$[
    {"droga":"Gabapentina (1ª escolha)","dose":"INICIAR 300 mg noite × 1d → 300 mg 12/12h × 1d → 300 mg 8/8h, titular até 1800-3600 mg/dia em 3 sem","via":"VO","frequencia":"8/8h","obs":"resposta em 2-4 sem. Em idoso: começar 100 mg, titular MUITO lentamente","drug_slug":"gabapentina"},
    {"droga":"Pregabalina (1ª escolha — alternativa)","dose":"INICIAR 75 mg 12/12h × 3-7d → 150-300 mg 12/12h","via":"VO","obs":"farmacocinética mais previsível. Mais cara. Risco abuso (controle B1)","drug_slug":"pregabalina"},
    {"droga":"Amitriptilina (ADT)","dose":"INICIAR 10-25 mg noite, titular até 50-150 mg/dia","via":"VO","obs":"eficaz em neuropatia diabética e fibromialgia. CUIDADO em IDOSO (anticolinérgico, queda, prolongamento QT). Alternativa: nortriptilina (mesma família, menos anticolinérgico)"},
    {"droga":"Duloxetina (IRSN)","dose":"30-60 mg/dia, max 120 mg","via":"VO","obs":"primeira escolha em neuropatia diabética + fibromialgia. Útil se depressão associada. Cuidado PA"},
    {"droga":"Venlafaxina (IRSN — alternativa)","dose":"75-225 mg/dia","via":"VO","obs":"alternativa a duloxetina se intolerância","drug_slug":"venlafaxina"},
    {"droga":"Lidocaína 5% adesivo tópico","dose":"1 adesivo até 12h/dia","via":"tópico","obs":"em neuralgia pós-herpética localizada. Mínima absorção sistêmica"},
    {"droga":"Capsaicina 8% adesivo (alta concentração)","dose":"1 aplicação 30-60 min, repetir cada 90 dias","obs":"refratário, em ambiente médico (queimação intensa)"},
    {"droga":"Tramadol (opioide fraco — 2ª linha)","dose":"50-100 mg 6/6h, max 400 mg/dia","via":"VO","obs":"OPIOIDE FRACO. Reduzir limiar convulsivo. Síndrome serotoninérgica com ISRS. Receita controlada"},
    {"droga":"Opioide forte (último recurso)","dose":"oxicodona 5-10 mg 12/12h LP","via":"VO","obs":"reservado para refratária após 2-3 linhas. Risco dependência/desvio. NÃO é primeira escolha em dor crônica não-oncológica"},
    {"droga":"Carbamazepina","dose":"INICIAR 100-200 mg 12/12h, titular até 600-1200 mg/dia","via":"VO","obs":"PRIMEIRA ESCOLHA em NEURALGIA DO TRIGÊMEO específicamente (não dor neuropática geral). Hiponatremia, agranulocitose"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAÇÃO MULTIMODAL: medicação + reabilitação + TCC + atividade física graduada + sono + suporte psicossocial',
    'TRATAR causa base (controle glicêmico em DM, anti-virais em pós-herpética <72h)',
    'METAS REALISTAS: redução 30-50% da dor é resposta clínica. Cura raramente possível',
    'EVITAR opioides em primeira linha — dor neuropática responde MAL a opioide',
    'TENTAR DUAS classes de 1ª linha antes de combinar; se 2 classes falharem, considerar opioide ou intervenção (bloqueio nervoso, neuromodulação)',
    'SAÚDE MENTAL: dor crônica + depressão + ansiedade são triângulo — tratar simultaneamente'
  ],
  ARRAY['DN4 (questionário diagnóstico)','HbA1c se DM','TSH','B12','Eletrólitos','EMG/ENMG se neuropatia atípica','RM/TC se suspeita radiculopatia compressiva ou neoplásica'],
  ARRAY['GABAPENTINOIDES + OPIOIDES = depressão respiratória aumentada (FDA Black Box 2019)','TRAMADOL + ISRS = síndrome serotoninérgica','EM IDOSO: gabapentinoides causam quedas/sedação importantes — começar muito baixo','AMITRIPTILINA: arritmia, anticolinérgico — preferir NORTRIPTILINA em idoso','OPIOIDE EM DOR CRÔNICA NÃO-ONCOLÓGICA: discutir desfechos esperados, riscos, abstinência. Não cronificar — desmamar quando possível','DEPENDÊNCIA: pregabalina/gabapentinoide e tramadol/opioide têm potencial — orientar paciente'],
  'NeuPSIG 2015 / IASP 2023',
  'https://www.iasp-pain.org/resources/clinical-guidelines/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
