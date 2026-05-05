-- PreceptorBook v3: +10 calculadoras clínicas
-- Total após migration: 30 calculadoras (eram 20)

-- ============================================================
-- 21. SOFA score — disfunção orgânica em UTI
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'sofa',
  'SOFA',
  'Terapia intensiva',
  'Sequential Organ Failure Assessment. Avalia gravidade da disfunção orgânica em pacientes críticos por 6 sistemas.',
  'Pacientes em UTI ou suspeita de sepse; ↑ ≥ 2 pontos no SOFA dentro de infecção define sepse (Sepsis-3, 2016).',
  $${
    "inputs":[
      {"key":"pao2_fio2","label":"PaO₂/FiO₂","type":"select","options":[
        {"value":"4","label":"< 100 com VM"},{"value":"3","label":"< 200 com VM"},
        {"value":"2","label":"< 300"},{"value":"1","label":"< 400"},{"value":"0","label":"≥ 400"}]},
      {"key":"plaq","label":"Plaquetas (×10³/μL)","type":"select","options":[
        {"value":"4","label":"< 20"},{"value":"3","label":"20–49"},{"value":"2","label":"50–99"},
        {"value":"1","label":"100–149"},{"value":"0","label":"≥ 150"}]},
      {"key":"bili","label":"Bilirrubina (mg/dL)","type":"select","options":[
        {"value":"4","label":"> 12"},{"value":"3","label":"6–11,9"},{"value":"2","label":"2–5,9"},
        {"value":"1","label":"1,2–1,9"},{"value":"0","label":"< 1,2"}]},
      {"key":"cardio","label":"Cardiovascular","type":"select","options":[
        {"value":"4","label":"NA > 0,1 ou epi > 0,1"},{"value":"3","label":"NA ≤ 0,1 ou dopa > 5"},
        {"value":"2","label":"Dopa ≤ 5 ou dobuta"},{"value":"1","label":"PAM < 70"},{"value":"0","label":"PAM ≥ 70"}]},
      {"key":"glasgow","label":"Glasgow","type":"select","options":[
        {"value":"4","label":"< 6"},{"value":"3","label":"6–9"},{"value":"2","label":"10–12"},
        {"value":"1","label":"13–14"},{"value":"0","label":"15"}]},
      {"key":"renal","label":"Renal — Cr (mg/dL) ou diurese","type":"select","options":[
        {"value":"4","label":"Cr > 5 ou diurese < 200 mL/d"},{"value":"3","label":"Cr 3,5–4,9 ou < 500 mL/d"},
        {"value":"2","label":"Cr 2–3,4"},{"value":"1","label":"Cr 1,2–1,9"},{"value":"0","label":"Cr < 1,2"}]}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"pao2_fio2","eq":"4"},"points":4},{"when":{"key":"pao2_fio2","eq":"3"},"points":3},
      {"when":{"key":"pao2_fio2","eq":"2"},"points":2},{"when":{"key":"pao2_fio2","eq":"1"},"points":1},
      {"when":{"key":"plaq","eq":"4"},"points":4},{"when":{"key":"plaq","eq":"3"},"points":3},
      {"when":{"key":"plaq","eq":"2"},"points":2},{"when":{"key":"plaq","eq":"1"},"points":1},
      {"when":{"key":"bili","eq":"4"},"points":4},{"when":{"key":"bili","eq":"3"},"points":3},
      {"when":{"key":"bili","eq":"2"},"points":2},{"when":{"key":"bili","eq":"1"},"points":1},
      {"when":{"key":"cardio","eq":"4"},"points":4},{"when":{"key":"cardio","eq":"3"},"points":3},
      {"when":{"key":"cardio","eq":"2"},"points":2},{"when":{"key":"cardio","eq":"1"},"points":1},
      {"when":{"key":"glasgow","eq":"4"},"points":4},{"when":{"key":"glasgow","eq":"3"},"points":3},
      {"when":{"key":"glasgow","eq":"2"},"points":2},{"when":{"key":"glasgow","eq":"1"},"points":1},
      {"when":{"key":"renal","eq":"4"},"points":4},{"when":{"key":"renal","eq":"3"},"points":3},
      {"when":{"key":"renal","eq":"2"},"points":2},{"when":{"key":"renal","eq":"1"},"points":1}
    ]},
    "interpretation":[
      {"min":0,"max":6,"label":"Disfunção leve","action":"Mortalidade ~10% — manter suporte"},
      {"min":7,"max":9,"label":"Disfunção moderada","action":"Mortalidade ~20% — escalar cuidado"},
      {"min":10,"max":12,"label":"Disfunção grave","action":"Mortalidade ~40-50%"},
      {"min":13,"max":24,"label":"Disfunção crítica","action":"Mortalidade > 80% — discutir prognóstico"}
    ],
    "disclaimer":"Sepsis-3: ↑ ≥ 2 pontos do basal em paciente com infecção define sepse."
  }$$::jsonb,
  'Vincent JL et al., 1996 (ICM); Sepsis-3 Singer 2016 (JAMA)',
  'https://pubmed.ncbi.nlm.nih.gov/8844239/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 22. ABCD2 — risco de AVC após AIT
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'abcd2',
  'ABCD²',
  'Neurologia',
  'Risco de AVC nos 2/7/90 dias após AIT (ataque isquêmico transitório).',
  'Estratificar urgência da investigação após AIT (alto risco = internar e investigar imediatamente).',
  $${
    "inputs":[
      {"key":"age","label":"Idade ≥ 60 anos","type":"boolean"},
      {"key":"bp","label":"PA ≥ 140/90 na apresentação","type":"boolean"},
      {"key":"clinic","label":"Quadro clínico","type":"select","options":[
        {"value":"2","label":"Fraqueza unilateral"},{"value":"1","label":"Disartria sem fraqueza"},{"value":"0","label":"Outros"}]},
      {"key":"duration","label":"Duração","type":"select","options":[
        {"value":"2","label":"≥ 60 min"},{"value":"1","label":"10–59 min"},{"value":"0","label":"< 10 min"}]},
      {"key":"diabetes","label":"Diabetes","type":"boolean"}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"age","eq":true},"points":1},
      {"when":{"key":"bp","eq":true},"points":1},
      {"when":{"key":"clinic","eq":"2"},"points":2},
      {"when":{"key":"clinic","eq":"1"},"points":1},
      {"when":{"key":"duration","eq":"2"},"points":2},
      {"when":{"key":"duration","eq":"1"},"points":1},
      {"when":{"key":"diabetes","eq":true},"points":1}
    ]},
    "interpretation":[
      {"min":0,"max":3,"label":"Baixo risco","action":"AVC 2d ~1%; investigar ambulatorial em 24-48h"},
      {"min":4,"max":5,"label":"Moderado","action":"AVC 2d ~4%; internar e investigar em ≤ 24h"},
      {"min":6,"max":7,"label":"Alto risco","action":"AVC 2d ~8%; internar UTI/Stroke unit, investigar imediato"}
    ],
    "disclaimer":"Tratamento moderno (DAPT 21d, AVC menor: AAS+clopi) reduziu o gradiente preditivo. Use junto com clínica."
  }$$::jsonb,
  'Johnston SC et al., 2007 (Lancet)',
  'https://pubmed.ncbi.nlm.nih.gov/17258668/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 23. NIHSS — gravidade de AVC
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'nihss',
  'NIHSS',
  'Neurologia',
  'National Institutes of Health Stroke Scale. Quantifica gravidade do déficit neurológico em AVC isquêmico.',
  'Todo paciente com AVC suspeito; orienta indicação de trombólise/trombectomia e prognóstico.',
  $${
    "inputs":[
      {"key":"consc","label":"1a. Nível de consciência","type":"select","options":[
        {"value":"0","label":"Alerta"},{"value":"1","label":"Sonolento"},{"value":"2","label":"Estupor"},{"value":"3","label":"Coma"}]},
      {"key":"perg","label":"1b. Perguntas (mês, idade)","type":"select","options":[
        {"value":"0","label":"Acerta ambas"},{"value":"1","label":"Acerta uma"},{"value":"2","label":"Erra ambas"}]},
      {"key":"comand","label":"1c. Comandos (abrir/fechar olhos, mão)","type":"select","options":[
        {"value":"0","label":"Cumpre ambos"},{"value":"1","label":"Cumpre um"},{"value":"2","label":"Não cumpre"}]},
      {"key":"olhar","label":"2. Olhar conjugado","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Paresia parcial"},{"value":"2","label":"Desvio fixo"}]},
      {"key":"campo","label":"3. Campo visual","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Hemianopsia parcial"},{"value":"2","label":"Hemianopsia completa"},{"value":"3","label":"Cegueira bilateral"}]},
      {"key":"facial","label":"4. Paresia facial","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Mínima"},{"value":"2","label":"Parcial"},{"value":"3","label":"Completa"}]},
      {"key":"msd","label":"5a. Membro superior D","type":"select","options":[
        {"value":"0","label":"Sem queda 10s"},{"value":"1","label":"Queda mas resiste"},{"value":"2","label":"Não resiste gravidade"},{"value":"3","label":"Movimento sem antigravidade"},{"value":"4","label":"Sem movimento"}]},
      {"key":"mse","label":"5b. Membro superior E","type":"select","options":[
        {"value":"0","label":"Sem queda 10s"},{"value":"1","label":"Queda mas resiste"},{"value":"2","label":"Não resiste gravidade"},{"value":"3","label":"Movimento sem antigravidade"},{"value":"4","label":"Sem movimento"}]},
      {"key":"mid","label":"6a. Membro inferior D","type":"select","options":[
        {"value":"0","label":"Sem queda 5s"},{"value":"1","label":"Queda mas resiste"},{"value":"2","label":"Não resiste gravidade"},{"value":"3","label":"Movimento sem antigravidade"},{"value":"4","label":"Sem movimento"}]},
      {"key":"mie","label":"6b. Membro inferior E","type":"select","options":[
        {"value":"0","label":"Sem queda 5s"},{"value":"1","label":"Queda mas resiste"},{"value":"2","label":"Não resiste gravidade"},{"value":"3","label":"Movimento sem antigravidade"},{"value":"4","label":"Sem movimento"}]},
      {"key":"ataxia","label":"7. Ataxia","type":"select","options":[
        {"value":"0","label":"Ausente"},{"value":"1","label":"Em 1 membro"},{"value":"2","label":"Em 2 membros"}]},
      {"key":"sens","label":"8. Sensibilidade","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Leve a moderada"},{"value":"2","label":"Grave/anestesia"}]},
      {"key":"ling","label":"9. Linguagem","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Afasia leve"},{"value":"2","label":"Afasia grave"},{"value":"3","label":"Mudo/global"}]},
      {"key":"disart","label":"10. Disartria","type":"select","options":[
        {"value":"0","label":"Normal"},{"value":"1","label":"Leve-moderada"},{"value":"2","label":"Grave"}]},
      {"key":"extinc","label":"11. Extinção/inatenção","type":"select","options":[
        {"value":"0","label":"Sem"},{"value":"1","label":"Em 1 modalidade"},{"value":"2","label":"Em > 1"}]}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"consc","eq":"1"},"points":1},{"when":{"key":"consc","eq":"2"},"points":2},{"when":{"key":"consc","eq":"3"},"points":3},
      {"when":{"key":"perg","eq":"1"},"points":1},{"when":{"key":"perg","eq":"2"},"points":2},
      {"when":{"key":"comand","eq":"1"},"points":1},{"when":{"key":"comand","eq":"2"},"points":2},
      {"when":{"key":"olhar","eq":"1"},"points":1},{"when":{"key":"olhar","eq":"2"},"points":2},
      {"when":{"key":"campo","eq":"1"},"points":1},{"when":{"key":"campo","eq":"2"},"points":2},{"when":{"key":"campo","eq":"3"},"points":3},
      {"when":{"key":"facial","eq":"1"},"points":1},{"when":{"key":"facial","eq":"2"},"points":2},{"when":{"key":"facial","eq":"3"},"points":3},
      {"when":{"key":"msd","eq":"1"},"points":1},{"when":{"key":"msd","eq":"2"},"points":2},{"when":{"key":"msd","eq":"3"},"points":3},{"when":{"key":"msd","eq":"4"},"points":4},
      {"when":{"key":"mse","eq":"1"},"points":1},{"when":{"key":"mse","eq":"2"},"points":2},{"when":{"key":"mse","eq":"3"},"points":3},{"when":{"key":"mse","eq":"4"},"points":4},
      {"when":{"key":"mid","eq":"1"},"points":1},{"when":{"key":"mid","eq":"2"},"points":2},{"when":{"key":"mid","eq":"3"},"points":3},{"when":{"key":"mid","eq":"4"},"points":4},
      {"when":{"key":"mie","eq":"1"},"points":1},{"when":{"key":"mie","eq":"2"},"points":2},{"when":{"key":"mie","eq":"3"},"points":3},{"when":{"key":"mie","eq":"4"},"points":4},
      {"when":{"key":"ataxia","eq":"1"},"points":1},{"when":{"key":"ataxia","eq":"2"},"points":2},
      {"when":{"key":"sens","eq":"1"},"points":1},{"when":{"key":"sens","eq":"2"},"points":2},
      {"when":{"key":"ling","eq":"1"},"points":1},{"when":{"key":"ling","eq":"2"},"points":2},{"when":{"key":"ling","eq":"3"},"points":3},
      {"when":{"key":"disart","eq":"1"},"points":1},{"when":{"key":"disart","eq":"2"},"points":2},
      {"when":{"key":"extinc","eq":"1"},"points":1},{"when":{"key":"extinc","eq":"2"},"points":2}
    ]},
    "interpretation":[
      {"min":0,"max":4,"label":"AVC menor","action":"Pode ser elegível mesmo assim — discutir trombólise se déficit incapacitante"},
      {"min":5,"max":15,"label":"AVC moderado","action":"Trombólise indicada se < 4,5h; trombectomia se grande vaso"},
      {"min":16,"max":20,"label":"AVC moderado a grave","action":"Trombólise + trombectomia (se grande vaso)"},
      {"min":21,"max":42,"label":"AVC grave","action":"Discutir trombectomia; risco-benefício individualizado"}
    ],
    "disclaimer":"NIHSS > 25 historicamente excluía trombólise; AHA 2024 não exclui automaticamente."
  }$$::jsonb,
  'Brott T et al., 1989 (Stroke)',
  'https://pubmed.ncbi.nlm.nih.gov/2749846/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 24. PSI/PORT — gravidade de pneumonia comunitária
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'psi-port',
  'PSI / PORT',
  'Pneumologia',
  'Pneumonia Severity Index. Estratifica mortalidade em 30 dias na PAC; orienta decisão de internação.',
  'Adulto com PAC; complementar ao CURB-65 — PSI mais preciso, CURB-65 mais simples.',
  $${
    "inputs":[
      {"key":"idade","label":"Idade (anos)","type":"number"},
      {"key":"sexo","label":"Sexo","type":"select","options":[{"value":"M","label":"Masculino"},{"value":"F","label":"Feminino"}]},
      {"key":"asilo","label":"Vive em asilo / instituição","type":"boolean"},
      {"key":"neoplasia","label":"Neoplasia","type":"boolean"},
      {"key":"hepatopatia","label":"Hepatopatia","type":"boolean"},
      {"key":"icc","label":"Insuficiência cardíaca","type":"boolean"},
      {"key":"avc","label":"AVC prévio","type":"boolean"},
      {"key":"renal","label":"Doença renal","type":"boolean"},
      {"key":"alt_mental","label":"Alteração mental","type":"boolean"},
      {"key":"fr30","label":"FR ≥ 30","type":"boolean"},
      {"key":"pas90","label":"PAS < 90","type":"boolean"},
      {"key":"temp","label":"T < 35 ou > 40°C","type":"boolean"},
      {"key":"fc125","label":"FC ≥ 125","type":"boolean"},
      {"key":"ph","label":"pH < 7,35","type":"boolean"},
      {"key":"ureia","label":"Ureia > 64 (BUN ≥ 30)","type":"boolean"},
      {"key":"sodio","label":"Sódio < 130","type":"boolean"},
      {"key":"glic","label":"Glicemia > 250","type":"boolean"},
      {"key":"hto","label":"Ht < 30%","type":"boolean"},
      {"key":"pao2","label":"PaO₂ < 60 (ou SpO₂ < 90)","type":"boolean"},
      {"key":"derrame","label":"Derrame pleural","type":"boolean"}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"idade","gte":0},"points":0},
      {"when":{"key":"sexo","eq":"F"},"points":-10},
      {"when":{"key":"asilo","eq":true},"points":10},
      {"when":{"key":"neoplasia","eq":true},"points":30},
      {"when":{"key":"hepatopatia","eq":true},"points":20},
      {"when":{"key":"icc","eq":true},"points":10},
      {"when":{"key":"avc","eq":true},"points":10},
      {"when":{"key":"renal","eq":true},"points":10},
      {"when":{"key":"alt_mental","eq":true},"points":20},
      {"when":{"key":"fr30","eq":true},"points":20},
      {"when":{"key":"pas90","eq":true},"points":20},
      {"when":{"key":"temp","eq":true},"points":15},
      {"when":{"key":"fc125","eq":true},"points":10},
      {"when":{"key":"ph","eq":true},"points":30},
      {"when":{"key":"ureia","eq":true},"points":20},
      {"when":{"key":"sodio","eq":true},"points":20},
      {"when":{"key":"glic","eq":true},"points":10},
      {"when":{"key":"hto","eq":true},"points":10},
      {"when":{"key":"pao2","eq":true},"points":10},
      {"when":{"key":"derrame","eq":true},"points":10}
    ]},
    "interpretation":[
      {"min":-10,"max":50,"label":"Classe I-II","action":"Mortalidade < 1% — ambulatorial"},
      {"min":51,"max":70,"label":"Classe III","action":"Mortalidade ~3% — observação ou ambulatório com seguimento"},
      {"min":71,"max":90,"label":"Classe IV","action":"Mortalidade ~9% — internar"},
      {"min":91,"max":250,"label":"Classe V","action":"Mortalidade ~27% — UTI"}
    ],
    "disclaimer":"Para idade, some o valor em anos; mulher: idade − 10. Soma todos os pontos."
  }$$::jsonb,
  'Fine MJ et al., 1997 (NEJM)',
  'https://pubmed.ncbi.nlm.nih.gov/8995087/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 25. Geneva PE revisado — pré-teste TEP
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'geneva-pe',
  'Geneva PE (revisado)',
  'Cardiologia',
  'Probabilidade pré-teste de TEP. Alternativa ao Wells; mais objetivo (não inclui julgamento clínico).',
  'Adulto com suspeita de TEP; orienta investigação (D-dímero vs AngioTC).',
  $${
    "inputs":[
      {"key":"idade65","label":"Idade > 65 anos","type":"boolean"},
      {"key":"tep_prev","label":"TEP/TVP prévio","type":"boolean"},
      {"key":"cirurgia","label":"Cirurgia ou fratura nos últimos 30 dias","type":"boolean"},
      {"key":"cancer","label":"Câncer ativo","type":"boolean"},
      {"key":"dor_uni","label":"Dor unilateral em MI","type":"boolean"},
      {"key":"hemoptise","label":"Hemoptise","type":"boolean"},
      {"key":"fc","label":"Frequência cardíaca","type":"select","options":[
        {"value":"0","label":"< 75"},{"value":"3","label":"75–94"},{"value":"5","label":"≥ 95"}]},
      {"key":"dor_palp","label":"Dor à palpação venosa MI + edema unilateral","type":"boolean"}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"idade65","eq":true},"points":1},
      {"when":{"key":"tep_prev","eq":true},"points":3},
      {"when":{"key":"cirurgia","eq":true},"points":2},
      {"when":{"key":"cancer","eq":true},"points":2},
      {"when":{"key":"dor_uni","eq":true},"points":3},
      {"when":{"key":"hemoptise","eq":true},"points":2},
      {"when":{"key":"fc","eq":"3"},"points":3},
      {"when":{"key":"fc","eq":"5"},"points":5},
      {"when":{"key":"dor_palp","eq":true},"points":4}
    ]},
    "interpretation":[
      {"min":0,"max":3,"label":"Baixa probabilidade","action":"~8% TEP — D-dímero (idade-ajustado) afasta se negativo"},
      {"min":4,"max":10,"label":"Probabilidade moderada","action":"~28% TEP — D-dímero; se positivo, AngioTC"},
      {"min":11,"max":22,"label":"Alta probabilidade","action":"~74% TEP — AngioTC direto, considerar anticoag empírica"}
    ]
  }$$::jsonb,
  'Le Gal G et al., 2006 (Ann Intern Med)',
  'https://pubmed.ncbi.nlm.nih.gov/16461960/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 26. Cockcroft-Gault — clearance de creatinina
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'cockcroft-gault',
  'Cockcroft-Gault (clearance de creatinina)',
  'Nefrologia',
  'Estimativa de clearance de creatinina (mL/min). Usado historicamente para AJUSTAR DOSE de fármacos (especialmente DOACs, vancomicina).',
  'Calcular CrCl para ajuste de dose de medicamentos. Para estadiamento DRC, prefira CKD-EPI.',
  $${
    "inputs":[
      {"key":"idade","label":"Idade (anos)","type":"number","min":18,"max":120},
      {"key":"peso","label":"Peso (kg)","type":"number","min":30,"max":250},
      {"key":"cr","label":"Creatinina sérica (mg/dL)","type":"number","min":0.3,"max":20,"step":0.1},
      {"key":"sexo","label":"Sexo","type":"select","options":[{"value":"M","label":"Masculino"},{"value":"F","label":"Feminino"}]}
    ],
    "formula":{"type":"custom_expression","expression":"((140 - idade) * peso / (72 * cr)) * (sexo == \"F\" ? 0.85 : 1)"},
    "interpretation":[
      {"min":0,"max":15,"label":"Falência renal","action":"Considerar TRS"},
      {"min":15,"max":30,"label":"Disfunção grave","action":"Ajuste agressivo de fármacos; muitas drogas contraindicadas"},
      {"min":30,"max":60,"label":"Disfunção moderada","action":"Ajustar metformina, DOACs, vancomicina, etc"},
      {"min":60,"max":90,"label":"Leve","action":"Maioria das drogas sem ajuste"},
      {"min":90,"max":300,"label":"Função preservada","action":"Sem ajuste"}
    ],
    "disclaimer":"Não usa raça. Usa peso REAL — em obesos, considerar peso ideal ou ajustado. Para DRC, prefira CKD-EPI."
  }$$::jsonb,
  'Cockcroft DW & Gault MH, 1976 (Nephron)',
  'https://pubmed.ncbi.nlm.nih.gov/1244564/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 27. Ranson — gravidade de pancreatite aguda
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'ranson',
  'Ranson (admissão)',
  'Gastroenterologia',
  'Critérios de gravidade de pancreatite aguda. Versão admissão (5 critérios) é avaliada nas primeiras 24h.',
  'Estratificar gravidade de PA. ≥ 3 = pancreatite grave (BISAP/APACHE-II são alternativas mais ágeis).',
  $${
    "inputs":[
      {"key":"idade","label":"Idade > 55 anos (não-biliar) / > 70 anos (biliar)","type":"boolean"},
      {"key":"leuco","label":"Leucócitos > 16.000 (não-biliar) / > 18.000 (biliar)","type":"boolean"},
      {"key":"glic","label":"Glicemia > 200 (não-biliar) / > 220 (biliar)","type":"boolean"},
      {"key":"ldh","label":"LDH > 350 (não-biliar) / > 400 (biliar)","type":"boolean"},
      {"key":"ast","label":"AST > 250 (não-biliar) / > 250 (biliar)","type":"boolean"}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"idade","eq":true},"points":1},
      {"when":{"key":"leuco","eq":true},"points":1},
      {"when":{"key":"glic","eq":true},"points":1},
      {"when":{"key":"ldh","eq":true},"points":1},
      {"when":{"key":"ast","eq":true},"points":1}
    ]},
    "interpretation":[
      {"min":0,"max":2,"label":"Leve","action":"Mortalidade < 1%"},
      {"min":3,"max":4,"label":"Moderada/grave","action":"Mortalidade 15% — internar UTI"},
      {"min":5,"max":5,"label":"Grave","action":"Mortalidade 40% — UTI obrigatório"}
    ],
    "disclaimer":"Versão completa tem 11 critérios (5 admissão + 6 nas 48h). BISAP é alternativa moderna (uso na admissão)."
  }$$::jsonb,
  'Ranson JH, 1974 (Surg Gynecol Obstet)',
  'https://pubmed.ncbi.nlm.nih.gov/4814758/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 28. NEWS-2 — alerta precoce de deterioração
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'news2',
  'NEWS-2',
  'Triagem',
  'National Early Warning Score 2. Detecta deterioração clínica em paciente hospitalizado; mais sensível que qSOFA na enfermaria.',
  'Triagem em PA, enfermaria, atendimento pré-hospitalar. Valor ≥ 5 sugere sepse/deterioração.',
  $${
    "inputs":[
      {"key":"fr","label":"Frequência respiratória","type":"select","options":[
        {"value":"3a","label":"≤ 8"},{"value":"1","label":"9–11"},{"value":"0","label":"12–20"},
        {"value":"2","label":"21–24"},{"value":"3b","label":"≥ 25"}]},
      {"key":"spo2","label":"SpO₂ (paciente sem DPOC)","type":"select","options":[
        {"value":"3a","label":"≤ 91%"},{"value":"2","label":"92–93%"},{"value":"1","label":"94–95%"},{"value":"0","label":"≥ 96%"}]},
      {"key":"o2","label":"Em O₂ suplementar","type":"boolean"},
      {"key":"temp","label":"Temperatura","type":"select","options":[
        {"value":"3","label":"≤ 35°C"},{"value":"1a","label":"35,1–36"},{"value":"0","label":"36,1–38"},
        {"value":"1b","label":"38,1–39"},{"value":"2","label":"≥ 39,1°C"}]},
      {"key":"pas","label":"PA sistólica","type":"select","options":[
        {"value":"3a","label":"≤ 90"},{"value":"2","label":"91–100"},{"value":"1","label":"101–110"},
        {"value":"0","label":"111–219"},{"value":"3b","label":"≥ 220"}]},
      {"key":"fc","label":"Frequência cardíaca","type":"select","options":[
        {"value":"3a","label":"≤ 40"},{"value":"1a","label":"41–50"},{"value":"0","label":"51–90"},
        {"value":"1b","label":"91–110"},{"value":"2","label":"111–130"},{"value":"3b","label":"≥ 131"}]},
      {"key":"consc","label":"Consciência","type":"select","options":[
        {"value":"0","label":"Alerta"},{"value":"3","label":"Confuso/sonolento/estupor"}]}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"fr","eq":"3a"},"points":3},{"when":{"key":"fr","eq":"1"},"points":1},
      {"when":{"key":"fr","eq":"2"},"points":2},{"when":{"key":"fr","eq":"3b"},"points":3},
      {"when":{"key":"spo2","eq":"3a"},"points":3},{"when":{"key":"spo2","eq":"2"},"points":2},{"when":{"key":"spo2","eq":"1"},"points":1},
      {"when":{"key":"o2","eq":true},"points":2},
      {"when":{"key":"temp","eq":"3"},"points":3},{"when":{"key":"temp","eq":"1a"},"points":1},
      {"when":{"key":"temp","eq":"1b"},"points":1},{"when":{"key":"temp","eq":"2"},"points":2},
      {"when":{"key":"pas","eq":"3a"},"points":3},{"when":{"key":"pas","eq":"2"},"points":2},
      {"when":{"key":"pas","eq":"1"},"points":1},{"when":{"key":"pas","eq":"3b"},"points":3},
      {"when":{"key":"fc","eq":"3a"},"points":3},{"when":{"key":"fc","eq":"1a"},"points":1},
      {"when":{"key":"fc","eq":"1b"},"points":1},{"when":{"key":"fc","eq":"2"},"points":2},{"when":{"key":"fc","eq":"3b"},"points":3},
      {"when":{"key":"consc","eq":"3"},"points":3}
    ]},
    "interpretation":[
      {"min":0,"max":4,"label":"Risco baixo","action":"Aferição mínima 12/12h"},
      {"min":5,"max":6,"label":"Risco médio","action":"Aferição 1/1h, escalar pra equipe sênior"},
      {"min":7,"max":21,"label":"Risco alto","action":"Resposta crítica imediata, transferir UTI"}
    ],
    "disclaimer":"Para DPOC, use SpO₂ alvo 88-92% — escala diferente (NEWS-2 SpO₂ scale 2)."
  }$$::jsonb,
  'Royal College of Physicians, NEWS-2, 2017',
  'https://www.rcp.ac.uk/improving-care/resources/national-early-warning-score-news-2/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 29. PHQ-9 — rastreio de depressão
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'phq9',
  'PHQ-9',
  'Saúde mental',
  'Patient Health Questionnaire-9. Rastreio e graduação de depressão maior.',
  'Adulto com queixa de humor; ≥ 10 sugere depressão maior. Acompanhar resposta ao tratamento.',
  $${
    "inputs":[
      {"key":"q1","label":"Pouco interesse ou prazer em fazer coisas","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q2","label":"Sentir-se desanimado, deprimido ou sem esperança","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q3","label":"Dificuldade dormir / dormir demais","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q4","label":"Cansaço ou pouca energia","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q5","label":"Falta de apetite ou comer demais","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q6","label":"Sentir-se mal consigo (fracasso, decepção)","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q7","label":"Dificuldade de concentração","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q8","label":"Movimentação/fala lenta OU inquietude","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]},
      {"key":"q9","label":"Pensamentos de morte / autoagressão","type":"select","options":[
        {"value":"0","label":"Nenhum dia"},{"value":"1","label":"Vários dias"},{"value":"2","label":"Mais da metade"},{"value":"3","label":"Quase todos os dias"}]}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"q1","eq":"1"},"points":1},{"when":{"key":"q1","eq":"2"},"points":2},{"when":{"key":"q1","eq":"3"},"points":3},
      {"when":{"key":"q2","eq":"1"},"points":1},{"when":{"key":"q2","eq":"2"},"points":2},{"when":{"key":"q2","eq":"3"},"points":3},
      {"when":{"key":"q3","eq":"1"},"points":1},{"when":{"key":"q3","eq":"2"},"points":2},{"when":{"key":"q3","eq":"3"},"points":3},
      {"when":{"key":"q4","eq":"1"},"points":1},{"when":{"key":"q4","eq":"2"},"points":2},{"when":{"key":"q4","eq":"3"},"points":3},
      {"when":{"key":"q5","eq":"1"},"points":1},{"when":{"key":"q5","eq":"2"},"points":2},{"when":{"key":"q5","eq":"3"},"points":3},
      {"when":{"key":"q6","eq":"1"},"points":1},{"when":{"key":"q6","eq":"2"},"points":2},{"when":{"key":"q6","eq":"3"},"points":3},
      {"when":{"key":"q7","eq":"1"},"points":1},{"when":{"key":"q7","eq":"2"},"points":2},{"when":{"key":"q7","eq":"3"},"points":3},
      {"when":{"key":"q8","eq":"1"},"points":1},{"when":{"key":"q8","eq":"2"},"points":2},{"when":{"key":"q8","eq":"3"},"points":3},
      {"when":{"key":"q9","eq":"1"},"points":1},{"when":{"key":"q9","eq":"2"},"points":2},{"when":{"key":"q9","eq":"3"},"points":3}
    ]},
    "interpretation":[
      {"min":0,"max":4,"label":"Mínima","action":"Sem ação específica"},
      {"min":5,"max":9,"label":"Leve","action":"Vigiar; psicoeducação; reavaliar em 2-4 sem"},
      {"min":10,"max":14,"label":"Moderada","action":"Tratar com TCC e/ou ISRS"},
      {"min":15,"max":19,"label":"Moderadamente grave","action":"ISRS + psicoterapia"},
      {"min":20,"max":27,"label":"Grave","action":"Tratamento intensivo, considerar internação se risco suicida"}
    ],
    "disclaimer":"Item Q9 (ideação suicida) ≥ 1 — investigar risco mesmo com PHQ-9 baixo."
  }$$::jsonb,
  'Kroenke K et al., 2001 (J Gen Intern Med)',
  'https://pubmed.ncbi.nlm.nih.gov/11556941/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();

