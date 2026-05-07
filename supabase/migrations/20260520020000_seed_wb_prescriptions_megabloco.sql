-- PreceptorBook: Prescrições Mega Bloco (8 prescrições adicionais)

-- 1. HIPERCALEMIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hipercalemia',
  'Hipercalemia — manejo agudo',
  'Distúrbio eletrolítico',
  'K+ >5,5 (leve), >6 (moderada), >6,5 ou alteração ECG (grave)',
  'PA / UTI',
  'Estabilizar miocárdio (Ca) + jogar K para dentro (insulina+glicose, beta2, bicarbonato) + remover do organismo (resina, diurético, diálise).',
  $$[
    {"droga":"GLUCONATO DE CÁLCIO 10% (estabilizador miocárdio)","dose":"1 g (10 mL) IV em 2-5 min, REPETIR após 5 min se ECG não normalizar","via":"IV","obs":"PRIMEIRA MEDIDA quando ECG ALTERADO. Início <5 min, dura 30-60 min. NÃO REDUZ K+ (apenas protege)","drug_slug":"gluconato-calcio"},
    {"droga":"INSULINA + GLICOSE (joga K+ intracelular)","dose":"insulina regular 10 U IV + 50 mL SG 50% (25 g glicose). Em hiperglicêmico: insulina sem glicose","via":"IV","obs":"reduz K em 0,5-1 mEq/L em 15 min, dura 4-6h. Monitor glicemia 1h depois (hipoglicemia)"},
    {"droga":"BETA2 INALATÓRIO","dose":"salbutamol nebulizado 10-20 mg (2-4x dose habitual) em 10-20 min","via":"INALAT","obs":"reduz K em 0,5-1 mEq/L em 30 min. Sinérgico com insulina. Cuidado em cardiopata","drug_slug":"salbutamol"},
    {"droga":"BICARBONATO DE SÓDIO (apenas em ACIDOSE associada)","dose":"50-100 mEq IV em 30 min","via":"IV","obs":"em paciente com pH <7,2 + hipercalemia. SEM acidose: pouco eficaz","drug_slug":"bicarbonato-sodio"},
    {"droga":"FUROSEMIDA (remoção real de K+)","dose":"40-80 mg IV","via":"IV","obs":"em paciente com função renal preservada + euvolêmico/sobrecarga. Sem oliguria","drug_slug":"furosemida"},
    {"droga":"RESINA DE TROCA (poliestirenossulfonato sódio — Sorcal)","dose":"15-30 g VO ou 50 g enema 6/6h","via":"VO ou retal","obs":"remoção GI ~1 mEq/h. Lenta. CUIDADO necrose intestinal — orientar com sorbitol diluído + monitor"},
    {"droga":"PATIROMER / ZIRCÔNIO (resinas modernas)","dose":"patiromer 8,4 g/dia ou ZS-9 10 g 3x/dia × 48h","obs":"mais cara mas mais segura que poliestirenossulfonato"},
    {"droga":"HEMODIÁLISE (último recurso / refratário)","obs":"K >7 não responsivo, IRA, anúria, ECG persistente alterado. Mais eficaz/rápida"},
    {"droga":"SUSPENDER causas: IECA/BRA, espironolactona, AINE, suplemento K","obs":"identificar e suspender medicações elevando K"}
  ]$$::jsonb,
  ARRAY[
    'ALTERAÇÕES ECG progressivas: K 5,5-6,5 ondas T apiculadas; >6,5 alargamento QRS, P aplaina; >7,5 padrão sinusoidal → FV/PCR',
    'COLETAR ECG + GASOMETRIA imediatamente. Confirmar com nova amostra (descartar pseudohipercalemia: hemólise, leucocitose>50k, plaquetose>500k)',
    'INVESTIGAR CAUSA: IRA, lesão tecidual (rabdomiólise, queimadura, lise tumoral), drogas (IECA/BRA, espironolactona), Addison, acidose, transfusão',
    'AVALIAR DIÁLISE em: K >7, IRA com anúria, sintomas refratários, intoxicação digitálica',
    'EVITAR ringer lactato (contém K) — usar SF 0,9% se IV',
    'REAVALIAR K+ a cada 1-2h durante manejo'
  ],
  ARRAY['ECG (ondas T apiculadas, alargamento QRS, aplainamento P, sinusoidal)','K+ sérico CONFIRMAR (pseudohipercalemia)','Gasometria + lactato','Função renal + Cr','Glicemia (durante insulina)','ECG seriado pós tratamento','Eletrólitos completos (Na, Mg, Ca, P)','Urina I + Cr urinária','LDH, CK em rabdomiólise'],
  ARRAY['CÁLCIO É EFEITO RÁPIDO MAS TEMPORÁRIO — outras medidas DEVEM SEGUIR para reduzir K+ real','EM PACIENTE COM DIGITÁLICO: cuidado com cálcio (potencializa toxicidade) — preferir bicarbonato/insulina+glicose','HIPERCALEMIA + RABDOMIÓLISE/LISE TUMORAL: associar hidratação maciça + alopurinol/rasburicase','POLIESTIRENO SULFONATO (Sorcal) com SORBITOL: NECROSE INTESTINAL relatada — preferir formulações modernas (patiromer, ZS-9) ou diálise','IECA/BRA + ESPIRONOLACTONA = COMBINAÇÃO HIPERCALÊMICA — monitor frequente, especialmente em IRC + DM','HEMÓLISE NA AMOSTRA gera pseudohipercalemia — repetir antes de tratar paciente assintomático'],
  'KDIGO 2024 / AHA',
  'https://kdigo.org/guidelines/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. REVERSÃO DE ANTICOAGULAÇÃO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'reversao-anticoagulacao',
  'Reversão de anticoagulante — sangramento ou cirurgia urgente',
  'Sangramento por anticoagulante',
  'Paciente em anticoagulante com sangramento ativo OU cirurgia urgente não eletiva',
  'PA / UTI / Bloco cirúrgico',
  'Estratégia varia por droga: varfarina = vit K + CCP; UFH = protamina; HBPM = protamina parcial; DOACs = idarucizumabe (dabigatrana) ou andexanet/CCP (Xa).',
  $$[
    {"droga":"VARFARINA — INR alto SEM sangramento","dose":"INR 4,5-10: suspender 1-2 doses + observar. INR >10: vit K1 2,5-5 mg VO","via":"VO","obs":"VO é preferível em paciente sem sangramento","drug_slug":"vitamina-k"},
    {"droga":"VARFARINA — sangramento maior / cirurgia urgente","dose":"vit K1 5-10 mg IV LENTO (30 min) + CCP 4-fator (Kcentra) 25-50 U/kg","via":"IV","obs":"alternativa: plasma fresco 10-15 mL/kg (mais lento, sobrecarga volume). CCP é PRIMEIRA ESCOLHA quando disponível","drug_slug":"vitamina-k"},
    {"droga":"HEPARINA NÃO-FRACIONADA — sangramento","dose":"sulfato de protamina: 1 mg neutraliza ~100 U UFH (max 50 mg dose). Calcular pela dose recente: para infusão = última 2-3h × dose","via":"IV LENTO em 10 min","obs":"infusão rápida = hipotensão, anafilaxia. Reverte ~100% UFH","drug_slug":"heparina-nao-fracionada"},
    {"droga":"ENOXAPARINA (HBPM) — sangramento","dose":"protamina 1 mg para cada 1 mg enoxaparina nas últimas 8h (max 50 mg)","via":"IV LENTO","obs":"reverte ~60% (não 100% — diferente de UFH). Em sangramento grave: associar TXA ± hemoderivados","drug_slug":"acido-tranexamico"},
    {"droga":"DABIGATRANA — sangramento grave","dose":"IDARUCIZUMABE (Praxbind) 5 g IV (2 ampolas 2,5 g consecutivas)","via":"IV","obs":"ANTÍDOTO ESPECÍFICO. Reverte em minutos. DISPONÍVEL no Brasil"},
    {"droga":"INIBIDOR Xa (apixabana, rivaroxabana) — sangramento","dose":"ANDEXANET ALFA 400-800 mg bolus + 480-960 mg/h × 2h. Sem disponibilidade: CCP 4-fator 50 U/kg","via":"IV","obs":"andexanet é caro/limitado no Brasil — CCP é alternativa principal"},
    {"droga":"AAS / clopidogrel — sangramento","obs":"NÃO HÁ ANTÍDOTO ESPECÍFICO. Suspender + transfusão de plaquetas (1 unidade aférese ou 6-10 unidades randômicas) se sangramento maior. Desmopressina 0,3 mcg/kg IV pode ajudar"},
    {"droga":"Ácido tranexâmico (adjuvante)","dose":"1 g IV em 10 min + 1 g em 8h","via":"IV","obs":"em hemorragia massiva (trauma <3h, hemorragia pós-parto, sangramento cirúrgico) — reduz mortalidade","drug_slug":"acido-tranexamico"},
    {"droga":"Suporte hemoderivados","obs":"transfusão CH se Hb baixa; plaquetas se <50k em sangramento; plasma fresco se INR alto e CCP indisponível; crioprecipitado se fibrinogênio <100"}
  ]$$::jsonb,
  ARRAY[
    'IDENTIFICAR DROGA, DOSE, ÚLTIMA ADMINISTRAÇÃO — orienta tratamento e estimar tempo de meia-vida residual',
    'CESSAR DROGA imediatamente',
    'COMPRESSÃO + medidas hemostáticas locais sempre',
    'EM CIRURGIA ELETIVA: PLANEJAR — varfarina suspender 5d antes (INR alvo <1,5); DOAC 24-48h antes; UFH 4-6h antes; HBPM 12-24h antes',
    'PONTE COM HEPARINA: em paciente alto risco trombótico (FA com CHA2DS2-VASc alto, prótese valvar mecânica) durante peri-op',
    'AGENDAR REINTRODUÇÃO de anticoagulante após hemostasia — risco trombótico volta',
    'COMUNICAR CIRURGIÃO/HEMATOLOGIA em casos complexos'
  ],
  ARRAY['INR / TTPa / TT (varfarina, UFH, dabigatrana respectivamente)','Anti-Xa (HBPM, DOAC Xa)','Hemograma (Hb, plaquetas)','Função renal (DOAC eliminação renal)','Função hepática','Fibrinogênio (em sangramento massivo)','Tipagem sanguínea + reserva'],
  ARRAY['VITAMINA K IV LENTA — anafilactoide possível. PREFERIR VO em paciente sem sangramento','PROTAMINA: anafilaxia, hipotensão se rápida — diluir, infundir em 10 min','TROMBOEMBOLISMO PARADOXAL pós-reversão: paciente recém anticoagulado por TEV/FA pode ter recidiva. Reintroduzir AC tan logo possível','EM PRÓTESE VALVAR MECÂNICA: tempo sem AC é minimizado — ponte com heparina + reintrodução varfarina cedo','CCP 4-FATOR > PCC 3-FATOR > PLASMA FRESCO em eficácia + rapidez. PCC tem fator VII, II, IX, X (4-fator); 3-fator não tem VII suficiente','SE NÃO TIVER CCP: plasma fresco 10-15 mL/kg (cuidado sobrecarga em idoso/IC)','DESMOPRESSINA não funciona em paciente em uso de antiplaquetário se a função plaquetária está zerada — transfundir plaquetas'],
  'ACCP 2018 / Hematology 2020',
  'https://www.hematology.org/education/clinicians/guidelines-and-quality-care',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. CHOQUE HIPOVOLÊMICO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'choque-hipovolemico',
  'Choque hipovolêmico — reanimação',
  'Choque',
  'Hipotensão + sinais hipoperfusão (taquicardia, oliguria, pele fria/marmórea, lactato↑, alteração consciência) + perda volumétrica',
  'PA / UTI',
  'Identificar e tratar causa do sangramento. Cristaloide inicial + transfusão precoce em hemorrágico (1:1:1). Cirurgia/embolização se cirúrgico.',
  $$[
    {"droga":"CRISTALOIDE — reanimação inicial","dose":"500-1000 mL bolus IV em 5-15 min, REAVALIAR (evitar reanimação cega)","via":"IV","obs":"PRIMEIRA medida. RINGER LACTATO ou PLASMA-LYTE preferíveis a SF 0,9% (acidose hiperclorêmica). Em hemorrágico: passar para hemoderivados precocemente"},
    {"droga":"CONCENTRADO DE HEMÁCIAS","dose":"1-2 unidades, manter Hb >7 (>8 em SCA/idoso)","obs":"em sangramento ativo: protocolo MASSIVO 1:1:1 (CH:plasma:plaquetas)"},
    {"droga":"PLASMA FRESCO CONGELADO (PFC)","dose":"10-15 mL/kg","obs":"em sangramento maciço: 1 unidade plasma para 1 unidade CH (1:1:1). Repõe fatores"},
    {"droga":"PLAQUETAS","dose":"1 aférese ou 6-10 unidades randômicas","obs":"em sangramento + plaquetas <50k OU hemorragia maciça (1 plaqueta para cada 1 CH no protocolo 1:1:1)"},
    {"droga":"Ácido tranexâmico (TRAUMA <3h)","dose":"1 g IV em 10 min + 1 g em 8h","via":"IV","obs":"CRASH-2: reduz mortalidade em trauma. INICIAR <3h. Após 3h pode aumentar mortalidade","drug_slug":"acido-tranexamico"},
    {"droga":"VASOPRESSOR (após reanimação volêmica adequada)","dose":"noradrenalina 0,05-0,5 mcg/kg/min IV BIC, titular para PAM ≥65","via":"IV BIC","obs":"NÃO substitui volume. Usar APÓS volume adequado se persistir hipotensão. Lembrar: vasopressor com hipovolemia = perfusão pior","drug_slug":"noradrenalina"},
    {"droga":"CONTROLE DA FONTE","obs":"INDISPENSÁVEL — cirurgia, endoscopia, embolização, drenagem. Reanimação sem controle da fonte = falha"},
    {"droga":"REVERSÃO ANTICOAGULANTE se em uso","obs":"vit K + CCP (varfarina); idarucizumabe (dabigatrana); andexanet/CCP (Xa); protamina (UFH)"},
    {"droga":"AQUECIMENTO + ELETRÓLITOS + Ca++","obs":"hipotermia + acidose + coagulopatia = TRÍADE LETAL. Aquecer fluidos, paciente. Repor Ca++ (citrato dos hemoderivados quela)"}
  ]$$::jsonb,
  ARRAY[
    'CLASSIFICAÇÃO ATLS: classe I (perda <15%) sem alteração; II (15-30%) taquicardia, ansiedade; III (30-40%) hipotensão; IV (>40%) letárgico/PAS <60',
    'PERMISSIVE HYPOTENSION em trauma penetrante: PAS alvo 80-90 (não normalizar) — reduz dispersão de coágulo, ressangramento, mortalidade (controverso em TCE)',
    'EM TCE COMPANHEIRO: PAS alvo ≥110 (perfusão cerebral)',
    'EVITAR REANIMAÇÃO COM SF 0,9% MACIÇA — acidose hiperclorêmica + LRA. Preferir Ringer ou Plasma-Lyte',
    'PROTOCOLO MASSIVO HEMORRAGIA: 1:1:1 (CH:plasma:plaquetas) — ativar precocemente em trauma grave / hemorragia >4 unidades em 1h',
    'LACTATO + DÉFICIT DE BASE são marcadores melhores de perfusão que PA — orientam reanimação',
    'CONTROLE DA FONTE é CRÍTICO — cirurgia/endoscopia/embolização sem demora'
  ],
  ARRAY['Hemograma seriado (Hb pode estar normal nas primeiras horas — hemoconcentração)','Coagulograma + plaquetas + fibrinogênio','TIPAGEM + reserva hemoderivados','Lactato (perfusão)','Gasometria + déficit de base','Função renal','TC abdome/pelve em trauma','Beta-HCG (gravidez ectópica)','ECG'],
  ARRAY['Todo paciente em choque → UTI'],
  ARRAY['DILUIÇÃO COAGULOPATIA: cristaloide >2L sem hemoderivados → coagulopatia. Início precoce de plasma/plaquetas','HIPOTERMIA AGRAVA COAGULOPATIA — aquecer fluidos, paciente','HIPOCALCEMIA por citrato dos hemoderivados — repor Ca++ profilaticamente','HIPERCALEMIA por CH (especialmente velho) — monitor K+ em transfusão maciça','EM IDOSO/CARDIOPATA: cuidado sobrecarga volume — ecocardiograma, CV à beira do leito orienta','ANTI-Rh em mulher Rh-: imunoglobulina anti-Rh em sangramento gestacional','SE PACIENTE NÃO RESPONDE A REANIMAÇÃO: reavaliar diagnóstico (sepse, cardiogênico, anafilaxia, obstrutivo) ou fonte oculta'],
  'ATLS 10ª ed / Surviving Sepsis 2021',
  'https://www.facs.org/quality-programs/trauma/atls',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. HIPOGLICEMIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hipoglicemia',
  'Hipoglicemia — manejo agudo',
  'Distúrbio glicêmico',
  'Glicemia <70 mg/dL com sintomas (tríade de Whipple: sintomas + glicemia baixa + alívio com glicose)',
  'Ambulatorial / PA',
  'Paciente CONSCIENTE: glicose VO 15g + reavaliar 15 min. INCONSCIENTE: glicose 50% IV ou glucagon IM. Investigar causa.',
  $$[
    {"droga":"PACIENTE CONSCIENTE — Glicose VO","dose":"15 g de carboidrato simples: 3 balas duras OU 1 colher sopa açúcar OU 200 mL suco/refrigerante","via":"VO","obs":"REGRA 15-15: 15g + reavaliar em 15 min. Repetir até glicemia >70. Após: refeição com carboidrato complexo + proteína"},
    {"droga":"PACIENTE INCONSCIENTE — Glicose 50% IV","dose":"50-100 mL IV em bolus (25-50 g)","via":"IV","obs":"INICIAR APÓS coleta para investigação se causa desconhecida (glicemia capilar + amostra para insulina/peptídeo C/cortisol/sulfonilureia se em paciente sem DM)"},
    {"droga":"PACIENTE SEM ACESSO IV — Glucagon","dose":"1 mg IM ou SC (0,5 mg em <25kg)","via":"IM ou SC","obs":"emergência domiciliar — orientar família. Eficaz em 10-15 min. NÃO funciona em hipoglicemia por etilismo (depleção glicogênio hepático)"},
    {"droga":"MANUTENÇÃO em hipoglicemia por SULFONILUREIA","dose":"SG 5% ou 10% IV BIC + monitor 24-72h","via":"IV BIC","obs":"sulfonilureia tem meia-vida longa — risco recorrência. INTERNAR. Octreotide pode ajudar"},
    {"droga":"TIAMINA (B1) ANTES DE GLICOSE em paciente alcoólatra/desnutrido","dose":"100 mg IM/IV","via":"IM/IV","obs":"PROFILAXIA WERNICKE — glicose isolada em deficiência B1 precipita encefalopatia"},
    {"droga":"Após estabilização — refeição carboidrato + proteína","obs":"reduz recidiva. Em DM em uso insulina/SU: avaliar ajuste de dose"}
  ]$$::jsonb,
  ARRAY[
    'TRÍADE DE WHIPPLE: sintomas + glicemia baixa + alívio com glicose. Confirma diagnóstico',
    'EM DM EM USO INSULINA/SU: hipoglicemia frequente — orientar SOS (15g carbo) + ajustar tratamento',
    'INVESTIGAR CAUSA EM PACIENTE NÃO-DIABÉTICO: insulinoma, suficiência adrenal, hipotireoidismo, sepse, hepatopatia, renal, etilismo, drogas (gibenclamida factícia)',
    'EM DM TIPO 1 COM HIPOGLICEMIAS GRAVES RECORRENTES: monitor contínuo glicose (CGM) + bomba infusão',
    'HIPOGLICEMIA NOTURNA: monitor glicemia 3h da manhã se sintomas ou HbA1c muito alta com hipoglicemias',
    'EDUCAÇÃO PACIENTE/FAMÍLIA: identificar sintomas precoces (tremor, sudorese, fome, taquicardia) ANTES de comprometimento neurológico'
  ],
  ARRAY['Glicemia capilar (CONFIRMAR)','Glicemia laboratorial (mais precisa)','Em causa desconhecida (não DM): insulina + peptídeo C + pró-insulina + sulfonilureia + cortisol + GH (durante hipoglicemia)','Função hepática + renal','TSH, ACTH','Beta-HCG'],
  ARRAY['NÃO ATRASAR TRATAMENTO em paciente sintomático com glicemia <70 — neuroglicopenia pode causar dano cerebral','GLICOSE 50% É IRRITANTE — preferir via central em uso prolongado. Em via periférica: solução 25% ou 10% após bolus','PACIENTE EM SULFONILUREIA: hipoglicemia PROLONGADA — internar mín 24h. NUNCA dar alta logo após correção','EM PACIENTE COM ALCOOLISMO/DESNUTRIÇÃO: SEMPRE TIAMINA ANTES de glicose (Wernicke)','HIPOGLICEMIA NÃO ASSINTOMÁTICA (hypoglycemia unawareness) em DM longo: adaptação do SNC — ajustar metas glicêmicas (alvo HbA1c menos rígido) para reduzir frequência','DIETA RESTRITIVA + USO de medicação hipoglicemiante: orientar não pular refeição','HIPOGLICEMIA REATIVA pós-prandial: dieta fracionada, baixa carga glicêmica — não medicar como DM'],
  'ADA 2024 / SBD',
  'https://diabetesjournals.org/care/issue/47/Supplement_1',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. INTOXICAÇÃO POR ORGANOFOSFORADO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'intoxicacao-organofosforado',
  'Intoxicação por organofosforado / carbamato',
  'Intoxicação',
  'Síndrome colinérgica: SLUDGE (salivação, lacrimejamento, diurese, defecação, GI, êmese) + miose + bradicardia + broncoespasmo após exposição',
  'PA / UTI',
  'ABC + descontaminação + atropina ATÉ ATROPINIZAÇÃO + pralidoxima. Doses muito altas de atropina podem ser necessárias.',
  $$[
    {"droga":"ABC + EPI (proteger profissionais)","obs":"INTOXICAÇÃO É CONTAMINANTE — luvas, avental, máscara. Descontaminar paciente (despir, lavar pele/cabelo abundantemente com água + sabão)"},
    {"droga":"ATROPINA (antídoto principal)","dose":"INICIAR 2-5 mg IV bolus, REPETIR EM ATÉ 5 MIN COM DOSES DOBRADAS até ATROPINIZAÇÃO (broncosecreção seca, FC >80, midríase, axila seca)","via":"IV","obs":"DOSES MUITO ALTAS necessárias — pode precisar gramas em 24h. Manutenção: 10-20% da dose inicial total/h em BIC","drug_slug":"atropina"},
    {"droga":"PRALIDOXIMA (reativador da acetilcolinesterase)","dose":"30 mg/kg IV bolus em 30 min + 8-10 mg/kg/h BIC (ou 1-2 g cada 6h)","via":"IV BIC","duracao":"24-48h após resolução sintomas + atropina suspensa","obs":"USAR PRECOCEMENTE (< 24-48h) — após esse tempo, o complexo OP-acetilcolinesterase 'envelhece' e não se reativa. Eficaz em ORGANOFOSFORADO; carbamato é REVERSÍVEL — pralidoxima geralmente desnecessária"},
    {"droga":"DIAZEPAM (convulsão / agitação)","dose":"5-10 mg IV, repetir conforme necessário","via":"IV","obs":"convulsão é comum em organofosforado","drug_slug":"diazepam"},
    {"droga":"SUPORTE VENTILATÓRIO","obs":"depressão respiratória + secreções abundantes + fraqueza muscular = via aérea + VM frequentes. EVITAR succinilcolina (potencializada — paralisia prolongada)","drug_slug":"succinilcolina"},
    {"droga":"DESCONTAMINAÇÃO GI","dose":"carvão ativado 1 g/kg VO/SNG se ingestão recente (<1h) + paciente com VA protegida","via":"VO/SNG","obs":"NÃO em rebaixamento sem IOT (broncoaspiração)"},
    {"droga":"NOTIFICAÇÃO","obs":"NOTIFICAR CIATox (0800 722 6001). Notificação compulsória SINAN (intoxicação exógena)"}
  ]$$::jsonb,
  ARRAY[
    'SÍNDROME COLINÉRGICA — Mnemônico SLUDGE: Salivação, Lacrimejamento, Urinação, Defecação, GI cramping, Êmese. + miose + bradicardia + sudorese + fraqueza',
    'EM INALAÇÃO/PELE: descontaminação imediata + EPI proteção',
    'EM INGESTÃO: carvão ativado se possível, NÃO induzir vômito',
    'AVALIAÇÃO RIGOROSA da DOSE de atropina — meta clínica é ATROPINIZAÇÃO (não mais miose, broncosecreção seca, FC >80) — não copiar doses padronizadas',
    'PRALIDOXIMA EM CARBAMATO É CONTROVERSA — geralmente desnecessária (reversível espontaneamente)',
    'OBSERVAÇÃO ≥24-48h após últimas doses — recidiva possível (depósito em gordura)',
    'EVENTOS TARDIOS: neuropatia periférica retardada (10-21 dias), sintomas neuropsiquiátricos prolongados',
    'TENTATIVA SUICÍDIO: avaliação psiquiátrica + acompanhamento'
  ],
  ARRAY['Acetilcolinesterase eritrocitária (RBC) — confirma diagnóstico, monitor recuperação','Pseudo-colinesterase plasmática (mais sensível mas inespecífica)','Hemograma','Eletrólitos','Função renal + hepática','ECG','Gasometria','Glicemia','Identificação do agente (frasco, garrafa)','Beta-HCG'],
  ARRAY['SUCCINILCOLINA EM PACIENTE COM ORGANOFOSFORADO = paralisia PROLONGADA (acetilcolinesterase inibida → não degrada succinilcolina). Usar rocurônio para intubação','PRALIDOXIMA SEM ATROPINA: pode causar piora paradoxal (reativa receptores nicotínicos sem proteger muscarínicos) — sempre associadas','SÍNDROME INTERMEDIÁRIA: 24-96h após intoxicação aguda — paralisia muscular proximal + insuficiência respiratória. Mortalidade 50% sem suporte','EM EXPOSIÇÃO PROFISSIONAL (agricultor): documentar para benefício previdenciário','TENTATIVAS HOSPITALARES de atropina por bolus a cada 5-10 min em meta clínica de "atropinização" é CRÍTICO — subdosagem = óbito','LIPOSSOLUBILIDADE: organofosforado se acumula em gordura → re-distribuição → intoxicação prolongada (especialmente paratiom, malatiom)'],
  'WHO 2020 / Manual Toxicologia Brasil',
  'https://www.who.int/publications/i/item/9789241547345',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 6. MALÁRIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, criterios_internacao, alertas,
  fonte, fonte_url, published
) VALUES (
  'malaria-tratamento',
  'Malária — tratamento por espécie',
  'Malária',
  'Febre + viagem em área endêmica + lâmina/teste rápido positivo (P. vivax, falciparum, ovale, malariae, knowlesi)',
  'Ambulatorial / Hospitalar (grave)',
  'P. falciparum sempre artemisinina. P. vivax: cloroquina + primaquina (eliminar hipnozoítos). Brasil: PNCM/MS distribui gratuito.',
  $$[
    {"droga":"P. FALCIPARUM não-grave (1ª escolha PNCM Brasil)","dose":"Artemether + lumefantrina (Coartem) 6 doses em 3 dias: D0/8h/24h/36h/48h/60h. Adulto: 4 cp por dose","via":"VO COM ALIMENTO GORDUROSO","duracao":"3 dias","obs":"PRIMEIRA ESCOLHA. Tomar com refeição/leite (absorção lumefantrina). Eficaz contra resistente"},
    {"droga":"P. FALCIPARUM grave","dose":"Artesunato IV 2,4 mg/kg em 0h, 12h, 24h, depois 1x/dia × 7 dias OU até VO. Após: artemether-lumefantrina × 3 dias","via":"IV","obs":"PRIMEIRA ESCOLHA grave (SEAQUAMAT, AQUAMAT trials). Disponível PNCM SUS"},
    {"droga":"P. VIVAX / P. OVALE (1ª escolha)","dose":"Cloroquina: 600 mg D1 + 450 mg 6h depois + 450 mg D2 + D3 (1500 mg total) + Primaquina 30 mg/dia × 7 dias (15 mg em <70 kg)","via":"VO","duracao":"cloroquina 3d + primaquina 7d","obs":"PRIMAQUINA elimina hipnozoítos (recidiva 30% sem). Verificar G6PD ANTES (hemólise em deficientes)","drug_slug":"cloroquina"},
    {"droga":"PRIMAQUINA","dose":"30 mg/dia × 7 dias OU 0,5 mg/kg/dia (P. vivax). 15 mg/dia × 14 dias se P. ovale","via":"VO","obs":"COM REFEIÇÃO. CONTRAINDICADA em deficiência G6PD grave + gestante + <6 meses. Alternativa em G6PD leve: 45 mg 1x/sem × 8 sem"},
    {"droga":"P. MALARIAE / P. KNOWLESI","dose":"Cloroquina 1500 mg em 3 dias (sem primaquina — não tem hipnozoítos)","via":"VO","drug_slug":"cloroquina"},
    {"droga":"GESTANTE com malária","obs":"P. falciparum 1º trim: quinino + clindamicina × 7d. 2-3º trim: artemisinina seguro. P. vivax: cloroquina + adiar primaquina pós-parto. SEMPRE INTERNAR"},
    {"droga":"PEDS","dose":"artemether-lumefantrina por peso (5-15 kg, 15-25, 25-35, ≥35 kg). Cloroquina 10 mg/kg/dia. Primaquina 0,5 mg/kg × 7d (vivax)","obs":"<6 meses: NÃO PRIMAQUINA"},
    {"droga":"Sintomáticos","dose":"paracetamol para febre. Hidratação. Não usar AAS (Reye em peds + sangramento)","drug_slug":"paracetamol"}
  ]$$::jsonb,
  ARRAY[
    'GOTA ESPESSA é padrão ouro — sensibilidade alta, identifica espécie + parasitemia',
    'TESTE RÁPIDO (LDH/HRP-2): útil em rastreio rápido, mas não substitui lâmina (especialmente espécie + parasitemia)',
    'NOTIFICAÇÃO COMPULSÓRIA — SINAN. Investigação',
    'DISTRIBUIÇÃO GRATUITA pelo PNCM/SUS — paciente não compra',
    'PRÉ-PRIMAQUINA: TESTAR G6PD (hemólise grave em deficientes). Se G6PD desconhecido + risco baixo deficiência: pode iniciar com vigilância',
    'GESTAÇÃO + MALÁRIA: emergência. Risco morte materna + feto. Internar + tratar imediatamente',
    'PROFILAXIA EM VIAJANTE: doxiciclina ou mefloquina ou atovaquona-proguanil — definir conforme área'
  ],
  ARRAY['Gota espessa + esfregaço (espécie + parasitemia)','Teste rápido (HRP-2/LDH)','Hemograma (anemia, plaquetopenia comum)','Função renal (LRA em falciparum grave)','Função hepática','Glicemia (hipoglicemia em grave)','Bilirrubina (hemólise)','LDH','Lactato (perfusão)','G6PD ANTES de primaquina','Beta-HCG'],
  ARRAY['MALÁRIA GRAVE: parasitemia >5%, alteração consciência, convulsão, IRA, hipoglicemia, hemoglobinúria, ARDS, hipotensão, hemorragia espontânea, acidose, hiperparasitemia, edema agudo pulmão','GESTANTE com malária','Crianças <5 anos','Imunossuprimido','Comorbidade descompensada'],
  ARRAY['MALÁRIA POR P. FALCIPARUM PODE EVOLUIR EM HORAS — não atrasar tratamento. Encaminhar HOSPITALAR se grave','PRIMAQUINA + DEFICIÊNCIA G6PD = HEMÓLISE INTRAVASCULAR GRAVE — pode ser fatal. Verificar antes ou monitor rigoroso','RECIDIVA P. VIVAX: 30-50% sem primaquina (hipnozoítos reativam) — completar primaquina','VIAJANTE COM FEBRE: PESQUISAR malária por 1 mês após retorno (P. vivax pode incubar até 1 ano)','GESTANTE + P. FALCIPARUM = ALTÍSSIMO RISCO — placentária, prematuridade, mortalidade. Tratar agressivamente','RESISTÊNCIA cloroquina em P. falciparum é universal — usar artemisinina sempre'],
  'PNCM Brasil 2023 / OMS 2023',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/m/malaria',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 7. ESQUISTOSSOMOSE MANSÔNICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'esquistossomose',
  'Esquistossomose mansônica — tratamento',
  'Esquistossomose',
  'Hospedeiro com S. mansoni (EPF positivo / sorologia / biópsia retal) — fase aguda ou crônica',
  'Ambulatorial',
  'Praziquantel é primeira escolha mundial. Brasil tem alta endemicidade no NE/MG/AL/PE.',
  $$[
    {"droga":"Praziquantel (1ª escolha)","dose":"50 mg/kg DOSE ÚNICA VO (peds 60 mg/kg)","via":"VO após refeição leve","frequencia":"dose única","duracao":"1 dia (repetir em 6 sem se persistente)","obs":"PRIMEIRA ESCOLHA. SUS distribui gratuitamente. Eficaz contra adulto. Em casos refratários: repetir","drug_slug":"praziquantel"},
    {"droga":"Oxamniquina (alternativa)","dose":"15 mg/kg dose única (adulto) / 20 mg/kg (peds <15 anos)","via":"VO","obs":"alternativa em refratário ao praziquantel. Cuidado em epilépticos (pode reduzir limiar)"},
    {"droga":"Corticoide em fase aguda (febre Katayama)","dose":"prednisona 1 mg/kg/dia × 5-7d","via":"VO","obs":"em fase aguda (4-8 sem pós-exposição) com sintomas sistêmicos. Reduz resposta imune às oviposições"},
    {"droga":"Tratamento de complicações (cirrose, hipertensão portal)","obs":"hipertensão portal pré-sinusoidal (pipestem fibrosis): seguir protocolo HDA varicosa, beta-bloqueador, ligadura. Cirurgia (esplenectomia + DAPE) em casos selecionados"},
    {"droga":"Tratamento de varizes esofágicas","obs":"PROFILAXIA SECUNDÁRIA: BB + ligadura elástica seriada. AGUDO: terlipressina + ligadura + ATB","drug_slug":"propranolol"}
  ]$$::jsonb,
  ARRAY[
    'EM ÁREA ENDÊMICA (Vale do Aço-MG, Pernambuco, Alagoas, Bahia, etc): tratamento em massa de comunidades é estratégia',
    'FONTE DE INFECÇÃO: contato com água doce contaminada (lagoas, rios) — caramujo Biomphalaria libera cercárias',
    'PROFILAXIA: saneamento + evitar contato com água doce em área endêmica',
    'PESQUISA EPF (3 amostras + Kato-Katz quantitativo) confirma diagnóstico',
    'SOROLOGIA é útil em viajante / em diagnóstico de fase aguda (antes da oviposição)',
    'CONTROLE DE CURA 4-12 sem após tratamento (EPF) — eficácia praziquantel ~80%',
    'COMPLICAÇÕES CRÔNICAS: forma hepatesplênica (fibrose pipestem), hipertensão portal, varizes esofágicas, cor pulmonale, glomerulopatia',
    'FORMA NEUROLÓGICA: medular (ovos no SNC) — paraplegia espástica. Emergência: praziquantel + corticoide alta dose'
  ],
  ARRAY['EPF (3 amostras + Kato-Katz quantitativo)','Sorologia (ELISA, hemaglutinação)','PCR em casos selecionados','Biópsia retal em pacientes com EPF negativo + alta suspeita','Hemograma (eosinofilia)','Função hepática','USG abdome (fibrose pipestem)','EDA em hipertensão portal','RM medular se forma neurológica'],
  ARRAY['FEBRE KATAYAMA: fase aguda com hipersensibilidade (febre, tosse, urticária, eosinofilia, hepatomegalia) — 4-8 sem pós-exposição. CORTICOIDE + praziquantel após acalmar (praziquantel agudo pode piorar)','FORMA HEPATESPLÊNICA: fibrose pipestem PRÉ-sinusoidal — diferente de cirrose alcoólica. Função hepática preservada apesar de hipertensão portal','MÃO-DE-OBRA NÃO-COMPENSADA em paciente com hepatesplênica: cirurgia eletiva pode descompensar. Avaliar caso a caso','CO-INFECÇÃO HIV reduz eficácia praziquantel — pode precisar dose maior/repetida','EM GESTANTE: tratar após 1º trim — risco materno (anemia) + feto (baixo peso)','TRATAMENTO EM MASSA: dose única é prática para campanhas de saúde pública'],
  'PCDT MS Esquistossomose 2018 / OMS 2022',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/e/esquistossomose',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 8. SÍNDROME NEUROLÉPTICA MALIGNA / HIPERTERMIA MALIGNA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'snm-hipertermia-maligna',
  'Síndrome neuroléptica maligna / Hipertermia maligna',
  'Emergências neuro-musculares',
  'SNM: febre + rigidez + alteração consciência + autonomia + CK elevado em uso de antipsicótico. HM: febre + rigidez + acidose + hipercalemia em uso de halogenado/succinilcolina',
  'PA / UTI',
  'Suspender agente. Suporte (resfriamento, hidratação, eletrólitos). Dantrolene em ambos. Bromocriptina em SNM.',
  $$[
    {"droga":"SUSPENDER agente causador","obs":"SNM: parar antipsicótico/metoclopramida. HM: parar halogenado + succinilcolina, hiperventilar com O2 100%"},
    {"droga":"DANTROLENE (PRIMEIRA ESCOLHA em ambos)","dose":"INICIAR 2,5 mg/kg IV bolus, repetir cada 5-10 min até 10 mg/kg total. Manutenção 1 mg/kg cada 6h × 24-48h","via":"IV","obs":"AMPOLA DIFÍCIL DISSOLVER (3 g em 60 mL água destilada — agitar muito). Em HM disponibilizar em bloco cirúrgico. PRIMEIRA ESCOLHA"},
    {"droga":"RESFRIAMENTO (febre >40°C)","obs":"compressas frias, lavagem gástrica/vesical com SF gelado, paciente despido em ambiente frio. Aspirina/dipirona TÊM POUCO efeito (febre é por contração muscular, não por reset hipotalâmico)"},
    {"droga":"HIDRATAÇÃO + RABDOMIÓLISE","dose":"SF 0,9% 1-2 L IV, manter diurese 200-300 mL/h, alcalinizar urina","obs":"forçar diurese previne IRA por mioglobinúria","drug_slug":"bicarbonato-sodio"},
    {"droga":"BROMOCRIPTINA (SNM — agonista dopaminérgico)","dose":"2,5 mg VO/SNG 8/8h, titular até 5-10 mg 8/8h","via":"VO/SNG","duracao":"continuar 10 dias após resolução, depois desmame","obs":"reverte bloqueio D2. Em SNM (não em HM)"},
    {"droga":"AMANTADINA (SNM — alternativa)","dose":"100 mg VO 12/12h","via":"VO","obs":"agonista dopaminérgico alternativo"},
    {"droga":"BENZODIAZEPÍNICO (agitação, sedação UTI)","dose":"midazolam 1-5 mg IV bolus + BIC ou lorazepam 1-2 mg IV","via":"IV","obs":"pode ajudar em rigidez muscular leve. NÃO substitui dantrolene","drug_slug":"midazolam"},
    {"droga":"VENTILAÇÃO MECÂNICA + UTI","obs":"em insuficiência respiratória, hipercapnia, alteração consciência grave"},
    {"droga":"REINTRODUÇÃO ANTIPSICÓTICO PÓS-RESOLUÇÃO (SNM)","obs":"esperar ≥2 sem após resolução completa. Trocar para classe diferente (ex: típico→atípico) com dose reduzida"}
  ]$$::jsonb,
  ARRAY[
    'TRÍADE SNM: febre + RIGIDEZ TUBO DE CHUMBO + alteração consciência + autonomia (taquicardia, sudorese, instabilidade PA). CK >1000. Mortalidade 10-20% sem tratamento',
    'TRÍADE HM: febre + RIGIDEZ + acidose + hipercalemia + hipercarbia em uso de anestésico halogenado (sevoflurano, halotano) ou succinilcolina. Mortalidade 5-10% com dantrolene',
    'SNM aparece em 24-72h após início/aumento antipsicótico. HM aparece minutos após indução anestésica',
    'COMUNICAR FAMÍLIA — HM tem componente genético (RyR1 — receptor rianodina) — orientar testagem familiar',
    'INTERNAR UTI — monitor cardio, eletrolítico, hidratação, oximetria',
    'EVITAR FUTURO USO de halogenados/succinilcolina em paciente com história HM — usar BNM não-despolarizantes + anestesia regional/IV'
  ],
  ARRAY['CK (>1000 em SNM, >5000-10000 em HM)','Mioglobinúria (urina escura)','Função renal (LRA por mioglobina)','Eletrólitos (K+ alto, Mg+ baixo, fosfato alterado)','Gasometria (acidose mista — metabólica + respiratória)','Hemograma','TGO/TGP','Coagulograma (CIVD)','ECG (hipercalemia)','TC crânio se diagnóstico diferencial'],
  ARRAY['SÍNDROME SEROTONINÉRGICA é DIFERENCIAL — clonus + hiperreflexia + agitação + tremor + diarreia. Tratamento: ciproheptadina','HIPERTERMIA NÃO-MALIGNA por antipsicótico atípico (geralmente clozapina/olanzapina): mais leve, reversível com suspensão, sem rigidez intensa','DANTROLENE PARA HM EM BLOCO CIRÚRGICO: TODA SALA DE ANESTESIA com halogenado deve ter dantrolene disponível (Brasil: estoque irregular)','RABDOMIÓLISE: hidratação maciça + alcalinização. K+ alto = risco arritmia/PCR — gluconato Ca + insulina + glicose','EM SNM: alguns autores usam ECT em casos refratários (controverso)','PROFILAXIA HM EM PACIENTE CONHECIDO: anestesia sem halogenado + sem succinilcolina + dantrolene profilático em alguns casos'],
  'AAN 2011 / MHAUS 2024',
  'https://www.mhaus.org/clinical-care/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
