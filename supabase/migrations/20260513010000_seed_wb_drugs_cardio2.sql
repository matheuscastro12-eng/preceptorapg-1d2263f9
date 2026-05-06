-- PreceptorBook: Bloco 2 — Cardio/anticoagulação adicional (8 drogas)
-- Total após esta migration: 78 drogas

-- 71. APIXABANA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'apixabana',
  'Apixabana',
  ARRAY['Eliquis'],
  'DOAC — anticoagulante oral direto (inibidor fator Xa)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"2,5 mg"},{"forma":"comprimido","concentracao":"5 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"FA não-valvar — prevenção AVC","dose":"5 mg 12/12h","obs":"reduzir 2,5 mg 12/12h se ≥ 2 critérios: idade ≥80a, peso ≤60kg, Cr ≥1,5"},{"para":"TEV (TEP/TVP) — fase aguda","dose":"10 mg 12/12h por 7 dias, depois 5 mg 12/12h","duracao":"3-6 meses (idiopático: estendido)"},{"para":"TEV — extensão profilática","dose":"2,5 mg 12/12h","obs":"após fase aguda, indefinido se idiopático/recorrente"},{"para":"profilaxia TVP pós-cirurgia ortopédica","dose":"2,5 mg 12/12h","duracao":"35 dias quadril / 12 dias joelho"}]}$$::jsonb,
  $${"obs":"considerar redução de dose se ≥80 anos + peso ≤60kg ou Cr ≥1,5 (ver indicação FA)."}$$::jsonb,
  $$[{"clcr":">25","ajuste":"sem ajuste primário"},{"clcr":"<15 ou diálise","ajuste":"contraindicado (escassez de dados)"}]$$::jsonb,
  $$[{"contexto":"Child-Pugh A","ajuste":"sem ajuste"},{"contexto":"Child-Pugh B","ajuste":"usar com cautela"},{"contexto":"Child-Pugh C","ajuste":"contraindicado"}]$$::jsonb,
  'B',
  'Categoria B (FDA antigo). Atravessa placenta. EVITAR — preferir enoxaparina em gestação.',
  'Excretado no leite — evitar.',
  $$[{"com":"cetoconazol/itraconazol","efeito":"aumenta nível plasmático","manejo":"contraindicado"},{"com":"rifampicina/fenitoína","efeito":"reduz eficácia","manejo":"contraindicado"},{"com":"AAS/AINE","efeito":"aumenta risco sangramento","manejo":"avaliar HAS-BLED"}]$$::jsonb,
  ARRAY['sangramento ativo','lesão maior com risco hemorrágico','coagulopatia','ClCr <15','hepatopatia grave (Child-Pugh C)','gestação'],
  $$[{"freq":"comum","evento":"sangramento (epistaxe, equimose, hematúria)"},{"freq":"comum","evento":"náusea"},{"freq":"incomum","evento":"sangramento maior (gastrointestinal, intracraniano)"},{"freq":"incomum","evento":"anemia"}]$$::jsonb,
  ARRAY['Antídoto: ANDEXANET ALFA (não disponível no SUS) — em sangramento maior usar CCP 50 U/kg + suporte','Não requer monitor TTPa/INR','Suspender 24-48h antes de cirurgias maiores; 24h antes de menores','Se esquecer dose: tomar imediatamente; se >6h, pular dose','Comparado à varfarina: menor sangramento intracraniano, eficácia similar (ARISTOTLE)'],
  ARRAY['Função renal a cada 6-12 meses','Hemoglobina periódica','Sinais de sangramento (hematúria, melena, hematoma)'],
  'Inibe diretamente o fator Xa ativado (livre e ligado ao complexo protrombinase) → bloqueia conversão de protrombina em trombina → reduz formação de trombo. Não requer antitrombina como cofator. Início rápido (3-4h), meia-vida 12h, eliminação 25% renal + 75% fecal/biliar.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=apixabana',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 72. DABIGATRANA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso,
  ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'dabigatrana',
  'Dabigatrana etexilato',
  ARRAY['Pradaxa'],
  'DOAC — inibidor direto da trombina',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"75 mg"},{"forma":"cápsula","concentracao":"110 mg"},{"forma":"cápsula","concentracao":"150 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"FA não-valvar","dose":"150 mg 12/12h","obs":"reduzir 110 mg 12/12h se ≥80 anos, alto risco sangramento, ClCr 30-50"},{"para":"TEP/TVP — após 5-10 dias de heparina","dose":"150 mg 12/12h","duracao":"≥3 meses"},{"para":"profilaxia TVP pós-ortopédica","dose":"110 mg 1-4h pós-cirurgia + 220 mg/dia","duracao":"10-14 dias joelho / 28-35 dias quadril"}]}$$::jsonb,
  $${"obs":"≥75 anos: 110 mg 12/12h. ≥80 anos: SEMPRE 110 mg 12/12h."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"30-50","ajuste":"considerar 110 mg 12/12h"},{"clcr":"15-30","ajuste":"75 mg 12/12h (US apenas para FA)"},{"clcr":"<15 ou diálise","ajuste":"CONTRAINDICADO"}]$$::jsonb,
  'C',
  'Categoria C. EVITAR em gestação — use enoxaparina.',
  'Sem dados — evitar.',
  $$[{"com":"verapamil/dronedarona/cetoconazol/amiodarona","efeito":"aumenta nível","manejo":"reduzir para 110 mg 12/12h ou evitar"},{"com":"rifampicina","efeito":"reduz eficácia","manejo":"contraindicado"},{"com":"AAS/clopidogrel","efeito":"sangramento","manejo":"avaliar risco-benefício"}]$$::jsonb,
  ARRAY['sangramento ativo','lesão com risco hemorrágico','prótese valvar mecânica (RE-ALIGN: aumentou eventos)','ClCr <30','hepatopatia grave','gestação'],
  $$[{"freq":"muito comum","evento":"dispepsia (10-30%) — limitante"},{"freq":"comum","evento":"sangramento (especialmente GI alto)"},{"freq":"comum","evento":"anemia"},{"freq":"incomum","evento":"sangramento maior (GI > intracraniano que varfarina)"}]$$::jsonb,
  ARRAY['ANTÍDOTO ESPECÍFICO: IDARUCIZUMAB (Praxbind) 5g IV — disponível no Brasil para sangramento grave/cirurgia urgente','Maior risco de sangramento GI que apixabana/varfarina (RE-LY)','Manter na embalagem original — sensível à umidade','Suspender 24-48h antes de cirurgia (1-2 dias se ClCr >50, 3-4 dias se ClCr 30-50)','Não usar em prótese valvar mecânica (CONTRAINDICADO — RE-ALIGN)'],
  ARRAY['Função renal cada 6-12 meses (mais frequente se ClCr 30-50)','Hemoglobina','Sinais de sangramento','Dispepsia → orientar tomar com refeição'],
  'Pró-droga (etexilato) hidrolisada por esterases plasmáticas a dabigatrana ativa → ligação reversível e direta ao sítio ativo da trombina (fator IIa) → inibe conversão de fibrinogênio em fibrina + ativação plaquetária dependente de trombina + ativação de fatores V, VIII, XI, XIII. Eliminação 80% renal. Meia-vida 12-17h.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=dabigatrana',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 73. NITROGLICERINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto,
  gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'nitroglicerina',
  'Nitroglicerina',
  ARRAY['Tridil', 'Nitronal', 'Nitradisc'],
  'Vasodilatador — nitrato',
  ARRAY['IV', 'SL', 'transdérmico'],
  $$[{"forma":"ampola IV","concentracao":"5 mg/mL (5 mL)"},{"forma":"sublingual","concentracao":"0,4 mg/dose spray"},{"forma":"adesivo","concentracao":"5-15 mg/24h"}]$$::jsonb,
  $${"indicacoes":[{"para":"angina aguda — ataque","dose":"0,4 mg SL","via":"sublingual","frequencia":"a cada 5 min, máx 3 doses","obs":"se persistir → ECG + emergência"},{"para":"SCA / IAM com supra","dose":"5-10 mcg/min IV BIC, titular até alívio dor ou queda PAS","via":"IV","frequencia":"contínua","obs":"meta: redução PAS 10-15%, não <90 mmHg"},{"para":"edema agudo de pulmão / IC aguda","dose":"10-200 mcg/min IV","via":"IV BIC","frequencia":"contínua","obs":"reduz pré-carga; melhora dispneia em minutos"},{"para":"crise hipertensiva (SCA associado)","dose":"5-200 mcg/min","via":"IV","obs":"escolha em isquemia coronariana"}]}$$::jsonb,
  'C',
  'Categoria C. Pode causar redução fluxo placentário. Usar se necessário.',
  'Sem dados; evitar.',
  $$[{"com":"sildenafil/tadalafil/vardenafil","efeito":"hipotensão grave (potencialmente fatal)","manejo":"CONTRAINDICADO em <24-48h de IPDE-5"},{"com":"riociguat","efeito":"hipotensão grave","manejo":"contraindicado"},{"com":"álcool","efeito":"potencializa hipotensão","manejo":"orientar"}]$$::jsonb,
  ARRAY['uso de sildenafil/tadalafil <24-48h','PAS <90 mmHg','IAM de ventrículo direito (depende de pré-carga)','estenose aórtica grave','cardiomiopatia hipertrófica obstrutiva','aumento de pressão intracraniana','hipersensibilidade a nitratos'],
  $$[{"freq":"muito comum","evento":"cefaleia pulsátil (efeito vasodilatador) — geralmente cede"},{"freq":"comum","evento":"hipotensão"},{"freq":"comum","evento":"taquicardia reflexa"},{"freq":"comum","evento":"rubor facial"},{"freq":"incomum","evento":"taquifilaxia (tolerância em 24-48h uso contínuo)"}]$$::jsonb,
  ARRAY['CONTRAINDICAÇÃO ABSOLUTA com inibidores PDE5 (sildenafil/tadalafil) — perguntar ANTES de prescrever','Tolerância: precisa intervalo livre 8-12h/dia (importante em uso oral/transdérmico crônico)','Em IAM de VD: NITRATO É CONTRAINDICADO — choque por queda pré-carga','Sublingual: sentado/deitado para evitar síncope','Frasco IV fotoprotegido; usar equipo PE-poliuretano (PVC absorve)'],
  ARRAY['PA invasiva ou não-invasiva contínua se IV','FC (taquicardia reflexa)','Sintomas (alívio da dor)','Cefaleia (orientar paciente)'],
  'Doador de óxido nítrico (NO) endógeno → ativa guanilato ciclase no músculo liso vascular → aumenta GMPc → relaxamento vascular. Predomínio venoso em doses baixas (reduz pré-carga); arterial em doses altas (reduz pós-carga). Reduz consumo miocárdico de O2 + redistribui fluxo coronariano para áreas isquêmicas. Início SL <2 min, IV imediato.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=nitroglicerina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 74. NITROPRUSSIATO DE SÓDIO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'nitroprussiato',
  'Nitroprussiato de sódio',
  ARRAY['Nipride'],
  'Vasodilatador arterial e venoso — emergência hipertensiva',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"50 mg liofilizado, reconstituir em 250 mL SG 5% = 200 mcg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"emergência hipertensiva","dose":"0,25-10 mcg/kg/min, titular pela PA","via":"IV BIC","frequencia":"contínua","obs":"DROGA DE ESCOLHA na maioria das emergências hipertensivas. Início em <2 min."},{"para":"dissecção de aorta (associado a esmolol/BB)","dose":"0,5-10 mcg/kg/min","obs":"reduzir PAS para ≤120 + FC ≤60 em 20 min. SEMPRE BB primeiro (evitar taquicardia reflexa)"},{"para":"IC aguda hipertensiva","dose":"0,3-5 mcg/kg/min","obs":"reduz pré e pós-carga; útil em EAP hipertensivo"}]}$$::jsonb,
  $${"indicacoes":[{"para":"crise hipertensiva pediátrica","dose":"0,5-8 mcg/kg/min titular"}]}$$::jsonb,
  $$[{"clcr":"<30","ajuste":"acumula tiocianato — limitar a 24-48h ou evitar"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduz conversão cianeto→tiocianato → risco intoxicação"}]$$::jsonb,
  'C',
  'Categoria C. Cianeto atravessa placenta. EVITAR — preferir hidralazina/labetalol.',
  'Sem dados — evitar.',
  $$[{"com":"sildenafil/tadalafil","efeito":"hipotensão grave","manejo":"contraindicado"},{"com":"anti-hipertensivos","efeito":"potencializa hipotensão","manejo":"titular"}]$$::jsonb,
  ARRAY['gestação','hipertensão compensatória (coarctação aorta, fístula AV)','deficiência B12','atrofia óptica de Leber','intoxicação por cianeto','ClCr <30 (uso prolongado)'],
  $$[{"freq":"muito comum","evento":"hipotensão (por overdose)"},{"freq":"comum","evento":"náusea, vômito, sudorese"},{"freq":"comum","evento":"taquicardia reflexa"},{"freq":"raro","evento":"INTOXICAÇÃO POR CIANETO (acidose metabólica grave, alteração consciência) — antídoto: hidroxocobalamina"},{"freq":"raro","evento":"intoxicação tiocianato (uso prolongado, IRA)"}]$$::jsonb,
  ARRAY['INTOXICAÇÃO POR CIANETO em uso >48h ou doses altas — sintomas: acidose metabólica gap aumentado, taquifilaxia, alteração consciência, lactato alto. Antídoto: hidroxocobalamina 5g IV','Frasco e equipo SEMPRE fotoprotegidos (papel alumínio) — degradação rápida com luz','NÃO usar SF 0,9% (apenas SG 5%)','Uso ≤48-72h se possível; se necessário prolongado → monitor tiocianato (alvo <100 mg/L) e adicionar tiossulfato','Em IRA: maior risco intoxicação — preferir labetalol/clevidipina'],
  ARRAY['PA invasiva contínua (essencial — titulação fina)','Equilíbrio ácido-base e lactato a cada 6h se uso prolongado','Sintomas neurológicos','Função renal'],
  'Doador direto de óxido nítrico (NO) — vasodilatador arterial e venoso balanceado. Início <2 min, meia-vida 1-2 min (titulação muito precisa). Metabolização: NO + cianeto → tiossulfato → tiocianato (excreção renal). Cianeto se acumula em uso prolongado/hepatopatia → bloqueia citocromo c oxidase → acidose metabólica grave.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=nitroprussiato',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 75. METOPROLOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'metoprolol',
  'Metoprolol (succinato/tartarato)',
  ARRAY['Selozok (succinato)','Lopressor (tartarato)','Seloken'],
  'Beta-bloqueador cardio-seletivo (β1)',
  ARRAY['VO', 'IV'],
  $$[{"forma":"comprimido tartarato","concentracao":"25/50/100 mg"},{"forma":"comprimido succinato (LP)","concentracao":"23,75/47,5/95/190 mg (≈25/50/100/200 mg base)"},{"forma":"ampola","concentracao":"5 mg/5 mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"HAS","dose":"25-100 mg 12/12h (tartarato) ou 50-200 mg/dia (succinato LP)","via":"VO"},{"para":"IC com FE reduzida","dose":"INICIAR 12,5 mg 12/12h (tartarato) ou 12,5-25 mg/dia (succinato), DOBRAR a cada 2 semanas","via":"VO","obs":"meta: 200 mg/dia succinato (MERIT-HF). NÃO iniciar em IC descompensada"},{"para":"angina estável","dose":"50-100 mg 12/12h","via":"VO"},{"para":"FA — controle de FC","dose":"25-100 mg 12/12h","via":"VO","obs":"ou 5 mg IV em 5 min, repetir até 15 mg em FA aguda"},{"para":"pós-IAM","dose":"INICIAR 25 mg 12/12h, titular","via":"VO","obs":"reduz mortalidade. Iniciar nas primeiras 24h se estável"}]}$$::jsonb,
  $${"obs":"iniciar metade da dose. Mais sensível a bradicardia."}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia grave","ajuste":"reduzir dose 50% (metabolismo CYP2D6 hepático)"}]$$::jsonb,
  'C',
  'Categoria C. Pode causar bradicardia e hipoglicemia neonatal. Usar se necessário (controle PA > risco).',
  'Compatível em doses baixas — monitor RN.',
  $$[{"com":"verapamil/diltiazem IV","efeito":"BAV/bradicardia grave","manejo":"contraindicado"},{"com":"clonidina (suspensão)","efeito":"crise hipertensiva rebote","manejo":"suspender BB primeiro"},{"com":"insulina/sulfonilureia","efeito":"mascara hipoglicemia","manejo":"orientar paciente"}]$$::jsonb,
  ARRAY['bradicardia <50 bpm','BAV 2º/3º grau (sem MP)','choque cardiogênico','IC descompensada (Killip III/IV)','PAS <90','asma grave (relativa em cardio-seletivo)'],
  $$[{"freq":"comum","evento":"bradicardia"},{"freq":"comum","evento":"fadiga, sonolência"},{"freq":"comum","evento":"hipotensão postural"},{"freq":"comum","evento":"extremidades frias"},{"freq":"incomum","evento":"broncoespasmo"},{"freq":"incomum","evento":"depressão, pesadelos"},{"freq":"incomum","evento":"disfunção sexual"}]$$::jsonb,
  ARRAY['DIFERENÇA TARTARATO vs SUCCINATO: succinato é LIBERAÇÃO PROLONGADA — usar em IC. Tartarato é liberação imediata.','Em IC descompensada: NÃO iniciar (mas manter dose se já em uso, reduzindo se baixo débito)','NUNCA suspender abruptamente — risco rebote isquêmico/hipertensivo. Reduzir 50% por 1-2 semanas','Cardio-seletivo β1 mas perde seletividade em doses altas (>100 mg)','Em DPOC: cardio-seletivos são SEGUROS em doses baixas se necessário'],
  ARRAY['FC + PA antes de cada aumento de dose','Sinais de descompensação (peso, dispneia, edema)','Glicemia em DM (mascara hipoglicemia)'],
  'Antagonista competitivo seletivo dos receptores β1-adrenérgicos cardíacos → reduz cronotropismo (FC), inotropismo (contratilidade) e dromotropismo (condução AV). Reduz consumo miocárdico O2 (anti-isquêmico), reduz remodelamento ventricular (IC), reduz secreção de renina (PA). Cardio-seletivo em doses baixas (<100 mg). Metabolização hepática via CYP2D6.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=metoprolol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 76. PROPRANOLOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica,
  ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'propranolol',
  'Propranolol',
  ARRAY['Inderal'],
  'Beta-bloqueador não-seletivo',
  ARRAY['VO', 'IV'],
  $$[{"forma":"comprimido","concentracao":"10/40/80 mg"},{"forma":"ampola","concentracao":"1 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"tremor essencial","dose":"40-160 mg/dia divididos","via":"VO"},{"para":"profilaxia de enxaqueca","dose":"40-160 mg/dia divididos","via":"VO"},{"para":"varizes esofágicas — profilaxia primária/secundária","dose":"INICIAR 20 mg 12/12h, titular para FC <55 bpm ou redução 25% basal","via":"VO","obs":"alternativa: carvedilol 6,25 mg 12/12h"},{"para":"hipertireoidismo (sintomático)","dose":"40-80 mg 8/8h ou 6/6h","via":"VO","obs":"controla taquicardia + tremor enquanto tireostático age. Reduz conversão T4→T3"},{"para":"síndrome do pânico / tremor por ansiedade situacional","dose":"10-40 mg 30 min antes do gatilho","via":"VO","obs":"uso sintomático SOS"},{"para":"feocromocitoma — preparo cirúrgico","dose":"associado a alfa-bloqueador (fenoxibenzamina)","obs":"NUNCA iniciar BB antes de alfa-bloqueio (crise hipertensiva)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"hemangioma infantil","dose":"1-3 mg/kg/dia divididos 12/12h","duracao":"6-12 meses","obs":"primeira escolha. Iniciar com monitor cardio"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"reduz metabolismo — começar com dose baixa"}]$$::jsonb,
  'C',
  'Categoria C. Pode causar hipoglicemia, bradicardia e RCIU em uso prolongado.',
  'Compatível em doses baixas.',
  $$[{"com":"verapamil/diltiazem IV","efeito":"BAV/bradicardia","manejo":"contraindicado"},{"com":"clorpromazina","efeito":"aumento mútuo","manejo":"monitor"},{"com":"AINE","efeito":"reduz efeito anti-hipertensivo","manejo":"reavaliar"}]$$::jsonb,
  ARRAY['asma brônquica (CONTRAINDICADO — não-seletivo)','DPOC moderado-grave','BAV 2º/3º grau','bradicardia <50','choque cardiogênico','feocromocitoma sem alfa-bloqueio','hipoglicemia em DM (mascara)'],
  $$[{"freq":"comum","evento":"bradicardia, fadiga"},{"freq":"comum","evento":"BRONCOESPASMO (mais que cardio-seletivos)"},{"freq":"comum","evento":"extremidades frias"},{"freq":"incomum","evento":"depressão, alteração de sono"},{"freq":"incomum","evento":"disfunção erétil"},{"freq":"incomum","evento":"hipoglicemia (especialmente DM tipo 1)"}]$$::jsonb,
  ARRAY['NÃO-SELETIVO — evitar em asma/DPOC moderado-grave (broncoespasmo)','EM HIPERTIREOIDISMO: PRIMEIRA ESCOLHA para sintomas (também reduz conversão periférica T4→T3)','Atravessa BHE — útil para tremor/enxaqueca/ansiedade somática, mas mais SNC effects (depressão, pesadelos)','Em VARIZES ESOFÁGICAS: meta clínica é redução FC 25% ou <55 bpm — não a PA','Suspender gradualmente (rebote)','Carvedilol é alternativa preferível em IC (alfa+beta + antioxidante)'],
  ARRAY['FC + PA','Glicemia em DM','PFE/sintomas respiratórios em pacientes com hiperresposta brônquica','FC para titular em varizes/tremor'],
  'Antagonista competitivo NÃO-SELETIVO de receptores β1 (cardíaco) e β2 (brônquico, vascular, hepático). Reduz FC, contratilidade, débito cardíaco, PA. Em hipertireoidismo: bloqueia também conversão periférica T4→T3 (efeito extra). Lipossolúvel — atravessa BHE (efeitos SNC). Metabolização hepática primeira passagem (biodisponibilidade ~25%).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=propranolol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 77. DIGOXINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_idoso,
  ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'digoxina',
  'Digoxina',
  ARRAY['Digoxina','Lanoxin'],
  'Glicosídeo cardíaco — inotrópico positivo',
  ARRAY['VO', 'IV'],
  $$[{"forma":"comprimido","concentracao":"0,25 mg"},{"forma":"elixir","concentracao":"0,05 mg/mL"},{"forma":"ampola","concentracao":"0,5 mg/2 mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"FA — controle de FC (em IC associada)","dose":"ATAQUE: 0,5 mg VO/IV + 0,25 mg 6/6h até 1-1,5 mg total. MANUTENÇÃO: 0,125-0,25 mg/dia","via":"VO ou IV","obs":"linha 2 ou 3 — usar quando BB/BCC contraindicados ou em IC"},{"para":"IC com FE reduzida sintomática","dose":"0,125-0,25 mg/dia","via":"VO","obs":"adjuvante quando sintomas persistem apesar terapia otimizada (BB+IECA+antagonista MR). Não reduz mortalidade"}]}$$::jsonb,
  $${"obs":"0,0625-0,125 mg/dia (idosos têm meia-vida prolongada — risco intoxicação)."}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"30-50","ajuste":"reduzir 25-50%"},{"clcr":"<30","ajuste":"reduzir 50% + intervalos maiores. Monitor nível sérico"}]$$::jsonb,
  'C',
  'Categoria C. Atravessa placenta. Usar se necessário.',
  'Compatível.',
  $$[{"com":"amiodarona","efeito":"aumenta nível digoxina 70-100%","manejo":"reduzir dose digoxina 50%"},{"com":"verapamil/quinidina/macrolídeos","efeito":"aumenta nível","manejo":"monitor nível sérico"},{"com":"diuréticos (hipocalemia/hipomagnesemia)","efeito":"potencializa toxicidade","manejo":"corrigir distúrbio antes"},{"com":"furosemida (depleção K)","efeito":"intoxicação","manejo":"suplementar K"}]$$::jsonb,
  ARRAY['BAV 2º/3º grau sem MP','TV/FV','cardiomiopatia hipertrófica obstrutiva','intoxicação digitálica','síndrome WPW com FA','intoxicação prévia'],
  $$[{"freq":"comum","evento":"náusea, vômito, anorexia (50% dos casos de toxicidade)"},{"freq":"comum","evento":"alteração visual (cromatopsia amarela/verde — sinal clássico)"},{"freq":"comum","evento":"bradicardia, BAV"},{"freq":"comum","evento":"confusão, alucinação (idoso)"},{"freq":"raro","evento":"ARRITMIAS GRAVES (taquicardia atrial com bloqueio, taquicardia juncional não-paroxística — patognomônicas de intoxicação)"}]$$::jsonb,
  ARRAY['JANELA TERAPÊUTICA ESTREITA — nível-alvo 0,5-0,9 ng/mL em IC; 0,8-2 ng/mL em FA','INTOXICAÇÃO DIGITÁLICA: náusea + alteração visual amarela + arritmia + hipocalemia. ANTÍDOTO: anticorpos antidigoxina (Digibind) — mas escassez no Brasil','Hipocalemia, hipomagnesemia, hipercalcemia POTENCIALIZAM toxicidade — sempre corrigir antes/durante uso','Coletar nível sérico ≥6h após dose oral; em uso crônico após ≥7 dias','NÃO reduz mortalidade em IC (DIG trial: redução de hospitalização apenas)'],
  ARRAY['Nível sérico digoxina (após 7 dias do início ou ajuste)','K+, Mg++, função renal','ECG (BAV, arritmias atriais com bloqueio)','Sintomas (náusea, alteração visual)'],
  'Inibe a Na+/K+-ATPase miocárdica → aumenta Na+ intracelular → reduz troca Na+/Ca++ → aumenta Ca++ intracelular → INOTROPISMO POSITIVO (mais força contrátil). Aumenta tônus vagal → reduz condução AV (controle FC em FA) e reduz FC sinusal (cronotropismo negativo). Eliminação 70-80% renal — acumula em IRA. Janela terapêutica estreita.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=digoxina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 78. AMIODARONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto,
  ajuste_renal, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  interacoes, contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'amiodarona',
  'Amiodarona',
  ARRAY['Atlansil','Ancoron'],
  'Antiarrítmico classe III (Vaughan-Williams) — bloqueador K+',
  ARRAY['VO', 'IV'],
  $$[{"forma":"comprimido","concentracao":"100/200 mg"},{"forma":"ampola","concentracao":"50 mg/mL (3 mL = 150 mg)"}]$$::jsonb,
  $${"indicacoes":[{"para":"FV/TV sem pulso (PCR refratária)","dose":"300 mg IV bolus + repetir 150 mg após 3-5 min se persistir","via":"IV","obs":"AHA 2020 — após 2-3 choques + adrenalina"},{"para":"TV monomórfica estável","dose":"150 mg IV em 10 min, repetir até 2,2 g em 24h","via":"IV","obs":"avaliar reverter eletricamente se instável"},{"para":"FA — reversão a ritmo sinusal","dose":"5-7 mg/kg IV em 30-60 min + 1 mg/min × 6h + 0,5 mg/min × 18h. VO: 600-800 mg/dia × 1 sem, depois 400 mg/dia × 1 sem, depois 200 mg/dia","via":"IV ou VO","obs":"opção em FA com IC ou FE reduzida (outros antiarrítmicos contraindicados)"},{"para":"FA — manutenção ritmo sinusal","dose":"100-200 mg/dia VO","via":"VO","obs":"mais eficaz mas mais tóxica (efeitos extracardíacos)"},{"para":"profilaxia FA pós-cirurgia cardíaca","dose":"200 mg 8/8h × 5d ou 400 mg/dia × 7-10d","via":"VO"}]}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste"}]$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"contraindicado se grave; monitor TGO/TGP"}]$$::jsonb,
  'D',
  'Categoria D. ATRAVESSA placenta. CONTRAINDICADA — risco hipotireoidismo neonatal, bradicardia, RCIU.',
  'CONTRAINDICADA — alta concentração no leite, risco hipotireoidismo neonatal.',
  $$[{"com":"varfarina","efeito":"aumenta INR (CYP2C9)","manejo":"reduzir varfarina 30-50%, monitor INR"},{"com":"digoxina","efeito":"aumenta nível 70-100%","manejo":"reduzir digoxina 50%"},{"com":"sinvastatina","efeito":"miopatia/rabdomiólise","manejo":"limitar sinvastatina a 20 mg/dia"},{"com":"BB/BCC","efeito":"BAV/bradicardia","manejo":"monitor"},{"com":"sotalol/ibutilida","efeito":"prolonga QT — torsades","manejo":"contraindicado"}]$$::jsonb,
  ARRAY['BAV 2º/3º grau sem MP','bradicardia <50','disfunção sinusal grave','tireopatia descompensada','prolongamento QT','gestação/lactação','hipersensibilidade ao iodo (alta % de iodo na molécula)'],
  $$[{"freq":"muito comum","evento":"depósitos corneanos (>90%, reversíveis)"},{"freq":"comum","evento":"alteração tireoide (hipo/hipertireoidismo) — 15-20%"},{"freq":"comum","evento":"elevação TGO/TGP (hepatotoxicidade)"},{"freq":"comum","evento":"fotossensibilidade, coloração azul-acinzentada da pele"},{"freq":"comum","evento":"náusea, anorexia"},{"freq":"incomum","evento":"FIBROSE PULMONAR (1-5%, GRAVE — pneumonite intersticial)"},{"freq":"incomum","evento":"neuropatia periférica, tremor"},{"freq":"raro","evento":"torsades de pointes (paradoxal — apesar de prolongar QT, baixa incidência)"}]$$::jsonb,
  ARRAY['ALTA TOXICIDADE EXTRACARDÍACA — 75% dos pacientes em uso prolongado terão algum efeito adverso','PNEUMONITE/FIBROSE PULMONAR é a complicação mais grave — Rx tórax basal e a cada 6-12 meses. Sintomas (tosse seca, dispneia) → suspender + corticoide','TIREOIDE: 30% terão alteração — TSH antes do início e a cada 6 meses. Hipertireoidismo induzido pode ser tipo 1 (rico em iodo) ou tipo 2 (tireoidite destrutiva)','Coloração AZUL-ACINZENTADA DA PELE em uso crônico (depósitos lipofuscina) — geralmente irreversível','Meia-vida MUITO longa (40-60 dias) — efeitos persistem após suspensão. Interações persistem por semanas','IV: usar acesso CENTRAL preferível (flebite). Não diluir em SF (apenas SG 5%)','Monitor: TSH/T4L, TGO/TGP, Rx tórax — 6/6 meses','PROLONGA QT — monitor ECG (alvo QTc <500 ms)'],
  ARRAY['ECG basal + a cada 3-6 meses (QTc, BAV)','TSH + T4L basal + a cada 6 meses','TGO/TGP basal + a cada 6 meses','Rx tórax basal + a cada 6-12 meses','Exame oftalmológico anual (depósitos corneanos)','Sintomas pulmonares (tosse seca, dispneia)'],
  'Antiarrítmico classe III predominante (bloqueia canais K+ → prolonga repolarização e período refratário) com efeitos das classes I (bloqueio Na+), II (beta-bloqueio fraco) e IV (bloqueio Ca++). Prolonga QT mas paradoxalmente baixa incidência de torsades. Alto teor de iodo (37% por peso → afeta tireoide). Lipossolubilidade extrema → distribuição em gordura/pulmão/fígado, meia-vida 40-60 dias.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=amiodarona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