-- ============================================================
-- 30. Critérios de Light — diferenciação de derrame pleural
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'light',
  'Critérios de Light',
  'Pneumologia',
  'Diferencia derrame pleural exsudativo de transudativo. Basta UM critério para classificar como exsudato.',
  'Adulto com derrame pleural após toracocentese diagnóstica.',
  $${
    "inputs":[
      {"key":"prot_ratio","label":"Razão proteína pleural / sérica > 0,5","type":"boolean"},
      {"key":"ldh_ratio","label":"Razão LDH pleural / sérica > 0,6","type":"boolean"},
      {"key":"ldh_pleura","label":"LDH pleural > 2/3 do LSN sérico (≈ > 200 UI/L)","type":"boolean"}
    ],
    "formula":{"type":"sum_weighted","rules":[
      {"when":{"key":"prot_ratio","eq":true},"points":1},
      {"when":{"key":"ldh_ratio","eq":true},"points":1},
      {"when":{"key":"ldh_pleura","eq":true},"points":1}
    ]},
    "interpretation":[
      {"min":0,"max":0,"label":"Transudato","action":"IC, cirrose, síndrome nefrótica, mixedema, embolia pulmonar (raro)"},
      {"min":1,"max":3,"label":"Exsudato","action":"Investigar: infeccioso (paraneumônico, TB), maligno, autoimune, pancreatite, quilotórax"}
    ],
    "disclaimer":"Em pacientes em diuréticos (IC tratada), Light pode falsamente indicar exsudato — calcular gradiente albumina sérica-pleural; > 1,2 g/dL sugere transudato apesar do Light."
  }$$::jsonb,
  'Light RW, 1972 (Ann Intern Med)',
  'https://pubmed.ncbi.nlm.nih.gov/4642731/',
  true
) ON CONFLICT (slug) DO UPDATE SET definicao = EXCLUDED.definicao, updated_at = now();
