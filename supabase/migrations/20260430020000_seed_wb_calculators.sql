-- Phase 1: seed inicial de 20 calculadoras clinicas para o Whitebook.
-- Conteudo eh factual: formulas matematicas (nao copyrightable) +
-- descricoes curtas em palavras proprias. Fonte primaria citada por
-- autor/ano. Pode ser reseedado via UPSERT por slug.

-- ============================================================
-- 1. CHA2DS2-VASc — risco de AVC em fibrilacao atrial
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'cha2ds2-vasc',
  'CHA₂DS₂-VASc',
  'Cardiologia',
  'Estimativa de risco anual de AVC em pacientes com fibrilação atrial não-valvar.',
  'Decidir indicação de anticoagulação em FA não-valvar.',
  $${
    "inputs":[
      {"key":"icc","label":"Insuficiência cardíaca","type":"boolean"},
      {"key":"hipertensao","label":"Hipertensão arterial","type":"boolean"},
      {"key":"idade","label":"Idade","type":"number","min":0,"max":120,"unit":"anos"},
      {"key":"diabetes","label":"Diabetes","type":"boolean"},
      {"key":"avc_ait","label":"AVC/AIT/tromboembolismo prévio","type":"boolean"},
      {"key":"vascular","label":"Doença vascular (IAM, DAP, placa aórtica)","type":"boolean"},
      {"key":"sexo","label":"Sexo","type":"select","options":[{"value":"M","label":"Masculino"},{"value":"F","label":"Feminino"}]}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"icc","eq":true},"points":1},
        {"when":{"key":"hipertensao","eq":true},"points":1},
        {"when":{"key":"idade","gte":75},"points":2},
        {"when":{"key":"idade","gte":65,"lt":75},"points":1},
        {"when":{"key":"diabetes","eq":true},"points":1},
        {"when":{"key":"avc_ait","eq":true},"points":2},
        {"when":{"key":"vascular","eq":true},"points":1},
        {"when":{"key":"sexo","eq":"F"},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":0,"label":"Risco muito baixo","action":"Anticoagulação geralmente não indicada"},
      {"min":1,"max":1,"label":"Risco baixo a moderado","action":"Considerar anticoagulação (homem); reavaliar (mulher 1 ponto isolado por sexo)"},
      {"min":2,"max":9,"label":"Risco elevado","action":"Anticoagulação oral recomendada (preferência DOAC)"}
    ],
    "disclaimer":"Considere também HAS-BLED para balancear risco hemorrágico."
  }$$::jsonb,
  'Lip GY et al, 2010',
  'https://pubmed.ncbi.nlm.nih.gov/19762550/',
  true
);

