-- PreceptorBook: Bloco 8 — Oncologia (3) + Hormonal feminino (3) + Oftalmo (2) + Derma tópico (2) + Anestésicos (2) + Antialérgicos (1) + Hidratação (1) = 14 drogas
-- Total após esta migration: 159 drogas

-- 146. TAMOXIFENO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'tamoxifeno',
  'Tamoxifeno',
  ARRAY['Nolvadex','Tamoxifeno'],
  'SERM (modulador seletivo do receptor de estrogênio)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"10/20 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"CA mama RH+ — adjuvante (pré-menopausa)","dose":"20 mg/dia","via":"VO","duracao":"5-10 anos","obs":"PRIMEIRA ESCOLHA pré-menopausa. Reduz recidiva 50%, mortalidade 30%. Em pós-menopausa: inibidor de aromatase é alternativa"},{"para":"prevenção CA mama em alto risco","dose":"20 mg/dia × 5 anos","obs":"em mulher com Gail score >1,67% em 5 anos. Discutir riscos (TEP, CA endométrio)"},{"para":"CA mama metastático (receptor+)","dose":"20 mg/dia","obs":"linha terapêutica em pré ou pós-menopausa"},{"para":"ginecomastia (off-label)","dose":"10-20 mg/dia"}]}$$::jsonb,
  'D','Categoria D — TERATOGÊNICO + risco aborto. Anticoncepção NÃO HORMONAL obrigatória. Suspender ≥2 meses antes de gestação programada.','Sem dados — evitar.',
  ARRAY['gestação','TEV/TEP prévio (relativa — alto risco x benefício)','sangramento uterino sem causa','hipersensibilidade','uso de varfarina (interação)'],
  $$[{"freq":"comum","evento":"fogachos, sintomas climatéricos"},{"freq":"comum","evento":"sangramento vaginal irregular"},{"freq":"comum","evento":"náusea"},{"freq":"comum","evento":"alteração humor"},{"freq":"incomum","evento":"TEV/TEP (~1%) — risco maior em pós-menopausa"},{"freq":"incomum","evento":"CA ENDOMÉTRIO (~2-3x risco)"},{"freq":"incomum","evento":"esteatose hepática"},{"freq":"raro","evento":"AVC, catarata"}]$$::jsonb,
  ARRAY['CA ENDOMÉTRIO: aumenta risco 2-3x — INVESTIGAR sangramento vaginal anormal (USG transvaginal + histeroscopia)','TEV/TEP: orientar paciente sintomas + evitar imobilidade prolongada. Suspender 2 sem antes cirurgia eletiva','PRÉ-MENOPAUSA mantém ovulação — gestação possível. Anticoncepção não-hormonal obrigatória','EM CYP2D6 metabolizador lento (genético): eficácia REDUZIDA — avaliar troca por inibidor aromatase','EVITAR ISRS POTENTES INIBIDORES CYP2D6 (paroxetina, fluoxetina) — reduzem ativação tamoxifeno. Preferir sertralina, escitalopram, venlafaxina'],
  ARRAY['USG transvaginal anual (espessamento endometrial)','Mamografia anual','Avaliação ginecológica anual','Exame oftalmológico (catarata)','Função hepática','Sintomas TEV','Densitometria (osso protege em pós-menopausa)'],
  'SERM — atua como ANTAGONISTA do receptor de estrogênio na MAMA (efeito anti-tumoral) e como AGONISTA parcial em ÚTERO/OSSO/FÍGADO (daí risco CA endométrio + proteção óssea + alteração lipídica). Pró-droga ativada por CYP2D6 a endoxifeno (metabólito ativo). Polimorfismo CYP2D6 explica resposta variável.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=tamoxifeno',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 147. ANASTROZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'anastrozol',
  'Anastrozol',
  ARRAY['Arimidex'],
  'Inibidor de aromatase (não-esteroidal)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"1 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"CA mama RH+ pós-menopausa — adjuvante","dose":"1 mg/dia","via":"VO","duracao":"5 anos (ou 5 anos após tamoxifeno = 10 anos total)","obs":"PRIMEIRA ESCOLHA em pós-menopausa. Superior a tamoxifeno em desfecho (ATAC trial)"},{"para":"CA mama metastático pós-menopausa","dose":"1 mg/dia","obs":"linha terapêutica"},{"para":"prevenção CA mama em alto risco pós-menopausa","dose":"1 mg/dia × 5 anos","obs":"alternativa a tamoxifeno"}]}$$::jsonb,
  'X','CONTRAINDICADO — apenas pós-menopausa.','Não aplica.',
  ARRAY['pré-menopausa (sem ablação ovariana)','gestação','hipersensibilidade'],
  $$[{"freq":"muito comum","evento":"artralgia, mialgia"},{"freq":"comum","evento":"fogachos"},{"freq":"comum","evento":"OSTEOPOROSE (acelera perda DMO)"},{"freq":"comum","evento":"dislipidemia (↑LDL)"},{"freq":"comum","evento":"alteração humor, fadiga"},{"freq":"incomum","evento":"FRATURAS por osteoporose"},{"freq":"incomum","evento":"hepatotoxicidade"}]$$::jsonb,
  ARRAY['OSTEOPOROSE é principal complicação — ACELERA perda DMO. DEXA basal + a cada 1-2 anos. CÁLCIO + VIT D para todas. Bisfosfonato se T-score <-2 ou fratura','ARTRALGIA/MIALGIA é comum (~50%) — limitante em algumas pacientes. Trocar por outro inibidor (letrozol, exemestano) pode ajudar','APENAS PÓS-MENOPAUSA — em pré-menopausa, ovário responde a feedback e pode aumentar produção de estrogênio (paradoxal). Em pré: tamoxifeno + supressão ovariana','Comparado a tamoxifeno: SEM risco de CA endométrio nem TEV — vantagem','PERFIL LIPÍDICO: monitor — pode aumentar LDL. Indicar estatina se necessário'],
  ARRAY['DEXA basal + a cada 1-2 anos','Cálcio + 25-OH-vit D anual','Perfil lipídico','Sintomas musculoesqueléticos','Função hepática'],
  'Inibidor SELETIVO e REVERSÍVEL da AROMATASE (CYP19) — enzima que converte androgênios (testosterona, androstenediona) em estrogênios (estradiol, estrona) em tecidos periféricos (gordura, músculo, mama). Em pós-menopausa, a aromatase periférica é a principal fonte de estrogênio (ovário inativo). Inibição → estrogênio quase indetectável → bloqueia crescimento tumoral RH+.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=anastrozol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 148. CISPLATINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'cisplatina',
  'Cisplatina',
  ARRAY['Cisplatina'],
  'Quimioterápico — alquilante platina',
  ARRAY['IV'],
  $$[{"forma":"frasco-ampola","concentracao":"50/100 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"CA testículo (cura ~95%)","dose":"BEP: 20 mg/m²/dia × 5 dias × 4 ciclos","via":"IV","obs":"BLEOMICINA + ETOPOSIDE + CISPLATINA. Cura mesmo em estádios avançados — quimiosensibilidade altíssima"},{"para":"CA pulmão pequenas células / não-pequenas células","dose":"75-100 mg/m² IV cada 3 sem","via":"IV","obs":"em esquema (ex: cisplatina + etoposide; cisplatina + pemetrexede)"},{"para":"CA bexiga, ovário, cabeça/pescoço","dose":"60-100 mg/m² IV cada 3-4 sem"},{"para":"radioquimio CA colo uterino","dose":"40 mg/m²/sem × 5-6 sem (concomitante radio)","obs":"em CA colo localmente avançado"}]}$$::jsonb,
  'D','Categoria D. Teratogênico + abortivo. Anticoncepção obrigatória.','CONTRAINDICADA.',
  ARRAY['hipersensibilidade a sais de platina','disfunção renal grave','perda auditiva grave prévia','mielossupressão grave','gestação'],
  $$[{"freq":"muito comum","evento":"NÁUSEA E VÔMITO (severos — emetogenicidade alta)"},{"freq":"muito comum","evento":"NEFROTOXICIDADE (NTA, hipomagnesemia, hipocalemia)"},{"freq":"muito comum","evento":"OTOTOXICIDADE (perda auditiva alta-frequência, irreversível)"},{"freq":"muito comum","evento":"NEUROPATIA periférica (sensitiva, dose-cumulativa)"},{"freq":"comum","evento":"mielossupressão (anemia, leucopenia)"},{"freq":"comum","evento":"alopécia"},{"freq":"incomum","evento":"hepatotoxicidade"},{"freq":"incomum","evento":"reação alérgica (cross-reativa com carboplatina)"},{"freq":"raro","evento":"síndrome lise tumoral (alta carga)"}]$$::jsonb,
  ARRAY['NEFROTOXICIDADE é o efeito limitante — HIDRATAÇÃO PRÉ E PÓS é OBRIGATÓRIA: 2-3 L SF 0,9% ± manitol (forçar diurese). Função renal antes de cada ciclo','EMETOGENICIDADE ALTA: profilaxia padrão = ondansetrona + aprepitanto + dexametasona + olanzapina (4 drogas — NCCN nível 1)','OTOTOXICIDADE IRREVERSÍVEL — perda auditiva alta-frequência. Audiometria basal + entre ciclos em paciente jovem/com função preservada','NEUROPATIA SENSITIVA dose-cumulativa: parestesia, dor neuropática — pode ser permanente. Reduzir dose ou trocar por carboplatina (menos neurotóxica)','HIPOMAGNESEMIA por perda renal — repor agressivamente. Sem repor: hipocalcemia, hipocalemia secundárias','SÍNDROME LISE TUMORAL em alta carga: alopurinol + hidratação + alcalinização ANTES'],
  ARRAY['Função renal + Mg + K + Ca antes cada ciclo','Audiometria basal + a cada 2-3 ciclos','Hemograma antes cada ciclo','Função hepática','Eletrólitos','Sintomas neurológicos (Total Neuropathy Score)'],
  'Alquilante de platina — entra na célula, água substitui cloretos → forma adutos com nitrogênio do DNA (especialmente N7 da guanina) → ligação cruzada intra/inter-fitas → bloqueia replicação + transcrição → apoptose. Não fase-específica do ciclo celular. Resistência por reparo de DNA aumentado, redução de captação, glutationa.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=cisplatina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 149. ESTRADIOL (TRH)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'estradiol',
  'Estradiol (17β-estradiol)',
  ARRAY['Estrofem','Estreva gel','Climen (associada)'],
  'Hormônio — estrogênio bioidêntico',
  ARRAY['VO','transdérmico','vaginal'],
  $$[{"forma":"comprimido","concentracao":"1/2 mg"},{"forma":"gel","concentracao":"0,06% (Estreva)"},{"forma":"adesivo","concentracao":"50/100 mcg/24h"},{"forma":"creme vaginal","concentracao":"0,1 mg/g"}]$$::jsonb,
  $${"indicacoes":[{"para":"sintomas vasomotores climatério moderado-grave","dose":"VO 1-2 mg/dia OU gel 1-2 g/dia OU adesivo 50 mcg 2x/sem","via":"VO/transdérmico","duracao":"o mais curto possível, reavaliar anualmente","obs":"TRH só em mulher <60a OU <10 anos pós-menopausa, sintomática. ASSOCIAR PROGESTAGÊNIO se útero presente (proteção endometrial)"},{"para":"atrofia vaginal sintomática","dose":"creme vaginal 0,5 mg 2x/sem","via":"vaginal","obs":"baixa absorção sistêmica — muito segura. Não precisa progestagênio"},{"para":"hipogonadismo / disgenesia gonadal","dose":"1-2 mg/dia + progestagênio cíclico","obs":"reposição em deficiência endógena"},{"para":"transição feminilizante (terapia hormonal afirmativa)","dose":"2-6 mg/dia VO ou equivalente transdérmico","obs":"protocolo individualizado, com supervisão especializada"}]}$$::jsonb,
  'X','CONTRAINDICADO em gestação (categoria X — exposição fetal).','CONTRAINDICADO.',
  ARRAY['CA mama / endométrio prévio ou ativo','TEV/TEP prévio ou trombofilia','AVC/IAM prévio','sangramento vaginal sem causa','hepatopatia ativa','HAS não controlada','enxaqueca com aura','gestação','tabagismo ≥35a (relativa — uso transdérmico contorna)'],
  $$[{"freq":"comum","evento":"mastalgia"},{"freq":"comum","evento":"sangramento vaginal irregular (especialmente início)"},{"freq":"comum","evento":"náusea, cefaleia"},{"freq":"comum","evento":"retenção líquidos"},{"freq":"incomum","evento":"TEV/TEP (mais com VO que transdérmica)"},{"freq":"incomum","evento":"CA mama (uso prolongado >5 anos com progestagênio sintético)"},{"freq":"incomum","evento":"hipertrigliceridemia"},{"freq":"raro","evento":"AVC isquêmico"}]$$::jsonb,
  ARRAY['SEMPRE ASSOCIAR PROGESTAGÊNIO se útero presente — risco CA endométrio sem oposição. Ex: estradiol + progesterona micronizada 100 mg/dia','TRANSDÉRMICA tem MENOR risco TEV que VO — preferir em paciente com fator de risco trombótico','MENOR DURAÇÃO POSSÍVEL — reavaliar anualmente, tentar suspender. Risco aumenta com uso prolongado','EM CA MAMA: TRH é CONTRAINDICADA. Alternativas para sintomas vasomotores: ISRS (paroxetina off-label), gabapentina, clonidina, comportamental','OSTEOPOROSE: TRH NÃO É 1ª LINHA isolada (risco-benefício desfavorável) — usar bisfosfonato. Pode ser benefício adicional se já em TRH por sintomas','RASTREIO MAMA + ENDOMETRIO: mamografia anual + USG transvaginal anual em uso de TRH'],
  ARRAY['PA','Mamografia anual','USG transvaginal anual','Perfil lipídico','Sintomas TEV','Sangramento anormal','Avaliação ginecológica anual'],
  'Estrogênio bioidêntico (mesma molécula do endógeno). Liga aos receptores de estrogênio (ERα, ERβ) → modulação genômica → repõe efeitos do estrogênio em tecidos-alvo: ósseo (anti-reabsortivo), vascular (vasodilatação NO-mediada), cardiometabólico (perfil lipídico), neuropsicológico (humor, cognição, fogachos), urogenital. Risco-benefício depende idade, sintomas, comorbidades.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=estradiol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 150. PROGESTERONA MICRONIZADA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'progesterona-micronizada',
  'Progesterona micronizada',
  ARRAY['Utrogestan','Evocanil'],
  'Progestagênio bioidêntico',
  ARRAY['VO','vaginal'],
  $$[{"forma":"cápsula","concentracao":"100/200 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"oposição endometrial em TRH","dose":"100 mg/dia (contínua) ou 200 mg × 12-14 dias/mês (sequencial)","via":"VO ou vaginal (noite)","obs":"em mulher com útero. Bioidêntica é mais segura que progestagênios sintéticos (acetato de medroxiprogesterona)"},{"para":"insuficiência luteal / suporte fase lútea (FIV)","dose":"200-600 mg/dia divididos","via":"vaginal preferida","obs":"em reprodução assistida"},{"para":"ameaça de aborto / abortamento habitual","dose":"200-400 mg/dia vaginal","duracao":"até 12-14ª sem","obs":"evidência sugere benefício em mulher com aborto recorrente prévio (PROMISE/PRISM trials)"},{"para":"prematuridade — colo curto","dose":"200 mg vaginal 1x/dia","duracao":"até 36ª sem","obs":"em colo <25 mm <24 sem ou parto prematuro prévio"},{"para":"sintomas vasomotores (off-label, monoterapia)","dose":"100-300 mg/dia","obs":"alternativa em mulher que não pode usar estrogênio"}]}$$::jsonb,
  'B','Categoria B. SEGURA — usada para suporte gestação.','Compatível.',
  ARRAY['hipersensibilidade','TEV ativa','sangramento vaginal sem causa','hepatopatia grave','CA mama / órgão genital ativo'],
  $$[{"freq":"comum","evento":"sonolência (efeito GABAérgico — tomar à noite)"},{"freq":"comum","evento":"tonteira"},{"freq":"comum","evento":"mastalgia"},{"freq":"comum","evento":"alteração ciclo menstrual"},{"freq":"incomum","evento":"depressão"},{"freq":"raro","evento":"reação alérgica a amendoim (excipiente em algumas formulações)"}]$$::jsonb,
  ARRAY['BIOIDÊNTICA — perfil mais seguro que progestagênios sintéticos. WHI mostrou que combinação CEE + medroxiprogesterona aumentou CA mama; estradiol + progesterona micronizada parece mais seguro (ESTHER, KEEPS)','TOMAR À NOITE — efeito sedativo GABAérgico (metabolito alopregnanolona) é desejável para sono','EM AMEAÇA DE ABORTO/ABORTAMENTO HABITUAL: vaginal tem perfil melhor (alta absorção uterina, menos efeitos sistêmicos)','EXCIPIENTE: Utrogestan tem amendoim — atenção em alergia (alternativa: progesterona em outras formulações)','ALERGIA A AMENDOIM: usar formulação alternativa de progesterona (sem amendoim)'],
  ARRAY['Sintomas (sono, humor)','USG transvaginal em TRH (espessamento endometrial)','Sangramento','Sintomas TEV (raros com progesterona)'],
  'Progestagênio BIOIDÊNTICO (mesma molécula endógena). Liga ao receptor de progesterona → modulação genômica → 1) ENDOMÉTRIO: secretor → bloqueia hiperplasia estrogênio-induzida; 2) MAMA: maturação alveolar; 3) MIOMÉTRIO: relaxamento (mantém gestação); 4) SNC: efeito GABAérgico via metabólito alopregnanolona (sedativo). Metabolismo hepático extenso de 1ª passagem na via VO — precisa micronização.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=progesterona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 151. OXITOCINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'oxitocina',
  'Oxitocina',
  ARRAY['Syntocinon','Oxitocina'],
  'Hormônio peptídico — ocitócico',
  ARRAY['IV','IM'],
  $$[{"forma":"ampola","concentracao":"5 UI/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"PREVENÇÃO HEMORRAGIA PÓS-PARTO (uterotônico — 1ª escolha)","dose":"10 UI IM ou IV (em SF) imediatamente após DESPRENDIMENTO DO OMBRO ANTERIOR","via":"IM (preferida) ou IV","obs":"PRIMEIRA ESCOLHA — reduz HPP em 50%. Manejo ativo do 3º estágio"},{"para":"TRATAMENTO HEMORRAGIA PÓS-PARTO (atonia uterina)","dose":"10-40 UI em 1 L SF 0,9% IV (50-200 mUI/min) + massagem uterina + outros uterotônicos","via":"IV","obs":"PRIMEIRA ESCOLHA. Se sem resposta: misoprostol 800 mcg sublingual/retal + ergometrina 0,2 mg IM"},{"para":"INDUÇÃO DO PARTO","dose":"INICIAR 1-2 mUI/min IV BIC, dobrar cada 15-30 min até contrações adequadas (3 em 10 min, 40-60 seg cada)","via":"IV BIC","obs":"em colo favorável (Bishop ≥6). Cardiotocografia contínua. CUIDADO: taquissistolia, ruptura uterina"},{"para":"AUGMENTO do trabalho de parto","dose":"2-20 mUI/min IV BIC","obs":"em distocia funcional após avaliação"},{"para":"aborto/curetagem com hemorragia","dose":"10 UI em SF 500 mL IV","obs":"contração uterina"}]}$$::jsonb,
  'X (em indução parto NÃO indicada) / B (em indicações apropriadas)','Apenas em indicações OBSTÉTRICAS específicas. CONTRAINDICADA em desproporção feto-pélvica, sofrimento fetal, posição anômala, placenta prévia, prolapso cordão.','Compatível em pós-parto.',
  ARRAY['desproporção feto-pélvica','sofrimento fetal','posição anômala','placenta prévia','prolapso cordão','cesárea prévia múltipla (relativa)','hipertonia uterina','hipersensibilidade'],
  $$[{"freq":"comum","evento":"taquissistolia (>5 contrações em 10 min)"},{"freq":"comum","evento":"hipertonia uterina"},{"freq":"comum","evento":"náusea, vômito"},{"freq":"incomum","evento":"DESACELERAÇÃO FETAL / sofrimento agudo"},{"freq":"incomum","evento":"INTOXICAÇÃO HÍDRICA (uso prolongado, alta dose, em SG)"},{"freq":"incomum","evento":"hipotensão (em bolus rápido IV)"},{"freq":"raro","evento":"RUPTURA UTERINA (especialmente em cesárea prévia)"}]$$::jsonb,
  ARRAY['NUNCA INFUNDIR EM BOLUS RÁPIDO IV — hipotensão grave + arritmia. Sempre BIC ou IM','TAQUISSISTOLIA: >5 contrações em 10 min ou desaceleração fetal → REDUZIR INFUSÃO 50% ou SUSPENDER + lateralizar + O2 + nitroglicerina SL/IV em casos extremos','EM CESÁREA PRÉVIA: cuidado redobrado — risco ruptura uterina é maior. Usar dose menor e monitor mais frequente','INTOXICAÇÃO HÍDRICA (similar a ADH): em uso >6h em altas doses. Diluir em SF 0,9% (NÃO SG 5%) + monitor Na+','HEMORRAGIA PÓS-PARTO: oxitocina + misoprostol + manobras + transfusão + balão Bakri se persistir + cirurgia se refratário','MANEJO ATIVO 3º ESTÁGIO: oxitocina ROTINEIRA reduz HPP em 50% — não é optional, é padrão'],
  ARRAY['Cardiotocografia contínua em indução','Dinâmica uterina','PA + FC materna','Sódio sérico em uso prolongado'],
  'Hormônio peptídico secretado pela neuro-hipófise. Liga aos RECEPTORES DE OXITOCINA do miométrio (densidade aumenta no termo gestacional via estrogênio) → contração uterina via Gq → IP3 → aumento Ca++ intracelular. Também age em mama (ejeção láctea via mioepitélio alveolar) e SNC (vínculo afetivo, "hormônio do amor"). Estrutura similar à ADH (vasopressina) → daí intoxicação hídrica em altas doses.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=oxitocina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- OFTALMO / DERMATO TÓPICO
-- ============================================================

-- 152. TIMOLOL (colírio)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'timolol-colirio',
  'Timolol (colírio)',
  ARRAY['Timoptol','Glaucotensil'],
  'Beta-bloqueador não-seletivo tópico (anti-glaucoma)',
  ARRAY['oftálmico'],
  $$[{"forma":"colírio","concentracao":"0,25% / 0,5%"}]$$::jsonb,
  $${"indicacoes":[{"para":"glaucoma de ângulo aberto / hipertensão ocular","dose":"1 gota no olho afetado 12/12h (0,5%) ou 1x/dia (formulação LP/gel)","via":"oftálmico","obs":"PRIMEIRA LINHA junto com análogo prostaglandina (latanoprosta). Reduz PIO ~25%"},{"para":"glaucoma agudo de ângulo fechado (manejo inicial)","dose":"1 gota cada 5-10 min × 3","obs":"adjuvante a pilocarpina + acetazolamida + manitol IV. Encaminhar oftalmo URGENTE"}]}$$::jsonb,
  'C','Categoria C. Absorção sistêmica significativa via mucosa nasal — pode causar bradicardia/broncoespasmo neonatal.','Excretado no leite — monitor RN.',
  ARRAY['ASMA / DPOC moderado-grave (cuidado mesmo tópico — absorção sistêmica)','BAV 2º/3º grau','bradicardia <50','choque cardiogênico','IC descompensada','hipersensibilidade'],
  $$[{"freq":"comum","evento":"queimação ocular ao instilar"},{"freq":"comum (sistêmico)","evento":"bradicardia, hipotensão"},{"freq":"comum (sistêmico)","evento":"broncoespasmo (especialmente em asmático)"},{"freq":"incomum","evento":"depressão, alteração humor"},{"freq":"raro","evento":"síncope, BAV"}]$$::jsonb,
  ARRAY['BETA-BLOQUEADOR TÓPICO TEM ABSORÇÃO SISTÊMICA — pode causar bradicardia, broncoespasmo, depressão, mascarar hipoglicemia. NÃO ASSUMIR que é "só local"','OCLUSÃO PUNCTAL (pressionar canto interno olho 1-2 min após instilar) reduz absorção sistêmica em 50-70% — orientar paciente','EM ASMA/DPOC: PREFERIR análogo prostaglandina (latanoprosta) ou alfa-agonista (brimonidina) — evitar BB tópico','EM IDOSO: cuidado bradicardia, hipotensão postural (queda)','PRIMEIRA APRESENTAÇÃO DE GLAUCOMA: encaminhar oftalmo para avaliação completa antes de iniciar — só o medicamento sem acompanhamento é insuficiente'],
  ARRAY['PIO (oftalmológico)','FC + PA em paciente cardiopata','Sintomas respiratórios','Campo visual + disco óptico (oftalmo)'],
  'Beta-bloqueador não-seletivo tópico — bloqueia receptores β no corpo ciliar → reduz produção de humor aquoso (mecanismo diferente dos análogos prostaglandina, que aumentam drenagem). Reduz PIO ~25%. Absorção sistêmica via via lacrimal-nasal-mucosa pode causar efeitos β-bloqueio sistêmicos significativos.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=timolol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 153. LATANOPROSTA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'latanoprosta',
  'Latanoprosta (colírio)',
  ARRAY['Xalatan'],
  'Análogo de prostaglandina F2α — anti-glaucoma',
  ARRAY['oftálmico'],
  $$[{"forma":"colírio","concentracao":"0,005%"}]$$::jsonb,
  $${"indicacoes":[{"para":"glaucoma ângulo aberto / hipertensão ocular (1ª escolha)","dose":"1 gota no olho afetado 1x/dia (NOITE)","via":"oftálmico","obs":"PRIMEIRA ESCOLHA — reduz PIO ~30%, dosagem mais cômoda. Alternativas: bimatoprosta, travoprosta"}]}$$::jsonb,
  'C','Categoria C. Absorção sistêmica baixa, mas evitar.','Sem dados — evitar.',
  ARRAY['hipersensibilidade','uveíte ativa','infecção ocular ativa'],
  $$[{"freq":"muito comum","evento":"HIPERPIGMENTAÇÃO da íris (irreversível, especialmente em olhos verdes/avelã/cinza)"},{"freq":"muito comum","evento":"crescimento + escurecimento de cílios (cosmético)"},{"freq":"comum","evento":"hiperemia conjuntival"},{"freq":"comum","evento":"queimação, sensação corpo estranho"},{"freq":"incomum","evento":"edema macular cistoide"},{"freq":"incomum","evento":"piora uveíte"},{"freq":"raro","evento":"reativação herpes ocular"}]$$::jsonb,
  ARRAY['HIPERPIGMENTAÇÃO IRREVERSÍVEL DA ÍRIS — orientar paciente sobre alteração permanente de cor (especialmente em olhos verdes/cinza). Avaliar mudança fotos seriadas','CRESCIMENTO DE CÍLIOS: efeito cosmético (bimatoprosta usado off-label como Latisse para alongar cílios)','SUPERIOR a beta-bloqueador em redução PIO + maior comodidade (1x/dia, sem efeitos sistêmicos significativos) — PRIMEIRA ESCOLHA atual','OCLUSÃO PUNCTAL recomendada','APLICAR À NOITE — pico ação 8-12h, melhor controle PIO durante o dia'],
  ARRAY['PIO','Coloração íris (foto basal)','Sintomas (irritação, hiperemia)','Campo visual + disco óptico'],
  'Análogo da PGF2α (prostaglandina F2-alfa). Liga aos receptores FP no músculo ciliar → aumenta drenagem do humor aquoso pela VIA UVEOESCLERAL (drenagem alternativa não-trabecular) → reduz PIO. Mecanismo COMPLEMENTAR aos beta-bloqueadores (que reduzem produção). Pode estimular melanócitos da íris (hiperpigmentação) e folículos ciliares (crescimento cílios).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=latanoprosta',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 154. BETAMETASONA TÓPICA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'betametasona-topica',
  'Betametasona (tópica) — diproprionato/valerato',
  ARRAY['Betnovate','Diprogenta (com gentamicina)'],
  'Corticoide tópico potência alta (classe III)',
  ARRAY['tópico'],
  $$[{"forma":"creme/pomada","concentracao":"valerato 0,1% / dipropionato 0,05%"}]$$::jsonb,
  $${"indicacoes":[{"para":"dermatite atópica grave (curta duração)","dose":"1 aplicação fina 1-2x/dia","via":"tópico","duracao":"≤2 SEMANAS contínuas","obs":"em adulto, pele espessa (palmas, solas, couro cabeludo). EVITAR face/genital/dobras"},{"para":"psoríase em placas","dose":"2x/dia até melhorar, depois 2x/sem manutenção","via":"tópico","duracao":"≤4 sem"},{"para":"líquen plano, líquen simples crônico","dose":"2x/dia","via":"tópico"},{"para":"crise eczema agudo","dose":"2x/dia × 5-7 dias","obs":"depois reduzir potência (hidrocortisona 1%)"}]}$$::jsonb,
  'C','Categoria C. Em pequenas áreas, curto prazo: aceitável. Evitar grande área/oclusão.','Compatível em local restrito (não na mama).',
  ARRAY['infecção ativa não tratada (bacteriana, viral, fúngica)','rosácea','dermatite perioral','acne','tuberculose cutânea'],
  $$[{"freq":"comum (uso prolongado)","evento":"atrofia cutânea, telangiectasia, estrias"},{"freq":"comum","evento":"hipopigmentação"},{"freq":"comum","evento":"erupção acneiforme"},{"freq":"incomum","evento":"taquifilaxia (perda de eficácia)"},{"freq":"incomum","evento":"dermatite perioral"},{"freq":"raro","evento":"supressão eixo HPA (uso extenso, oclusão, criança)"},{"freq":"raro","evento":"glaucoma (uso prolongado periorbital)"}]$$::jsonb,
  ARRAY['CORTICOIDE TÓPICO POTENTE: NUNCA usar em FACE / GENITAL / DOBRAS / criança pequena rotineiramente — preferir hidrocortisona 1% (baixa potência)','LIMITE DURAÇÃO: ≤2 sem em alta potência. Após: reduzir potência ou intercalar com inibidor calcineurina (tacrolimo/pimecrolimo)','OCLUSÃO + GRANDE ÁREA = ABSORÇÃO SISTÊMICA — supressão HPA, especialmente em peds','REGRA DE FINGERTIP UNIT: 1 fingertip cobre ~2% da superfície corporal — orientar quantidade','RESISTÊNCIA: rotina de 2 sem on / 2 sem off ou intercalar com não-corticoide previne taquifilaxia','EM PEDS: usar potências baixas (hidrocortisona 1%) — pele fina, absorção maior'],
  ARRAY['Sintomas locais (atrofia, telangiectasia)','Resposta clínica (suspender se não melhora)','Em peds: curva de crescimento, sinais cushingoide se uso extenso'],
  'Corticoide sintético halogenado tópico de alta potência (classe III brasileira / II americana). Penetra a pele e liga ao receptor de glicocorticoide intracelular → modulação genômica → reduz inflamação (inibe citocinas, mediadores), suprime imunidade local, vasoconstrição, antimitótico (atrofia em uso prolongado).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=betametasona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 155. PERMETRINA TÓPICA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'permetrina',
  'Permetrina (tópica)',
  ARRAY['Nedax','Kwell'],
  'Inseticida piretroide — antiparasitário tópico',
  ARRAY['tópico'],
  $$[{"forma":"loção/creme","concentracao":"5% (sarna) / 1% (piolho)"},{"forma":"shampoo","concentracao":"1%"}]$$::jsonb,
  $${"indicacoes":[{"para":"escabiose (sarna)","dose":"creme 5% — aplicar do pescoço aos pés à noite, lavar pela manhã (8-14h depois). Repetir em 7-14 dias","via":"tópico","obs":"PRIMEIRA ESCOLHA. Tratar TODA família simultaneamente. Lavar roupas/lençóis 60°C"},{"para":"pediculose (piolho)","dose":"shampoo 1% — aplicar cabelo seco/úmido, esperar 10 min, enxaguar. Repetir em 7 dias","via":"tópico","obs":"alternativa: ivermectina VO refratário"},{"para":"profilaxia em surto (instituições)","dose":"aplicar em todos contactantes simultaneamente"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥2 meses peds","dose":"creme 5% — aplicar mesmo esquema. Em <2m: discutir com derma"}]}$$::jsonb,
  'B','Categoria B. SEGURA em gestação.','Compatível.',
  ARRAY['hipersensibilidade','dermatite ativa grave (irritação)'],
  $$[{"freq":"comum","evento":"prurido, ardência local"},{"freq":"comum","evento":"vermelhidão local"},{"freq":"incomum","evento":"dermatite de contato"}]$$::jsonb,
  ARRAY['ESCABIOSE: tratar TODOS contactantes domiciliares simultaneamente — sem isso, reinfecção certa','PRURIDO PERSISTE até 4 SEMANAS APÓS cura — orientar paciente (não é falha de tratamento). Anti-histamínico + emoliente para alívio','LAVAR roupas, lençóis, toalhas com ÁGUA QUENTE (≥60°C) ou ferver. Itens não laváveis: saco plástico fechado por 3-7 dias (ácaros morrem sem hospedeiro)','EM ESCABIOSE CROSTOSA (Norueguesa) — imunossuprimido com hiperqueratose: ivermectina VO + permetrina tópica + isolamento','PIOLHO: pentear com pente fino + cuidado contactantes na escola','APLICAR EM PELE SECA (não logo após banho) — penetração melhor'],
  ARRAY['Resposta clínica (resolução prurido em 2-4 sem)','Reaplicação após 7-14d','Sintomas alérgicos','Família/contactantes'],
  'Piretroide sintético — atua nos canais de SÓDIO voltagem-dependentes do parasita (ácaro/piolho) → mantém canal aberto → despolarização contínua → paralisia + morte. Em mamíferos, canais de Na+ menos sensíveis e metabolismo rápido → margem de segurança alta. Ovicida + adulticida.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=permetrina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- ANESTESIA / EMERGÊNCIA
-- ============================================================

-- 156. LIDOCAÍNA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'lidocaina',
  'Lidocaína',
  ARRAY['Xylocaína'],
  'Anestésico local — amida / antiarrítmico classe Ib',
  ARRAY['tópico','infiltrativa','IV'],
  $$[{"forma":"frasco/ampola","concentracao":"1% / 2% (com ou sem epinefrina 1:100000-200000)"},{"forma":"gel","concentracao":"2%"},{"forma":"spray","concentracao":"10%"}]$$::jsonb,
  $${"indicacoes":[{"para":"anestesia local infiltrativa (pequena cirurgia, sutura)","dose":"≤4,5 mg/kg sem epinefrina (max ~300 mg adulto) OU ≤7 mg/kg com epinefrina (max ~500 mg)","via":"infiltrativa","obs":"epinefrina prolonga ação + reduz sangramento. NÃO usar em extremidades terminais (dedo, pênis, nariz, orelha) — vasoconstrição"},{"para":"anestesia tópica mucosa","dose":"gel 2% / spray 10% conforme área","via":"tópico","obs":"absorção pode ser significativa em mucosa — risco toxicidade"},{"para":"arritmia ventricular (TV/FV refratária)","dose":"1-1,5 mg/kg IV bolus, repetir 0,5-0,75 mg/kg após 5-10 min se persistir + 1-4 mg/min BIC","via":"IV","obs":"AHA: 2ª linha em PCR após amiodarona. Não usar profilático rotineiro pós-IAM"},{"para":"dor neuropática localizada (adesivo)","dose":"adesivo 5% até 12h/dia"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infiltrativa peds","dose":"max 4,5 mg/kg sem epi"}]}$$::jsonb,
  'B','Categoria B. SEGURA em pequenas doses (epidural obstétrica = boa).','Compatível.',
  ARRAY['BAV 2º/3º grau','choque cardiogênico','hipersensibilidade a amidas','porfiria intermitente aguda','injetar em vaso (cuidado aspirar antes)'],
  $$[{"freq":"comum (overdose)","evento":"sintomas SNC: zumbido, parestesia perioral, agitação, tonteira"},{"freq":"comum (epidural)","evento":"hipotensão, bradicardia"},{"freq":"incomum","evento":"convulsão (toxicidade SNC progressiva)"},{"freq":"raro","evento":"PCR (bloqueio cardíaco em alta dose)"},{"freq":"raro","evento":"reação alérgica verdadeira (rara em amidas — ésteres mais alergênicos)"},{"freq":"raro","evento":"metemoglobinemia (em prilocaína > lidocaína; antídoto azul de metileno)"}]$$::jsonb,
  ARRAY['DOSE MÁXIMA OBRIGATÓRIA — calcular em mg/kg ANTES de infiltrar. Toxicidade sistêmica pode ser fatal (PCR)','TOXICIDADE SISTÊMICA POR ANESTÉSICO LOCAL (LAST): sintomas progressivos — zumbido → tremor → convulsão → arritmia → PCR. ANTÍDOTO: emulsão lipídica 20% (Intralipid) 1,5 mL/kg IV bolus + BIC','ASPIRAR ANTES DE INJETAR — evita injeção intravascular','EPINEFRINA EM EXTREMIDADES (dedo, pênis, nariz, orelha): NÃO USAR — risco isquemia/necrose','BIC IV PARA ARRITMIA: requer monitor — toxicidade SNC em níveis altos','METEMOGLOBINEMIA: paciente cianótico não responsivo a O2 + sangue chocolate — antídoto azul de metileno 1-2 mg/kg IV'],
  ARRAY['Cálculo dose por peso','Sintomas precoces toxicidade (zumbido, parestesia perioral)','PA + FC durante uso','SatO2','ECG em uso IV','Sinais isquemia em extremidades (com epi)'],
  'Anestésico local AMIDA — bloqueia canais de SÓDIO voltagem-dependentes em estado inativo → impede despolarização → bloqueia condução nervosa (efeito reversível). Bloqueia em ordem: dor > temperatura > tato > pressão > motor (fibras finas → grossas). Como antiarrítmico classe Ib: encurta período refratário, atua em foco isquêmico (TV pós-IAM).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=lidocaina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 157. SUCCINILCOLINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'succinilcolina',
  'Succinilcolina',
  ARRAY['Quelicin'],
  'Bloqueador neuromuscular despolarizante (curta ação)',
  ARRAY['IV','IM'],
  $$[{"forma":"frasco-ampola","concentracao":"100 mg/5 mL (20 mg/mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"INTUBAÇÃO RÁPIDA (sequência rápida — ISR)","dose":"1-1,5 mg/kg IV bolus","via":"IV","obs":"primeira escolha em ISR para emergência (paralisia em 30-60 seg, dura 5-10 min). Alternativa: rocurônio 1,2 mg/kg (alvo: sugamadex disponível)"},{"para":"intubação difícil prevista (com via reversível)","dose":"1 mg/kg IV","obs":"recuperação em 5-10 min é vantagem se intubação falhar"},{"para":"laringoespasmo refratário","dose":"0,1-0,5 mg/kg IV ou 4 mg/kg IM"}]}$$::jsonb,
  $${"indicacoes":[{"para":"ISR peds","dose":"1-2 mg/kg IV (peds têm receptores extra-juncionais — pode haver hipercalemia)"}]}$$::jsonb,
  'C','Categoria C. Usada em cesárea de emergência — não atravessa barreira em quantidade significativa.','Compatível em curto prazo.',
  ARRAY['HIPERTERMIA MALIGNA pessoal/familiar','HIPERCALEMIA conhecida','queimadura >24-48h (denervação → receptores extrajuncionais → hipercalemia maciça)','denervação (TRM crônico, AVC com paralisia >7 dias, doença neuromuscular)','rabdomiólise','trauma extenso','história deficiência pseudocolinesterase plasmática'],
  $$[{"freq":"muito comum","evento":"FASCICULAÇÕES seguidas de paralisia"},{"freq":"comum","evento":"mialgia pós-procedimento"},{"freq":"comum","evento":"AUMENTO TRANSITÓRIO DE POTÁSSIO (~0,5 mEq/L em saudável; muito mais em alto risco)"},{"freq":"incomum","evento":"bradicardia (especialmente peds com 2ª dose)"},{"freq":"incomum","evento":"aumento PIO/PIC/PIA"},{"freq":"raro","evento":"HIPERTERMIA MALIGNA — emergência (antídoto dantrolene)"},{"freq":"raro","evento":"PARALISIA PROLONGADA (deficiência pseudocolinesterase — apneia 4-8h)"}]$$::jsonb,
  ARRAY['HIPERTERMIA MALIGNA: rara mas FATAL — taquicardia + hipertermia + rigidez muscular + acidose + hipercalemia + mioglobinúria. ANTÍDOTO: dantrolene 2,5 mg/kg IV. Suspender, esfriar, suporte','HIPERCALEMIA POR DENERVAÇÃO/QUEIMADURA: receptores extrajuncionais proliferam → liberação massiva de K+ → arritmia/PCR. CONTRAINDICADO em queimado >24-48h, AVC/TRM com paralisia, distrofia muscular','BRADICARDIA EM PEDS: pré-medicar com atropina 0,02 mg/kg em <5a OU em 2ª dose','SEMPRE TER EQUIPAMENTO DE VIA AÉREA AVANÇADA disponível antes de paralisar paciente — paralisia sem capacidade de intubar = morte','DEFICIÊNCIA PSEUDOCOLINESTERASE: paralisia prolongada (4-8h) — manter ventilação até reversão espontânea. Dosagem da enzima após'],
  ARRAY['SatO2 contínua','ECG (bradicardia, hipercalemia)','Capnografia','Temperatura (hipertermia)','CK pós-procedimento (mialgia/rabdomiólise)','K+ em pacientes de risco','Plano via aérea backup'],
  'Despolarizante: dois acetilcolinas ligados — liga aos receptores nicotínicos da placa motora → DESPOLARIZA persistente → fasciculação inicial → PARALISIA por dessensibilização do receptor (não consegue repolarizar). Hidrolisada por PSEUDOCOLINESTERASE plasmática (rápido, daí curta ação 5-10 min). Causa hipercalemia por liberação de K+ na despolarização — em receptores extrajuncionais (queimado/denervado), liberação maciça.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=succinilcolina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 158. DIFENIDRAMINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, dose_idoso, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'difenidramina',
  'Difenidramina',
  ARRAY['Benadryl','Difenidrin'],
  'Anti-histamínico H1 (1ª geração)',
  ARRAY['VO','IV','IM','tópico'],
  $$[{"forma":"comprimido","concentracao":"25/50 mg"},{"forma":"ampola","concentracao":"10 mg/mL"},{"forma":"creme","concentracao":"1-2%"}]$$::jsonb,
  $${"indicacoes":[{"para":"reação alérgica aguda (urticária, angioedema sem comprometimento VA)","dose":"25-50 mg VO/IV/IM, repetir 4-6/6h","via":"VO/IV/IM","obs":"COADJUVANTE em anafilaxia (NÃO substitui adrenalina). Útil em reação leve cutânea isolada"},{"para":"distonia aguda induzida por antipsicótico/metoclopramida","dose":"25-50 mg IV/IM","via":"IV ou IM","obs":"alternativa a biperideno. Resposta em 5-15 min"},{"para":"náusea/vertigem (cinetose, Ménière, BPPV)","dose":"25-50 mg VO 4-6/6h","via":"VO","obs":"efeito anti-emético central + anti-vertiginoso (anti-H1 + anti-M)"},{"para":"insônia (ocasional, NÃO crônica)","dose":"25-50 mg ao deitar","via":"VO","obs":"USO LIMITADO. NÃO em idoso (Beers — risco quedas, anticolinérgico)"}]}$$::jsonb,
  $${"indicacoes":[{"para":">2a","dose":"1-1,25 mg/kg/dose 6/6h, max 25-50 mg/dose"}]}$$::jsonb,
  $${"obs":"EVITAR — Beers Criteria. Anticolinérgico, sedação, queda."}$$::jsonb,
  'B','Categoria B. Considerada SEGURA em gestação (categoria B). Em hiperêmese: opção 1ª linha (com piridoxina/doxilamina).','Compatível em curto prazo. Pode reduzir produção láctea em uso prolongado.',
  ARRAY['glaucoma de ângulo fechado','retenção urinária / HBP grave','asma aguda (espessamento secreção)','obstrução vesical','convulsão recente','RN (paradoxal hiperatividade)','idoso (Beers)'],
  $$[{"freq":"muito comum","evento":"sedação"},{"freq":"comum","evento":"efeitos anticolinérgicos: boca seca, retenção urinária, constipação, visão borrada"},{"freq":"comum","evento":"sonolência paradoxal (em criança e idoso — agitação/irritabilidade)"},{"freq":"incomum","evento":"taquicardia"},{"freq":"raro","evento":"discinesia (em altas doses)"}]$$::jsonb,
  ARRAY['EM ANAFILAXIA: COADJUVANTE — NÃO SUBSTITUI adrenalina. Adrenalina IM é primeira linha SEMPRE','BEERS CRITERIA: anti-H1 1ª geração CONTRAINDICADO em idoso (queda, demência, anticolinérgico). Preferir 2ª geração (loratadina, fexofenadina) que não atravessa BHE','SEDATIVO MÁXIMO entre anti-H1 — efeito desejável em insônia/coceira; indesejável quando precisa estar alerta','HIPERÊMESE GRAVÍDICA: 1ª linha = piridoxina + doxilamina (semelhante difenidramina). Difenidramina é alternativa segura em gestação','EM PEDS pequenos: efeito paradoxal de excitação em <2 anos (FDA contraindicou OTC <2a)','OVERDOSE: anticolinérgico (mad as a hatter) — taquicardia, midríase, retenção urinária, alucinação. Antídoto: fisostigmina (raramente necessário)'],
  ARRAY['Resposta clínica','Sinais anticolinérgicos','Sedação (idoso, dirigir)','Em peds: sinais paradoxais'],
  'Anti-histamínico H1 de 1ª geração. Antagonista competitivo dos receptores H1 → reduz efeitos histamina (urticária, prurido, vasodilatação). Atravessa BHE livremente → SEDAÇÃO + efeito anti-vertiginoso (núcleos vestibulares). Tem também efeito ANTICOLINÉRGICO (M1) — daí boca seca, retenção urinária, efeito anti-emético central, anti-distônico (em distonia induzida por antipsicótico).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=difenidramina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 159. SORO DE REIDRATAÇÃO ORAL (SRO)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'soro-reidratacao-oral',
  'Soro de reidratação oral (SRO)',
  ARRAY['SRO','Pedialyte','Floralyte','Reidratação Oral SUS'],
  'Solução de reidratação — eletrólitos + glicose',
  ARRAY['VO','SNG'],
  $$[{"forma":"sachê","concentracao":"OMS reduzido: Na 75 + K 20 + Cl 65 + citrato 10 + glicose 75 mmol/L"}]$$::jsonb,
  $${"indicacoes":[{"para":"diarreia aguda — desidratação leve-moderada (Plano A/B)","dose":"PLANO A (sem desidratação): SRO após cada evacuação 50-100 mL <1a, 100-200 mL ≥1a, ad libitum adulto. PLANO B (alguma desidratação): 75 mL/kg em 4 horas","via":"VO ou SNG","obs":"PRIMEIRA ESCOLHA. Reidrata 95% dos casos. Hidratação IV apenas em desidratação grave (Plano C)"},{"para":"manutenção em diarreia persistente","dose":"reposição contínua","obs":"associar à alimentação habitual — não suspender"},{"para":"vômito (alternar com água/leite materno)","dose":"5-10 mL cada 5-10 min, aumentar conforme tolerância","via":"VO","obs":"em criança com vômito persistente: SRO ondansetrona pode ser útil"}]}$$::jsonb,
  $${"indicacoes":[{"para":"diarreia aguda peds","dose":"Plano B: 75 mL/kg em 4h (calcular pelo peso corporal)"}]}$$::jsonb,
  'A','Categoria A. SEGURA em gestação.','Compatível.',
  ARRAY['choque (Plano C — IV imediata)','íleo paralítico','obstrução intestinal','vômito persistente intratável','rebaixamento consciência (risco aspiração)','desidratação grave (Plano C)'],
  $$[{"freq":"raro","evento":"náusea (se aceito muito rápido)"},{"freq":"raro","evento":"hipernatremia (se preparo errado, mais Na que indicado)"}]$$::jsonb,
  ARRAY['SRO REDUZIDO (OMS, 245 mOsm/L) é o atual padrão — menos Na (75 mmol/L), menos osmolaridade. Reduz volume fezes em 25%, vômito em 30%, necessidade hidratação IV em 33%','PREPARO CORRETO: 1 sachê em 1 LITRO de ÁGUA FILTRADA — hipertônico se feito errado pode piorar diarreia','MANTER ALIMENTAÇÃO: leite materno + alimentos habituais durante diarreia (NÃO RESTRINGIR). Em peds desnutrido: dieta hipercalórica','ZINCO em diarreia peds <5a: 10-20 mg/dia × 14 dias — reduz duração + recidiva','PROBIÓTICOS: evidência para Saccharomyces boulardii, Lactobacillus em diarreia infecciosa (reduz 1 dia)','Plano C (desidratação grave): 100 mL/kg SF 0,9% IV em 3h (>1a) ou 6h (<1a) — referência hospitalar','SOLUÇÃO CASEIRA (1 colher de sopa açúcar + 1 colher de chá sal em 1 L água): aceitável em emergência mas SRO industrial é melhor'],
  ARRAY['Sinais desidratação (turgor, mucosa, FC, lágrima, fontanela peds)','Diurese','Peso (peds)','Eletrólitos em desidratação grave','Tolerância (vômito, aceitação)'],
  'Solução isotônica/hipotônica de glicose + eletrólitos. Aproveita o COTRANSPORTE Na+/glicose no enterócito (SGLT-1) — mesmo em diarreia, esse transportador funciona → absorção de Na arrasta água por osmose. Glicose otimiza a absorção de Na sem causar diarreia osmótica (proporção ~1:1 molécula). Reduz volume fezes + repõe perdas.',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/d/diarreia',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
