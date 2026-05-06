-- PreceptorBook: Prescrições Bloco 6 (5 doenças)
-- PAC ambulatorial, verminose, intoxicação benzo/opioide, intoxicação paracetamol, hemorragia digestiva alta

-- 1. PAC AMBULATORIAL
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'pac-ambulatorial',
  'Pneumonia comunitária — manejo ambulatorial',
  'Pneumonia',
  'Adulto previamente hígido com PAC + CURB-65 ≤ 1 + sem hipoxemia + tolerância VO',
  'Ambulatorial',
  'Em PAC sem comorbidade: amoxicilina ou macrolídeo. Com comorbidade ou ATB recente: betalactâmico + macrolídeo OU quinolona respiratória.',
  $$[
    {"droga":"Amoxicilina (1ª escolha — sem comorbidade)","dose":"500 mg-1 g 8/8h","via":"VO","duracao":"5-7 dias","obs":"PRIMEIRA ESCOLHA em adulto jovem hígido. Cobre pneumococo. Em alta resistência: dose alta 1g 8/8h","drug_slug":"amoxicilina"},
    {"droga":"Azitromicina (alternativa em alergia/atípicos)","dose":"500 mg D1 → 250 mg D2-D5","via":"VO","duracao":"5 dias","obs":"alternativa. Em comorbidade: associar à amoxicilina","drug_slug":"azitromicina"},
    {"droga":"Amoxicilina + clavulanato (com comorbidade)","dose":"875+125 mg 12/12h","via":"VO","duracao":"7 dias","obs":"se DPOC, DM, IC, idoso, ATB recente. Cobre H. influenzae, M. catarrhalis","drug_slug":"amoxicilina-clavulanato"},
    {"droga":"Levofloxacino (alternativa monoterapia)","dose":"750 mg/dia","via":"VO","duracao":"5 dias","obs":"alergia beta-lactâmico ou em alto risco. Cuidado idoso (tendinopatia, QT)","drug_slug":"levofloxacino"},
    {"droga":"Sintomáticos","dose":"paracetamol 500-1000 mg 6/6h febre/dor","obs":"hidratação + repouso + acompanhamento","drug_slug":"paracetamol"}
  ]$$::jsonb,
  ARRAY[
    'CURB-65: Confusão, Uréia >50, FR ≥30, PA <90/60, idade ≥65 (1 ponto cada). 0-1 = ambulatorial; 2 = considerar internar; ≥3 = internar',
    'AVALIAR sinais de gravidade: SatO2 <92%, FR >24, taquicardia >125, hipotensão, alteração consciência, comorbidade descompensada — INTERNAR',
    'Reavaliar em 48-72h: se piora ou ausência de melhora → considerar internação + Rx tórax + investigar atípico/resistência',
    'Vacina pneumocócica + influenza após resolução',
    'Tosse pode persistir 4-6 sem pós-resolução — normal'
  ],
  ARRAY['Rx tórax (não é obrigatório em PAC ambulatorial sem sinais alarme — clínica + manejo empírico)','SatO2 (oximetria)','Hemograma + PCR em casos atípicos','Antígeno urinário pneumococo/Legionella se grave','Painel viral em sazonal'],
  ARRAY['SE EM 48-72h NÃO MELHORA: re-avaliar — descartar empiema, atípicos, resistência, complicações, diagnóstico alternativo (TEP, IC)','EM IDOSO/COMORBIDADE: limiar BAIXO para internar — apresentação atípica (sem febre, sem queixa respiratória clara, queda)','SARS-CoV-2 pode mimicar PAC — testar em sazonal','TUBERCULOSE em país endêmico: pesquisar BAAR se PAC arrastada/atípica'],
  'IDSA/ATS 2019 / SBPT 2018',
  'https://www.atsjournals.org/doi/10.1164/rccm.201908-1581ST',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. VERMINOSE INTESTINAL
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'verminose-intestinal',
  'Verminose intestinal — manejo',
  'Parasitose intestinal',
  'Suspeita clínica (prurido anal, eosinofilia, anemia ferropriva, dor abdominal, baixo peso) ou EPF positivo',
  'Ambulatorial',
  'Albendazol dose única cobre maioria. Estrongiloides preferir ivermectina. Tratamento empírico em área endêmica + toda família.',
  $$[
    {"droga":"Albendazol — esquema universal","dose":"400 mg DOSE ÚNICA (>2 anos)","via":"VO","frequencia":"dose única","duracao":"1 dia (repetir 14d em enterobíase)","obs":"PRIMEIRA ESCOLHA. Cobre ascaris, ancilóstomo, tricuris, enterobius","drug_slug":"albendazol"},
    {"droga":"Ivermectina (estrongiloides)","dose":"200 mcg/kg dose única (~12 mg adulto 60kg)","via":"VO em jejum","frequencia":"dose única, repetir em 2 sem se imunossuprimido","obs":"PRIMEIRA ESCOLHA em estrongiloidíase. Também trata escabiose, pediculose","drug_slug":"ivermectina"},
    {"droga":"Esquema família (área endêmica)","dose":"albendazol 400 mg em todos os familiares simultaneamente","obs":"reduz reinfeção. OMS recomenda em áreas de alta prevalência"},
    {"droga":"Metronidazol (giardíase, amebíase)","dose":"giardíase: 250-500 mg 8/8h × 5-7d. Amebíase intestinal: 500-750 mg 8/8h × 7-10d","via":"VO","obs":"em amebíase invasiva associar com paromomicina ou diloxanida (eliminação cisto)","drug_slug":"metronidazol"},
    {"droga":"Praziquantel (esquistossomose)","dose":"60 mg/kg dose única (peds) ou 50-60 mg/kg adulto","via":"VO","duracao":"dose única","obs":"PRIMEIRA ESCOLHA em S. mansoni (Brasil) e outras esquistossomoses + teníase. Eficaz em dose única"},
    {"droga":"Niclosamida (teníase — alternativa)","dose":"2 g VO dose única + laxante 2h após","obs":"alternativa ao praziquantel em teníase. Não absorvida (sem efeito sistêmico)"}
  ]$$::jsonb,
  ARRAY[
    'EM ÁREA ENDÊMICA: tratamento empírico anual de família/comunidade é estratégia de saúde pública (vermifugação em massa)',
    'EOSINOFILIA + sintomas TGI/anemia: investigar parasitose ANTES de outros diagnósticos',
    'CICLO MIGRATÓRIO: alguns helmintos (ascaris, ancilóstomo, estrongiloides) passam por pulmão — sintomas respiratórios + eosinofilia (síndrome de Löeffler)',
    'PESQUISA: 3 amostras de fezes (sensibilidade aumenta) — método de Kato-Katz para schistosoma; Baermann para estrongiloides',
    'PROFILAXIA: saneamento + lavar mãos + cozinhar carne + filtrar água + sapato em área endêmica',
    'IMUNOSSUPRIMIDO: rastrear estrongiloides ANTES de iniciar imunossupressor (corticoide alta dose, biológico) — risco hiperinfecção fatal'
  ],
  ARRAY['EPF (3 amostras)','Hemograma (eosinofilia, anemia)','Ferritina se anemia (ancilostomose causa ferropriva)','Pesquisa estrongiloides (Baermann) — em imunossuprimido sempre','Sorologia esquistossomose em área endêmica','Beta-HCG mulher idade fértil'],
  ARRAY['HIPERINFECÇÃO POR ESTRONGILOIDES: paciente imunossuprimido + helmintíase grave + sepse gram-negativo (translocação) — emergência. Ivermectina + albendazol + ATB amplo','EM GESTANTE: EVITAR albendazol/ivermectina no 1º trim. OMS recomenda após 2º trim em área endêmica','TENÍASE com sintomas neurológicos (cefaleia, convulsão): investigar NEUROCISTICERCOSE (TC/RM) ANTES de praziquantel — risco piora inflamatória','PEDS: dose pediátrica e tratamento simultâneo de toda família','METRONIDAZOL: evitar álcool durante e 48h após (efeito antabuse)'],
  'OMS 2023 / MS Brasil 2020',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/p/parasitoses',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. INTOXICAÇÃO POR BENZODIAZEPÍNICO/OPIOIDE
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'intoxicacao-benzo-opioide',
  'Intoxicação aguda por opioide e/ou benzodiazepínico',
  'Intoxicação',
  'Depressão SNC + depressão respiratória + miose (opioide) ou flacidez/sonolência sem miose (BZD)',
  'PA / UTI',
  'Suporte ventilatório + naloxona em opioide. Flumazenil restrito (risco convulsão). Identificação clínica orienta antídoto.',
  $$[
    {"droga":"ABC + suporte ventilatório (1ª medida)","obs":"VIA AÉREA + ventilação assistida (BVM ou IOT) + acesso IV. NÃO atrasar pelo antídoto. Suporte é a base"},
    {"droga":"Naloxona (overdose opioide)","dose":"INICIAR 0,04-0,4 mg IV (titular FR), repetir cada 2-3 min até FR ≥12. Em parada respiratória: 2 mg IV/IM/IN bolus","via":"IV (preferida), IM, IN","frequencia":"repetir até resposta","obs":"meia-vida curta (30-90 min) — opioide longa duração re-narcosa. Manter observação ≥4h, considerar BIC","drug_slug":"naloxona"},
    {"droga":"Naloxona BIC (overdose grave / longa duração)","dose":"2/3 da dose efetiva inicial × 1h em BIC, ajustar","via":"IV BIC","obs":"em metadona, oxicodona LP, fentanil patch — re-narcose esperada","drug_slug":"naloxona"},
    {"droga":"Flumazenil (USO RESTRITO — overdose BZD)","dose":"0,2 mg IV em 30 seg, repetir até resposta (max 3 mg)","via":"IV","obs":"USO LIMITADO. Risco convulsão se: uso crônico BZD (abstinência), co-ingestão pró-convulsivante (TCA, cocaína, bupropiona). Geralmente PREFERIR suporte clínico","drug_slug":"flumazenil"},
    {"droga":"Carvão ativado","dose":"50 g VO/SNG (1 g/kg peds)","via":"VO/SNG","obs":"em ingestão recente <1-2h, paciente com VA protegida. NÃO em rebaixamento sem IOT (broncoaspiração)"},
    {"droga":"Suporte ventilatório (IOT + VM)","obs":"se SatO2 <90% após O2 OU FR <8 OU coma com risco aspiração — não esperar piora"},
    {"droga":"Tratamento abstinência pós-reversão (em dependente)","obs":"clonidina 0,1-0,2 mg 6/6h + sintomáticos. Encaminhar para tratamento dependência"}
  ]$$::jsonb,
  ARRAY[
    'TRÍADE OPIOIDE: depressão SNC + depressão respiratória + MIOSE (pupila puntiforme). Em metadona/tramadol: miose menos óbvia',
    'TRÍADE BZD: depressão SNC + flacidez + reflexo pupilar PRESERVADO (sem miose) + FR pouco afetada (vs opioide)',
    'CO-INGESTÃO frequente — paciente com BZD + opioide é caso típico (pacto suicida, overdose recreativa)',
    'NÃO ATRASAR INTUBAÇÃO em paciente sem proteção VA — antídoto é coadjuvante, não substitui suporte',
    'HISTÓRIA: tempo, substância, quantidade, co-ingestão (álcool, drogas, paracetamol). Família/familiares se paciente inconsciente',
    'NOTIFICAR CIATox (Centro de Informação Toxicológica) — 0800 722 6001'
  ],
  ARRAY['Glicemia capilar IMEDIATA (excluir hipoglicemia)','Gasometria (acidose por hipoventilação)','Painel toxicológico (qualitativo: opioide, BZD, anfetamina, cocaína, TCA)','Paracetamol/salicilato (rastreio em todo intoxicado)','ECG (TCA, antipsicótico)','TC crânio se foco neurológico','Função renal + hepática','Beta-HCG'],
  ARRAY['NALOXONA não reverte BZD/álcool/barbitúrico — não esperar resposta nestes','FLUMAZENIL EM USO CRÔNICO BZD = CONVULSÕES — risco maior que benefício','PARACETAMOL EM CO-INGESTÃO: silencioso → fazer dosagem 4h pós + tratar com NAC se nomograma indica','Alta hospitalar SEM avaliação psiquiátrica e contato com rede de apoio em tentativa de suicídio = NEGLIGÊNCIA','REINTERNAR se re-narcose ocorrer (opioide longa duração) — pode ocorrer 2-12h pós-naloxona','Em DEPENDENTE de opioide: NÃO precipitar abstinência total — titular naloxona pela FR'],
  'NIDA / Toxicologia ABRASCO',
  'https://www.gov.br/anvisa/pt-br/centraisdeconteudo/publicacoes/medicamentos/farmacovigilancia',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. INTOXICAÇÃO POR PARACETAMOL
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'intoxicacao-paracetamol',
  'Intoxicação por paracetamol',
  'Intoxicação',
  'Ingestão >7,5 g em adulto (>150 mg/kg) OU dose terapêutica em hepatopata/etilista/desnutrido',
  'PA / UTI',
  'NAC é antídoto eficaz. Decisão pelo nomograma de Rumack-Matthew (nível 4h pós-ingestão). Tratar mesmo em hepatite estabelecida.',
  $$[
    {"droga":"Carvão ativado (ingestão recente)","dose":"50 g VO/SNG (1 g/kg peds)","via":"VO ou SNG","duracao":"<1-2h da ingestão","obs":"paciente consciente ou VA protegida. Reduz absorção"},
    {"droga":"N-acetilcisteína IV (ANTÍDOTO — protocolo 21h)","dose":"150 mg/kg em 200 mL SG 5% em 60 min ATAQUE + 50 mg/kg em 500 mL em 4h + 100 mg/kg em 1L em 16h (total 300 mg/kg em 21h)","via":"IV","duracao":"21h","obs":"PRIMEIRA ESCOLHA. INICIAR <8h da ingestão (eficácia máxima ~100%); >24h ainda beneficia se hepatite instalada","drug_slug":"n-acetilcisteina"},
    {"droga":"NAC VO (alternativa)","dose":"140 mg/kg ATAQUE + 70 mg/kg cada 4h × 17 doses (total 72h)","via":"VO","duracao":"72h","obs":"alternativa se IV indisponível. Paladar ruim (odor sulfuroso) — vômito frequente","drug_slug":"n-acetilcisteina"},
    {"droga":"NAC manutenção em hepatite estabelecida","dose":"continuar protocolo até INR <2 + clínica melhorando","obs":"em hepatite grave: pode prolongar dias-semanas"},
    {"droga":"Manejo anafilactoide à NAC IV","obs":"reação em 10% (flushing, broncoespasmo, hipotensão) → reduzir velocidade, anti-histamínico, retomar"},
    {"droga":"Suporte hepatoprotetor","obs":"hidratação, correção K/Mg/PO4, vit K se INR alto, considerar transplante se King's College criteria preenchidos"},
    {"droga":"Transplante hepático (último recurso)","obs":"King's College criteria: pH <7,3 OR (INR >6,5 + Cr >3,4 + encefalopatia ≥III). Transferir CENTRO TRANSPLANTE se evolução desfavorável"}
  ]$$::jsonb,
  ARRAY[
    'NOMOGRAMA DE RUMACK-MATTHEW: dosar paracetamol sérico ≥4h pós-ingestão. Nível >150 mcg/mL às 4h ou linha de tratamento → tratar com NAC',
    'INDICAÇÕES NAC: 1) nível tóxico no nomograma, 2) ingestão massiva (>10g) com nível pendente, 3) hepatite instalada (AST↑) mesmo sem nível, 4) paciente desconhecido',
    'EM INGESTÃO TARDIA (>8h): NÃO ATRASAR — iniciar NAC empírico enquanto aguarda nível',
    'PARACETAMOL ESTÁ EM TUDO — Tylex (com codeína), Resfenol, sintomáticos de gripe — paciente pode ingerir sem saber',
    'EM HEPATOPATA/ETILISTA/DESNUTRIDO: dose terapêutica pode ser tóxica (depleção de glutationa)',
    'TENTATIVA SUICÍDIO: avaliação psiquiátrica obrigatória antes da alta'
  ],
  ARRAY['Paracetamol sérico 4h pós-ingestão (não antes — falso resultado)','TGO/TGP, INR, bilirrubina basal + 12/12h × 72h','Função renal','Glicemia (hipoglicemia em hepatite fulminante)','Lactato, pH','Co-ingestos: salicilato, BZD, opioide, álcool','Beta-HCG','EAS'],
  ARRAY['INGESTÃO ESCALONADA (>1 dose ao longo do dia): nomograma é menos confiável — tratar empiricamente se >150 mg/kg total','TGO ELEVADA = HEPATITE INSTALADA — manter NAC mesmo com nível paracetamol negativo. Agora é tratamento de hepatite','EM GESTANTE: paracetamol é o analgésico de escolha — overdose tem alta mortalidade fetal. Tratar agressivamente','EM PEDS: ingestão acidental é mais comum — calcular mg/kg. <150 mg/kg dose única raramente causa toxicidade','HEPATITE FULMINANTE: encaminhar centro de transplante ANTES de evolução para coma III-IV','NÃO EXISTE OUTRO ANTÍDOTO — NAC é único'],
  'AASLD 2014 / Manual Toxicologia ABRASCO',
  'https://www.aasld.org/practice-guidelines',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. HEMORRAGIA DIGESTIVA ALTA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hemorragia-digestiva-alta',
  'Hemorragia digestiva alta — manejo agudo',
  'Hemorragia digestiva',
  'Hematêmese / melena / sangue NG + instabilidade ou queda Hb',
  'PA / UTI / Endoscopia',
  'Estabilizar primeiro, depois investigar. EDA precoce <24h. Origem: úlcera (1ª causa) vs varicosa (cirrótico).',
  $$[
    {"droga":"Reanimação volêmica + transfusão","obs":"2 acessos calibrosos. Cristaloide 1-2L. CONCENTRADO HEMÁCIAS se Hb <7 (estratégia restritiva — AASLD; em SCA/idoso instável: <8). Manter PVC, PA, lactato"},
    {"droga":"Pantoprazol IV — ATAQUE","dose":"80 mg IV bolus + 8 mg/h BIC × 72h","via":"IV BIC","duracao":"72h pós-EDA","obs":"em úlcera com sangramento ativo (Forrest IIa-IIb). Após hemostasia endoscópica continua. EM TODOS suspeita de úlcera","drug_slug":"pantoprazol"},
    {"droga":"Octreotide / terlipressina (varicosa - cirrótico)","dose":"octreotide 50 mcg IV bolus + 50 mcg/h BIC × 3-5d. Terlipressina 2 mg IV 4/4h × 24-48h, então 1 mg 4/4h × 5d","via":"IV","obs":"em SUSPEITA DE HEMORRAGIA VARICOSA (cirrose, estigmas hepáticos). Reduz pressão portal"},
    {"droga":"Ácido tranexâmico (HDA — POTENCIAL PIORA)","dose":"NÃO ROTINEIRO em HDA","obs":"HALT-IT trial: TXA NÃO reduziu mortalidade + AUMENTOU TVP/TEP em HDA. NÃO usar","drug_slug":"acido-tranexamico"},
    {"droga":"Endoscopia digestiva alta (EDA)","dose":"em <24h da admissão (urgente <12h se instável)","obs":"DIAGNÓSTICA + TERAPÊUTICA. Hemoclipe, escleroterapia, ligadura elástica em varizes. Determina classificação Forrest"},
    {"droga":"Erradicação H. pylori (após estabilização)","dose":"esquema tripla 14 dias","obs":"em úlcera péptica + H. pylori positivo. Reduz recorrência"},
    {"droga":"ATB profilático (varicosa em cirrótico)","dose":"ceftriaxona 1 g IV/dia × 7d","duracao":"7 dias","obs":"em cirrótico com HDA: previne PBE + reduz mortalidade. INICIAR à admissão (antes EDA)","drug_slug":"ceftriaxona"},
    {"droga":"Lactulose (cirrótico — encefalopatia)","dose":"30-45 mL VO 6/6h, alvo 2-3 evacuações/dia","obs":"prevenir/tratar encefalopatia desencadeada por sangue intestinal","drug_slug":"lactulose"},
    {"droga":"Beta-bloqueador profilaxia secundária varizes","dose":"propranolol 20-40 mg 12/12h, titular pela FC (alvo <55) ou carvedilol 6,25 mg 12/12h","obs":"INICIAR após resolução do sangramento. Reduz recorrência junto com ligadura elástica","drug_slug":"propranolol"}
  ]$$::jsonb,
  ARRAY[
    'PRIMEIRO ESTABILIZAR, DEPOIS INVESTIGAR — ABCDE',
    'GLASGOW-BLATCHFORD ≤1: pode ser ambulatorial (alta sem EDA urgente). Usar para triagem',
    'ROCKALL pré + pós-endoscopia: predição de mortalidade',
    'NÃO USAR PVC sozinha como alvo — usar lactato + débito urinário + perfusão',
    'EM CIRRÓTICO: terlipressina + ATB + lactulose + EDA com ligadura — pacote especial',
    'ENVOLVER GASTRO/ENDOSCOPIA + UTI cedo'
  ],
  ARRAY['Hemograma seriado (Hb pode estar normal nas primeiras horas — hemoconcentração)','Coagulograma + plaquetas','Função renal + eletrólitos (uréia ALTA / Cr normal sugere HDA)','Função hepática','TIPAGEM + reserva de hemoderivados','ECG','Lactato (perfusão)','EDA <24h'],
  ARRAY['SEM SNG ROTINEIRA — não diagnostica/exclui HDA com confiabilidade. Pode atrasar EDA','RESTRINGIR transfusão (Hb alvo 7) — TRANSFUSION TRIGGER trial: estratégia liberal aumentou ressangramento e mortalidade em cirrose','EM PACIENTE COM ANTICOAGULANTE: discutir reverter (varfarina: vit K + CCP; DOAC: idarucizumabe/andexanet) — risco-benefício','EM GASTRITE/ÚLCERA POR AINE: SUSPENDER AINE imediatamente, IBP por 8 sem','SE EDA NÃO CONSEGUE HEMOSTASIA: cirurgia ou angiografia com embolização','PIORA APÓS HEMOSTASIA: EDA repetir + considerar embolização/cirurgia'],
  'ACG 2021 / Baveno VII (varicosa)',
  'https://journals.lww.com/ajg/Fulltext/2021/05000/ACG_Clinical_Guideline__Upper_Gastrointestinal.10.aspx',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