-- ============================================================
-- 2. HAS-BLED — risco de sangramento em anticoagulado
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'has-bled',
  'HAS-BLED',
  'Cardiologia',
  'Risco anual de sangramento maior em paciente em anticoagulação oral por FA.',
  'Avaliar risco hemorrágico antes de iniciar/continuar anticoagulação.',
  $${
    "inputs":[
      {"key":"hipertensao","label":"Hipertensão (PAS > 160 mmHg)","type":"boolean"},
      {"key":"renal","label":"Disfunção renal (Cr > 2,0 mg/dL ou diálise)","type":"boolean"},
      {"key":"hepatica","label":"Disfunção hepática (cirrose, BT > 2x ou TGO/TGP > 3x)","type":"boolean"},
      {"key":"avc","label":"AVC prévio","type":"boolean"},
      {"key":"sangramento","label":"História de sangramento maior ou predisposição","type":"boolean"},
      {"key":"inr_labil","label":"INR lábil (TTR < 60% se em varfarina)","type":"boolean"},
      {"key":"idosos","label":"Idade > 65 anos","type":"boolean"},
      {"key":"drogas","label":"Uso concomitante de antiplaquetários ou AINE","type":"boolean"},
      {"key":"alcool","label":"Consumo alcoólico ≥ 8 doses/semana","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"hipertensao","eq":true},"points":1},
        {"when":{"key":"renal","eq":true},"points":1},
        {"when":{"key":"hepatica","eq":true},"points":1},
        {"when":{"key":"avc","eq":true},"points":1},
        {"when":{"key":"sangramento","eq":true},"points":1},
        {"when":{"key":"inr_labil","eq":true},"points":1},
        {"when":{"key":"idosos","eq":true},"points":1},
        {"when":{"key":"drogas","eq":true},"points":1},
        {"when":{"key":"alcool","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":2,"label":"Risco baixo","action":"Anticoagulação geralmente segura; monitorar"},
      {"min":3,"max":9,"label":"Risco alto","action":"Atenção redobrada, corrigir fatores modificáveis (PA, álcool, AINE)"}
    ],
    "disclaimer":"Score alto NÃO contraindica anticoagulação — sinaliza necessidade de monitoramento mais próximo."
  }$$::jsonb,
  'Pisters R et al, 2010',
  'https://pubmed.ncbi.nlm.nih.gov/20299623/',
  true
);

-- ============================================================
-- 3. Wells PE — probabilidade clínica de embolia pulmonar
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'wells-tep',
  'Wells (TEP)',
  'Pneumologia',
  'Probabilidade clínica de tromboembolismo pulmonar.',
  'Estratificar pré-teste antes de D-dímero/AngioTC.',
  $${
    "inputs":[
      {"key":"sinais_tvp","label":"Sinais clínicos de TVP","type":"boolean"},
      {"key":"tep_provavel","label":"TEP é o diagnóstico mais provável","type":"boolean"},
      {"key":"fc","label":"FC > 100 bpm","type":"boolean"},
      {"key":"imobilizacao","label":"Imobilização ≥ 3 dias ou cirurgia ≤ 4 sem","type":"boolean"},
      {"key":"tep_previa","label":"TEP/TVP prévia","type":"boolean"},
      {"key":"hemoptise","label":"Hemoptise","type":"boolean"},
      {"key":"cancer","label":"Câncer ativo (tratamento ≤ 6 meses ou paliativo)","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"sinais_tvp","eq":true},"points":3},
        {"when":{"key":"tep_provavel","eq":true},"points":3},
        {"when":{"key":"fc","eq":true},"points":1.5},
        {"when":{"key":"imobilizacao","eq":true},"points":1.5},
        {"when":{"key":"tep_previa","eq":true},"points":1.5},
        {"when":{"key":"hemoptise","eq":true},"points":1},
        {"when":{"key":"cancer","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":1.5,"label":"TEP improvável (baixa)","action":"D-dímero; se negativo, descartado"},
      {"min":2,"max":6,"label":"TEP improvável (intermediária)","action":"D-dímero; se positivo, AngioTC"},
      {"min":6.5,"max":99,"label":"TEP provável (alta)","action":"AngioTC pulmonar direta"}
    ],
    "disclaimer":"Versão dicotomizada usa cutoff em 4: ≤4 improvável, >4 provável."
  }$$::jsonb,
  'Wells PS et al, 2001',
  'https://pubmed.ncbi.nlm.nih.gov/11453709/',
  true
);

-- ============================================================
-- 4. Wells DVT — probabilidade clínica de TVP
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'wells-tvp',
  'Wells (TVP)',
  'Hematologia',
  'Probabilidade clínica de trombose venosa profunda em membros inferiores.',
  'Estratificação pré-teste antes de D-dímero/USG Doppler.',
  $${
    "inputs":[
      {"key":"cancer","label":"Câncer ativo","type":"boolean"},
      {"key":"paralisia","label":"Paralisia/paresia ou imobilização recente do membro","type":"boolean"},
      {"key":"acamado","label":"Acamado ≥ 3 dias ou cirurgia maior ≤ 12 semanas","type":"boolean"},
      {"key":"dor_trajeto","label":"Dor à palpação no trajeto do sistema venoso profundo","type":"boolean"},
      {"key":"edema_membro","label":"Edema de todo o membro","type":"boolean"},
      {"key":"edema_pant","label":"Edema da panturrilha > 3 cm em relação à contralateral","type":"boolean"},
      {"key":"edema_cacifo","label":"Edema com cacifo confinado ao membro sintomático","type":"boolean"},
      {"key":"colateral","label":"Veias colaterais superficiais (não varizes)","type":"boolean"},
      {"key":"tvp_previa","label":"TVP prévia documentada","type":"boolean"},
      {"key":"alt_dx","label":"Diagnóstico alternativo tão ou mais provável que TVP","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"cancer","eq":true},"points":1},
        {"when":{"key":"paralisia","eq":true},"points":1},
        {"when":{"key":"acamado","eq":true},"points":1},
        {"when":{"key":"dor_trajeto","eq":true},"points":1},
        {"when":{"key":"edema_membro","eq":true},"points":1},
        {"when":{"key":"edema_pant","eq":true},"points":1},
        {"when":{"key":"edema_cacifo","eq":true},"points":1},
        {"when":{"key":"colateral","eq":true},"points":1},
        {"when":{"key":"tvp_previa","eq":true},"points":1},
        {"when":{"key":"alt_dx","eq":true},"points":-2}
      ]
    },
    "interpretation":[
      {"min":-99,"max":0,"label":"Baixa probabilidade","action":"D-dímero; se negativo, TVP descartada"},
      {"min":1,"max":2,"label":"Probabilidade moderada","action":"USG Doppler; D-dímero pode ser usado"},
      {"min":3,"max":99,"label":"Alta probabilidade","action":"USG Doppler direto"}
    ],
    "disclaimer":"Versão dicotomizada: ≥2 provável, <2 improvável."
  }$$::jsonb,
  'Wells PS et al, 1997',
  'https://pubmed.ncbi.nlm.nih.gov/9314878/',
  true
);

-- ============================================================
-- 5. qSOFA — sepse beira-leito
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'qsofa',
  'qSOFA',
  'Infectologia / UTI',
  'Triagem rápida beira-leito para mortalidade em pacientes com infecção suspeita (Sepsis-3).',
  'Avaliar deterioração em paciente com infecção fora da UTI.',
  $${
    "inputs":[
      {"key":"fr","label":"Frequência respiratória ≥ 22 ipm","type":"boolean"},
      {"key":"alt_mental","label":"Alteração do nível de consciência (Glasgow < 15)","type":"boolean"},
      {"key":"pas","label":"PAS ≤ 100 mmHg","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"fr","eq":true},"points":1},
        {"when":{"key":"alt_mental","eq":true},"points":1},
        {"when":{"key":"pas","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":1,"label":"Baixo risco","action":"Vigilância clínica"},
      {"min":2,"max":3,"label":"Alto risco","action":"Mortalidade aumentada — investigar sepse, escalonar cuidado"}
    ],
    "disclaimer":"qSOFA não substitui SOFA completo — é ferramenta de triagem fora da UTI."
  }$$::jsonb,
  'Singer M et al, JAMA 2016',
  'https://pubmed.ncbi.nlm.nih.gov/26903338/',
  true
);

-- ============================================================
-- 6. CURB-65 — gravidade de pneumonia adquirida na comunidade
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'curb-65',
  'CURB-65',
  'Pneumologia',
  'Estimativa de mortalidade em pneumonia adquirida na comunidade.',
  'Decidir local de tratamento (ambulatorial vs internação vs UTI).',
  $${
    "inputs":[
      {"key":"confusao","label":"Confusão mental","type":"boolean"},
      {"key":"ureia","label":"Ureia > 50 mg/dL (> 7 mmol/L)","type":"boolean"},
      {"key":"fr","label":"FR ≥ 30 ipm","type":"boolean"},
      {"key":"pa","label":"PAS < 90 ou PAD ≤ 60 mmHg","type":"boolean"},
      {"key":"idade","label":"Idade ≥ 65 anos","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"confusao","eq":true},"points":1},
        {"when":{"key":"ureia","eq":true},"points":1},
        {"when":{"key":"fr","eq":true},"points":1},
        {"when":{"key":"pa","eq":true},"points":1},
        {"when":{"key":"idade","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":1,"label":"Baixa mortalidade","action":"Tratamento ambulatorial"},
      {"min":2,"max":2,"label":"Mortalidade intermediária","action":"Considerar internação"},
      {"min":3,"max":5,"label":"Mortalidade alta","action":"Internação obrigatória, considerar UTI se ≥4"}
    ],
    "disclaimer":"CRB-65 (sem ureia) é alternativa ambulatorial."
  }$$::jsonb,
  'Lim WS et al, Thorax 2003',
  'https://pubmed.ncbi.nlm.nih.gov/12728155/',
  true
);

-- ============================================================
-- 7. Glasgow Coma Scale (GCS)
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'glasgow',
  'Escala de Coma de Glasgow',
  'Neurologia',
  'Avaliação do nível de consciência através de abertura ocular, resposta verbal e motora.',
  'TCE, AVC, intoxicações, deterioração neurológica.',
  $${
    "inputs":[
      {"key":"ocular","label":"Abertura ocular","type":"select","options":[
        {"value":"4","label":"Espontânea (4)"},
        {"value":"3","label":"Ao chamado (3)"},
        {"value":"2","label":"À dor (2)"},
        {"value":"1","label":"Ausente (1)"}
      ]},
      {"key":"verbal","label":"Resposta verbal","type":"select","options":[
        {"value":"5","label":"Orientado (5)"},
        {"value":"4","label":"Confuso (4)"},
        {"value":"3","label":"Palavras inapropriadas (3)"},
        {"value":"2","label":"Sons incompreensíveis (2)"},
        {"value":"1","label":"Ausente (1)"}
      ]},
      {"key":"motora","label":"Resposta motora","type":"select","options":[
        {"value":"6","label":"Obedece comandos (6)"},
        {"value":"5","label":"Localiza dor (5)"},
        {"value":"4","label":"Retira à dor (4)"},
        {"value":"3","label":"Flexão anormal — decorticação (3)"},
        {"value":"2","label":"Extensão anormal — descerebração (2)"},
        {"value":"1","label":"Ausente (1)"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(ocular) + toNumber(verbal) + toNumber(motora)"
    },
    "interpretation":[
      {"min":3,"max":8,"label":"Coma — TCE grave","action":"Considerar IOT (Glasgow ≤ 8)"},
      {"min":9,"max":12,"label":"TCE moderado","action":"Avaliação neurocirúrgica"},
      {"min":13,"max":15,"label":"TCE leve / consciência preservada","action":"Vigilância e seguimento"}
    ],
    "disclaimer":"Documente os 3 componentes separadamente (E_V_M_), não só o total."
  }$$::jsonb,
  'Teasdale G & Jennett B, Lancet 1974',
  'https://pubmed.ncbi.nlm.nih.gov/4136544/',
  true
);

-- ============================================================
-- 8. MELD — disfunção hepática terminal
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'meld',
  'MELD',
  'Hepatologia',
  'Severidade de hepatopatia crônica — fila de transplante hepático.',
  'Estratificar gravidade de cirrose; alocação em fila de transplante.',
  $${
    "inputs":[
      {"key":"bilirrubina","label":"Bilirrubina total","type":"number","min":0.1,"max":99,"step":0.1,"unit":"mg/dL"},
      {"key":"creatinina","label":"Creatinina (mín 1,0; máx 4,0; em diálise → 4,0)","type":"number","min":0.1,"max":99,"step":0.1,"unit":"mg/dL"},
      {"key":"inr","label":"INR","type":"number","min":0.5,"max":99,"step":0.1}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"round(3.78 * log(max(bilirrubina, 1)) + 11.2 * log(max(inr, 1)) + 9.57 * log(min(max(creatinina, 1), 4)) + 6.43)"
    },
    "interpretation":[
      {"min":0,"max":9,"label":"Baixa gravidade","action":"Mortalidade 3 meses < 2%"},
      {"min":10,"max":19,"label":"Gravidade moderada","action":"Mortalidade 3 meses ~6%"},
      {"min":20,"max":29,"label":"Gravidade alta","action":"Mortalidade 3 meses ~20%; priorizar transplante"},
      {"min":30,"max":39,"label":"Crítico","action":"Mortalidade 3 meses ~50%"},
      {"min":40,"max":99,"label":"Extremamente crítico","action":"Mortalidade 3 meses > 70%"}
    ],
    "disclaimer":"Valores de creatinina/bilirrubina/INR < 1.0 são truncados a 1.0; creatinina máxima 4.0 (paciente em diálise = 4.0)."
  }$$::jsonb,
  'Kamath PS et al, Hepatology 2001',
  'https://pubmed.ncbi.nlm.nih.gov/11172350/',
  true
);

-- ============================================================
-- 9. Child-Pugh — gravidade de cirrose hepática
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'child-pugh',
  'Child-Pugh',
  'Hepatologia',
  'Estimativa de prognóstico em cirrose hepática (sobrevida 1-2 anos).',
  'Cirrose, decisão pré-cirurgia abdominal eletiva.',
  $${
    "inputs":[
      {"key":"bilirrubina","label":"Bilirrubina total","type":"select","options":[
        {"value":"1","label":"< 2 mg/dL (1)"},
        {"value":"2","label":"2 – 3 mg/dL (2)"},
        {"value":"3","label":"> 3 mg/dL (3)"}
      ]},
      {"key":"albumina","label":"Albumina","type":"select","options":[
        {"value":"1","label":"> 3,5 g/dL (1)"},
        {"value":"2","label":"2,8 – 3,5 g/dL (2)"},
        {"value":"3","label":"< 2,8 g/dL (3)"}
      ]},
      {"key":"inr","label":"INR","type":"select","options":[
        {"value":"1","label":"< 1,7 (1)"},
        {"value":"2","label":"1,7 – 2,3 (2)"},
        {"value":"3","label":"> 2,3 (3)"}
      ]},
      {"key":"ascite","label":"Ascite","type":"select","options":[
        {"value":"1","label":"Ausente (1)"},
        {"value":"2","label":"Leve, controlada com diurético (2)"},
        {"value":"3","label":"Moderada/grave, refratária (3)"}
      ]},
      {"key":"encefalopatia","label":"Encefalopatia hepática","type":"select","options":[
        {"value":"1","label":"Ausente (1)"},
        {"value":"2","label":"Grau I-II (2)"},
        {"value":"3","label":"Grau III-IV (3)"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(bilirrubina) + toNumber(albumina) + toNumber(inr) + toNumber(ascite) + toNumber(encefalopatia)"
    },
    "interpretation":[
      {"min":5,"max":6,"label":"Child A — bem compensado","action":"Sobrevida 1 ano ~100%"},
      {"min":7,"max":9,"label":"Child B — comprometimento significativo","action":"Sobrevida 1 ano ~80%"},
      {"min":10,"max":15,"label":"Child C — descompensado","action":"Sobrevida 1 ano ~45%; evitar cirurgia eletiva"}
    ],
    "disclaimer":"Hoje MELD é preferido para alocação em transplante; Child-Pugh ainda útil para risco cirúrgico."
  }$$::jsonb,
  'Pugh RN et al, 1973',
  'https://pubmed.ncbi.nlm.nih.gov/4541913/',
  true
);

-- ============================================================
-- 10. APGAR — vitalidade do recém-nascido
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'apgar',
  'APGAR',
  'Pediatria',
  'Avaliação rápida da vitalidade do recém-nascido aos 1 e 5 minutos de vida.',
  'Sala de parto.',
  $${
    "inputs":[
      {"key":"fc","label":"Frequência cardíaca","type":"select","options":[
        {"value":"0","label":"Ausente (0)"},
        {"value":"1","label":"< 100 bpm (1)"},
        {"value":"2","label":"≥ 100 bpm (2)"}
      ]},
      {"key":"resp","label":"Respiração","type":"select","options":[
        {"value":"0","label":"Ausente (0)"},
        {"value":"1","label":"Lenta, irregular (1)"},
        {"value":"2","label":"Choro forte (2)"}
      ]},
      {"key":"tonus","label":"Tônus muscular","type":"select","options":[
        {"value":"0","label":"Flácido (0)"},
        {"value":"1","label":"Flexão de extremidades (1)"},
        {"value":"2","label":"Movimento ativo (2)"}
      ]},
      {"key":"irrit","label":"Irritabilidade reflexa","type":"select","options":[
        {"value":"0","label":"Sem resposta (0)"},
        {"value":"1","label":"Caretas (1)"},
        {"value":"2","label":"Choro/tosse vigorosa (2)"}
      ]},
      {"key":"cor","label":"Cor","type":"select","options":[
        {"value":"0","label":"Cianose central / pálido (0)"},
        {"value":"1","label":"Cianose de extremidades (1)"},
        {"value":"2","label":"Rosado (2)"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(fc) + toNumber(resp) + toNumber(tonus) + toNumber(irrit) + toNumber(cor)"
    },
    "interpretation":[
      {"min":0,"max":3,"label":"Asfixia grave","action":"Reanimação imediata"},
      {"min":4,"max":6,"label":"Asfixia moderada","action":"Suporte ventilatório"},
      {"min":7,"max":10,"label":"Boa vitalidade","action":"Cuidados de rotina"}
    ],
    "disclaimer":"Avaliar 1 e 5 min; se < 7 aos 5 min, repetir a cada 5 min até 20 min."
  }$$::jsonb,
  'Apgar V, Curr Res Anesth Analg 1953',
  'https://pubmed.ncbi.nlm.nih.gov/13083014/',
  true
);

-- ============================================================
-- 11. TIMI Risk Score — IAM sem supra
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'timi-nstemi',
  'TIMI Risk (NSTEMI/UA)',
  'Cardiologia',
  'Risco de morte/IAM/revascularização em 14 dias em SCASSST.',
  'SCA sem supra de ST.',
  $${
    "inputs":[
      {"key":"idade","label":"Idade ≥ 65 anos","type":"boolean"},
      {"key":"fatores","label":"≥ 3 fatores de risco para DAC (HAS, DM, dislipidemia, tabagismo, HF)","type":"boolean"},
      {"key":"dac_conhecida","label":"Estenose coronariana ≥ 50% conhecida","type":"boolean"},
      {"key":"aas","label":"Uso de AAS nos últimos 7 dias","type":"boolean"},
      {"key":"angina","label":"≥ 2 episódios de angina nas últimas 24h","type":"boolean"},
      {"key":"st","label":"Alterações de ST ≥ 0,5 mm","type":"boolean"},
      {"key":"marcadores","label":"Troponina ou CK-MB elevados","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"idade","eq":true},"points":1},
        {"when":{"key":"fatores","eq":true},"points":1},
        {"when":{"key":"dac_conhecida","eq":true},"points":1},
        {"when":{"key":"aas","eq":true},"points":1},
        {"when":{"key":"angina","eq":true},"points":1},
        {"when":{"key":"st","eq":true},"points":1},
        {"when":{"key":"marcadores","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":2,"label":"Baixo risco","action":"Eventos em 14d ~5-8%"},
      {"min":3,"max":4,"label":"Risco intermediário","action":"Eventos em 14d ~13-20%"},
      {"min":5,"max":7,"label":"Alto risco","action":"Eventos em 14d ~26-41% — estratégia invasiva precoce"}
    ],
    "disclaimer":"Para STEMI use TIMI STEMI Score (diferente)."
  }$$::jsonb,
  'Antman EM et al, JAMA 2000',
  'https://pubmed.ncbi.nlm.nih.gov/10938172/',
  true
);

-- ============================================================
-- 12. Killip — IAM com supra
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'killip',
  'Killip',
  'Cardiologia',
  'Estratificação de mortalidade em 30 dias no IAM com supra ST baseado no exame físico.',
  'IAM agudo, beira-leito.',
  $${
    "inputs":[
      {"key":"classe","label":"Classe Killip","type":"select","options":[
        {"value":"1","label":"I — sem IC (sem estertores, sem B3)"},
        {"value":"2","label":"II — IC leve (estertores < 50%, B3, hipertensão venosa)"},
        {"value":"3","label":"III — edema agudo de pulmão (estertores > 50%)"},
        {"value":"4","label":"IV — choque cardiogênico"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(classe)"
    },
    "interpretation":[
      {"min":1,"max":1,"label":"Killip I","action":"Mortalidade 30d ~6%"},
      {"min":2,"max":2,"label":"Killip II","action":"Mortalidade 30d ~17%"},
      {"min":3,"max":3,"label":"Killip III","action":"Mortalidade 30d ~38%"},
      {"min":4,"max":4,"label":"Killip IV","action":"Mortalidade 30d ~67-81%"}
    ],
    "disclaimer":"Avaliar idealmente nas primeiras horas do IAM."
  }$$::jsonb,
  'Killip T & Kimball JT, Am J Cardiol 1967',
  'https://pubmed.ncbi.nlm.nih.gov/6059183/',
  true
);

-- ============================================================
-- 13. PESI simplificado (sPESI) — prognóstico em TEP
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'spesi',
  'sPESI (PESI simplificado)',
  'Pneumologia',
  'Prognóstico em 30 dias após TEP confirmado — versão simplificada do PESI.',
  'Após confirmação de TEP, decidir tratamento ambulatorial vs internação.',
  $${
    "inputs":[
      {"key":"idade","label":"Idade > 80 anos","type":"boolean"},
      {"key":"cancer","label":"Câncer (atual ou recente)","type":"boolean"},
      {"key":"icp","label":"Insuficiência cardíaca crônica ou DPOC","type":"boolean"},
      {"key":"fc","label":"FC ≥ 110 bpm","type":"boolean"},
      {"key":"pas","label":"PAS < 100 mmHg","type":"boolean"},
      {"key":"satO2","label":"SatO₂ < 90%","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"idade","eq":true},"points":1},
        {"when":{"key":"cancer","eq":true},"points":1},
        {"when":{"key":"icp","eq":true},"points":1},
        {"when":{"key":"fc","eq":true},"points":1},
        {"when":{"key":"pas","eq":true},"points":1},
        {"when":{"key":"satO2","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":0,"label":"Baixo risco","action":"Mortalidade 30d ~1% — considerar manejo ambulatorial"},
      {"min":1,"max":6,"label":"Alto risco","action":"Mortalidade 30d ~10% — internação"}
    ],
    "disclaimer":"Pacientes com instabilidade hemodinâmica devem ser tratados como TEP de alto risco independente do escore."
  }$$::jsonb,
  'Jiménez D et al, Arch Intern Med 2010',
  'https://pubmed.ncbi.nlm.nih.gov/20696966/',
  true
);

-- ============================================================
-- 14. IMC — Índice de Massa Corporal
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'imc',
  'IMC (Índice de Massa Corporal)',
  'Geral',
  'Classificação de peso em adultos pela razão peso/altura².',
  'Triagem nutricional em adultos (≥ 20 anos).',
  $${
    "inputs":[
      {"key":"peso","label":"Peso","type":"number","min":1,"max":400,"step":0.1,"unit":"kg"},
      {"key":"altura","label":"Altura","type":"number","min":0.5,"max":2.5,"step":0.01,"unit":"m"}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"round(peso / (altura * altura) * 10) / 10"
    },
    "interpretation":[
      {"min":0,"max":18.4,"label":"Baixo peso","action":"Investigar causas; suporte nutricional"},
      {"min":18.5,"max":24.9,"label":"Eutrófico","action":"Manter peso e estilo de vida"},
      {"min":25,"max":29.9,"label":"Sobrepeso","action":"Mudança de estilo de vida"},
      {"min":30,"max":34.9,"label":"Obesidade grau I","action":"MEV + considerar farmacoterapia"},
      {"min":35,"max":39.9,"label":"Obesidade grau II","action":"Farmacoterapia; avaliar cirurgia bariátrica"},
      {"min":40,"max":99,"label":"Obesidade grau III","action":"Indicação de cirurgia bariátrica"}
    ],
    "disclaimer":"Não se aplica a atletas, gestantes, idosos > 65 anos ou crianças (curva por idade)."
  }$$::jsonb,
  'OMS (classificação adulto)',
  'https://www.who.int/data/gho/indicator-metadata-registry/imr-details/3420',
  true
);

-- ============================================================
-- 15. Bishop — preditivo de sucesso de indução de parto
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'bishop',
  'Bishop',
  'Obstetrícia',
  'Preditivo do sucesso de indução de trabalho de parto pelo exame do colo uterino.',
  'Indicação de indução de parto a termo.',
  $${
    "inputs":[
      {"key":"dilatacao","label":"Dilatação cervical","type":"select","options":[
        {"value":"0","label":"Fechado (0)"},
        {"value":"1","label":"1-2 cm (1)"},
        {"value":"2","label":"3-4 cm (2)"},
        {"value":"3","label":"≥ 5 cm (3)"}
      ]},
      {"key":"esvaec","label":"Esvaecimento","type":"select","options":[
        {"value":"0","label":"0-30% (0)"},
        {"value":"1","label":"40-50% (1)"},
        {"value":"2","label":"60-70% (2)"},
        {"value":"3","label":"≥ 80% (3)"}
      ]},
      {"key":"plano","label":"Altura da apresentação (planos de De Lee)","type":"select","options":[
        {"value":"0","label":"-3 (0)"},
        {"value":"1","label":"-2 (1)"},
        {"value":"2","label":"-1/0 (2)"},
        {"value":"3","label":"+1/+2 (3)"}
      ]},
      {"key":"consist","label":"Consistência do colo","type":"select","options":[
        {"value":"0","label":"Firme (0)"},
        {"value":"1","label":"Médio (1)"},
        {"value":"2","label":"Amolecido (2)"}
      ]},
      {"key":"posicao","label":"Posição do colo","type":"select","options":[
        {"value":"0","label":"Posterior (0)"},
        {"value":"1","label":"Médio (1)"},
        {"value":"2","label":"Anterior (2)"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(dilatacao) + toNumber(esvaec) + toNumber(plano) + toNumber(consist) + toNumber(posicao)"
    },
    "interpretation":[
      {"min":0,"max":5,"label":"Colo desfavorável","action":"Considerar amadurecimento (misoprostol/dinoprostona/balão)"},
      {"min":6,"max":7,"label":"Colo intermediário","action":"Indução com ocitocina possível"},
      {"min":8,"max":13,"label":"Colo favorável","action":"Alta probabilidade de sucesso com indução simples"}
    ],
    "disclaimer":"Score ≥ 8 sugere parto vaginal espontâneo provável independente de indução."
  }$$::jsonb,
  'Bishop EH, Obstet Gynecol 1964',
  'https://pubmed.ncbi.nlm.nih.gov/14199536/',
  true
);

-- ============================================================
-- 16. Centor McIsaac — faringite estreptocócica
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'centor-mcisaac',
  'Centor (McIsaac)',
  'Infectologia',
  'Probabilidade de faringoamigdalite por Streptococcus β-hemolítico do grupo A.',
  'Faringite aguda, decisão sobre teste rápido/cultura/antibiótico.',
  $${
    "inputs":[
      {"key":"febre","label":"Febre > 38°C","type":"boolean"},
      {"key":"sem_tosse","label":"Ausência de tosse","type":"boolean"},
      {"key":"linfono","label":"Adenopatia cervical anterior dolorosa","type":"boolean"},
      {"key":"exsudato","label":"Exsudato/edema amigdaliano","type":"boolean"},
      {"key":"idade","label":"Idade","type":"select","options":[
        {"value":"1","label":"3-14 anos (+1)"},
        {"value":"0","label":"15-44 anos (0)"},
        {"value":"-1","label":"≥ 45 anos (-1)"}
      ]}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"febre","eq":true},"points":1},
        {"when":{"key":"sem_tosse","eq":true},"points":1},
        {"when":{"key":"linfono","eq":true},"points":1},
        {"when":{"key":"exsudato","eq":true},"points":1},
        {"when":{"key":"idade","eq":"1"},"points":1},
        {"when":{"key":"idade","eq":"-1"},"points":-1}
      ]
    },
    "interpretation":[
      {"min":-1,"max":0,"label":"Baixa probabilidade","action":"Não testar nem tratar"},
      {"min":1,"max":1,"label":"Probabilidade baixa","action":"Considerar teste rápido se disponível"},
      {"min":2,"max":3,"label":"Probabilidade moderada","action":"Teste rápido / cultura"},
      {"min":4,"max":5,"label":"Alta probabilidade","action":"Teste rápido / cultura; tratar empírico em adultos é controverso"}
    ],
    "disclaimer":"Em crianças sempre confirmar com teste antes de antibiótico."
  }$$::jsonb,
  'McIsaac WJ et al, CMAJ 1998',
  'https://pubmed.ncbi.nlm.nih.gov/9475915/',
  true
);

-- ============================================================
-- 17. Charlson — comorbidades / mortalidade 10 anos
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'charlson',
  'Charlson Comorbidity Index',
  'Geriatria',
  'Estimativa de mortalidade em 10 anos baseada em carga de comorbidades.',
  'Avaliação prognóstica em paciente idoso ou com múltiplas comorbidades.',
  $${
    "inputs":[
      {"key":"idade","label":"Idade","type":"number","min":0,"max":120,"unit":"anos"},
      {"key":"iam","label":"IAM prévio","type":"boolean"},
      {"key":"icc","label":"Insuficiência cardíaca","type":"boolean"},
      {"key":"vasculop","label":"Doença vascular periférica","type":"boolean"},
      {"key":"avc","label":"AVC prévio (sem sequelas)","type":"boolean"},
      {"key":"demencia","label":"Demência","type":"boolean"},
      {"key":"dpoc","label":"DPOC / doença pulmonar crônica","type":"boolean"},
      {"key":"reumat","label":"Doença reumatológica","type":"boolean"},
      {"key":"ulcera","label":"Úlcera péptica","type":"boolean"},
      {"key":"hep_leve","label":"Hepatopatia leve","type":"boolean"},
      {"key":"dm","label":"Diabetes sem complicações","type":"boolean"},
      {"key":"hemip","label":"Hemiplegia (AVC com sequela)","type":"boolean"},
      {"key":"renal","label":"DRC moderada/grave","type":"boolean"},
      {"key":"dm_compl","label":"DM com complicação de órgão-alvo","type":"boolean"},
      {"key":"ca","label":"Tumor sólido sem metástase (≤ 5 anos)","type":"boolean"},
      {"key":"leu","label":"Leucemia","type":"boolean"},
      {"key":"linfoma","label":"Linfoma","type":"boolean"},
      {"key":"hep_grave","label":"Hepatopatia moderada/grave","type":"boolean"},
      {"key":"ca_meta","label":"Tumor sólido com metástase","type":"boolean"},
      {"key":"hiv","label":"HIV/AIDS","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"iam","eq":true},"points":1},
        {"when":{"key":"icc","eq":true},"points":1},
        {"when":{"key":"vasculop","eq":true},"points":1},
        {"when":{"key":"avc","eq":true},"points":1},
        {"when":{"key":"demencia","eq":true},"points":1},
        {"when":{"key":"dpoc","eq":true},"points":1},
        {"when":{"key":"reumat","eq":true},"points":1},
        {"when":{"key":"ulcera","eq":true},"points":1},
        {"when":{"key":"hep_leve","eq":true},"points":1},
        {"when":{"key":"dm","eq":true},"points":1},
        {"when":{"key":"hemip","eq":true},"points":2},
        {"when":{"key":"renal","eq":true},"points":2},
        {"when":{"key":"dm_compl","eq":true},"points":2},
        {"when":{"key":"ca","eq":true},"points":2},
        {"when":{"key":"leu","eq":true},"points":2},
        {"when":{"key":"linfoma","eq":true},"points":2},
        {"when":{"key":"hep_grave","eq":true},"points":3},
        {"when":{"key":"ca_meta","eq":true},"points":6},
        {"when":{"key":"hiv","eq":true},"points":6},
        {"when":{"key":"idade","gte":50,"lt":60},"points":1},
        {"when":{"key":"idade","gte":60,"lt":70},"points":2},
        {"when":{"key":"idade","gte":70,"lt":80},"points":3},
        {"when":{"key":"idade","gte":80},"points":4}
      ]
    },
    "interpretation":[
      {"min":0,"max":2,"label":"Baixa carga","action":"Mortalidade 10a ~10%"},
      {"min":3,"max":4,"label":"Carga moderada","action":"Mortalidade 10a ~30-50%"},
      {"min":5,"max":99,"label":"Carga alta","action":"Mortalidade 10a > 70%"}
    ],
    "disclaimer":"Considere comorbidade ativa, não apenas histórica."
  }$$::jsonb,
  'Charlson ME et al, J Chronic Dis 1987',
  'https://pubmed.ncbi.nlm.nih.gov/3558716/',
  true
);

-- ============================================================
-- 18. Padua — risco TEV em paciente clínico
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'padua',
  'Padua VTE',
  'Hematologia',
  'Risco de tromboembolismo venoso em paciente clínico hospitalizado.',
  'Decisão sobre profilaxia farmacológica de TEV em internação clínica.',
  $${
    "inputs":[
      {"key":"cancer","label":"Câncer ativo","type":"boolean"},
      {"key":"tev_previa","label":"TEV prévia (exceto trombose superficial)","type":"boolean"},
      {"key":"mobilidade","label":"Mobilidade reduzida (acamado ≥ 3 dias)","type":"boolean"},
      {"key":"trombofilia","label":"Trombofilia conhecida","type":"boolean"},
      {"key":"trauma","label":"Trauma ou cirurgia recente (≤ 1 mês)","type":"boolean"},
      {"key":"idade","label":"Idade ≥ 70 anos","type":"boolean"},
      {"key":"icc_iresp","label":"IC e/ou insuficiência respiratória","type":"boolean"},
      {"key":"iam_avc","label":"IAM ou AVC isquêmico agudo","type":"boolean"},
      {"key":"infeccao","label":"Infecção aguda ou doença reumatológica","type":"boolean"},
      {"key":"obesidade","label":"Obesidade (IMC ≥ 30)","type":"boolean"},
      {"key":"hormonal","label":"Em uso de terapia hormonal","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"cancer","eq":true},"points":3},
        {"when":{"key":"tev_previa","eq":true},"points":3},
        {"when":{"key":"mobilidade","eq":true},"points":3},
        {"when":{"key":"trombofilia","eq":true},"points":3},
        {"when":{"key":"trauma","eq":true},"points":2},
        {"when":{"key":"idade","eq":true},"points":1},
        {"when":{"key":"icc_iresp","eq":true},"points":1},
        {"when":{"key":"iam_avc","eq":true},"points":1},
        {"when":{"key":"infeccao","eq":true},"points":1},
        {"when":{"key":"obesidade","eq":true},"points":1},
        {"when":{"key":"hormonal","eq":true},"points":1}
      ]
    },
    "interpretation":[
      {"min":0,"max":3,"label":"Baixo risco","action":"Profilaxia farmacológica não rotineira; deambulação precoce"},
      {"min":4,"max":20,"label":"Alto risco","action":"Profilaxia farmacológica indicada (HBPM, fondaparinux ou HNF)"}
    ],
    "disclaimer":"Avaliar contraindicação a anticoagulação antes de iniciar profilaxia."
  }$$::jsonb,
  'Barbar S et al, J Thromb Haemost 2010',
  'https://pubmed.ncbi.nlm.nih.gov/20738765/',
  true
);

-- ============================================================
-- 19. HEART Score — dor torácica em emergência
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'heart',
  'HEART Score',
  'Cardiologia',
  'Risco de evento cardíaco maior em 6 semanas em paciente com dor torácica em emergência.',
  'Triagem de dor torácica em pronto-socorro.',
  $${
    "inputs":[
      {"key":"historia","label":"História","type":"select","options":[
        {"value":"0","label":"Pouco suspeita (0)"},
        {"value":"1","label":"Moderadamente suspeita (1)"},
        {"value":"2","label":"Altamente suspeita (2)"}
      ]},
      {"key":"ecg","label":"ECG","type":"select","options":[
        {"value":"0","label":"Normal (0)"},
        {"value":"1","label":"Distúrbios inespecíficos de repolarização (1)"},
        {"value":"2","label":"Depressão de ST significativa (2)"}
      ]},
      {"key":"idade","label":"Idade","type":"select","options":[
        {"value":"0","label":"< 45 anos (0)"},
        {"value":"1","label":"45-64 anos (1)"},
        {"value":"2","label":"≥ 65 anos (2)"}
      ]},
      {"key":"fatores","label":"Fatores de risco (HAS, DLP, DM, obesidade, tabagismo, HF, DAC conhecida)","type":"select","options":[
        {"value":"0","label":"Nenhum (0)"},
        {"value":"1","label":"1-2 fatores (1)"},
        {"value":"2","label":"≥ 3 fatores ou DAC conhecida (2)"}
      ]},
      {"key":"trop","label":"Troponina","type":"select","options":[
        {"value":"0","label":"≤ limite normal (0)"},
        {"value":"1","label":"1-3x limite normal (1)"},
        {"value":"2","label":"> 3x limite normal (2)"}
      ]}
    ],
    "formula":{
      "type":"custom_expression",
      "expression":"toNumber(historia) + toNumber(ecg) + toNumber(idade) + toNumber(fatores) + toNumber(trop)"
    },
    "interpretation":[
      {"min":0,"max":3,"label":"Baixo risco","action":"Eventos 6 sem ~1.7% — alta com seguimento"},
      {"min":4,"max":6,"label":"Risco intermediário","action":"Eventos 6 sem ~17% — internação para investigação"},
      {"min":7,"max":10,"label":"Alto risco","action":"Eventos 6 sem ~50% — estratégia invasiva"}
    ],
    "disclaimer":"Pacientes com supra de ST ou instabilidade hemodinâmica saem do algoritmo HEART e vão direto pra hemodinâmica."
  }$$::jsonb,
  'Six AJ et al, Neth Heart J 2008',
  'https://pubmed.ncbi.nlm.nih.gov/18958256/',
  true
);

-- ============================================================
-- 20. Glasgow-Blatchford — sangramento digestivo alto
-- ============================================================
INSERT INTO public.wb_calculators (slug, nome, categoria, descricao, quando_usar, definicao, fonte, fonte_url, published)
VALUES (
  'glasgow-blatchford',
  'Glasgow-Blatchford',
  'Gastroenterologia',
  'Risco de necessidade de intervenção (transfusão, endoscopia terapêutica, cirurgia) em HDA.',
  'Hemorragia digestiva alta em emergência — triagem pré-endoscopia.',
  $${
    "inputs":[
      {"key":"ureia","label":"Ureia (mg/dL)","type":"select","options":[
        {"value":"0","label":"< 39 (0)"},
        {"value":"2","label":"39-48 (2)"},
        {"value":"3","label":"48-60 (3)"},
        {"value":"4","label":"60-150 (4)"},
        {"value":"6","label":"≥ 150 (6)"}
      ]},
      {"key":"hb","label":"Hemoglobina (g/dL)","type":"select","options":[
        {"value":"0","label":"≥ 13 (homem) ou ≥ 12 (mulher) (0)"},
        {"value":"1","label":"12-12.9 (homem) (1)"},
        {"value":"3","label":"10-11.9 (homem) ou 10-11.9 (mulher) (3)"},
        {"value":"6","label":"< 10 (6)"}
      ]},
      {"key":"pas","label":"PAS (mmHg)","type":"select","options":[
        {"value":"0","label":"≥ 110 (0)"},
        {"value":"1","label":"100-109 (1)"},
        {"value":"2","label":"90-99 (2)"},
        {"value":"3","label":"< 90 (3)"}
      ]},
      {"key":"fc","label":"FC ≥ 100 bpm","type":"boolean"},
      {"key":"melena","label":"Melena","type":"boolean"},
      {"key":"sincope","label":"Síncope","type":"boolean"},
      {"key":"hep","label":"Doença hepática","type":"boolean"},
      {"key":"icc","label":"Insuficiência cardíaca","type":"boolean"}
    ],
    "formula":{
      "type":"sum_weighted",
      "rules":[
        {"when":{"key":"ureia","eq":"2"},"points":2},
        {"when":{"key":"ureia","eq":"3"},"points":3},
        {"when":{"key":"ureia","eq":"4"},"points":4},
        {"when":{"key":"ureia","eq":"6"},"points":6},
        {"when":{"key":"hb","eq":"1"},"points":1},
        {"when":{"key":"hb","eq":"3"},"points":3},
        {"when":{"key":"hb","eq":"6"},"points":6},
        {"when":{"key":"pas","eq":"1"},"points":1},
        {"when":{"key":"pas","eq":"2"},"points":2},
        {"when":{"key":"pas","eq":"3"},"points":3},
        {"when":{"key":"fc","eq":true},"points":1},
        {"when":{"key":"melena","eq":true},"points":1},
        {"when":{"key":"sincope","eq":true},"points":2},
        {"when":{"key":"hep","eq":true},"points":2},
        {"when":{"key":"icc","eq":true},"points":2}
      ]
    },
    "interpretation":[
      {"min":0,"max":0,"label":"Risco muito baixo","action":"Considerar manejo ambulatorial; endoscopia eletiva"},
      {"min":1,"max":5,"label":"Risco baixo","action":"Endoscopia em até 24h"},
      {"min":6,"max":99,"label":"Risco alto","action":"Endoscopia precoce; cuidados intensivos"}
    ],
    "disclaimer":"Score 0 identifica baixíssimo risco — alguns serviços manejam ambulatorialmente."
  }$$::jsonb,
  'Blatchford O et al, Lancet 2000',
  'https://pubmed.ncbi.nlm.nih.gov/11041411/',
  true
);
