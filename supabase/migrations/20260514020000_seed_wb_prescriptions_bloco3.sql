-- PreceptorBook: Prescrições Bloco 3 (6 doenças)
-- Depressão maior, TAG, hipotireoidismo, hipertireoidismo, DPOC manutenção, transtorno bipolar

-- 1. DEPRESSÃO MAIOR
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'depressao-maior',
  'Depressão maior — primeiro episódio',
  'Depressão',
  'Adulto com depressão moderada-grave (PHQ-9 ≥ 10), sem mania prévia',
  'Ambulatorial',
  'ISRS é primeira linha. Manter ≥6-12 meses após remissão. Psicoterapia (TCC) eleva resposta. Se refratário: troca de classe ou potencialização.',
  $$[
    {"droga":"Sertralina (1ª escolha)","dose":"INICIAR 50 mg/dia (25 mg em ansiosos × 1 sem), titular até 100-200 mg/dia em 2-4 sem","via":"VO","frequencia":"1x/dia (manhã ou noite)","duracao":"6-12 meses pós-remissão (1º episódio); indefinido se ≥3 episódios","obs":"resposta em 4-6 sem. Boa tolerância, melhor para gestante/lactante","drug_slug":"sertralina"},
    {"droga":"Escitalopram (alternativa 1ª escolha)","dose":"INICIAR 10 mg/dia, max 20 mg","via":"VO","frequencia":"1x/dia","obs":"melhor perfil de tolerância. Cuidado QT em idoso (10 mg max)","drug_slug":"escitalopram"},
    {"droga":"Fluoxetina","dose":"20-60 mg/dia (manhã)","via":"VO","obs":"meia-vida longa = tolera esquecimento. Mais ativadora — útil se hipersônia/inibição","drug_slug":"fluoxetina"},
    {"droga":"Venlafaxina (refratária a 2 ISRS)","dose":"75 mg/dia → 150-225 mg/dia","via":"VO","obs":"IRSN — útil se sintomas físicos/dor associados. Monitor PA","drug_slug":"venlafaxina"},
    {"droga":"Bupropiona (alternativa não-serotoninérgica)","dose":"150 mg/dia × 4d → 300 mg/dia (XR 1x/dia)","via":"VO","obs":"sem disfunção sexual e sem ganho peso. Pode reduzir limiar convulsivo — evitar em epilepsia/bulimia"},
    {"droga":"Quetiapina XR (potencialização)","dose":"150-300 mg/dia (noite)","via":"VO","obs":"adjuvante em depressão refratária a ISRS. Cuidado metabólico","drug_slug":"quetiapina"},
    {"droga":"Psicoterapia cognitivo-comportamental (TCC)","obs":"INDICADA — equivalente a antidepressivo em casos leve-moderado, sinérgica em moderado-grave. 12-20 sessões"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAR risco de suicídio em TODA consulta (ideação, plano, intenção, acesso a meios)',
    'PHQ-9 para diagnóstico e seguimento — meta redução ≥50% em 4-6 sem',
    'DESCARTAR bipolaridade antes de iniciar (questionar episódios de mania/hipomania) — antidepressivo isolado pode precipitar mania',
    'Investigar hipotireoidismo, anemia, B12, abuso de substâncias, fatores estressantes',
    'Reavaliar em 2-4 sem após início; ajustar em 4-6 sem se resposta parcial; trocar em 8 sem se sem resposta'
  ],
  ARRAY['TSH','Hemograma','Vitamina B12 + ácido fólico','Função hepática + renal','Glicemia','Sorologias se contexto','Beta-HCG mulher idade fértil'],
  ARRAY['BLACK BOX FDA: ideação suicida em <25 anos primeiras 4-6 sem — monitor próximo','LATÊNCIA 2-4 sem para efeito — orientar paciente para não desistir','SÍNDROME DE DESCONTINUAÇÃO em desmame abrupto (especialmente venlafaxina, paroxetina) — desmamar em 2-4 sem','SÍNDROME SEROTONINÉRGICA: agitação + tremor + diarreia + hipertermia em uso de 2 serotoninérgicos — emergência','EVITAR FLUOXETINA em pacientes em uso de TAMOXIFENO (interação CYP2D6)','EVITAR ISRS em paciente com risco hemorragia GI alto (associar IBP se necessário)'],
  'Diretriz APA 2010 / NICE 2022',
  'https://psychiatryonline.org/guidelines',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. TRANSTORNO DE ANSIEDADE GENERALIZADA (TAG)
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'tag-ansiedade-generalizada',
  'Transtorno de ansiedade generalizada — manejo',
  'Transtornos de ansiedade',
  'Adulto com preocupação excessiva e crônica (≥6 meses), GAD-7 ≥10, com prejuízo funcional',
  'Ambulatorial',
  'ISRS/IRSN é primeira linha (não BZD). TCC é tão eficaz quanto medicação. BZD apenas curto prazo, em crises pontuais.',
  $$[
    {"droga":"Escitalopram","dose":"10-20 mg/dia","via":"VO","obs":"PRIMEIRA ESCOLHA — perfil tolerância excelente. Resposta 4-6 sem","drug_slug":"escitalopram"},
    {"droga":"Sertralina","dose":"INICIAR 25 mg × 1 sem (evitar piora ansiedade) → 50-200 mg/dia","via":"VO","drug_slug":"sertralina"},
    {"droga":"Venlafaxina XR","dose":"75-225 mg/dia","via":"VO","obs":"IRSN — alternativa em paciente com sintomas físicos predominantes","drug_slug":"venlafaxina"},
    {"droga":"Buspirona","dose":"INICIAR 5 mg 8/8h, titular 15-30 mg/dia","via":"VO","obs":"antiansiedade não-BZD, sem dependência. Latência 2-4 sem. Útil em paciente com dependência prévia"},
    {"droga":"Pregabalina","dose":"INICIAR 75 mg 12/12h, titular até 300-450 mg/dia","via":"VO","obs":"alternativa em casos refratários. Risco abuso (esquema especial). Atenção em idoso (sedação, edema)"},
    {"droga":"Clonazepam (apenas curto prazo)","dose":"0,25-1 mg 12/12h","via":"VO","duracao":"≤2-4 semanas, ponte até ISRS agir","obs":"USO LIMITADO. Risco dependência, queda em idoso, acidentes. NUNCA primeira escolha em manutenção"},
    {"droga":"TCC","obs":"PRIMEIRA ESCOLHA NÃO-FARMACOLÓGICA — eficácia equivalente a medicação. 12-20 sessões"}
  ]$$::jsonb,
  ARRAY[
    'TAG ≠ ataques de pânico ≠ TOC ≠ fobia social — diferenciar para tratamento adequado',
    'COMORBIDADE com depressão é regra (>60%) — tratar simultaneamente',
    'GAD-7 para seguimento (≤4 = remissão; 5-9 = leve)',
    'Investigar consumo de cafeína, álcool, drogas, distúrbio do sono',
    'BZD não é tratamento de longo prazo — risco dependência, tolerância, deterioração cognitiva'
  ],
  ARRAY['TSH (descartar hipertireoidismo)','Hemograma','Glicemia','ECG se BB indicado','Avaliação neurológica em casos atípicos'],
  ARRAY['BENZODIAZEPÍNICO É CRÔNICO É ARMADILHA — em ≥4 sem cria dependência. Em idoso: aumenta queda 50%, demência, mortalidade','PARADOXO: ISRS pode INICIALMENTE piorar ansiedade nas 1-2 primeiras sem — começar dose baixa, avisar paciente, BZD ponte se necessário','Buspirona não tem efeito imediato — não usar como SOS','Pregabalina entrou na lista de psicotrópicos do Brasil — receita de controle especial'],
  'Diretriz NICE 2020 / WFSBP 2017',
  'https://www.nice.org.uk/guidance/cg113',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. HIPOTIREOIDISMO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hipotireoidismo',
  'Hipotireoidismo primário — reposição',
  'Hipotireoidismo',
  'TSH > 10 ou TSH 4-10 com sintomas / anti-TPO+ / gestação',
  'Ambulatorial',
  'Levotiroxina é única opção. Dose 1,6 mcg/kg/dia em jovem hígido; iniciar baixo em idoso/cardiopata.',
  $$[
    {"droga":"Levotiroxina (T4)","dose":"jovem hígido: 1,6 mcg/kg/dia (≈ 100-125 mcg/dia). Idoso: 25-50 mcg, titular 25 mcg cada 4-6 sem. Cardiopata: 12,5-25 mcg, titular lentamente","via":"VO","frequencia":"1x/dia em JEJUM (30-60 min antes do café)","duracao":"contínuo","obs":"meta TSH: 0,4-4,0 (geral); 0,5-2,5 em gestante; manter elevado em idoso (1-4 mcU/mL)","drug_slug":"levotiroxina"}
  ]$$::jsonb,
  ARRAY[
    'TOMAR EM JEJUM — café/leite/ferro/cálcio reduzem absorção em até 40%. Esperar 30-60 min antes da refeição',
    'REAVALIAR TSH em 6-8 SEMANAS após início ou ajuste de dose (o T4 leva tempo para equilibrar)',
    'Em gestação: aumentar dose 25-30% IMEDIATAMENTE com confirmação (TSH alvo <2,5 no 1º trim, <3,0 no 2º-3º)',
    'NÃO trocar marca — diferenças de absorção entre fabricantes'
  ],
  ARRAY['TSH ultrassensível (rastreio)','T4 livre (confirmação se TSH alterado)','Anti-TPO + anti-TG (Hashimoto)','Colesterol total (pode estar alto, reduz com tratamento)','USG tireoide se palpável','TSH controle a cada 6-8 sem até estável; depois anual'],
  ARRAY['SUPERDOSAGEM (T4 alto, TSH suprimido) → osteoporose, fibrilação atrial, sintomas hipertireoidismo. Comum em idoso','EM IDOSO/CARDIOPATA: iniciar dose baixa — risco angina/IAM/arritmia se reposição rápida','GESTAÇÃO: necessidade aumenta 25-50% — orientar paciente para aumentar 25-30% logo na confirmação','HIPOTIREOIDISMO SUBCLÍNICO (TSH 4-10): tratar se sintomas, gestante, anti-TPO+, dislipidemia, IC, infertilidade'],
  'Diretriz SBEM 2023 / ATA 2014',
  'https://www.endocrino.org.br/diretrizes',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. HIPERTIREOIDISMO (Doença de Graves)
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hipertireoidismo-graves',
  'Hipertireoidismo (Graves) — manejo inicial',
  'Hipertireoidismo',
  'TSH suprimido + T4L/T3L elevados + TRAb+ ou cintilografia com captação difusa',
  'Ambulatorial',
  'Tripé terapêutico: tireostático (metimazol) + beta-bloqueador (sintomático) + decisão de tratamento definitivo (radioiodo ou cirurgia).',
  $$[
    {"droga":"Metimazol (tapazol) — 1ª escolha","dose":"INICIAR 10-30 mg/dia (T4L 1-1,5x normal: 10 mg; 1,5-2x: 20 mg; >2x: 30 mg). Manutenção 5-10 mg/dia","via":"VO","frequencia":"1x/dia ou 8/8h","duracao":"12-18 meses (Graves) com meta de remissão","obs":"PRIMEIRA ESCOLHA. Mais eficaz que PTU, menos hepatotoxicidade. EXCETO 1º trim gestação: usar PTU"},
    {"droga":"Propiltiouracil (PTU)","dose":"100-300 mg 8/8h, ataque","via":"VO","obs":"USAR APENAS: 1º trim gestação, crise tireotóxica, intolerância ao metimazol. RISCO hepatite fulminante (Black Box)"},
    {"droga":"Propranolol — controle sintomático","dose":"40-80 mg 8/8h ou 6/6h","via":"VO","obs":"BB NÃO-SELETIVO preferido — controla taquicardia + tremor + reduz conversão T4→T3. Continuar até T4 normalizar","drug_slug":"propranolol"},
    {"droga":"Radioiodo (I-131) — tratamento definitivo","dose":"10-20 mCi VO dose única","via":"VO","obs":"escolha em maioria dos adultos. CONTRAINDICADO em: gestação, lactação, oftalmopatia ativa moderada-grave (pode piorar). Evitar concepção 6 meses pós-tratamento"},
    {"droga":"Tireoidectomia total","obs":"escolha se: bócio volumoso/compressivo, suspeita malignidade, oftalmopatia grave, intolerância às outras opções, gestante refratária"},
    {"droga":"Levotiroxina (após tratamento definitivo)","dose":"1,6 mcg/kg/dia","via":"VO","obs":"reposição vitalícia após radioiodo (90% hipotireoidismo em 1 ano) ou tireoidectomia","drug_slug":"levotiroxina"}
  ]$$::jsonb,
  ARRAY[
    'TRAb POSITIVO confirma Graves — não precisa cintilografia se TRAb alto + clínica clássica',
    'Avaliar OFTALMOPATIA (presente em ~25% — exoftalmia, retração palpebral, diplopia) — orienta tratamento',
    'PARAR DE FUMAR — fator de progressão da oftalmopatia',
    'Manter TSH/T4L 4-6 sem após início e mensalmente até estável; depois 2-3 meses'
  ],
  ARRAY['TSH + T4L + T3L','TRAb (Graves)','Anti-TPO/anti-TG','Cintilografia tireoide com 99mTc ou I-123 (se TRAb negativo)','USG tireoide','Hemograma (rastreio agranulocitose pré-metimazol)','Função hepática (rastreio antes e periódica)','ECG'],
  ARRAY['AGRANULOCITOSE com tireostáticos: 0,2-0,5%, geralmente 1ºs 90 dias — ORIENTAR paciente buscar emergência se febre + dor garganta. Coletar hemograma. NÃO rastrear rotineiramente, mas medir basal','HEPATOTOXICIDADE: PTU > metimazol — monitor TGO/TGP. PTU tem Black Box de hepatite fulminante','GESTAÇÃO: PTU no 1º trim, METIMAZOL no 2º-3º (risco aplasia cutis com metimazol no 1º trim)','CRISE TIREOTÓXICA: febre, taquicardia >140, alteração consciência, IC — emergência. PTU + lugol + propranolol + corticoide + UTI','OFTALMOPATIA ATIVA: NÃO usar radioiodo (pode piorar). Tratar com corticoide IV, teprotumumab'],
  'Diretriz ATA 2016 / SBEM 2022',
  'https://www.thyroid.org/professionals/ata-professional-guidelines/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. DPOC — manutenção
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'dpoc-manutencao',
  'DPOC — tratamento de manutenção',
  'DPOC',
  'DPOC confirmada (VEF1/CVF <0,7 pós-broncodilatador) classificada GOLD A-D',
  'Ambulatorial',
  'CESSAÇÃO DO TABAGISMO é a única intervenção que muda história natural. Broncodilatador é base; corticoide inalatório apenas em fenótipo eosinofílico/exacerbador.',
  $$[
    {"droga":"Broncodilatador de curta ação SOS","dose":"salbutamol 100-200 mcg + ipratrópio 40-80 mcg","via":"INALAT (MDI 2-4 puffs com espaçador)","frequencia":"a cada 4-6h se necessário","obs":"para todos os pacientes — alívio sintomático","drug_slug":"salbutamol"},
    {"droga":"LAMA (tiotrópio) — GOLD B/E","dose":"18 mcg/dia (Spiriva HandiHaler) ou 2,5 mcg 2x/dia (Respimat)","via":"INALAT","frequencia":"1x/dia","obs":"LAMA isolado é primeira escolha em DPOC GOLD B (sintomático sem exacerbação)"},
    {"droga":"LABA + LAMA dupla broncodilatação — GOLD B/E","dose":"olodaterol+tiotrópio (Spiolto), umeclidínio+vilanterol (Anoro), formoterol+aclidinio (Duaklir) — 1x/dia","via":"INALAT","obs":"superior a monoterapia em pacientes sintomáticos"},
    {"droga":"LABA+LAMA+CI tripla terapia — GOLD E (exacerbador)","dose":"vilanterol+umeclidínio+furoato fluticasona (Trelegy) ou formoterol+glicopirrônio+budesonida (Trimbow) — 1x/dia","via":"INALAT","obs":"INDICADA se ≥2 exacerbações/ano OU 1 hospitalização. ETHOS/IMPACT: reduz mortalidade. Eosinófilos ≥300 favorecem CI"},
    {"droga":"Roflumilaste","dose":"500 mcg/dia","via":"VO","obs":"adjuvante em fenótipo bronquite + VEF1 <50% + exacerbação. Náusea/diarreia/perda peso comuns"},
    {"droga":"Azitromicina (profilática)","dose":"250 mg/dia ou 500 mg 3x/sem","via":"VO","duracao":"6-12 meses","obs":"em ex-fumante com exacerbação frequente apesar tripla. Atenção QT, ototoxicidade, resistência"},
    {"droga":"Vacinas","obs":"Influenza ANUAL + Pneumocócica (PCV13 + PPSV23) + Tdap + COVID-19 + ZOSTER ≥50a"},
    {"droga":"Reabilitação pulmonar","obs":"INDICADA se mMRC ≥2 — reduz dispneia, aumenta tolerância exercício, reduz hospitalizações"},
    {"droga":"O2 domiciliar (longo prazo)","dose":"≥15h/dia","obs":"se PaO2 ≤55 ou SatO2 ≤88% em repouso (ou ≤59/89% se cor pulmonale/policitemia). ÚNICO tratamento que reduz mortalidade"}
  ]$$::jsonb,
  ARRAY[
    'PARAR DE FUMAR é a única intervenção que altera a história natural — todas as consultas reforçar + oferecer terapia (vareniclina, bupropiona, NRT)',
    'AVALIAÇÃO ANUAL: mMRC, CAT, exacerbações, espirometria',
    'EXACERBAÇÃO leve: aumentar BD curto. Moderada: + corticoide VO 5d (prednisolona 40 mg) ± ATB se purulento. Grave: hospitalizar',
    'Rastreio CA pulmão em fumante 50-80a com ≥20 anos-maço: TC baixa dose anual'
  ],
  ARRAY['Espirometria (basal + anual)','Rx tórax / TC se suspeita complicação','SatO2','Gasometria se SatO2 <92%','Eosinófilos sanguíneos (orientar uso CI)','BNP/eco TT se cor pulmonale suspeita'],
  ARRAY['CORTICOIDE INALATÓRIO em DPOC: NÃO é benefício universal. Reservar para exacerbador ou eosinofílico (≥300). Risco pneumonia 2x','BB CARDIO-SELETIVOS são SEGUROS em DPOC — não contraindicar se há indicação cardio','SatO2 alvo: 88-92% em retentor de CO2 (não hipersaturar — risco hipercapnia)','OXIGENIOTERAPIA é única que muda mortalidade junto com cessação tabagismo','Triplo terapia se ≥2 exacerbação/ano apesar LABA+LAMA + eosinófilos ≥100'],
  'GOLD 2024',
  'https://goldcopd.org/2024-gold-report/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 6. TRANSTORNO BIPOLAR — manutenção
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'transtorno-bipolar-manutencao',
  'Transtorno bipolar — manutenção',
  'Transtorno bipolar',
  'Adulto com TB I/II após estabilização da fase aguda (mania, hipomania ou depressão bipolar)',
  'Ambulatorial',
  'Estabilizador é base. Lítio é única evidência forte de redução de suicídio. Evitar antidepressivo em monoterapia (vira mania).',
  $$[
    {"droga":"Lítio carbonato","dose":"600-1200 mg/dia (alvo litemia 0,6-1,0 mEq/L)","via":"VO","frequencia":"8/8h ou 12/12h CR","duracao":"contínua, vitalícia se ≥2 episódios","obs":"PRIMEIRA ESCOLHA. ÚNICO com evidência forte redução suicídio. Litemia 12h pós-dose","drug_slug":"litio"},
    {"droga":"Ácido valproico","dose":"500-1500 mg/dia (alvo 50-125 mcg/mL)","via":"VO","frequencia":"12/12h ou DR 1x/dia","obs":"alternativa ao lítio. CONTRAINDICADO em mulher idade fértil (teratogênico — espinha bífida 3-5%, autismo)"},
    {"droga":"Lamotrigina","dose":"INICIAR 25 mg/dia × 2 sem → 50 mg × 2 sem → 100 mg → 200 mg/dia","via":"VO","obs":"ESPECÍFICO para fase depressiva bipolar. Titulação OBRIGATÓRIA lenta — risco Stevens-Johnson"},
    {"droga":"Quetiapina XR (estabilizador atípico)","dose":"300-600 mg/dia (noite)","via":"VO","obs":"eficaz em mania, depressão bipolar e manutenção. Cuidado metabólico","drug_slug":"quetiapina"},
    {"droga":"Olanzapina","dose":"5-20 mg/dia","via":"VO","obs":"eficaz mas alto ganho metabólico. Reservar para falha de outros","drug_slug":"olanzapina"},
    {"droga":"Antidepressivo (CUIDADO)","obs":"NÃO usar em monoterapia (vira mania). Apenas associado a estabilizador, em depressão bipolar refratária. Preferir bupropiona/sertralina (menor risco viragem)"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAR risco SUICÍDIO em toda consulta — TB tem 15-20x maior risco que população geral',
    'PSICOEDUCAÇÃO + adesão são fundamentais — entender prodromos ajuda prevenir recidiva',
    'Reconhecer GATILHOS: privação de sono, álcool, drogas, estresse, viagem com fuso',
    'Manutenção 2 anos após 1º episódio se grave; 5 anos se 2 episódios; vitalícia se ≥3 ou episódio grave/psicótico',
    'Acompanhamento psiquiátrico contínuo + rede de suporte familiar'
  ],
  ARRAY['Litemia (cada 5d até estável; depois trimestral)','TSH/T4L semestral (lítio)','Função renal trimestral (lítio)','Hemograma + função hepática (valproato)','Peso, glicemia, lipídios (atípicos)','ECG (lítio + atípicos)'],
  ARRAY['LÍTIO: janela estreita — desidratação, AINE, IECA, tiazídicos podem precipitar toxicidade. Sintomas: tremor grosseiro, ataxia, confusão. Litemia >2,5 = HEMODIÁLISE','VALPROATO: TERATOGÊNICO — evitar em mulher idade fértil. Hepatotoxicidade, pancreatite, plaquetopenia','LAMOTRIGINA: Stevens-Johnson em ~0,1% (mais em titulação rápida) — qualquer rash deve suspender','ANTIDEPRESSIVO ISOLADO em TB → vira mania ou ciclagem rápida. SEMPRE associado a estabilizador','MULHER em idade fértil: lítio (categoria D mas seguro com monitor) > lamotrigina > quetiapina. EVITAR valproato'],
  'CANMAT 2018 / NICE 2023',
  'https://www.canmat.org/clinical-guidelines/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
