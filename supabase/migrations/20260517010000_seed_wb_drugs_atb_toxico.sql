-- PreceptorBook: Bloco 6 — ATB adicional (5) + Antiparasitário (2) + Antifúngico (1) + Toxicologia/emergência (4) = 12 drogas
-- Total após esta migration: 133 drogas

-- 122. AMPICILINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'ampicilina',
  'Ampicilina',
  ARRAY['Ampicilina','Binotal'],
  'Penicilina semissintética — ampliado',
  ARRAY['VO','IV','IM'],
  $$[{"forma":"frasco-ampola","concentracao":"500/1000 mg"},{"forma":"comprimido","concentracao":"500 mg"},{"forma":"suspensão","concentracao":"50 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"meningite bacteriana (Listeria, S. agalactiae)","dose":"2 g IV 4/4h","via":"IV","duracao":"14-21 dias","obs":"associar a ceftriaxona em adulto idoso/imunossuprimido. Cobertura Listeria"},{"para":"endocardite enterocócica","dose":"2 g IV 4/4h + gentamicina","duracao":"4-6 semanas","obs":"associar gentamicina ou ceftriaxona (sinergia)"},{"para":"profilaxia GBS intraparto","dose":"2 g IV ATAQUE + 1 g IV 4/4h até parto","via":"IV","obs":"em gestante com cultura GBS+ ou fator de risco. Iniciar ≥4h antes do parto"},{"para":"ITU","dose":"500 mg VO 6/6h","via":"VO","obs":"cobertura limitada por resistência E. coli"}]}$$::jsonb,
  $${"indicacoes":[{"para":"meningite peds","dose":"50 mg/kg IV 6/6h"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"10-50","ajuste":"6-12/12h"},{"clcr":"<10","ajuste":"12-24h"}]$$::jsonb,
  'B','Categoria B. Segura.','Compatível.',
  ARRAY['hipersensibilidade a penicilinas/cefalosporinas','mononucleose (rash macular em ~90%)'],
  $$[{"freq":"comum","evento":"diarreia, náusea"},{"freq":"comum","evento":"rash maculopapular (especialmente em mononucleose/CMV ativa)"},{"freq":"incomum","evento":"colite por C. difficile"},{"freq":"raro","evento":"anafilaxia, SJS"}]$$::jsonb,
  ARRAY['EM MONONUCLEOSE/CMV ativa: 90% dos pacientes desenvolvem rash com ampicilina — não é alergia verdadeira (não contraindica futuro uso)','Cobertura: Listeria, Enterococcus, GBS, alguns gram-negativos. NÃO COBRE S. aureus produtor beta-lactamase','Em meningite >50 anos: associar ampicilina + ceftriaxona (cobre Listeria além de pneumococo/meningococo)'],
  ARRAY['Função renal','Sinais de rash','Diarreia (C. difficile)'],
  'Aminopenicilina — beta-lactâmico que se liga a PBPs (penicillin-binding proteins) das bactérias → inibe transpeptidase → bloqueia síntese de peptidoglicano → autólise. Espectro ampliado vs penicilina G: cobre alguns gram- (E. coli, Proteus, H. influenzae não-beta-lactamase, Listeria, Salmonella). Inativada por beta-lactamase (associar inibidor — sulbactam, ácido clavulânico).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ampicilina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 123. OXACILINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'oxacilina',
  'Oxacilina',
  ARRAY['Oxacilina'],
  'Penicilina anti-estafilocócica',
  ARRAY['IV','IM'],
  $$[{"forma":"frasco-ampola","concentracao":"500 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"infecção S. aureus MSSA (não-MRSA)","dose":"2 g IV 4/4h","via":"IV","obs":"PRIMEIRA ESCOLHA em S. aureus oxa-sensível. Endocardite, osteomielite, bacteremia, infecção pele/partes moles graves"},{"para":"endocardite S. aureus MSSA","dose":"2 g IV 4/4h × 4-6 semanas","obs":"em valva nativa. Em prótese: associar gentamicina + rifampicina"},{"para":"osteomielite/artrite séptica MSSA","dose":"2 g IV 4/4h","duracao":"4-6 sem (pode estender em prótese)"}]}$$::jsonb,
  $${"indicacoes":[{"para":"infecção MSSA peds","dose":"50 mg/kg IV 6/6h, max 12 g/dia"}]}$$::jsonb,
  $$[{"clcr":"todos","ajuste":"sem ajuste primário"}]$$::jsonb,
  'B','Sem dados de teratogenia significativa.','Compatível.',
  ARRAY['hipersensibilidade a penicilinas','MRSA (resistente)'],
  $$[{"freq":"comum","evento":"flebite (uso IV prolongado)"},{"freq":"incomum","evento":"hepatite induzida (TGO/TGP)"},{"freq":"incomum","evento":"nefrite intersticial"},{"freq":"raro","evento":"neutropenia (uso >2 sem)"}]$$::jsonb,
  ARRAY['SE MRSA: trocar para vancomicina, daptomicina ou linezolida — oxacilina NÃO cobre MRSA','HEPATITE INDUZIDA é mais comum com oxacilina que outras penicilinas — monitor TGO/TGP semanal','EM ENDOCARDITE MSSA: oxacilina é PREFERÍVEL a vancomicina (mortalidade menor, mais rápida esterilização)','NÃO existe formulação VO no Brasil (cefalexina é alternativa em pele/partes moles ambulatorial)'],
  ARRAY['Função renal','TGO/TGP semanal','Hemograma (neutropenia uso prolongado)'],
  'Penicilina semissintética modificada com cadeia lateral isoxazolil — RESISTENTE à beta-lactamase estafilocócica. Mesmo mecanismo das penicilinas (inibe transpeptidase, síntese peptidoglicano). Espectro estreito: principalmente S. aureus MSSA e estreptococos. NÃO cobre MRSA (mecA → PBP2a) nem gram-negativos.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=oxacilina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 124. GENTAMICINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'gentamicina',
  'Gentamicina',
  ARRAY['Gentamicina','Garamicina'],
  'Aminoglicosídeo',
  ARRAY['IV','IM','tópico'],
  $$[{"forma":"ampola","concentracao":"40 mg/mL (1/2 mL)"},{"forma":"colírio/pomada oftálmica","concentracao":"3 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"sepse gram-negativo / pielonefrite grave","dose":"5-7 mg/kg IV 1x/dia (dose única estendida)","via":"IV","duracao":"3-5 dias (curto, depois deescalar conforme cultura)","obs":"PREFERIR dose única diária — menor nefro/ototoxicidade (efeito pós-antibiótico)"},{"para":"endocardite enterocócica/estreptocócica (sinergia)","dose":"3 mg/kg/dia divididos 8/8h","via":"IV","duracao":"2-6 sem (depende patógeno/foco)","obs":"sinergia com beta-lactâmico/glicopeptídeo. Dose menor que regime único"},{"para":"profilaxia cirurgia colorrectal/abdominal","dose":"1,5 mg/kg IV pré-incisão","via":"IV","obs":"associada a metronidazol"}]}$$::jsonb,
  $${"indicacoes":[{"para":"sepse neonatal","dose":"4-5 mg/kg/dose IV cada 24-36h conforme idade gestacional"}]}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste (dose única)"},{"clcr":"40-60","ajuste":"intervalo 36h"},{"clcr":"20-40","ajuste":"intervalo 48h"},{"clcr":"<20","ajuste":"dose ajustada por nível sérico (alvo pico 5-10, vale <2)"}]$$::jsonb,
  'D','Categoria D — ototoxicidade fetal documentada (8º par craniano). Evitar; usar se vital. Estreptomicina pior.','Compatível em curto prazo (baixa absorção GI infantil).',
  ARRAY['hipersensibilidade','miastenia gravis (bloqueio neuromuscular)','ototoxicidade prévia','disfunção vestibular'],
  $$[{"freq":"comum","evento":"NEFROTOXICIDADE (NTA, dose-dependente, geralmente reversível)"},{"freq":"comum","evento":"OTOTOXICIDADE coclear (perda auditiva, irreversível) e vestibular (vertigem)"},{"freq":"incomum","evento":"bloqueio neuromuscular (em miastenia / pós-cirurgia)"},{"freq":"raro","evento":"reação alérgica"}]$$::jsonb,
  ARRAY['NEFROTOXICIDADE: ~10-25% — dose-cumulativa-dependente. Monitor Cr/eGFR. Hidratar adequadamente, evitar associação com outros nefrotóxicos (vanco, AINE, contraste)','OTOTOXICIDADE IRREVERSÍVEL — perda auditiva alta-frequência primeiro. AUDIOMETRIA basal + semanal se uso >5d. Sintomas: zumbido, vertigem','DOSE ÚNICA DIÁRIA é PADRÃO atual — eficácia igual a 8/8h, MENOR toxicidade (efeito pós-antibiótico + saturação reservatórios)','NÍVEIS SÉRICOS em uso prolongado/IRA: PICO (60 min após dose, alvo 5-10 em sinergia, >10 em monoterapia infecção grave) e VALE (antes próxima dose, alvo <2 — toxicidade se >2)','EM IDOSO: maior risco. Usar dose mais conservadora','MONOTERAPIA SÓ em ITU não-grave — em outras infecções, sempre combinada'],
  ARRAY['Cr / eGFR a cada 2-3 dias','Audiometria basal + semanal em uso >5-7d','Equilíbrio (vestibular)','Nível pico/vale em uso prolongado ou IRA','Sinais bloqueio neuromuscular se cirurgia recente'],
  'Aminoglicosídeo — liga IRREVERSIVELMENTE à subunidade 30S do ribossomo bacteriano → causa erros de leitura do mRNA → proteínas defeituosas + bloqueia iniciação. Bactericida concentração-dependente. Ativo principalmente contra GRAM-NEGATIVOS aeróbios (E. coli, Klebsiella, Pseudomonas) e em sinergia com beta-lactâmico contra gram+ (Enterococcus, Staphylococcus). Não atravessa BHE (sem ação meningite). Eliminação 100% renal.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=gentamicina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 125. AMICACINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'amicacina',
  'Amicacina',
  ARRAY['Amicacina','Novamin'],
  'Aminoglicosídeo (semissintético — resistente a enzimas inativadoras)',
  ARRAY['IV','IM'],
  $$[{"forma":"ampola","concentracao":"100/250/500 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"sepse gram-negativo MDR","dose":"15-20 mg/kg IV 1x/dia","via":"IV","obs":"PREFERIR amicacina sobre gentamicina em hospital com alta resistência a gentamicina (Brasil: comum)"},{"para":"TB MDR","dose":"15 mg/kg IV/IM","via":"IM ou IV","obs":"em esquema MDR-TB com bedaquilina + linezolida + outros"},{"para":"sepse neonatal grave","dose":"15 mg/kg/dia (ajustar IG)"}]}$$::jsonb,
  $$[{"clcr":">60","ajuste":"sem ajuste"},{"clcr":"40-60","ajuste":"36h"},{"clcr":"20-40","ajuste":"48h"},{"clcr":"<20","ajuste":"por nível sérico"}]$$::jsonb,
  'D','Categoria D. Mesma classe gentamicina.','Compatível em curto prazo.',
  ARRAY['hipersensibilidade aminoglicosídeos','miastenia gravis'],
  $$[{"freq":"comum","evento":"nefrotoxicidade"},{"freq":"comum","evento":"ototoxicidade (mais coclear que gentamicina)"},{"freq":"raro","evento":"bloqueio neuromuscular"}]$$::jsonb,
  ARRAY['EM HOSPITAIS BRASILEIROS com alta resistência E. coli/Klebsiella a gentamicina: AMICACINA é melhor opção empírica','AMICACINA é mais resistente às enzimas inativadoras → melhor opção para enterobactérias produtoras de ESBL/AmpC','Mesmas precauções que gentamicina: nefro + oto-toxicidade, dose única diária preferida','Se uso >7-10 dias: considerar TROCAR ou desescalar — toxicidade cumulativa'],
  ARRAY['Cr basal + cada 2-3d','Audiometria basal + semanal','Nível pico/vale (alvo pico 25-40, vale <8)'],
  'Aminoglicosídeo derivado da kanamicina por adição de cadeia lateral hidroxiaminobutirílica (HABA) → resiste a 9 das 12 enzimas inativadoras de aminoglicosídeos → maior eficácia em cepas resistentes a gentamicina/tobramicina. Mesmo mecanismo (inibe ribossomo 30S). Espectro mais amplo em gram-negativos resistentes.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=amicacina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 126. LEVOFLOXACINO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'levofloxacino',
  'Levofloxacino',
  ARRAY['Levaquin','Tavanic'],
  'Fluoroquinolona respiratória',
  ARRAY['VO','IV'],
  $$[{"forma":"comprimido","concentracao":"500/750 mg"},{"forma":"frasco-ampola","concentracao":"500/750 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"PAC (alternativa beta-lactâmico)","dose":"750 mg/dia × 5d","via":"VO ou IV","obs":"monoterapia em alergia beta-lactâmico OU em alto risco Pseudomonas"},{"para":"pielonefrite/ITU complicada","dose":"750 mg/dia × 5-7d","via":"VO ou IV"},{"para":"prostatite bacteriana","dose":"500 mg/dia × 4-6 semanas","obs":"boa penetração prostática"},{"para":"TB MDR/XDR (4ª linha)","dose":"500-1000 mg/dia"}]}$$::jsonb,
  $$[{"clcr":">50","ajuste":"sem ajuste"},{"clcr":"20-50","ajuste":"500 mg D1 → 250 mg/dia"},{"clcr":"<20","ajuste":"500 mg D1 → 250 mg cada 48h"}]$$::jsonb,
  'C','Categoria C. Tendinopatia + cartilagem fetal em estudos animais. EVITAR. Em TB MDR pode ser necessária.','Sem dados — evitar.',
  ARRAY['hipersensibilidade','prolongamento QT','tendinopatia prévia por quinolona','miastenia gravis','<18 anos (relativa)'],
  $$[{"freq":"comum","evento":"náusea, diarreia"},{"freq":"comum","evento":"cefaleia, tonteira"},{"freq":"comum","evento":"insônia"},{"freq":"incomum","evento":"PROLONGAMENTO QT, torsades"},{"freq":"incomum","evento":"TENDINOPATIA / RUPTURA TENDÃO DE AQUILES (mais em idoso, corticoide)"},{"freq":"raro","evento":"NEUROPATIA PERIFÉRICA — pode ser irreversível"},{"freq":"raro","evento":"hipoglicemia/hiperglicemia"},{"freq":"raro","evento":"aneurisma/dissecção aorta (uso prolongado)"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: TENDINOPATIA + RUPTURA tendão Aquiles, NEUROPATIA PERIFÉRICA, ALTERAÇÃO HUMOR/SUICÍDIO, hipoglicemia. Risco aumentado em >60a, corticoide, transplante, IRC','Quinolonas devem ser USADAS COM CAUTELA — benefício > risco apenas em infecções específicas. NÃO usar em ITU não-complicada (alternativas existem)','RESISTÊNCIA crescente em E. coli no Brasil — sucesso empírico questionável em ITU','Suspender se sintomas tendão (dor súbita) → repouso, evitar exercício','PROLONGAMENTO QT: cuidado em paciente com hipocalemia/hipomagnesemia ou outros prolongadores'],
  ARRAY['ECG (QT) em alto risco','Glicemia em DM','Sintomas tendão / neuropatia','Sintomas neuropsiquiátricos'],
  'Fluoroquinolona — inibe DNA-girase (topoisomerase II) e topoisomerase IV bacterianas → impede superenrolamento e replicação do DNA → bactericida concentração-dependente. Levofloxacino é o enantiômero L (ativo) do ofloxacino — biodisponibilidade VO ~99%. Espectro: gram+ (pneumococo, S. aureus, atípicos: Mycoplasma, Chlamydia, Legionella) + gram- (Pseudomonas em altas doses) + Mycobacterium.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=levofloxacino',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 127. ALBENDAZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'albendazol',
  'Albendazol',
  ARRAY['Zentel'],
  'Antiparasitário benzimidazol',
  ARRAY['VO'],
  $$[{"forma":"comprimido mastigável","concentracao":"400 mg"},{"forma":"suspensão","concentracao":"40 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"verminoses comuns (ascaridíase, ancilostomíase, tricuríase, enterobíase)","dose":"400 mg DOSE ÚNICA (repetir em 14d para enterobíase)","via":"VO","obs":"primeira escolha. Em estrongiloidíase: ivermectina é superior"},{"para":"tratamento empírico em pré-natal/peds (área endêmica)","dose":"400 mg dose única após 1º trim","obs":"OMS recomenda em área endêmica"},{"para":"neurocisticercose","dose":"15 mg/kg/dia (max 1200 mg/dia) divididos 12/12h × 8-15 dias","via":"VO","obs":"associar dexametasona + anticonvulsivante. ATENÇÃO: pode piorar inflamação inicial"},{"para":"hidatidose (Echinococcus)","dose":"10-15 mg/kg/dia × 1-6 meses","obs":"adjuvante a cirurgia"},{"para":"giardíase (alternativa)","dose":"400 mg/dia × 5 dias"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥2 anos verminoses","dose":"400 mg dose única (mesmo adulto se >2a)"}]}$$::jsonb,
  'C','Categoria C. EVITAR no 1º trim (teratogênico em estudos animais). Após: avaliar risco-benefício.','Compatível.',
  ARRAY['gestação 1º trim','hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, dor abdominal"},{"freq":"comum","evento":"cefaleia"},{"freq":"incomum","evento":"elevação enzimas hepáticas"},{"freq":"raro","evento":"mielossupressão (uso prolongado em hidatidose/cisticercose)"},{"freq":"raro","evento":"alopecia reversível"}]$$::jsonb,
  ARRAY['DOSE ÚNICA é suficiente para verminoses comuns — orientar paciente NÃO repetir desnecessariamente','EM NEUROCISTICERCOSE: piora inflamatória aguda nas primeiras 1-2 sem — sempre associar dexametasona + reavaliar antes (TC/RM)','HEPATOTOXICIDADE em uso prolongado — monitor TGO/TGP em hidatidose','EM ÁREA ENDÊMICA: tratamento empírico anual de toda família é estratégia recomendada','Eficácia: ascaris/ancilóstomo >95%, tricuris ~50% (precisa repetir/associar)'],
  ARRAY['TGO/TGP basal + a cada 2 sem em uso prolongado','Hemograma em uso prolongado','Sintomas em neurocisticercose'],
  'Benzimidazol — liga IRREVERSIVELMENTE à TUBULINA β do parasita → impede polimerização em microtúbulos → bloqueia absorção de glicose, esgotamento glicogênio, redução produção ATP → morte do verme. Ovicida, larvicida e adulticida na maioria. Metabolizado a sulfóxido de albendazol (forma ativa sistêmica). Absorção aumenta com refeição gordurosa.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=albendazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 128. IVERMECTINA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'ivermectina',
  'Ivermectina',
  ARRAY['Revectina','Ivomec'],
  'Antiparasitário macrolídeo (lactona)',
  ARRAY['VO'],
  $$[{"forma":"comprimido","concentracao":"6 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"estrongiloidíase (1ª escolha)","dose":"200 mcg/kg dose única (200 mcg/kg = ~12 mg em adulto 60kg)","via":"VO em jejum","obs":"PRIMEIRA ESCOLHA — superior a albendazol em Strongyloides. Repetir em 2 sem se imunossuprimido"},{"para":"escabiose (sarna)","dose":"200 mcg/kg dose única, repetir em 7-14 dias","via":"VO","obs":"alternativa a permetrina tópica. Em escabiose crostosa (Norueguesa): ≥3-7 doses"},{"para":"pediculose (piolho) refratária ao tópico","dose":"400 mcg/kg dose única, repetir em 7d"},{"para":"oncocercose, filariose","dose":"150-200 mcg/kg dose única anual"},{"para":"COVID-19","dose":"NÃO RECOMENDADA","obs":"SEM EFICÁCIA comprovada (TOGETHER, ACTIV-6, COVID-OUT). NÃO PRESCREVER para COVID"}]}$$::jsonb,
  $${"indicacoes":[{"para":"≥15 kg verminoses","dose":"200 mcg/kg dose única"}]}$$::jsonb,
  'C','Categoria C. EVITAR no 1º trim. Após pode usar.','Compatível.',
  ARRAY['<15 kg / <2 anos','gestação 1º trim','hipersensibilidade','meningite/BHE permeável (Loa loa em alta carga)'],
  $$[{"freq":"comum","evento":"náusea, dor abdominal, diarreia"},{"freq":"comum","evento":"prurido transitório (reação Mazzotti em filariose)"},{"freq":"incomum","evento":"cefaleia, sonolência"},{"freq":"raro","evento":"encefalopatia (Loa loa hiperinfectado)"}]$$::jsonb,
  ARRAY['NÃO É TRATAMENTO PARA COVID-19 — evidência conclusiva (RCTs negativos). Prescrever ivermectina para COVID = má prática','EM ESTRONGILOIDÍASE DISSEMINADA (paciente imunossuprimido com helmintíase grave): ivermectina + albendazol + ATB para gram-negativos (translocação)','EM ESCABIOSE: orientar tratamento de TODOS os contactantes domiciliares simultaneamente + lavar roupas/lençóis 60°C','TOMAR EM JEJUM — alimento aumenta absorção mas reduz consistência','SEGURA em geral — uso veterinário em larga escala fala da segurança em mamíferos. Não confundir formulação humana com veterinária'],
  ARRAY['Resposta clínica (resolução prurido escabiose 2-4 sem)','Cura parasitológica (estrongiloides — pesquisa fezes 1-3 meses pós)'],
  'Avermectina — liga seletivamente a canais de CLORO controlados por glutamato em invertebrados (paralisia flácida) e potencia GABA → hiperpolarização e morte do parasita. Em mamíferos, glutamato-Cl não existe e GABA está restrito ao SNC (pouco atravessa BHE com glicoproteína-P intacta) → margem de segurança alta. Eficaz em nematódeos, ácaros, alguns artrópodes.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=ivermectina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 129. ITRACONAZOL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, ajuste_hepatico, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'itraconazol',
  'Itraconazol',
  ARRAY['Sporanox','Itraspor'],
  'Antifúngico triazólico',
  ARRAY['VO'],
  $$[{"forma":"cápsula","concentracao":"100 mg"},{"forma":"solução oral","concentracao":"10 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"micoses cutâneas extensas (tinea, pitiríase)","dose":"200 mg/dia × 1 sem (pulso) ou 100 mg/dia × 2-4 sem","via":"VO COM REFEIÇÃO","obs":"absorção depende ácido gástrico — TOMAR com refeição. EVITAR IBP/anti-H2"},{"para":"onicomicose","dose":"PULSOTERAPIA: 200 mg 12/12h × 1 sem por mês × 2-3 pulsos (mãos) ou 3-4 pulsos (pés)","via":"VO","obs":"alternativa: terbinafina contínua 250 mg/dia (mais eficaz em dermatófitos)"},{"para":"candidíase orofaríngea/esofágica refratária","dose":"100-200 mg/dia × 7-14 dias","via":"VO solução (melhor absorção)"},{"para":"paracoccidioidomicose","dose":"200 mg/dia × 6-9 meses (forma leve) ou 12-24 meses (grave)","via":"VO","obs":"PRIMEIRA ESCOLHA em PCM no Brasil (alternativa: SMX-TMP)"},{"para":"histoplasmose, blastomicose, esporotricose","dose":"200 mg/dia × 6-12 meses"}]}$$::jsonb,
  $$[{"contexto":"hepatopatia","ajuste":"contraindicado se grave"}]$$::jsonb,
  'C','Categoria C. EVITAR — teratogênico em altas doses estudos animais. Em onicomicose: postergar pós-gestação.','Sem dados — evitar.',
  ARRAY['IC com FE reduzida (Black Box — efeito inotrópico negativo)','uso de drogas que prolongam QT','hepatopatia ativa','gestação','hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, dispepsia"},{"freq":"comum","evento":"cefaleia"},{"freq":"comum","evento":"elevação enzimas hepáticas"},{"freq":"incomum","evento":"PIORA DE IC (efeito inotrópico negativo)"},{"freq":"incomum","evento":"hepatotoxicidade clínica"},{"freq":"raro","evento":"prolongamento QT"},{"freq":"raro","evento":"neuropatia"}]$$::jsonb,
  ARRAY['BLACK BOX FDA: PIORA DE IC em paciente com FE reduzida → contraindicado em IC','INTERAÇÕES: inibidor potente CYP3A4 — aumenta nível de muitas drogas (sinvastatina/atorvastatina → miopatia; varfarina → INR↑; sildenafil → hipotensão)','TOMAR COM REFEIÇÃO em cápsula (precisa pH ácido); SOLUÇÃO oral em jejum (formulação com ciclodextrina)','HEPATOTOXICIDADE: monitor TGO/TGP em uso >1 mês','RESISTÊNCIA crescente em onicomicose — terbinafina é alternativa em dermatófitos'],
  ARRAY['Função hepática a cada 2-4 sem','ECG se uso prolongado / outros prolongadores QT','Sintomas IC','Resposta clínica + cultura'],
  'Triazol — inibe a 14-α-DEMETILASE FÚNGICA (CYP fúngico) → bloqueia conversão de lanosterol → ergosterol (esterol da membrana fúngica) → desestabiliza membrana. Mais lipofílico que fluconazol, melhor penetração em queratina (unha, pele) — vantagem em onicomicose/dermatofitoses. Pior penetração SNC e LCR (não usar em meningite). Forte inibidor CYP3A4 (interações).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=itraconazol',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- ============================================================
-- TOXICOLOGIA / EMERGÊNCIA
-- ============================================================

-- 130. NALOXONA
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'naloxona',
  'Naloxona',
  ARRAY['Narcan','Naloxona'],
  'Antagonista opioide (antídoto)',
  ARRAY['IV','IM','SC','intranasal'],
  $$[{"forma":"ampola","concentracao":"0,4 mg/mL"},{"forma":"spray nasal","concentracao":"4 mg/dose (Narcan Nasal)"}]$$::jsonb,
  $${"indicacoes":[{"para":"INTOXICAÇÃO/OVERDOSE OPIOIDE — depressão respiratória","dose":"0,04-0,4 mg IV (titular pela FR), repetir cada 2-3 min até FR ≥12-16. Em parada respiratória: 2 mg IV/IM/IN bolus","via":"IV (preferida) ou IM/IN","frequencia":"repetir até resposta","obs":"se sem resposta após 10 mg total → reconsiderar diagnóstico (não é só opioide). Meia-vida CURTA (30-90 min) — repetir ou BIC"},{"para":"depressão respiratória pós-anestésica/sedação por opioide","dose":"0,04-0,1 mg IV (titular)","obs":"DOSE BAIXA — evitar reverter analgesia totalmente (dor, taquicardia)"},{"para":"infusão BIC (overdose grave)","dose":"2/3 da dose efetiva inicial × 1h, ajustar pela resposta","via":"IV BIC","obs":"em overdose por opioide longa duração (metadona, oxicodona LP, fentanil patch) — evitar re-narcose"},{"para":"naloxona intranasal — primeiros respondedores/leigos","dose":"4 mg INTRANASAL (uma narina), repetir em 2-3 min se sem resposta","via":"INTRANASAL"}]}$$::jsonb,
  $${"indicacoes":[{"para":"peds overdose","dose":"0,01 mg/kg IV/IM/SC, repetir 0,1 mg/kg se sem resposta"}]}$$::jsonb,
  'B','Categoria B. INDICADA em gestante com overdose. CUIDADO: pode precipitar abstinência fetal aguda → contrações + sofrimento fetal','Compatível em curto prazo.',
  ARRAY['hipersensibilidade'],
  $$[{"freq":"comum (em dependentes)","evento":"SÍNDROME ABSTINÊNCIA AGUDA — agitação, taquicardia, HAS, sudorese, vômito"},{"freq":"comum","evento":"taquicardia"},{"freq":"incomum","evento":"edema agudo de pulmão (raro mas grave)"},{"freq":"incomum","evento":"arritmias (FA, FV)"},{"freq":"raro","evento":"convulsão (em paciente com co-ingestão)"}]$$::jsonb,
  ARRAY['ABORDAGEM EMERGENCIAL: ABC + naloxona. Não atrasar pela espera de via IV — IM/intranasal funcionam rápido','MEIA-VIDA CURTA (30-90 min) — opioides de longa ação podem RE-NARCOSAR após efeito naloxona acabar. Manter observação ≥2-4h pós-resposta. Considerar BIC','DOSE TITULADA — dose alta em dependente precipita abstinência aguda intensa (taquicardia, HAS, vômito) — pode prejudicar via aérea','EM PARADA RESPIRATÓRIA: dose plena (2 mg) IV ou IM','SUSPEITAR overdose se: depressão respiratória + miose (pupila puntiforme) + sedação. Em metadona/tramadol: pode ser miose menos evidente','NALOXONA NASAL é estratégia de saúde pública para reduzir mortes por overdose — disponível em comunidades de risco','NÃO REVERTE: depressão por BZD (precisa flumazenil), álcool, gabapentinoide, barbitúrico'],
  ARRAY['FR (alvo ≥12-16/min)','Nível de consciência','SatO2','PA + FC','ECG se arritmia','Observação ≥2-4h pós-resposta'],
  'Antagonista competitivo PURO dos receptores opioides (μ, κ, δ), com afinidade preferencial por μ (responsável por analgesia + depressão respiratória). Reverte rapidamente todos os efeitos opioides — não tem agonismo. Início IV em 2 min, IM/IN em 5-10 min. Meia-vida 30-90 min (curta — atenção a re-narcose).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=naloxona',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 131. FLUMAZENIL
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'flumazenil',
  'Flumazenil',
  ARRAY['Lanexat','Flumazenil'],
  'Antagonista de benzodiazepínico (antídoto)',
  ARRAY['IV'],
  $$[{"forma":"ampola","concentracao":"0,1 mg/mL (5 mL)"}]$$::jsonb,
  $${"indicacoes":[{"para":"reversão de SEDAÇÃO POR BZD (anestesia/procedimento)","dose":"0,2 mg IV em 15 seg, repetir 0,1-0,2 mg cada 1 min até resposta (max 1 mg)","via":"IV","obs":"USO MAIS COMUM. Rápido — efeito em 1-2 min"},{"para":"intoxicação por BZD (uso restrito)","dose":"0,2 mg IV em 30 seg, repetir até resposta (max 3 mg)","via":"IV","obs":"USO LIMITADO — risco convulsão se: 1) uso crônico de BZD (abstinência), 2) co-ingestão de pró-convulsivante (TCA, cocaína, bupropiona), 3) epilepsia. Geralmente NÃO USAR ROTINEIRAMENTE em overdose"},{"para":"BIC em re-narcose (raríssimo)","dose":"0,1-0,4 mg/h","via":"IV BIC","obs":"em overdose por BZD longa ação após bolus. Geralmente suporte clínico é melhor"}]}$$::jsonb,
  $${"indicacoes":[{"para":"peds reversão pós-procedimento","dose":"0,01 mg/kg IV (max 0,2 mg/dose)"}]}$$::jsonb,
  'C','Categoria C. Sem dados suficientes.','Sem dados — evitar.',
  ARRAY['uso CRÔNICO de BZD com risco abstinência grave','co-ingestão de pró-convulsivante (TCA, cocaína)','epilepsia em uso de BZD para controle','aumento da pressão intracraniana','hipersensibilidade'],
  $$[{"freq":"comum","evento":"agitação ao acordar"},{"freq":"comum","evento":"náusea, vômito"},{"freq":"incomum","evento":"CONVULSÕES — em uso crônico BZD ou co-ingestão pró-convulsivante"},{"freq":"incomum","evento":"taquicardia, HAS"},{"freq":"raro","evento":"arritmia"}]$$::jsonb,
  ARRAY['USO RESTRITO em overdose por BZD — risco CONVULSÕES superior ao benefício na maioria. Suporte clínico (intubação, suporte ventilatório) é mais seguro','EM RE-NARCOSE pós-anestesia/procedimento: flumazenil é seguro e útil — uso aguda, sem dependência','MEIA-VIDA CURTA (~1h) — pode RE-SEDAR depois (BZD longa duração). Manter observação ≥2h','NÃO REVERTE: depressão por opioide, álcool, barbitúrico, anti-histamínico, antipsicótico — apenas BZD'],
  ARRAY['Nível consciência','FR + SatO2','Sinais convulsão','Sinais abstinência (em uso crônico)','Observação ≥2h pós-resposta'],
  'Antagonista COMPETITIVO seletivo dos receptores GABA-A (sítio benzodiazepínico) → reverte sedação, depressão respiratória, amnésia e ansiólise dos BZDs. Não afeta receptores GABA por outros mecanismos (barbitúricos, álcool). Início rápido (1-2 min IV), meia-vida curta (~1h).',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=flumazenil',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 132. N-ACETILCISTEÍNA (NAC)
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'n-acetilcisteina',
  'N-acetilcisteína (NAC)',
  ARRAY['Fluimucil','Acetilcisteína','Mucistein'],
  'Antídoto paracetamol / mucolítico',
  ARRAY['VO','IV','INALAT'],
  $$[{"forma":"ampola IV","concentracao":"100 mg/mL (3 mL)"},{"forma":"sachê/comprimido efervescente","concentracao":"600 mg"},{"forma":"xarope","concentracao":"20 mg/mL ou 40 mg/mL"}]$$::jsonb,
  $${"indicacoes":[{"para":"INTOXICAÇÃO POR PARACETAMOL — antídoto","dose":"PROTOCOLO IV: 150 mg/kg em 200 mL SG 5% em 60 min + 50 mg/kg em 500 mL em 4h + 100 mg/kg em 1L em 16h (TOTAL 21h, 300 mg/kg). PROTOCOLO VO: 140 mg/kg ATAQUE + 70 mg/kg cada 4h × 17 doses","via":"IV (preferida) ou VO","duracao":"21h IV ou 72h VO","obs":"INICIAR <8h da ingestão (eficácia máxima). >24h ainda pode beneficiar se hepatite estabelecida"},{"para":"profilaxia nefropatia por contraste","dose":"600 mg VO 12/12h × 4 doses (2 antes + 2 após contraste) + hidratação SF 0,9%","obs":"EVIDÊNCIA CONTROVERSA (PRESERVE trial: NAC não superior a placebo). Hidratação é o que mais importa"},{"para":"mucolítico (DPOC, fibrose cística, bronquite)","dose":"600 mg/dia VO","via":"VO","obs":"benefício modesto. Reduz exacerbações em DPOC (BRONCUS)"},{"para":"esteato-hepatite alcoólica/insuficiência hepática (off-label)","dose":"protocolo paracetamol IV"}]}$$::jsonb,
  $${"indicacoes":[{"para":"intoxicação peds paracetamol","dose":"mesmo protocolo adulto por peso"}]}$$::jsonb,
  'B','Categoria B. INDICADA em gestante com overdose paracetamol — atravessa placenta, protege fígado fetal.','Compatível.',
  ARRAY['hipersensibilidade','úlcera péptica ativa (oral)','asma broncoespasmo (relativo — cuidado com inalação)'],
  $$[{"freq":"comum","evento":"náusea, vômito (oral — odor sulfuroso 'ovo podre')"},{"freq":"comum","evento":"reação anafilactoide (IV) — flushing, broncoespasmo, hipotensão (especialmente se infundido rápido)"},{"freq":"incomum","evento":"rash, prurido"},{"freq":"raro","evento":"anafilaxia"}]$$::jsonb,
  ARRAY['ANTÍDOTO PARACETAMOL: NÃO ATRASAR — eficácia decai após 8-10h da ingestão. Decisão pelo NOMOGRAMA DE RUMACK-MATTHEW (nível de paracetamol vs tempo)','REAÇÃO ANAFILACTOIDE em ~10% dos pacientes IV — maior se infusão muito rápida. Reduzir velocidade ou interromper, dar anti-histamínico/corticoide se grave, depois retomar','EM HEPATITE INSTALADA: NAC ainda beneficia mesmo >24h da ingestão — manter até INR <2 e melhora clínica','PROFILAXIA NEFROPATIA: hidratação >> NAC (PRESERVE)','PARACETAMOL EM GESTANTE: tratar agressivamente — overdose tem alta mortalidade fetal','NOMOGRAMA: nível 4h pós-ingestão >150 mcg/mL ou 8h >75 = tratar'],
  ARRAY['TGO/TGP, INR, bilirrubina','Lactato','Função renal','Glicemia','Sintomas anafilactoide durante IV'],
  'Precursor da CISTEÍNA → reabastece estoques de GLUTATIONA hepática (depletada na intoxicação por paracetamol). Glutationa conjuga o metabólito tóxico do paracetamol (NAPQI, gerado pelo CYP2E1) → impede ligação covalente a proteínas hepáticas → previne necrose. Como mucolítico: rompe pontes dissulfeto do muco → reduz viscosidade. Antioxidante geral.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=acetilcisteina',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();

-- 133. ÁCIDO TRANEXÂMICO
INSERT INTO public.wb_drugs (
  slug, nome_principio, nome_comercial, classe_terapeutica, via_administracao,
  apresentacoes, dose_adulto, dose_pediatrica, ajuste_renal, gestacao_categoria, gestacao_obs, lactacao,
  contraindicacoes, efeitos_adversos, alertas_seguranca, monitoramento,
  mecanismo_acao, bula_fonte_url, published
) VALUES (
  'acido-tranexamico',
  'Ácido tranexâmico (TXA)',
  ARRAY['Transamin','Hemoblock'],
  'Antifibrinolítico',
  ARRAY['IV','VO'],
  $$[{"forma":"ampola IV","concentracao":"50 mg/mL (5 mL = 250 mg)"},{"forma":"comprimido","concentracao":"250/500 mg"}]$$::jsonb,
  $${"indicacoes":[{"para":"TRAUMA com sangramento (CRASH-2)","dose":"1 g IV em 10 min ATAQUE + 1 g IV em 8h","via":"IV","duracao":"INICIAR <3h do trauma","obs":"reduz mortalidade em trauma com hemorragia. Após 3h: pode aumentar mortalidade — NÃO administrar"},{"para":"hemorragia pós-parto (WOMAN trial)","dose":"1 g IV em 10 min, repetir após 30 min se sangramento persistir","via":"IV","duracao":"INICIAR <3h pós-parto","obs":"associar a oxitocina + manobras + transfusão. Reduz mortalidade materna"},{"para":"hipermenorragia / menstruação volumosa","dose":"500-1000 mg VO 8/8h × 4-5 dias durante menstruação","via":"VO","obs":"reduz fluxo ~40-50%"},{"para":"epistaxe recorrente","dose":"500 mg VO 8/8h × 3-5 dias OU compressas tópicas com solução IV","via":"VO ou tópica"},{"para":"profilaxia em cirurgia (ortopédica/cardíaca)","dose":"1 g IV pré-incisão + 1 g IV pós-cirurgia","obs":"reduz transfusões"},{"para":"hifema traumático","dose":"75 mg/kg/dia VO × 5-7d","obs":"reduz ressangramento ocular"}]}$$::jsonb,
  $${"indicacoes":[{"para":"trauma peds","dose":"15 mg/kg (max 1g) ATAQUE + manutenção"}]}$$::jsonb,
  $$[{"clcr":"<50","ajuste":"reduzir 50%"}]$$::jsonb,
  'B','Categoria B. SEGURA em hemorragia pós-parto (WOMAN). Não cruza placenta significativamente.','Compatível.',
  ARRAY['história de tromboembolismo / trombofilia conhecida','hematúria por sangramento de vias urinárias altas (risco obstrução por coágulo)','hemorragia subaracnoide ativa por aneurisma','hipersensibilidade'],
  $$[{"freq":"comum","evento":"náusea, diarreia"},{"freq":"comum","evento":"distúrbio visual transitório (descrito como 'visão amarelada')"},{"freq":"incomum","evento":"hipotensão (infusão rápida)"},{"freq":"raro","evento":"trombose arterial/venosa (controverso — meta-análises não confirmam aumento em uso aguda)"},{"freq":"raro","evento":"convulsões (especialmente em altas doses cirurgia cardíaca)"}]$$::jsonb,
  ARRAY['NA HEMORRAGIA AGUDA: <3h da ocorrência é a JANELA TERAPÊUTICA — após 3h pode AUMENTAR mortalidade (CRASH-2)','EVIDÊNCIA FORTE em: trauma com sangramento, hemorragia pós-parto, hipermenorragia','EVIDÊNCIA MAIS FRACA em: AVC hemorrágico, sangramento GI alto (HALT-IT — sem benefício)','TROMBOSE: risco teórico mas estudos grandes (CRASH-2, WOMAN) NÃO mostraram aumento. Cautela em paciente com trombofilia conhecida','EM HIPERMENORRAGIA: não é hormonal, pode ser usado com qualquer método contraceptivo'],
  ARRAY['Sinais hemorragia (controle)','Sinais trombose (clinicamente — TVP, TEP)','Função renal (ajuste)'],
  'Análogo sintético da lisina → liga aos sítios de ligação à lisina do PLASMINOGÊNIO → impede sua ativação a PLASMINA pela t-PA → bloqueia FIBRINÓLISE → estabiliza coágulos formados. Efeito pró-hemostático sem aumentar coagulação propriamente. Aprotinina foi retirada do mercado (toxicidade), TXA é alternativa segura. Dose-dependente.',
  'https://consultas.anvisa.gov.br/#/bulario/q/?nomeProduto=acido+tranexamico',
  true
) ON CONFLICT (slug) DO UPDATE SET dose_adulto = EXCLUDED.dose_adulto, mecanismo_acao = EXCLUDED.mecanismo_acao, updated_at = now();
