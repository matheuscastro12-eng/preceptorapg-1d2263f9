-- PreceptorBook: Prescrições Bloco 7 (5 doenças)
-- Insônia crônica, transtorno do pânico, epilepsia, osteoporose pós-menopausa, abstinência alcoólica

-- 1. INSÔNIA CRÔNICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'insonia-cronica',
  'Insônia crônica — manejo',
  'Insônia',
  'Dificuldade para iniciar/manter sono ≥3 noites/semana por ≥3 meses + prejuízo funcional',
  'Ambulatorial',
  'TCC para insônia (TCC-i) é PRIMEIRA LINHA. Hipnóticos só em casos selecionados, curto prazo. NUNCA cronificar BZD.',
  $$[
    {"droga":"TCC-i (terapia cognitivo-comportamental para insônia)","obs":"PRIMEIRA LINHA — eficácia ≥ medicação, sem efeitos adversos. 4-8 sessões. Higiene do sono, controle de estímulo, restrição de sono, reestruturação cognitiva"},
    {"droga":"Higiene do sono","obs":"horário regular, ambiente escuro/silencioso, sem cafeína após 14h, sem álcool, atividade física pela manhã, expor-se à luz solar manhã, sem tela 1h antes deitar"},
    {"droga":"Zolpidem (uso curto)","dose":"5-10 mg ao deitar (mulher 5 mg, idoso 5 mg)","via":"VO","duracao":"≤2-4 semanas","obs":"OPÇÃO em insônia situacional ou ponte. Black Box: comportamento complexo durante sono","drug_slug":"zolpidem"},
    {"droga":"Trazodona (alternativa OFF-LABEL)","dose":"25-100 mg ao deitar","via":"VO","obs":"sem dependência. Útil em insônia + ansiedade. Off-label mas amplamente usado. Boca seca, hipotensão postural"},
    {"droga":"Mirtazapina (alternativa em insônia + depressão)","dose":"7,5-15 mg ao deitar","via":"VO","obs":"se comórbida com depressão. Ganho peso pode ser desejado em paciente desnutrido","drug_slug":"mirtazapina"},
    {"droga":"Melatonina","dose":"0,5-3 mg 30-60 min antes deitar","via":"VO","obs":"útil em insônia inicial (latência), distúrbio fase atrasada, jet lag, idoso. Eficácia modesta"},
    {"droga":"Doxepina (em baixa dose)","dose":"3-6 mg ao deitar","via":"VO","obs":"FDA aprovado para manutenção do sono. Anti-H1 puro em baixa dose"},
    {"droga":"Clonazepam/diazepam (EVITAR uso crônico)","obs":"NÃO PRESCREVER para insônia crônica. Risco dependência, queda em idoso, demência. Se já em uso: DESMAMAR","drug_slug":"clonazepam"}
  ]$$::jsonb,
  ARRAY[
    'INVESTIGAR causa antes de medicar: depressão, ansiedade, dor, refluxo, SAOS, pernas inquietas, álcool, cafeína, drogas',
    'POLISSONOGRAFIA: indicada se suspeita de SAOS, narcolepsia, parassonia',
    'TCC-i é mais EFICAZ no longo prazo que medicação — orientar sobre limitações de hipnóticos',
    'EM IDOSO: NÃO USAR BZD/Z-drug (Beers Criteria) — quedas, demência. Preferir trazodona/melatonina',
    'GESTANTE: orientar higiene + difenidramina como último recurso (categoria B). EVITAR BZD',
    'Reavaliar a cada 2-4 semanas — DESMAMAR hipnótico se evolução boa'
  ],
  ARRAY['História do sono detalhada (diário do sono 1-2 sem)','Polissonografia (se SAOS/narcolepsia/parassonia suspeita)','PHQ-9 + GAD-7 (depressão/ansiedade)','TSH','Ferritina (síndrome pernas inquietas)','Vit B12','Glicemia (em idoso)'],
  ARRAY['BZD CRÔNICO É ARMADILHA — desmame difícil, recidiva alta. Evitar iniciar; se em uso: plano de desmame','Z-DRUG (zolpidem): Black Box FDA — comportamento complexo durante sono. Suspender se ocorrer','EM IDOSO: BZD/Z-drug aumentam queda 50%. Beers diz NÃO USAR','SUSPENSÃO ABRUPTA de hipnótico CRÔNICO → insônia rebote (1-3 noites). Desmamar','SAOS NÃO TRATADO + SEDATIVO = depressão respiratória — sempre rastrear ronco/apneia em paciente com insônia + sonolência diurna','SUICÍDIO: BZD em alta dose pode ser usado em tentativa — limitar prescrição em paciente com risco'],
  'AASM 2017 / NICE 2019',
  'https://aasm.org/clinical-resources/practice-standards/practice-guidelines/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. TRANSTORNO DO PÂNICO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'transtorno-panico',
  'Transtorno do pânico — manejo',
  'Transtornos de ansiedade',
  'Ataques de pânico recorrentes inesperados + preocupação persistente sobre próximos ataques + alteração comportamental ≥1 mês',
  'Ambulatorial',
  'ISRS é primeira linha — INICIAR com dose menor (50% habitual) por 1 sem para evitar piora ansiosa inicial. TCC é tão eficaz quanto medicação.',
  $$[
    {"droga":"Sertralina (1ª escolha)","dose":"INICIAR 25 mg/dia × 1 sem (evitar piora) → 50 mg/dia, titular até 50-200 mg","via":"VO","duracao":"≥12 meses pós-remissão","obs":"PRIMEIRA ESCOLHA. Resposta em 4-6 sem. Avisar paciente sobre piora inicial possível","drug_slug":"sertralina"},
    {"droga":"Escitalopram","dose":"INICIAR 5 mg × 1 sem → 10-20 mg","via":"VO","obs":"alternativa 1ª linha — boa tolerância","drug_slug":"escitalopram"},
    {"droga":"Paroxetina","dose":"INICIAR 10 mg × 1 sem → 20-40 mg","via":"VO","obs":"alternativa, mas síndrome descontinuação intensa — preferir sertralina/escitalopram"},
    {"droga":"Venlafaxina XR (2ª linha)","dose":"INICIAR 37,5 mg × 1 sem → 75-225 mg","via":"VO","obs":"se ISRS não responder. Cuidado PA","drug_slug":"venlafaxina"},
    {"droga":"Clonazepam (PONTE — uso curto)","dose":"0,25-0,5 mg 12/12h","via":"VO","duracao":"2-4 semanas (até ISRS agir)","obs":"USO LIMITADO. Risco dependência. Plano de desmame OBRIGATÓRIO","drug_slug":"clonazepam"},
    {"droga":"Alprazolam (uso EXCEPCIONAL)","dose":"0,25-0,5 mg conforme necessidade","via":"VO","obs":"ALTO risco dependência. Preferir clonazepam (longa ação) se BZD necessário","drug_slug":"alprazolam"},
    {"droga":"TCC com exposição","obs":"PRIMEIRA LINHA não-medicamentosa — equivalência a ISRS, melhor durabilidade. 12-20 sessões"},
    {"droga":"Treino respiratório","obs":"respiração diafragmática + grounding (5-4-3-2-1) durante crise — não substitui tratamento mas reduz intensidade dos ataques"}
  ]$$::jsonb,
  ARRAY[
    'EXCLUIR causas orgânicas: hipertireoidismo, feocromocitoma, arritmia, TEP, hipoglicemia, abstinência substância',
    'PSICOEDUCAÇÃO: explicar fisiologia do ataque (sistema simpático), curso autolimitado (~10-30 min), normalidade dos sintomas físicos',
    'TCC com EXPOSIÇÃO interoceptiva (sensações corporais) e situacional (lugares evitados) é altamente eficaz',
    'AGORAFOBIA é comum (40%) — explicar, planejar exposição',
    'TRATAMENTO ≥12 MESES após remissão para reduzir recidiva',
    'EVITAR cafeína, álcool, estimulantes (cocaína, anfetamina)'
  ],
  ARRAY['ECG (descartar arritmia)','TSH (descartar hipertireoidismo)','Hemograma','Glicemia','Eletrólitos','Beta-HCG','Catecolaminas urinárias se suspeita feocromocitoma'],
  ARRAY['ISRS PODE INICIALMENTE PIORAR pânico (1-2 sem) — começar dose BAIXA, aumentar lento, avisar paciente','BZD CRÔNICO em pânico: dependência rápida + resistência ao desmame. Plano de desmame DESDE O INÍCIO','SE PACIENTE BUSCA REPETIDAMENTE EMERGÊNCIA por sintomas físicos: investigar pânico, encaminhar saúde mental','RECEITA controlada de BZD: limitar quantidades, monitor — desvio comum','GESTAÇÃO: TCC é primeira escolha. Sertralina é ISRS de menor risco','EM IDOSO: BZD = quedas — preferir ISRS + TCC'],
  'APA 2009 / NICE 2020',
  'https://psychiatryonline.org/guidelines',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. EPILEPSIA — primeira escolha por tipo
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'epilepsia-primeira-escolha',
  'Epilepsia — primeira escolha por tipo de crise',
  'Epilepsia',
  'Diagnóstico ILAE 2017 — ≥2 crises não provocadas em >24h ou 1 crise + alto risco recorrência (anormalidade EEG/imagem)',
  'Ambulatorial / Neurologia',
  'Levetiracetam ou lamotrigina em mulher idade fértil. Evitar valproato e carbamazepina nesta população. Treat-to-target: liberdade de crises sem efeitos adversos.',
  $$[
    {"droga":"Levetiracetam (1ª escolha — focal e generalizada)","dose":"INICIAR 500 mg 12/12h, titular até 1000-3000 mg/dia divididos","via":"VO ou IV","obs":"PRIMEIRA ESCOLHA AMPLA — eficaz em crises focais e generalizadas. Seguro em gestação. Sem interações importantes. Eventos psiquiátricos (irritabilidade) em 10%"},
    {"droga":"Lamotrigina (focal + generalizada — mulher idade fértil)","dose":"TITULAÇÃO LENTA: 25 mg/dia × 2 sem → 50 → 100 → 200 mg/dia","via":"VO","obs":"VANTAGEM em mulher idade fértil (perfil teratogenia favorável). Atenção SJS — titulação lenta obrigatória","drug_slug":"lamotrigina"},
    {"droga":"Carbamazepina (focal — clássica)","dose":"INICIAR 200 mg 12/12h, titular até 800-1200 mg/dia","via":"VO","obs":"clássica em focal. EVITAR em mulher idade fértil (DTN). Indutor enzimático — interações","drug_slug":"carbamazepina"},
    {"droga":"Ácido valproico (1ª escolha em GENERALIZADA, mas evitar mulher idade fértil)","dose":"INICIAR 250-500 mg 12/12h, titular até 1000-2000 mg/dia (nível 50-125 mcg/mL)","via":"VO","obs":"PRIMEIRA ESCOLHA em mioclônica/ausência/tônico-clônica generalizada — MAS contraindicado em mulher idade fértil (teratogenia ALTA — espinha bífida 3-5%, autismo)"},
    {"droga":"Etossuximida (ausência infantil isolada)","dose":"15-40 mg/kg/dia divididos","via":"VO","obs":"PRIMEIRA ESCOLHA em ausência infantil pura. Em síndromes mistas: valproato"},
    {"droga":"Topiramato (alternativa)","dose":"INICIAR 25 mg, titular até 100-400 mg/dia","obs":"focal + generalizada. Útil em obeso (perda peso). Cuidado nefrolitíase, glaucoma agudo, parestesias"},
    {"droga":"Oxcarbazepina (alternativa carbamazepina)","dose":"600-2400 mg/dia","obs":"em focal — menor risco SJS, menor indução enzimática que carbamazepina. Hiponatremia comum"},
    {"droga":"Suspensão futura (após ≥2 anos sem crise)","obs":"discutir desmame em paciente com EEG normal + sem síndrome epileptogênica + risco baixo. Recidiva 30-50%. Suspensão LENTA em meses"}
  ]$$::jsonb,
  ARRAY[
    'INVESTIGAÇÃO inicial: HISTÓRIA TESTEMUNHADA (vídeo do celular ajuda) + EEG (basal + privação sono) + RM crânio (HARNESS-MS protocol)',
    'CLASSIFICAR ILAE 2017: focal vs generalizada vs combinada vs desconhecida — orienta tratamento',
    'MONOTERAPIA SEMPRE QUE POSSÍVEL — escolher fármaco com perfil mais adequado ao paciente',
    'TROCAR antiepiléptico se sem resposta em monoterapia em dose máxima — não combinar precocemente',
    '70% dos pacientes ficam livres de crises em monoterapia',
    'DRIVING: paciente epiléptico não pode dirigir até ≥1-2 anos sem crise (varia por estado)',
    'TODA MULHER IDADE FÉRTIL com epilepsia: ácido fólico 4-5 mg/dia + planejamento gestação'
  ],
  ARRAY['EEG (basal + privação sono)','RM crânio (protocolo epilepsia)','Hemograma + função hepática + renal basal','Beta-HCG mulher idade fértil','HLA-B*1502 em descendência asiática (carbamazepina)','Nível sérico em casos refratários ou suspeita má aderência'],
  ARRAY['SUSPENSÃO ABRUPTA = STATUS EPILEPTICUS — desmamar gradualmente em meses','GESTAÇÃO: planejar — preferir levetiracetam/lamotrigina. EVITAR valproato (teratogenia 10%, autismo, QI ↓)','VALPROATO em mulher idade fértil: contraindicado salvo se outras opções falhadas + contracepção segura + termo de consentimento','SUDEP (morte súbita inesperada na epilepsia): risco em epilepsia mal controlada, especialmente noturna, GTC. Discutir com paciente','GERIATRIA: levetiracetam/lamotrigina preferíveis (sem interação, sem indução enzimática)','SUICÍDIO: anticonvulsivantes podem aumentar ideação suicida (Black Box) — monitor'],
  'ILAE 2018 / NICE 2022',
  'https://www.ilae.org/guidelines',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. OSTEOPOROSE PÓS-MENOPAUSA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'osteoporose-pos-menopausa',
  'Osteoporose pós-menopausa',
  'Osteoporose',
  'Mulher ≥50a com T-score ≤ -2,5 OU fratura por fragilidade OU FRAX 10a >20% (maior) ou >3% (quadril)',
  'Ambulatorial',
  'Bisfosfonato é primeira linha. Cálcio + vit D para todos. Tratar 5-10 anos, depois pausa terapêutica em risco baixo.',
  $$[
    {"droga":"Alendronato (1ª escolha)","dose":"70 mg 1x/SEMANA OU 10 mg/dia","via":"VO em jejum, 200 mL água, em pé/sentado 30 min","duracao":"5 anos (reavaliação) → 10 anos se alto risco fratura","obs":"PRIMEIRA ESCOLHA. Reduz fratura vertebral 50%, quadril 50%","drug_slug":"alendronato"},
    {"droga":"Risedronato (alternativa bisfosfonato VO)","dose":"35 mg 1x/sem ou 150 mg 1x/mês","obs":"alternativa em intolerância gástrica ao alendronato"},
    {"droga":"Ácido zoledrônico (bisfosfonato IV)","dose":"5 mg IV 1x/ANO","via":"IV em 15-30 min","duracao":"3-5 anos","obs":"em paciente com má aderência ou problema esofágico. Pré-medicar paracetamol (febre/mialgia em 30%). Hidratar"},
    {"droga":"Denosumabe","dose":"60 mg SC cada 6 meses","via":"SC","obs":"em IRC ClCr <30 (bisfosfonato contraindicado), refratário ou intolerante. NÃO INTERROMPER (rebote com fraturas vertebrais múltiplas) — SEMPRE acompanhar com bisfosfonato após"},
    {"droga":"Teriparatida (anabólico)","dose":"20 mcg SC 1x/dia","via":"SC","duracao":"≤24 meses","obs":"em osteoporose GRAVE (T-score < -3,5, fratura múltipla, refratário). MUITO CARO. CONTRAINDICADO em osteossarcoma prévio, Paget. Após: bisfosfonato (consolidar ganho)"},
    {"droga":"Romosozumabe (anabólico + antirreabsortivo)","dose":"210 mg SC mensal","duracao":"12 meses","obs":"alta osteoporose. Contraindicado em DCV recente (IAM/AVC ↑). Após: bisfosfonato"},
    {"droga":"Cálcio elementar","dose":"1000-1200 mg/dia (preferir DIETÉTICO)","via":"VO","obs":"se ingesta dietética <1000 mg: suplementar. Carbonato com refeição","drug_slug":"carbonato-calcio"},
    {"droga":"Vitamina D3","dose":"800-2000 UI/dia","via":"VO","obs":"obrigatória em todo tratamento osteoporose. Repor se 25-OH-D <30 ng/mL ANTES de iniciar bisfosfonato (risco hipocalcemia)","drug_slug":"colecalciferol"},
    {"droga":"Reposição hormonal (TRH — uso muito restrito)","obs":"NÃO É 1ª LINHA para osteoporose isolada. Risco CV e CA mama. Apenas em mulher <60a ou <10 anos pós-menopausa com sintomas vasomotores"}
  ]$$::jsonb,
  ARRAY[
    'CALCULAR FRAX (Brasil) — 10 anos de risco fratura. >20% maior ou >3% quadril = tratar',
    'DEXA basal e a cada 1-2 anos durante tratamento',
    'INVESTIGAR causas secundárias antes de tratar: hiperparatireoidismo, hipertireoidismo, hipogonadismo, mieloma, doença celíaca, IRC, uso de corticoide',
    'EXERCÍCIO de carga (caminhar, treino força) + prevenção quedas (revisão visual, calçado, casa) — INTEGRA tratamento',
    'PARAR DE FUMAR + reduzir álcool',
    'AVALIAÇÃO DENTAL ANTES de iniciar bisfosfonato/denosumabe — risco osteonecrose mandíbula',
    'PAUSA TERAPÊUTICA (drug holiday) em pacientes baixo risco após 5 anos de bisfosfonato — 1-3 anos. Em ALTO risco: continuar até 10 anos'
  ],
  ARRAY['DEXA (densitometria — coluna L + colo fêmur + 1/3 distal rádio)','Cálcio + 25-OH-vit D','PTH (em hipocalcemia ou suspeita 2ª)','Função renal','TSH','Hemograma','VHS + eletroforese proteínas (mieloma)','Beta-CTX urinário (marcador remodelamento — para acompanhar resposta)','Avaliação dental basal'],
  ARRAY['BISFOSFONATO + HIPOCALCEMIA não corrigida = AGRAVAMENTO. CORRIGIR vit D e cálcio ANTES de iniciar','OSTEONECROSE MANDÍBULA: rara em VO, mais em IV alta dose (câncer). Avaliação dental + evitar procedimentos invasivos','FRATURA ATÍPICA FÊMUR: dor coxa progressiva em uso >5 anos = pré-fratura. Rx + RM','DENOSUMABE: NUNCA INTERROMPER sem transição para bisfosfonato — fraturas vertebrais múltiplas em rebote','TERIPARATIDA: limitada a 24 meses (risco osteossarcoma extrapolado de roedores)','EM ALTO RISCO (T-score muito baixo, fratura recente, alta queda): considerar anabólico (teriparatida/romosozumabe) ANTES do bisfosfonato'],
  'AACE 2020 / SBEM 2017',
  'https://www.endocrino.org.br/diretrizes',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. ABSTINÊNCIA ALCOÓLICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'abstinencia-alcoolica',
  'Síndrome de abstinência alcoólica',
  'Transtorno por uso de álcool',
  'Cessação ou redução de consumo crônico abusivo + ≥2 sintomas (tremor, taquicardia, HAS, sudorese, náusea, ansiedade, alucinação, convulsão)',
  'PA / Enfermaria',
  'BZD em escala (CIWA-Ar). Tiamina ANTES de glicose (Wernicke). Profilaxia convulsão e delirium tremens.',
  $$[
    {"droga":"Tiamina (B1) — ANTES de glicose","dose":"100 mg IV/IM × 3-5 dias → VO 100 mg 1-2x/dia","via":"IV/IM (preferida) ou VO","duracao":"3-5 dias IV/IM, depois VO continuado","obs":"PROFILAXIA WERNICKE-KORSAKOFF — sempre antes de glicose. Em encefalopatia: 500 mg IV 8/8h × 2-3 dias"},
    {"droga":"Diazepam (1ª escolha sem hepatopatia)","dose":"10-20 mg VO 4-6/6h conforme CIWA, titular","via":"VO","duracao":"3-7 dias com desmame","obs":"meia-vida longa = desmame natural","drug_slug":"diazepam"},
    {"droga":"Lorazepam (1ª escolha em hepatopatia)","dose":"1-2 mg VO/IV 4-6/6h conforme CIWA","via":"VO ou IV","obs":"sem metabólito ativo — segura em hepatopatia. Útil em delirium tremens UTI","drug_slug":"lorazepam"},
    {"droga":"Esquema CIWA-Ar (titulação por sintomas)","obs":"avaliar a cada 1-2h. CIWA 8-15: BZD em SOS. >15: BZD a cada 1-2h até CIWA <8. Reduz uso desnecessário de BZD"},
    {"droga":"Carbamazepina (alternativa em abstinência leve-moderada)","dose":"200-400 mg 8/8h × 5-7d","via":"VO","obs":"alternativa a BZD em paciente com história abuso BZD ou idoso. Sem dependência","drug_slug":"carbamazepina"},
    {"droga":"Magnésio sulfato","dose":"2 g IV/IM 1x/dia","obs":"reposição em hipomagnesemia (comum). Reduz convulsão"},
    {"droga":"Folato + complexo B","dose":"folato 1-5 mg/dia + multivit B","obs":"deficiências múltiplas em alcoólatra"},
    {"droga":"Hidratação","obs":"SF 0,9% conforme volemia. NÃO ROTINEIRA em superhidratação se euvolêmico"},
    {"droga":"Naltrexona (manutenção - prevenção recidiva)","dose":"50 mg VO/dia (após desintoxicação)","via":"VO","obs":"reduz craving + recidiva. Iniciar após abstinência aguda. Cuidado: contraindicado em uso de opioides (pode precipitar abstinência)"},
    {"droga":"Acamprosato (manutenção)","dose":"666 mg 8/8h","obs":"reduz craving. Inocuo em hepatopatia"},
    {"droga":"Dissulfiram (aversivo)","dose":"250 mg/dia","obs":"causa reação intensa com álcool (cefaleia, vômito, taquicardia, hipotensão). Apenas em paciente motivado, sob supervisão"}
  ]$$::jsonb,
  ARRAY[
    'WERNICKE-KORSAKOFF (encefalopatia + ataxia + oftalmoplegia): TIAMINA EM ALTA DOSE IMEDIATAMENTE — antes de glicose, antes de qualquer outra coisa',
    'CIWA-Ar (Clinical Institute Withdrawal Assessment Alcohol revised): escala de 10 itens, 0-67 pontos. Direciona sintomas + dose BZD',
    'DELIRIUM TREMENS: 5% dos pacientes — confusão grave + alucinação + tremor + autonomia simpática extrema. Mortalidade 5% sem tratamento, <1% com. UTI, BZD altas doses',
    'CONVULSÃO ABSTINÊNCIA: geralmente 6-48h após última dose. BZD profilático em pacientes com história',
    'MOTIVAÇÃO PARA TRATAMENTO: aproveitar internação para encaminhar AA, terapia, manutenção (naltrexona/acamprosato)',
    'CO-DEPENDÊNCIAS comuns: BZD, opioide, cocaína — investigar'
  ],
  ARRAY['CIWA-Ar a cada 1-2h','Hemograma + plaquetas (anemia, mielossupressão alcoólica)','Função hepática + INR','Função renal + eletrólitos (Mg, Fosfato, K, Na)','Glicemia capilar (hipoglicemia comum)','Lactato (cetoacidose alcoólica)','Painel toxicológico (co-uso)','TC crânio se trauma/foco','ECG (cardiomiopatia)','Beta-HCG mulher idade fértil'],
  ARRAY['NUNCA dar GLICOSE ANTES de tiamina em alcoólatra → PRECIPITA WERNICKE','BZD em uso prolongado: dependência cruzada — desmame gradual ao final','SE PACIENTE EM USO DE OPIOIDE: NÃO usar naltrexona (precipita abstinência opioide)','HEPATOPATIA AVANÇADA: lorazepam é preferível ao diazepam','HIPOFOSFATEMIA: pode causar fraqueza muscular e arritmias durante reabilitação — repor','PACIENTE FOI DESINTOXICADO MAS SEM PLANO DE MANUTENÇÃO = vai recidivar — SEMPRE encaminhar para acompanhamento ambulatorial + grupo de apoio'],
  'WHO Alcohol 2024 / NIAAA',
  'https://www.niaaa.nih.gov/health-professionals-communities/core-resource-on-alcohol',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
