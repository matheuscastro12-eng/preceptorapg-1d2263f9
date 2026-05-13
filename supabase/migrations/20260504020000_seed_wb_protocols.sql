-- Phase 2.2: seed dos 12 protocolos clínicos essenciais (cobrem ~70%
-- das urgências e doenças crônicas mais prevalentes).
-- Conteúdo sintetizado de diretrizes públicas brasileiras (SBC, SBD,
-- SBPT, SBI, Febrasgo, MS) + Surviving Sepsis 2021 + GINA 2024 + GOLD 2024.
-- Re-seedável via ON CONFLICT.

-- ============================================================
-- 1. SEPSE E CHOQUE SÉPTICO
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'sepse',
  'Sepse e choque séptico',
  'Emergência',
  'PA / Emergência / UTI',
  'Disfunção orgânica ameaçadora à vida causada por resposta desregulada do hospedeiro à infecção. Choque séptico = sepse + necessidade de vasopressor + lactato > 2 mmol/L apesar de ressuscitação volêmica.',
  $$[
    {"item":"Sepse","def":"Infecção suspeita ou confirmada + SOFA ≥ 2 pontos novos"},
    {"item":"Choque séptico","def":"Sepse + vasopressor para PAM ≥ 65 mmHg + lactato > 2 mmol/L apesar de volume"},
    {"item":"qSOFA (triagem extra-UTI, baixa sensibilidade)","def":"≥ 2 dos 3: FR ≥ 22, alteração mental (Glasgow < 15), PAS ≤ 100"},
    {"item":"NEWS-2 ou MEWS","def":"escores de triagem mais sensíveis que qSOFA para reconhecer sepse precoce"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Reconhecimento e ativação de protocolo nas primeiras horas","detalhes":"Hora 0 = momento do reconhecimento; iniciar 'pacote de 1 hora' (Surviving Sepsis 2021)"},
    {"passo":2,"acao":"Coletar lactato, hemoculturas (2 pares antes ATB se não atrasar > 45 min) e exames-base","detalhes":"Hemograma, função renal, hepática, coagulograma, gasometria, urocultura, RX tórax conforme foco"},
    {"passo":3,"acao":"Antibioticoterapia empírica em ≤ 1 hora se choque, ≤ 3 horas se sepse sem choque","detalhes":"Cobrir foco provável: comunidade respiratório (ceftriaxona + macrolídeo) / urinário (ceftriaxona) / abdominal (piperacilina-tazobactam ou cefepime + metronidazol) / hospitalar (piperacilina-tazo ou meropenem ± vanco)"},
    {"passo":4,"acao":"Cristaloide 30 mL/kg em 3 horas se hipotensão ou lactato ≥ 4","detalhes":"Reavaliar a cada 500 mL: status volêmico (US POCUS, eleva-perna, VPP/VVS), lactato, perfusão. Não infundir cegamente em IC ou DRC"},
    {"passo":5,"acao":"Vasopressor se PAM < 65 após cristaloide","detalhes":"Noradrenalina 1ª escolha (iniciar 0,05 mcg/kg/min via central ou periférica grossa por curto período); adicionar vasopressina 0,03 U/min se NA > 0,25 mcg/kg/min; epinefrina como 3ª opção"},
    {"passo":6,"acao":"Controle do foco em ≤ 6–12h","detalhes":"Drenagem de coleções, retirada de cateter infectado, desbridamento de fasceíte, etc"},
    {"passo":7,"acao":"Suporte adjuvante","detalhes":"Hidrocortisona 200 mg/dia se choque refratário; controle glicêmico < 180 mg/dL; profilaxia TVP; estratégia VM protetora se SDRA"},
    {"passo":8,"acao":"Reavaliar ATB em 48–72h","detalhes":"Descalonar conforme cultura; duração total geralmente 7–10 dias; calcular qSOFA/SOFA seriado"}
  ]$$::jsonb,
  ARRAY['Lactato seriado (basal e a cada 2–4h)','Hemoculturas 2 pares','Urocultura','Hemograma com leucograma','Função renal e hepática','Coagulograma','Gasometria arterial','RX tórax','PCR e procalcitonina (auxiliar diagnóstico)','TC ou US conforme foco'],
  ARRAY['Hipotensão refratária a > 2 L cristaloide','Lactato > 4 mmol/L','PaO2/FiO2 < 300','Glasgow < 13','Anúria persistente','Petéquias / púrpura (Waterhouse-Friderichsen)','Sangramento espontâneo (CIVD)'],
  'Surviving Sepsis Campaign 2021 + Diretriz ILAS Brasil 2018 (atualização 2023)',
  'https://www.sccm.org/SurvivingSepsisCampaign/Guidelines/Adult-Patients',
  '2021-10-04',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  red_flags = EXCLUDED.red_flags,
  updated_at = now();

-- ============================================================
-- 2. INFARTO AGUDO DO MIOCÁRDIO COM SUPRA (STEMI)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'iam-stemi',
  'IAM com supradesnível de ST (STEMI)',
  'Cardiologia',
  'Emergência / Hemodinâmica',
  'Oclusão coronariana epicárdica completa, geralmente trombótica sobre placa rota. Tratamento é REPERFUSÃO RÁPIDA: angioplastia primária em ≤ 90 min ou trombolítico em ≤ 30 min do contato médico se ICP indisponível em 120 min.',
  $$[
    {"item":"Clínico","def":"Dor torácica anginosa típica > 20 min sem alívio com nitrato, com sintomas adrenérgicos"},
    {"item":"ECG","def":"Supra-ST ≥ 1 mm em 2 derivações contíguas (≥ 2 mm em V2-V3 homem, ≥ 1,5 mm V2-V3 mulher) OU BRE novo OU IAM posterior (depressão V1-V3 espelho)"},
    {"item":"Marcadores","def":"Troponina elevada (não é necessária para indicar reperfusão emergencial)"},
    {"item":"Equivalentes de STEMI","def":"De Winter (downsloping inicial em V1-V6 + supra em aVR), Wellens (T bifásica em V2-V3), Sgarbossa em BRE prévio"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"ECG em ≤ 10 min do primeiro contato","detalhes":"Ativar Hemodinâmica imediatamente se STEMI confirmado"},
    {"passo":2,"acao":"MOVE: Monitor, O2 (se SatO2 < 90%), Veia, ECG","detalhes":"Não usar O2 rotineiramente em SatO2 ≥ 90% (pode ser deletério)"},
    {"passo":3,"acao":"Antiagregação dupla: AAS + 2º antiplaquetário","detalhes":"AAS 162–325 mg VO mastigado; ticagrelor 180 mg VO (preferido) ou clopidogrel 600 mg VO se ICP / 300 mg se trombolítico (>75a: 75 mg)"},
    {"passo":4,"acao":"Anticoagulação","detalhes":"HNF 60 U/kg bolus IV (max 4000 U) + 12 U/kg/h em ICP; enoxaparina 30 mg IV bolus + 1 mg/kg SC em trombolítico"},
    {"passo":5,"acao":"REPERFUSÃO","detalhes":"ICP primária se contato com hemodinâmica em ≤ 120 min (porta-balão ≤ 90 min). Se NÃO disponível: trombolítico (tenecteplase peso-ajustada IV bolus) em ≤ 30 min, depois transferir para ICP de resgate ou rotina (3–24h)"},
    {"passo":6,"acao":"Adjuvantes","detalhes":"Beta-bloqueador VO em ≤ 24h se sem contraindicação (não IV de rotina, COMMIT trial); IECA em ≤ 24h se FE reduzida ou anterior; estatina alta intensidade desde admissão"},
    {"passo":7,"acao":"Pós-IAM","detalhes":"Manter dupla antiagregação 12 meses (AAS + ticagrelor/clopidogrel); AAS perpétuo; estatina alta intensidade; IECA/BRA; beta-bloq; reabilitação cardíaca; controle DM/HAS/dislipidemia/cessação tabagismo"}
  ]$$::jsonb,
  ARRAY['ECG 12 derivações + V3R/V4R/V7-V9 se inferior','Troponina','Hemograma, função renal','Coagulograma','Glicemia, eletrólitos','RX tórax','Ecocardiograma após estabilização','Cateterismo cardíaco em hemodinâmica'],
  ARRAY['Choque cardiogênico (Killip IV)','Arritmia ventricular maligna','Bloqueio AV total','Edema agudo de pulmão (Killip III)','Dor torácica + assimetria de pulsos (dissecção de aorta — contraindica trombolítico)','Sopro novo de insuficiência mitral aguda (ruptura papilar)'],
  'Diretriz SBC IAM 2024 + ESC STEMI 2023',
  'https://www.scielo.br/j/abc/a/ABC-2024-IAM-SBC',
  '2024-03-15',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 3. AVC ISQUÊMICO AGUDO
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'avc-isquemico',
  'AVC isquêmico agudo',
  'Neurologia',
  'Emergência / UTI / Stroke unit',
  'Déficit neurológico súbito por oclusão arterial. Janela de trombólise IV: 4,5 horas do início dos sintomas. Trombectomia mecânica até 24h em oclusões de grandes vasos com penumbra (DAWN/DEFUSE-3).',
  $$[
    {"item":"Clínico","def":"Déficit focal súbito: hemiparesia, afasia, hemianopsia, ataxia, disartria"},
    {"item":"NIHSS","def":"escore 0–42; > 6 sugere oclusão de grande vaso; calcular sempre"},
    {"item":"TC sem contraste","def":"primeiro exame; afasta hemorragia; pode mostrar sinais precoces (apagamento de sulcos, hipodensidade > 1/3 ACM)"},
    {"item":"AngioTC ou angioRM","def":"detecta oclusão de grande vaso (TICA, M1/M2, basilar) — candidato a trombectomia"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Reconhecer sinais (FAST: Face, Arm, Speech, Time)","detalhes":"Tempo de início = última vez visto bem; FAZ DIFERENÇA na elegibilidade"},
    {"passo":2,"acao":"TC de crânio sem contraste em ≤ 25 min da chegada","detalhes":"Excluir hemorragia"},
    {"passo":3,"acao":"Avaliar elegibilidade para trombólise IV","detalhes":"Sintomas < 4,5h, NIHSS ≥ 4 (ou déficit incapacitante), TC sem hemorragia, sem contraindicações (sangramento ativo, AVC < 3m, plaquetopenia, INR > 1,7, PA > 185/110 não controlável)"},
    {"passo":4,"acao":"Trombólise IV se elegível: alteplase 0,9 mg/kg (max 90 mg) — 10% bolus, 90% em 1h","detalhes":"Manter PA < 180/105 nas primeiras 24h; tenecteplase 0,25 mg/kg bolus único é alternativa (AHA 2024)"},
    {"passo":5,"acao":"Trombectomia mecânica se oclusão grande vaso + ASPECTS ≥ 6 + janela ≤ 6h (ou ≤ 24h com mismatch perfusão)","detalhes":"Indicação: TICA, M1, M2 proximal, basilar; AHA classe I"},
    {"passo":6,"acao":"Suporte: PA < 220/120 (ou < 180/105 se trombolisado), glicemia 140–180, normotermia","detalhes":"Não tratar HAS agressivamente fora do contexto de trombólise"},
    {"passo":7,"acao":"AAS 100–300 mg em 24–48h se não trombolisado, ou 24h após trombólise","detalhes":"Em AVC menor (NIHSS ≤ 5) ou AIT alto risco: dupla antiagregação AAS + clopidogrel por 21 dias (CHANCE/POINT)"},
    {"passo":8,"acao":"Investigação etiológica e prevenção secundária","detalhes":"Holter, ecocardio, USG carótidas, lipidograma; iniciar estatina alta intensidade; controle HAS/DM; avaliar anticoagulação se FA"}
  ]$$::jsonb,
  ARRAY['TC crânio sem contraste imediata','AngioTC ou angioRM (se candidato a trombectomia)','Glicemia capilar (excluir hipoglicemia mimickers)','Hemograma, coagulograma','Eletrólitos, função renal','ECG','Troponina','Lipidograma','HbA1c','Ecocardiograma TT','USG doppler carótidas','Holter 24h ou monitor cardíaco prolongado se criptogênico'],
  ARRAY['NIHSS > 25 (limite superior tradicional para trombólise; AHA 2024 não exclui)','Convulsão ao início (avaliar mimickers — Todd''s paralysis)','Hemorragia em qualquer território','PA > 185/110 não controlável','Suspeita de dissecção arterial','TC com hipodensidade > 1/3 ACM (pior prognóstico)'],
  'AHA/ASA 2019 update 2024 + Diretriz Brasileira AVC 2023',
  'https://www.ahajournals.org/doi/10.1161/STR.0000000000000211',
  '2024-01-22',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 4. HAS — manejo ambulatorial
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'has-ambulatorial',
  'Hipertensão arterial: manejo ambulatorial',
  'Cardiologia',
  'Atenção primária',
  'Diagnóstico exige ≥ 2 medidas em ≥ 2 consultas (ou MAPA/MRPA). Meta < 140/90 (diretriz brasileira), < 130/80 em DM, DRC, alto risco CV.',
  $$[
    {"item":"PA normal","def":"PAS < 130 e PAD < 85"},
    {"item":"Pré-HAS","def":"PAS 130–139 ou PAD 85–89"},
    {"item":"HAS estágio 1","def":"PAS 140–159 ou PAD 90–99"},
    {"item":"HAS estágio 2","def":"PAS 160–179 ou PAD 100–109"},
    {"item":"HAS estágio 3","def":"PAS ≥ 180 ou PAD ≥ 110"},
    {"item":"MAPA — média 24h","def":"≥ 130/80 confirma HAS; vigília ≥ 135/85; sono ≥ 120/70"},
    {"item":"MRPA","def":"≥ 130/80 (média de 4 dias, 6 medidas/dia)"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Confirmar diagnóstico","detalhes":"≥ 2 medidas em ≥ 2 consultas separadas (ou MAPA/MRPA preferencial); técnica: braço apoiado, sentado 5 min, manguito adequado, sem cafeína 30 min, bexiga vazia"},
    {"passo":2,"acao":"Estratificar risco CV total e investigar lesão de órgão-alvo","detalhes":"Calcular ASCVD ou risco SBC; ECG (HVE), creatinina, EAS, lipidograma, glicemia, K+, ác. úrico"},
    {"passo":3,"acao":"Mudanças de estilo de vida (MEV) para todos","detalhes":"DASH/Mediterrânea, sódio < 2 g/dia (≈ 5 g sal), atividade aeróbica 150 min/sem, redução peso (3 kg = 5–10 mmHg), cessação tabagismo, álcool ≤ 2 doses/dia (homem) ou 1 (mulher)"},
    {"passo":4,"acao":"Iniciar farmacoterapia","detalhes":"HAS estágio 2/3 ou estágio 1 com alto risco: começar com COMBINAÇÃO (IECA/BRA + BCC ou IECA/BRA + tiazídico). HAS estágio 1 sem alto risco: tentar MEV 3–6 meses ou monoterapia"},
    {"passo":5,"acao":"Escalonar a cada 4 semanas até atingir meta","detalhes":"Combinar 2 → 3 classes (IECA/BRA + BCC + tiazídico). 4ª droga: espironolactona 25 mg (PATHWAY-2)"},
    {"passo":6,"acao":"HAS resistente (≥ 3 drogas em dose otimizada incluindo tiazídico)","detalhes":"Investigar: aderência, secundárias (estenose renal, hiperaldo primário, feocromocitoma, apneia do sono, doença renal), MAPA para HAS do jaleco branco vs verdadeira"},
    {"passo":7,"acao":"Acompanhamento","detalhes":"Mensal até controlar; depois 3–6 meses; reavaliar lesão de órgão-alvo a cada 1–2 anos; renal e K+ 1–2 semanas após mudança de IECA/BRA/diurético"}
  ]$$::jsonb,
  ARRAY['PA na consulta + MAPA/MRPA (preferencial)','ECG','Creatinina + clcr (CKD-EPI)','EAS + relação albumina/creatinina urinária','Lipidograma','Glicemia jejum + HbA1c','K+, Na+, ácido úrico','TSH','Ecocardio se HVE no ECG ou cardiopatia suspeita','Fundoscopia em HAS grave'],
  ARRAY['Emergência hipertensiva (PAS ≥ 180 ou PAD ≥ 120 + lesão de órgão-alvo aguda)','Encefalopatia, AVC, IAM, dissecção, EAP, eclâmpsia, IRA aguda','Sopro abdominal (estenose de a. renal)','Hipocalemia espontânea (hiperaldo primário)','Crises adrenérgicas (feocromocitoma)'],
  'Diretriz Brasileira HAS 2020 + ESC 2023',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-116-3-516/0066-782X-abc-116-3-516.pdf',
  '2020-09-22',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 5. DM2 — manejo ambulatorial
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'dm2-ambulatorial',
  'Diabetes mellitus tipo 2: manejo ambulatorial',
  'Endocrinologia',
  'Atenção primária',
  'Doença crônica do metabolismo glicídico com resistência insulínica e disfunção de células beta. Manejo é multifatorial: glicemia + lipídio + PA + peso + cessação tabagismo. Meta HbA1c < 7% para a maioria; < 6,5% se risco baixo de hipoglicemia; < 8% em idoso frágil.',
  $$[
    {"item":"Glicemia jejum","def":"≥ 126 mg/dL em 2 ocasiões"},
    {"item":"HbA1c","def":"≥ 6,5%"},
    {"item":"GTT 75g 2h","def":"≥ 200 mg/dL"},
    {"item":"Glicemia aleatória","def":"≥ 200 mg/dL com sintomas (poliúria, polidipsia, perda de peso)"},
    {"item":"Pré-diabetes","def":"glicemia 100–125 OU HbA1c 5,7–6,4 OU GTT 140–199"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Diagnóstico e estratificação","detalhes":"Confirmar com 2 testes (mesmo ou diferentes). Avaliar complicações no diagnóstico: fundoscopia, microalbuminúria, monofilamento, ECG, lipidograma"},
    {"passo":2,"acao":"MEV intensiva","detalhes":"Perda 5–10% peso, dieta com baixo IG/Mediterrânea, atividade aeróbica 150 min/sem + resistência 2x/sem"},
    {"passo":3,"acao":"Metformina como primeira linha","detalhes":"500 mg 1x/dia titular até 1 g 12/12h. Iniciar JÁ no diagnóstico junto com MEV"},
    {"passo":4,"acao":"Adicionar 2ª droga conforme perfil (SBD 2024 baseado em risco)","detalhes":"DCV/IC/DRC: associar iSGLT2 (dapa, empa) — mortalidade reduzida (EMPA-REG, DAPA-HF, DAPA-CKD). Obesidade: GLP-1 (semaglutida, liraglutida). Sem comorbidade: sulfonilureia (gliclazida) ou DPP-4 (sitagliptina) se preço barreira"},
    {"passo":5,"acao":"Insulinização se HbA1c > 9% sintomático ou falha de duas drogas","detalhes":"Basal: NPH bedtime ou glargina/degludeca 0,1–0,2 U/kg, titular 2 U a cada 3 dias até GJ < 130. Avançar para basal-bolus se necessário (1ª escolha em DM1, sintomático, gestação)"},
    {"passo":6,"acao":"Controle multifatorial integrado","detalhes":"PA < 130/80 (IECA/BRA preferencial); LDL < 70 (estatina alta intensidade em todo DM > 40a); AAS apenas em prevenção secundária; cessação tabagismo"},
    {"passo":7,"acao":"Rastreio anual de complicações","detalhes":"Fundoscopia, microalbuminúria, monofilamento (neuropatia), exame de pés, ECG, lipidograma"}
  ]$$::jsonb,
  ARRAY['Glicemia jejum','HbA1c','Microalbuminúria (relação A/C urinária)','Creatinina + clcr','Lipidograma','TSH (a cada 1–2 anos)','Fundoscopia anual','ECG','Vitamina B12 anual em uso > 4a de metformina'],
  ARRAY['Glicemia > 600 ou cetonas positivas (CAD/EHH)','Sintomas neurológicos novos (AVC silencioso, neuropatia)','Pé diabético com infecção/isquemia','Microalbuminúria progressiva','Retinopatia proliferativa','Hipoglicemia recorrente em insulinizado','Perda de peso involuntária (descompensação)'],
  'SBD 2024 + ADA Standards of Care 2024',
  'https://diretriz.diabetes.org.br/',
  '2024-01-15',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 6. ASMA — exacerbação aguda
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'asma-exacerbacao',
  'Asma — exacerbação aguda',
  'Pneumologia',
  'Emergência / PA',
  'Piora aguda da inflamação brônquica com aumento de sintomas e queda do PFE. Tratamento: SABA + corticoide sistêmico precoce + ipratrópio em moderada/grave. GINA 2024 desencoraja SABA isolado fora da urgência.',
  $$[
    {"item":"Leve/moderada","def":"Fala em frases, FR aumentada, FC < 120, SatO2 > 95%, PFE > 60% predito"},
    {"item":"Grave","def":"Fala em palavras, FR > 30, FC > 120, SatO2 90–95%, PFE 40–60%, uso musculatura acessória"},
    {"item":"Ameaça à vida","def":"Sonolento, exausto, silêncio respiratório, bradicardia, cianose, SatO2 < 90%, PFE < 40%"},
    {"item":"Quase fatal","def":"Necessidade de VM, hipercapnia (PaCO2 > 45), acidose"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliação inicial: ABCDE + classificação de gravidade","detalhes":"PFE se cooperativo, SatO2, FR, FC, ausculta. Atenção: silêncio respiratório = grave"},
    {"passo":2,"acao":"O2 para SatO2 alvo 93–95% (88–92% se DPOC concomitante)","detalhes":"NÃO superoxigenar (pode piorar V/Q)"},
    {"passo":3,"acao":"SABA via espaçador (preferido) ou nebulização","detalhes":"Salbutamol 4–10 jatos via espaçador a cada 20 min × 3 (1ª hora) OU neb 2,5–5 mg em 3 mL SF a cada 20 min × 3"},
    {"passo":4,"acao":"Ipratrópio em moderada/grave","detalhes":"Neb 0,5 mg associado ao salbutamol nas 3 primeiras nebulizações"},
    {"passo":5,"acao":"Corticoide sistêmico em ≤ 1 hora","detalhes":"Prednisona 40–60 mg VO (ou metilprednisolona 60–125 mg IV se sem VO). Manter 5–7 dias sem desmame se < 14 dias"},
    {"passo":6,"acao":"Sulfato de magnésio se grave / sem resposta","detalhes":"2 g IV em 20 min (1 ampola 10% = 1 g em 10 mL)"},
    {"passo":7,"acao":"Reavaliar após 1 hora; decidir alta vs internação","detalhes":"Alta: PFE > 70% predito, sem dispneia, SatO2 > 94%, capaz de tomar VO. Internar: PFE < 60% após tratamento ou critérios de gravidade persistentes"},
    {"passo":8,"acao":"Plano pós-alta","detalhes":"Iniciar/escalar ICS-formoterol como reliever (GINA: budesonida-formoterol 200/6 PRN ou MART). Cursinho de 5–7 dias de prednisona. Plano escrito de ação. Retorno ambulatorial 2–7 dias"}
  ]$$::jsonb,
  ARRAY['SatO2 contínua','PFE pré e pós-broncodilatador','Gasometria arterial se grave (alerta: PaCO2 normal ou alta = exaustão)','RX tórax se febre, dor torácica, ausência de resposta, primeira crise','Hemograma se febre','ECG se cardiopata ou taquiarritmia'],
  ARRAY['Silêncio auscultatório','Bradicardia em paciente até então taquicárdico','Sonolência ou agitação progressiva','SatO2 < 90% mesmo com O2','PaCO2 > 45 mmHg (hipercapnia em asma é gravíssima)','História de internação prévia em UTI ou intubação','Uso recente de SABA > 1 frasco/mês ou ≥ 3 cursos de corticoide nos últimos 12 meses'],
  'GINA 2024 + Diretriz SBPT Asma 2020',
  'https://ginasthma.org/2024-report/',
  '2024-05-01',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  red_flags = EXCLUDED.red_flags,
  updated_at = now();

-- ============================================================
-- 7. DPOC — exacerbação
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'dpoc-exacerbacao',
  'DPOC — exacerbação aguda',
  'Pneumologia',
  'PA / Emergência',
  'Piora aguda dos sintomas respiratórios além da variação habitual, exigindo mudança terapêutica. Antibiótico se ≥ 2 critérios de Anthonisen (piora de dispneia, aumento volume escarro, escarro purulento) ou VM.',
  $$[
    {"item":"DPOC base","def":"sintomas + VEF1/CVF < 0,7 pós-BD"},
    {"item":"Exacerbação leve","def":"tratada só com SABA ± SAMA ambulatorial"},
    {"item":"Moderada","def":"SABA + ATB e/ou corticoide oral"},
    {"item":"Grave","def":"hospitalização ou PA com risco de IRpA"},
    {"item":"Anthonisen","def":"≥ 2 dos 3: piora dispneia, aumento volume escarro, escarro purulento → indica ATB"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliar gravidade e indicação de hospitalização","detalhes":"Internar: dispneia em repouso grave, comorbidades graves, falha do tratamento ambulatorial, IRpA, alteração mental"},
    {"passo":2,"acao":"O2 alvo SatO2 88–92% (Venturi 24–28% preferido a máscara reservatório)","detalhes":"Risco de hipercapnia se SatO2 > 92% por perda do drive hipóxico"},
    {"passo":3,"acao":"Broncodilatador de curta ação","detalhes":"Salbutamol 4–8 jatos via espaçador OU neb 2,5–5 mg + ipratrópio 0,5 mg, repetir 1/1h conforme resposta"},
    {"passo":4,"acao":"Corticoide sistêmico (REDUCE 2013)","detalhes":"Prednisona 40 mg VO 1x/dia × 5 dias (preferível ao IV; sem desmame)"},
    {"passo":5,"acao":"Antibiótico se Anthonisen ≥ 2 ou VM","detalhes":"Amoxi-clavulanato 875/125 12/12h × 5 dias OU azitromicina 500 mg/dia × 3–5 dias OU levofloxacino 500 mg/dia × 5 dias (se risco Pseudomonas, alta exposição prévia ATB)"},
    {"passo":6,"acao":"VNI se IRpA hipercápnica (pH 7,25–7,35, PaCO2 > 45)","detalhes":"BiPAP IPAP 12–14 / EPAP 5–6 cm H2O. Reduz mortalidade e intubação"},
    {"passo":7,"acao":"VM invasiva se VNI falhar, parada respiratória, choque, alteração mental grave","detalhes":"Modo PCV ou VCV com I:E prolongado para evitar auto-PEEP"},
    {"passo":8,"acao":"Pós-alta","detalhes":"Otimizar terapia inalatória (LABA + LAMA ± ICS conforme GOLD), cessação tabagismo, vacinação (influenza, pneumococo, COVID-19, RSV em ≥ 60), reabilitação pulmonar, plano de ação"}
  ]$$::jsonb,
  ARRAY['Gasometria arterial (essencial — define IRpA hipercápnica)','SatO2 contínua','Hemograma','Eletrólitos','Função renal','BNP/NT-proBNP (descartar IC concomitante)','RX tórax (descartar pneumonia, pneumotórax)','ECG','Cultura escarro se grave ou ATB recente','D-dímero/AngioTC se suspeita TEP (alta prevalência em DPOC)'],
  ARRAY['Cianose ou movimentos abdominais paradoxais','Alteração mental','Hipercapnia com pH < 7,30','Falha da VNI em 1–2h','Instabilidade hemodinâmica','Suspeita de TEP (pleurítica, hemoptise, taqui desproporcional)','Suspeita de pneumotórax'],
  'GOLD 2024 + Diretriz SBPT DPOC 2017',
  'https://goldcopd.org/2024-gold-report/',
  '2024-01-10',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 8. PNEUMONIA ADQUIRIDA NA COMUNIDADE (PAC)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'pneumonia-pac',
  'Pneumonia adquirida na comunidade (PAC)',
  'Pneumologia',
  'Atenção primária / PA / Internação',
  'Infecção do parênquima pulmonar adquirida fora do hospital. Site of care decidido por CURB-65 ou PSI: ≤ 1 ambulatório, 2 considerar internação, ≥ 3 internação. CURB-65: Confusão, Ureia > 50, RR > 30, BP < 90/60, ≥ 65 anos.',
  $$[
    {"item":"Clínico","def":"Tosse, febre, dispneia, dor pleurítica em paciente comunitário"},
    {"item":"Imagem","def":"Infiltrado novo no RX tórax (ouro: TC tem mais sensibilidade)"},
    {"item":"CURB-65","def":"0–1 = ambulatório, 2 = considerar internação, ≥ 3 = internação (≥ 4 considerar UTI)"},
    {"item":"Critérios maiores UTI","def":"choque com vasopressor OU IRpA com VM"},
    {"item":"Critérios menores UTI (≥ 3 = UTI)","def":"FR ≥ 30, PaO2/FiO2 ≤ 250, infiltrado multilobar, confusão, ureia ≥ 50, leucopenia < 4000, plaquetas < 100000, hipotermia < 36, hipotensão exigindo volume agressivo"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Confirmar diagnóstico (clínica + RX)","detalhes":"Avaliar comorbidades, imunossupressão, viagem recente, exposição"},
    {"passo":2,"acao":"Estratificar local de tratamento","detalhes":"CURB-65 + julgamento clínico + suporte social"},
    {"passo":3,"acao":"Antibiótico empírico baseado no local","detalhes":"AMBULATÓRIO sem comorbidade: amoxicilina 1 g 8/8h × 5d. Com comorbidade: amoxi-clavulanato 875/125 12/12h ± macrolídeo. ENFERMARIA: ceftriaxona 1 g IV 1x/dia + azitromicina 500 mg IV/VO 1x/dia × 5d. UTI: ceftriaxona + azitromicina (ou levofloxacino se alergia). Suspeita Pseudomonas: piperacilina-tazo ou cefepime + macrolídeo"},
    {"passo":4,"acao":"Suporte: O2 alvo SatO2 ≥ 94% (88–92% se DPOC), hidratação, antipirético","detalhes":"Avaliar VNI ou VM se IRpA. Glicocorticoide adjuvante NÃO recomendado de rotina (estudos divergentes; CAPE COD 2023 sugere benefício em PAC grave)"},
    {"passo":5,"acao":"Reavaliar resposta em 48–72h","detalhes":"Estabilidade clínica: temperatura ≤ 37,8, FC ≤ 100, FR ≤ 24, PAS ≥ 90, SatO2 ≥ 90% em ar ambiente, capacidade VO. Trocar IV → VO (switch therapy)"},
    {"passo":6,"acao":"Duração total: 5 dias é suficiente se estável em 72h (IDSA/SBPT)","detalhes":"Estender se complicação (empiema, abscesso, bacteremia S. aureus, Pseudomonas, Legionella): 7–14 dias"},
    {"passo":7,"acao":"Vacinação pós-alta","detalhes":"Pneumocócica (PCV20 ou PCV13+PPSV23), influenza anual, COVID-19, RSV em ≥ 60a"}
  ]$$::jsonb,
  ARRAY['RX tórax PA + perfil','Hemograma','Função renal e hepática','Glicemia','PCR','Lactato e gasometria se grave','Hemoculturas 2 pares se internado','Cultura de escarro com bacterioscopia se internado','Antígeno urinário pneumococo e Legionella se internação grave/UTI','Painel viral respiratório (FluA/B, RSV, COVID-19) em estação','Lipase se dor abdominal'],
  ARRAY['Hipotensão refratária a volume','PaO2/FiO2 ≤ 250 ou IRpA','Infiltrado multilobar progressivo (rule out SDRA)','Sinais de derrame pleural complicado / empiema','Hemoptise volumosa','Imunossupressão grave (HIV avançado, transplante, neutropenia)','Falência terapêutica em 72h'],
  'Diretriz SBPT PAC 2018 + IDSA/ATS 2019',
  'https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST',
  '2019-10-01',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 9. ITU NÃO COMPLICADA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'itu-nao-complicada',
  'ITU não complicada (cistite e pielonefrite)',
  'Urologia',
  'Atenção primária / PA',
  'Infecção urinária em mulher não-gestante, sem alterações estruturais ou funcionais do trato urinário, sem comorbidades complicadoras. ITU complicada (homem, gestante, DRC, diabetes descompensada, sondado, anomalia urológica) exige abordagem distinta.',
  $$[
    {"item":"Cistite não complicada","def":"disúria + polaciúria + urgência ± dor suprapúbica em mulher saudável; UROCULTURA não obrigatória se cuadro clássico"},
    {"item":"Pielonefrite não complicada","def":"sintomas de cistite + febre, calafrios, dor lombar (Giordano +); SEMPRE urocultura + hemoculturas"},
    {"item":"ITU recorrente","def":"≥ 2 episódios em 6 meses ou ≥ 3 em 12 meses"},
    {"item":"EAS","def":"piúria (≥ 10 leucócitos/campo) + nitrito; sensibilidade variável"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Diagnosticar e classificar","detalhes":"Cistite vs pielonefrite, complicada vs não-complicada"},
    {"passo":2,"acao":"CISTITE: ATB empírico curto","detalhes":"Nitrofurantoína 100 mg 6/6h × 5 dias OU SMX-TMP 800/160 mg 12/12h × 3 dias (se resistência local < 20%) OU fosfomicina 3 g VO dose única. Evitar fluoroquinolonas em cistite simples (toxicidade > benefício)"},
    {"passo":3,"acao":"PIELONEFRITE: ambulatorial se estável e capaz de VO","detalhes":"Ciprofloxacino 500 mg 12/12h × 7d OU SMX-TMP 800/160 12/12h × 14d (se sensível). Se sepse, vômitos, gestação, falha VO, comorbidade grave: internar"},
    {"passo":4,"acao":"Pielonefrite hospitalar","detalhes":"Ceftriaxona 1 g IV 1x/dia ± gentamicina 5–7 mg/kg/dia se grave. Switch para VO em 48–72h após estabilização. Total 7–10d (cipro) ou 14d (SMX-TMP)"},
    {"passo":5,"acao":"ITU recorrente: investigar e profilaxia","detalhes":"USG renal, descartar fatores; profilaxia: estrogênio vaginal pós-menopausa, micção pós-coital, cranberry (evidência fraca), ATB profilática contínua (nitrofurantoína 50 mg/dia ou SMX-TMP 200/40) ou pós-coital"},
    {"passo":6,"acao":"Bacteriúria assintomática","detalhes":"Tratar APENAS gestantes e pré-procedimento urológico invasivo. NÃO tratar em idoso institucionalizado, DM, sondado crônico, paciente assintomático"}
  ]$$::jsonb,
  ARRAY['EAS (pode dispensar em cistite típica)','Urocultura: obrigatória em pielonefrite, ITU recorrente, gestante, falha de tratamento','Hemoculturas se pielonefrite ou sepse','Função renal','Hemograma se pielonefrite','USG renal se ITU recorrente, falha em 72h, suspeita complicada, sepse, homem','TC se suspeita abscesso ou obstrução'],
  ARRAY['Sepse, instabilidade hemodinâmica','Falha após 72h de ATB adequado (suspeitar abscesso, obstrução)','Massa abdominal palpável','Hematúria persistente após cura','Homens jovens com ITU (investigar prostatite, anomalia urológica)','ITU em criança (sempre investigar refluxo vesicoureteral, cistouretrografia)','Resistência a múltiplos ATB no antibiograma'],
  'Diretriz Brasileira de ITU 2024 + IDSA 2010',
  'https://sbu-sp.org.br/profissionais/diretrizes-da-sbu/',
  '2024-06-01',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  updated_at = now();

-- ============================================================
-- 10. CETOACIDOSE DIABÉTICA (CAD)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'cad',
  'Cetoacidose diabética (CAD)',
  'Endocrinologia',
  'Emergência / UTI',
  'Tríade: hiperglicemia + cetonemia + acidose metabólica. Tratamento: volume → potássio → insulina → bicarbonato (raro) → identificar e tratar precipitante. Cuidado especial com CAD euglicêmica (iSGLT2).',
  $$[
    {"item":"Glicemia","def":"> 250 mg/dL (pode ser normal em CAD euglicêmica por iSGLT2)"},
    {"item":"pH arterial","def":"< 7,30"},
    {"item":"HCO3-","def":"< 18 mEq/L"},
    {"item":"Cetonemia / cetonúria","def":"β-hidroxibutirato > 3 mmol/L"},
    {"item":"Anion gap","def":"> 10–12 mEq/L"},
    {"item":"Gravidade","def":"leve pH 7,25–7,30; moderada 7,00–7,24; grave < 7,00"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"REPOSIÇÃO VOLÊMICA primeiro (1ª hora antes de insulina)","detalhes":"SF 0,9% 15–20 mL/kg na 1ª hora (1–1,5 L). Após: SF 0,45% se Na corrigido alto/normal, SF 0,9% se baixo. Trocar para SG 5% + SF 0,45% quando glicemia < 250"},
    {"passo":2,"acao":"POTÁSSIO antes ou junto da insulina","detalhes":"K+ < 3,3: REPOR antes de insulina (10–20 mEq/h em SF 1L). K+ 3,3–5,3: repor 20–30 mEq/L de fluido. K+ > 5,3: NÃO repor, monitorar"},
    {"passo":3,"acao":"INSULINA REGULAR EV após reposição inicial","detalhes":"Bolus 0,1 U/kg + infusão 0,1 U/kg/h (ou só infusão 0,14 U/kg/h sem bolus). Meta: glicemia ↓ 50–75 mg/dL/h. Se < que isso, dobrar; se > 100/h, reduzir"},
    {"passo":4,"acao":"Bicarbonato APENAS se pH < 6,9","detalhes":"100 mEq em 400 mL SF + 20 mEq KCl em 2h. Reavaliar pH. Não usar em pH > 6,9 (sem benefício, possível dano)"},
    {"passo":5,"acao":"Critérios de resolução","detalhes":"Glicemia < 200 + 2 dos: HCO3 ≥ 15, pH ≥ 7,30, anion gap ≤ 12. β-hidroxibutirato < 0,6 é indicador robusto"},
    {"passo":6,"acao":"Transição para insulina SC","detalhes":"Quando paciente tolera VO + critérios de resolução: aplicar SC, manter EV por 1–2h após (sobreposição)"},
    {"passo":7,"acao":"Identificar e tratar precipitante","detalhes":"Infecção (mais comum), má aderência insulina, IAM, AVC, gestação, drogas (cocaína, antipsicóticos atípicos), iSGLT2 (CAD euglicêmica)"},
    {"passo":8,"acao":"Educar paciente antes da alta","detalhes":"Manejo de dias de doença, automonitorização glicemia + cetona, plano insulínico, sinais de alarme"}
  ]$$::jsonb,
  ARRAY['Glicemia capilar e laboratorial','β-hidroxibutirato (preferível) ou cetonúria','Gasometria arterial seriada','Eletrólitos completo (Na, K, Cl, Mg, P) seriado','Função renal e hepática','Hemograma','EAS + urocultura (precipitante)','RX tórax (precipitante)','ECG','HbA1c','Lactato','Lipase (cuidado: pode estar elevada por CAD sem pancreatite)','TC crânio se alteração mental persistente (edema cerebral, especialmente pediátrico)'],
  ARRAY['Glasgow rebaixado / cefaleia em criança (edema cerebral — emergência: manitol)','Hipocalemia grave inicial (< 3,3) — corrigir antes de insulina','Hipotensão refratária após volume','Suspeita IAM (ECG sempre)','PaO2 reduzido (descartar SDRA, edema agudo de pulmão por hidratação excessiva)','Acidose mista (lactato + cetose)','Estado hiperosmolar concomitante (osmolalidade > 320 mOsm/kg)','CAD euglicêmica em uso de iSGLT2 (suspender o iSGLT2)'],
  'SBD 2024 + ADA Consensus 2024',
  'https://diretriz.diabetes.org.br/cetoacidose-diabetica/',
  '2024-02-10',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  red_flags = EXCLUDED.red_flags,
  updated_at = now();

-- ============================================================
-- 11. ANAFILAXIA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'anafilaxia',
  'Anafilaxia',
  'Alergia / Emergência',
  'Emergência (todos os níveis)',
  'Reação alérgica grave, sistêmica, rapidamente progressiva, potencialmente fatal. ADRENALINA IM é o pilar do tratamento — TUDO MAIS é adjuvante. Não atrasar pelo diagnóstico diferencial.',
  $$[
    {"item":"Critério 1","def":"Início súbito (minutos a horas) com envolvimento de pele/mucosa + dispneia/broncoespasmo OU hipotensão"},
    {"item":"Critério 2","def":"≥ 2 dos seguintes após exposição a alérgeno provável: pele/mucosa, respiratório, cardiovascular (hipotensão), GI persistente"},
    {"item":"Critério 3","def":"Hipotensão isolada após exposição a alérgeno conhecido"},
    {"item":"Triggers comuns","def":"Alimentos (amendoim, frutos do mar, leite, ovo), medicamentos (penicilinas, AINE, contrastes, anti-monoclonais), insetos (himenópteros), látex, exercício, idiopática"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"ADRENALINA IM IMEDIATAMENTE — antes de qualquer outra coisa","detalhes":"0,5 mg (0,5 mL da 1:1000) IM em vasto lateral da coxa em adulto; 0,01 mg/kg (max 0,3 mg) em criança. Repetir a cada 5–15 min se sem resposta"},
    {"passo":2,"acao":"Posicionar","detalhes":"Decúbito dorsal com MMII elevados (Trendelenburg). Sentado se dispneia. NÃO permitir levantar abruptamente (síndrome do ventrículo vazio)"},
    {"passo":3,"acao":"Suporte ABC","detalhes":"O2 alta vazão por máscara não-reinalante; via aérea pérvia; preparar IOT precoce se estridor, edema laríngeo (tubo menor que o usual)"},
    {"passo":4,"acao":"Volume IV se hipotensão","detalhes":"Cristaloide 1–2 L IV rápido (20 mL/kg em criança). Pode precisar 4–8 L em horas"},
    {"passo":5,"acao":"Adjuvantes (NÃO substituem adrenalina)","detalhes":"Anti-histamínico H1 (difenidramina 25–50 mg IV ou prometazina 25 mg IM) + H2 (ranitidina 50 mg IV — mais para urticária e prurido). Corticoide (metilprednisolona 1 mg/kg IV ou hidrocortisona 200 mg) — efeito tardio, NÃO previne reação bifásica"},
    {"passo":6,"acao":"Broncodilatador se broncoespasmo refratário","detalhes":"Salbutamol nebulização 2,5–5 mg + ipratrópio 0,5 mg"},
    {"passo":7,"acao":"Adrenalina IV em choque refratário","detalhes":"BIC 0,05–0,2 mcg/kg/min titular pela PA. Cuidado: arritmia, isquemia em uso IV inadvertido"},
    {"passo":8,"acao":"Glucagon se em uso de beta-bloqueador (refratário a adrenalina)","detalhes":"1–5 mg IV em 5 min (causa náusea/vômito; proteger via aérea)"},
    {"passo":9,"acao":"Observação prolongada e plano de alta","detalhes":"Observar 4–8h (até 24h se grave ou bifásica de risco). Prescrever 2 EpiPens (Auvi-Q ou similar). Encaminhar a alergista para identificar gatilho. Plano de ação por escrito. Pulseira de alerta médico"}
  ]$$::jsonb,
  ARRAY['Triptase sérica (em 1–4h, útil para confirmar diagnóstico retrospectivo)','Glicemia (descartar hipoglicemia mimicker)','ECG, troponina se dor torácica','Gasometria se IRpA'],
  ARRAY['Estridor / edema laríngeo','Hipotensão refratária a adrenalina + volume (prevenir colapso CV)','Reação bifásica (pode ocorrer 4–24h após resolução inicial — mais comum se tratamento inicial inadequado)','Uso prévio de beta-bloqueador (resposta atenuada à adrenalina — usar glucagon)','Mastocitose sistêmica conhecida (reações severas)','Asma concomitante (mortalidade aumentada)','Atraso de adrenalina > 30 min do início — preditor forte de morte'],
  'WAO 2020 + EAACI 2021 + ASBAI Brasil 2022',
  'https://onlinelibrary.wiley.com/doi/10.1111/all.14606',
  '2020-10-01',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  red_flags = EXCLUDED.red_flags,
  updated_at = now();

-- ============================================================
-- 12. PRÉ-ECLÂMPSIA / ECLÂMPSIA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'pre-eclampsia',
  'Pré-eclâmpsia / eclâmpsia',
  'Obstetrícia',
  'Maternidade / UTI',
  'Síndrome multissistêmica gestacional (≥ 20 semanas) com HAS + proteinúria ou disfunção orgânica. Eclâmpsia = pré-eclâmpsia + convulsão. Único tratamento definitivo é o parto. Sulfato de magnésio = profilaxia/tratamento de convulsão.',
  $$[
    {"item":"Pré-eclâmpsia","def":"PA ≥ 140/90 em duas medidas com 4h de intervalo, após 20 semanas em gestante previamente normotensa, com proteinúria (≥ 300 mg/24h ou A/C ≥ 0,3 ou fita ≥ 1+) OU sinais de gravidade"},
    {"item":"Pré-eclâmpsia GRAVE","def":"PA ≥ 160/110 OU plaquetopenia < 100k OU TGO/TGP ≥ 2x LSN OU creatinina > 1,1 OU edema pulmonar OU sintomas neurológicos novos OU dor epigástrica"},
    {"item":"Eclâmpsia","def":"convulsão tônico-clônica em gestante com pré-eclâmpsia (não atribuível a outra causa)"},
    {"item":"HELLP","def":"Hemólise (LDH > 600, esquizócitos, BI elevada) + Elevated Liver enzymes (TGO/TGP ≥ 2x) + Low Platelets (< 100k)"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliar gravidade e idade gestacional","detalhes":"Diferenciar pré-eclâmpsia leve vs grave; verificar viabilidade fetal"},
    {"passo":2,"acao":"INTERROMPER GRAVIDEZ se grave + ≥ 34 semanas OU comprometimento materno-fetal","detalhes":"Indicações imediatas: eclâmpsia, HELLP, edema pulmonar, IRA, coagulopatia, abruptio placentae, sofrimento fetal, óbito fetal"},
    {"passo":3,"acao":"Sulfato de magnésio (Pritchard ou Zuspan) — profilaxia e tratamento de eclâmpsia","detalhes":"Pritchard (IM): 4 g IV em 20 min + 10 g IM (5 g cada nádega) → 5 g IM 4/4h. Zuspan (IV): 4 g IV em 20 min → BIC 1–2 g/h por ≥ 24h após parto OU última convulsão. Suspender se: FR < 16, reflexos abolidos, diurese < 25 mL/h. Antídoto: gluconato de cálcio 10% 10 mL IV"},
    {"passo":4,"acao":"Anti-hipertensivo se PA ≥ 160/110","detalhes":"Hidralazina 5 mg IV a cada 20 min (max 30 mg) OU labetalol 20–80 mg IV a cada 10 min (max 300 mg) OU nifedipino 10 mg VO a cada 20 min. Meta: 140–155/90–105 (não baixar muito — prejudica perfusão placentária)"},
    {"passo":5,"acao":"Corticoide para maturação pulmonar fetal","detalhes":"24–34 semanas (estender até 36+6 se urgência): betametasona 12 mg IM 24/24h × 2 doses OU dexametasona 6 mg IM 12/12h × 4 doses"},
    {"passo":6,"acao":"Manejo do parto","detalhes":"Via vaginal preferível se condições; cesárea se indicação obstétrica. Monitorar PA continuamente; manter sulfato de magnésio durante parto e 24h pós-parto"},
    {"passo":7,"acao":"Pós-parto","detalhes":"Risco de eclâmpsia até 7 dias após parto. Manter sulfato 24h. Anti-HTN: nifedipino 30 mg ou metildopa. Reavaliar PA a cada visita pós-natal. Fator de risco para HAS crônica e DCV ao longo da vida"},
    {"passo":8,"acao":"Profilaxia em próxima gestação","detalhes":"AAS 100 mg/dia das 12–16 semanas até 36 semanas em alto risco (HAS prévia, DM, DRC, LES, SAF, gemelar, pré-eclâmpsia prévia, IMC > 35, primípara > 35a)"}
  ]$$::jsonb,
  ARRAY['PA seriada','Proteinúria de 24h ou A/C urinária','Hemograma (plaquetas, esquizócitos)','Função renal (creatinina, ácido úrico)','TGO, TGP, LDH, bilirrubinas','Coagulograma','Cardiotocografia','USG obstétrico com doppler de a. umbilical e a. uterinas','Glicemia (descartar diabetes)','Magnesemia se uso prolongado de sulfato'],
  ARRAY['Convulsão = eclâmpsia','Cefaleia intensa, alteração visual, escotomas, dor epigástrica','Plaquetas < 50k (HELLP grave)','Creatinina > 1,4 ou ↑ rápida','TGO/TGP > 5x LSN','Edema pulmonar, dispneia','Abruptio placentae (sangramento, dor, hipertonia uterina)','Cardiotocografia categoria III','Restrição grave de crescimento fetal'],
  'Febrasgo 2023 + ACOG 2020 + ISSHP 2021',
  'https://www.febrasgo.org.br/pt/protocolos/',
  '2023-08-01',
  true
) ON CONFLICT (slug) DO UPDATE SET
  conduta_passos = EXCLUDED.conduta_passos,
  red_flags = EXCLUDED.red_flags,
  updated_at = now();
