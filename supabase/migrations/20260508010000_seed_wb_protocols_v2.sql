-- PreceptorBook v2: +15 protocolos clínicos cobrindo emergências e
-- urgências mais frequentes (cardio, neuro, GI, endócrino, pulmão).
-- Total após esta migration: 27 protocolos.

-- ============================================================
-- 13. CRISE HIPERTENSIVA (urgência vs emergência)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'crise-hipertensiva',
  'Crise hipertensiva: urgência vs emergência',
  'Cardiologia',
  'PA / Emergência',
  'PA muito elevada (≥ 180/120) classificada conforme presença ou não de lesão aguda de órgão-alvo. Emergência exige redução IV rápida porém controlada (25% na 1ª hora). Urgência permite redução VO em 24-48h.',
  $$[
    {"item":"Urgência hipertensiva","def":"PAS ≥ 180 ou PAD ≥ 120 SEM lesão aguda de órgão-alvo. Reduzir VO em 24-48h, alvo PA < 160/100"},
    {"item":"Emergência hipertensiva","def":"PA ≥ 180/120 COM lesão aguda: encefalopatia, AVC, EAP, SCA, dissecção aórtica, IRA, eclâmpsia, retinopatia III/IV"},
    {"item":"Pseudocrise","def":"PA elevada por dor, ansiedade, retenção urinária. Trate o gatilho, não a PA"},
    {"item":"Atenção","def":"NÃO baixar PA agressivamente (>25% em 1h) — risco AVC isquêmico, IAM, IRA por hipoperfusão"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Confirmar PA com técnica adequada","detalhes":"Manguito correto, paciente sentado 5 min, sem cafeína. Aferir nos 2 braços se suspeita de dissecção (assimetria ≥ 20 mmHg)"},
    {"passo":2,"acao":"Buscar lesão de órgão-alvo (LOA) aguda","detalhes":"Cefaleia + visão turva / vômitos = encefalopatia. Dor torácica = SCA/dissecção. Dispneia + estertores = EAP. Déficit focal = AVC. Dor lombar = IRA/dissecção"},
    {"passo":3,"acao":"URGÊNCIA: tratamento VO ambulatorial","detalhes":"Captopril 12,5-25 mg VO OU clonidina 0,1-0,2 mg VO. Reduzir PA em 24-48h. Alvo PA < 160/100. NÃO usar nifedipino sublingual (queda abrupta = isquemia)"},
    {"passo":4,"acao":"EMERGÊNCIA: medicação IV em UTI/sala vermelha","detalhes":"Reduzir 20-25% da PAM na 1ª hora, depois para 160/100 nas próximas 2-6h, depois normalizar em 24-48h. EXCEÇÃO: dissecção (PA < 120 sistólica em 20 min) e AVC isquêmico (PA até 220/120 se não trombolítico)"},
    {"passo":5,"acao":"Drogas IV de escolha por contexto","detalhes":"AVC: nicardipino, labetalol. SCA/dissecção: nitroprussiato + esmolol/labetalol. EAP: nitroglicerina + furosemida. Eclâmpsia: hidralazina, sulfato de Mg. Encefalopatia: nicardipino. Feocromocitoma: fentolamina"},
    {"passo":6,"acao":"Após estabilização: investigar causa","detalhes":"HAS resistente, hiperaldosteronismo, estenose renal, feocromocitoma, drogas (cocaína, suspensão clonidina), apneia do sono, doença renal"},
    {"passo":7,"acao":"Alta com plano","detalhes":"Otimizar HAS de base, marcar retorno em 1-2 semanas, MAPA em ambulatório se HAS resistente"}
  ]$$::jsonb,
  ARRAY['PA aferida nos 2 braços','ECG (LVH, isquemia)','Hemograma','Função renal + EAS (sedimento)','Eletrólitos','Troponina se dor torácica','RX tórax (se EAP suspeito)','TC crânio (se déficit neurológico)','Fundoscopia','BNP/NT-proBNP em IC suspeita','Beta-HCG em mulher idade fértil'],
  ARRAY['Dor torácica em rasgo + assimetria de pulsos = dissecção (TC ou angio-RM urgente)','Glasgow rebaixado','Cegueira súbita / hemianopsia','Edema agudo de pulmão','Dor abdominal severa (dissecção abdominal)','Gestante com cefaleia + epigastralgia (eclâmpsia/HELLP)','Hematúria macroscópica (microangiopatia trombótica)'],
  'Diretriz Brasileira HAS 2020 + ACC/AHA 2017 + ESC 2023',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-116-3-516/0066-782X-abc-116-3-516.pdf',
  '2020-09-22',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 14. INSUFICIÊNCIA CARDÍACA AGUDA DESCOMPENSADA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'ic-aguda-descompensada',
  'Insuficiência cardíaca aguda descompensada',
  'Cardiologia',
  'PA / Emergência / UTI',
  'Síndrome clínica de congestão (sistêmica/pulmonar) e/ou baixo débito por disfunção cardíaca aguda ou crônica descompensada. Estratificar por perfil hemodinâmico (Stevenson) orienta tratamento.',
  $$[
    {"item":"Congestão clínica","def":"Dispneia, ortopneia, DPN, edema, estase jugular, B3, hepatomegalia, ascite"},
    {"item":"Hipoperfusão","def":"Pele fria, oliguria, sonolência, hipotensão, lactato elevado"},
    {"item":"Stevenson — 4 perfis","def":"A (quente-seco): compensado. B (quente-úmido): mais comum, congestão sem hipoperfusão. C (frio-úmido): congestão + choque. L (frio-seco): baixo débito"},
    {"item":"BNP / NT-proBNP","def":"BNP > 100 ou NT-proBNP > 300 (idade-ajustado) sugere IC descompensada"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliação ABC + exame focado","detalhes":"SpO2, PA, FC, perfusão, ausculta pulmonar (estertores), turgência jugular, edema, peso. Ecocardio à beira do leito se disponível"},
    {"passo":2,"acao":"Identificar perfil Stevenson","detalhes":"B (quente-úmido) = diurético. L (frio-seco) = volume cuidadoso ± inotrópico. C (frio-úmido) = inotrópico + vasopressor + diurético. A = ajuste otimização"},
    {"passo":3,"acao":"Suporte ventilatório","detalhes":"O2 alvo SatO2 > 92% (88-92% se DPOC). VNI se EAP/IRpA hipercápnica (CPAP/BiPAP). IOT se Glasgow < 8, exaustão, instabilidade"},
    {"passo":4,"acao":"Diurético IV — pilar do tratamento","detalhes":"Furosemida 40-80 mg IV (se virgem) OU 2,5x a dose VO crônica. Avaliar resposta em 1-2h. Se diurese < 100 mL/h: dobrar dose. Considerar BIC 5-20 mg/h. Adicionar tiazídico (HCTZ ou metolazona) se resistência"},
    {"passo":5,"acao":"Vasodilatador se PA permite (PAS > 110)","detalhes":"Nitroglicerina BIC 5-20 mcg/min (preferida em SCA/IC isquêmica). Nitroprussiato em IC com regurgitação valvar grave. Reduz pré e pós-carga"},
    {"passo":6,"acao":"Inotrópico se hipoperfusão (perfis C/L)","detalhes":"Dobutamina 2,5-15 mcg/kg/min (1ª escolha). Milrinona em uso crônico de beta-bloq. Levosimendana se disponível. NÃO usar em paciente quente-úmido (B) — não traz benefício"},
    {"passo":7,"acao":"Vasopressor se choque (perfil C)","detalhes":"Noradrenalina 1ª escolha. Não usar em isquemia coronariana ativa sem inotrópico junto"},
    {"passo":8,"acao":"Tratar PRECIPITANTE","detalhes":"FA com RVR → cardioversão ou controle FC. SCA → cateterismo. Crise HTA → vasodilatador. Sepse → ATB. Embolia pulmonar → anticoagulação ± trombolítico. Má aderência → educação"},
    {"passo":9,"acao":"Pré-alta","detalhes":"Otimizar GDMT (IECA/BRA/Sacubitril, beta-bloq, espironolactona, iSGLT2). Programa multiprofissional. Reavaliação em 7-14 dias (alta vulnerabilidade)"}
  ]$$::jsonb,
  ARRAY['BNP ou NT-proBNP','Troponina','ECG','RX tórax','Gasometria arterial','Eletrólitos + função renal','Hemograma','Glicemia, TSH, ferro','Ecocardio TT','D-dímero (se TEP suspeito)','US POCUS pulmonar (linhas B) e cardíaco'],
  ARRAY['Choque cardiogênico (necessita BIA, ECMO, VAD)','PCR iminente / arritmia maligna','EAP refratário com SatO2 < 90% em VNI','Dor torácica com supra de ST (IAM como causa)','Sopro novo (ruptura papilar, CIV pós-IAM)','Suspeita de tamponamento cardíaco','Endocardite com abscesso valvar'],
  'Diretriz Brasileira IC SBC 2018 + ESC HF 2021',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-111-3-436/0066-782X-abc-111-3-436.pdf',
  '2018-09-15',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 15. TROMBOEMBOLISMO PULMONAR (TEP)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'tep',
  'Tromboembolismo pulmonar (TEP)',
  'Cardiologia / Pneumologia',
  'PA / Emergência / UTI',
  'Oclusão de artéria pulmonar por trombo, geralmente embolizado de TVP. Estratificação por risco define tratamento: massivo (choque) → trombolítico; submassivo (disfunção VD) → ICU + considerar trombolítico; leve → anticoagulação ambulatorial.',
  $$[
    {"item":"Wells score","def":"≥ 4,5 = TEP provável (AngioTC). < 4,5 = improvável (D-dímero)"},
    {"item":"Geneva score","def":"alternativo ao Wells, similar"},
    {"item":"D-dímero","def":"VPN alta — < 500 ng/mL (ou idade-ajustado: idade × 10 em > 50 anos) afasta TEP em pré-teste baixo"},
    {"item":"AngioTC","def":"padrão-ouro. Sensibilidade > 95%"},
    {"item":"Massivo","def":"PAS < 90 ou queda > 40 mmHg por > 15 min, ou choque/PCR"},
    {"item":"Submassivo (intermediário)","def":"Hemodinamicamente estável + disfunção VD (eco/CT) OU troponina elevada"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliação inicial e probabilidade pré-teste","detalhes":"Calcular Wells: TVP clínica (3), TEP é mais provável (3), FC > 100 (1,5), imobilização > 3d / cirurgia recente (1,5), TVP/TEP prévio (1,5), hemoptise (1), câncer (1)"},
    {"passo":2,"acao":"Estratégia diagnóstica conforme probabilidade","detalhes":"Baixa (< 2): considerar PERC; se negativo, exclui. Média (2-6): D-dímero; se ≥ 500, AngioTC. Alta (> 6): direto AngioTC. Em gestante: cintilografia V/Q se RX normal"},
    {"passo":3,"acao":"Estabilização inicial","detalhes":"O2 alvo > 92%. Volume cuidadoso (250-500 mL SF) — sobrecarga piora VD. Vasopressor (NA) se hipotensão"},
    {"passo":4,"acao":"Anticoagulação imediata se TEP confirmado ou alta probabilidade","detalhes":"Enoxaparina 1 mg/kg SC 12/12h (1ª escolha) OU HNF se cirurgia recente, IRC clcr < 30 ou TEP massivo (titulável). DOACs (rivaroxabana 15 mg 12/12h × 21d → 20 mg/dia) podem ser usados ambulatorialmente em TEP de baixo risco"},
    {"passo":5,"acao":"Estratificar gravidade","detalhes":"Massivo = trombolítico se sem CI absoluta. Submassivo = considerar (decisão multidisciplinar). Leve (PESI baixo, sem disfunção VD) = pode ir pra casa em algumas semanas com DOAC"},
    {"passo":6,"acao":"Trombolítico se MASSIVO","detalhes":"Alteplase 100 mg IV em 2h (10 mg bolus + 90 mg em 110 min). Manter heparina parada durante e retomar após. Alternativas: tenecteplase, estreptoquinase. Trombectomia se contraindicação a trombolítico"},
    {"passo":7,"acao":"Filtro de VCI","detalhes":"Indicação restrita: contraindicação absoluta a anticoagulação OU TEP recorrente apesar de anticoagulação adequada. Remover assim que possível"},
    {"passo":8,"acao":"Duração do tratamento","detalhes":"Provocado (cirurgia, imobilização): 3 meses. Não-provocado: 3-6 meses, considerar prolongado. Câncer ativo: enquanto câncer ativo. Recorrente / SAF: indefinido"},
    {"passo":9,"acao":"Investigar etiologia se não-provocado","detalhes":"Trombofilias hereditárias (FV Leiden, prot C/S, antitrombina), SAF, malignidade oculta (idade-ajustado), homocisteinemia"}
  ]$$::jsonb,
  ARRAY['ECG (S1Q3T3 clássico mas raro)','D-dímero (se pré-teste baixo/médio)','AngioTC tórax (padrão-ouro)','Ecocardiograma (disfunção VD?)','Troponina + BNP (estratificação)','Gasometria arterial (hipoxemia + alcalose respiratória)','Doppler MMII (TVP concomitante)','Lab: hemograma, função renal, coagulograma','Beta-HCG em mulher idade fértil'],
  ARRAY['Hipotensão / choque (TEP massivo — trombolítico)','Sat < 90% em O2','Sinais de hipoperfusão','Disfunção VD ao ecocardiograma','Troponina elevada','Fibrilação atrial nova','PCR (considerar trombólise empírica em PCR de TEP suspeito)'],
  'Diretriz Brasileira TEV 2023 + ESC TEP 2019',
  'https://academic.oup.com/eurheartj/article/41/4/543/5556136',
  '2019-08-31',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 16. FIBRILAÇÃO ATRIAL — manejo na sala de emergência
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'fa-emergencia',
  'Fibrilação atrial — manejo na emergência',
  'Cardiologia',
  'PA / Emergência',
  'Arritmia mais comum, irregular sem onda P. Decisão emergencial: instável → CV elétrica. Estável → controle de FC ou ritmo. Sempre avaliar anticoagulação (CHA2DS2-VASc).',
  $$[
    {"item":"ECG","def":"Ausência de onda P, R-R irregular, ondas f de fibrilação"},
    {"item":"Tipos","def":"Paroxística (autolimitada < 7d), persistente (> 7d, requer CV), permanente (não tentar reverter), valvular (estenose mitral / prótese mecânica)"},
    {"item":"Instabilidade","def":"Hipotensão, dor anginosa, IC aguda, alteração mental → CV elétrica imediata"},
    {"item":"CHA2DS2-VASc","def":"≥ 2 (homem) ou ≥ 3 (mulher) = anticoagulação. 1/2 considerar individualmente"},
    {"item":"HAS-BLED","def":"avaliar risco hemorrágico mas NÃO contraindica anticoagulação isoladamente"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliar estabilidade","detalhes":"PA, sintomas (dispneia, dor torácica, síncope), perfusão, edema. ECG de 12 derivações"},
    {"passo":2,"acao":"INSTÁVEL = cardioversão elétrica imediata","detalhes":"100-200 J bifásico sincronizada (200 J monofásica). Pré-medicar se possível (etomidato, propofol). Se PCR: protocolo ACLS"},
    {"passo":3,"acao":"ESTÁVEL: estratégia controle de FC vs ritmo","detalhes":"Maioria dos casos: controle de FC. Controle de ritmo se: 1ª FA jovem sintomático, IC com FA recente, sintomas refratários ao controle FC. Estudo EAST-AFNET 4 (2020) mostrou benefício de controle precoce de ritmo em FA recente (< 1 ano)"},
    {"passo":4,"acao":"Controle de FC","detalhes":"Beta-bloq (metoprolol 5 mg IV ou 25-100 mg VO) — 1ª escolha. BCC não-DHP (verapamil, diltiazem) se sem IC FEr. Digital em FA com IC ou paciente sedentário (alvo FC repouso < 80, exercício < 110)"},
    {"passo":5,"acao":"Controle de ritmo (cardioversão química)","detalhes":"Amiodarona 150 mg IV em 10 min + 1 mg/min × 6h + 0,5 mg/min × 18h (preferida em IC). Propafenona 600 mg VO ('pill in the pocket' em FA paroxística sem cardiopatia estrutural). Flecainida (não disponível BR). Sotalol"},
    {"passo":6,"acao":"Cardioversão elétrica eletiva","detalhes":"Após anticoagulação ≥ 3 semanas (ou ETE excluindo trombo) E início < 48h OU paciente já anticoagulado. Manter anticoagulação ≥ 4 semanas pós-CV (estado pró-trombótico atordoamento atrial)"},
    {"passo":7,"acao":"Anticoagulação por CHA2DS2-VASc","detalhes":"DOAC (rivaroxabana, apixabana, dabigatrana, edoxabana) — 1ª escolha em FA não-valvar. Varfarina obrigatória em FA valvular (estenose mitral moderada-grave, prótese mecânica). Iniciar imediatamente em alto risco mesmo se vai cardioverter"},
    {"passo":8,"acao":"Pós-alta","detalhes":"Manter beta-bloq + DOAC. Cardiologista para considerar ablação se sintomático refratário. Tratar precipitante: hipertireoidismo, infecção, álcool, apneia do sono, IC, doença valvar"}
  ]$$::jsonb,
  ARRAY['ECG 12 derivações','Eletrólitos (K+, Mg++)','TSH (hipertireoidismo é precipitante)','Hemograma','Função renal (DOACs precisam ajuste)','Função hepática','Ecocardiograma (FE, valvopatias, AE, trombo)','Holter se intermitente','Ergométrico em casos selecionados','D-dímero se TEP suspeito (FA pode ser secundária)'],
  ARRAY['Instabilidade hemodinâmica → CV imediata','Sinais de IC aguda','Dor torácica com supra de ST (FA pode ser sintoma de IAM)','AVC concomitante (avaliar trombólise — janela)','FA pré-excitada (WPW): NÃO usar BB ou BCC ou digital — pode aumentar FC ventricular; usar amiodarona ou CV','Síncope com FA (descartar bloqueio AV)','Trombo em AE no ETE → cardioversão proibida sem anticoagulação prévia'],
  'Diretriz Brasileira FA SBC 2023 + ESC AF 2024',
  'https://abccardiol.org/wp-content/uploads/articles_xml/0066-782X-abc-121-9-e20230945',
  '2023-09-30',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 17. HEMORRAGIA DIGESTIVA ALTA (HDA)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'hda',
  'Hemorragia digestiva alta (HDA)',
  'Gastroenterologia',
  'PA / Emergência / UTI',
  'Sangramento proximal ao ângulo de Treitz. Apresentação: hematêmese, melena, hematoquezia (HDA maciça). Causas: úlcera péptica (50%), varizes esofágicas (10-15%), Mallory-Weiss, esofagite, neoplasia.',
  $$[
    {"item":"Hematêmese","def":"vômito com sangue (vivo ou em borra de café)"},
    {"item":"Melena","def":"fezes pretas, pegajosas, fétidas (≥ 50-100 mL sangue alto)"},
    {"item":"Hematoquezia em HDA","def":"sangramento maciço com trânsito acelerado"},
    {"item":"Glasgow-Blatchford","def":"≤ 1: alta precoce. ≥ 7: alto risco, internação UTI"},
    {"item":"Rockall (pré e pós-endoscopia)","def":"prediz mortalidade e ressangramento"},
    {"item":"BUN/creat ratio elevado","def":"> 20: HDA mais provável que HDB"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Avaliar estabilidade hemodinâmica","detalhes":"PA ortostática, FC, perfusão, Hb seriada (Hb basal pode estar normal pois ainda não hemodiluiu)"},
    {"passo":2,"acao":"Ressuscitação volêmica + 2 acessos calibrosos","detalhes":"Cristaloide 1-2 L (cuidado em cardiopata/cirrótico). Tipagem + reserva 2-4 U concentrado de hemácias se choque ou Hb < 7 (alvo > 7-8 estável; > 8-9 cardiopata)"},
    {"passo":3,"acao":"IBP IV em alta dose","detalhes":"Pantoprazol/omeprazol 80 mg bolus + 8 mg/h em BIC (ou 40 mg 12/12h IV se sem BIC). Iniciar ANTES da endoscopia. Reduz necessidade de tratamento endoscópico"},
    {"passo":4,"acao":"Suspeita de varizes (cirrose conhecida ou estigmas)","detalhes":"Octreotida 50 mcg IV bolus + 50 mcg/h por 2-5 dias (vasoconstrição esplâncnica). Ceftriaxona 1 g IV/dia × 7d (PBE profilática, reduz mortalidade). Considerar EVL urgente"},
    {"passo":5,"acao":"Endoscopia digestiva alta (EDA) em ≤ 24h","detalhes":"≤ 12h se choque/sangramento maciço. Se varizes: ligadura elástica (EVL) ou esclerose. Se úlcera: classificação Forrest. Forrest I/IIa = injeção + cauterização ou clipe (reduz ressangramento). Forrest IIb (coágulo): considerar remoção. Forrest IIc/III: terapia médica"},
    {"passo":6,"acao":"Procurar e tratar H. pylori se úlcera","detalhes":"Biópsia ou teste de urease no momento da EDA. Tratamento ambulatorial pós-controle do sangramento"},
    {"passo":7,"acao":"Sangramento refratário / recorrente","detalhes":"Re-EDA. Embolização arterial radiológica (radiointervencionista). Cirurgia de salvamento (raro, alta mortalidade). Em varizes: TIPS de urgência se EVL falhar"},
    {"passo":8,"acao":"Pós-controle: investigação e prevenção","detalhes":"Suspender AINE/antiplaquetário se possível. AAS pode ser reiniciado em 3-7 dias se cardio-vascular alta indicação. Erradicar H. pylori. Profilaxia secundária com IBP em alto risco. Em cirrose: profilaxia secundária EVL + beta-bloq não-seletivo"}
  ]$$::jsonb,
  ARRAY['Hemograma (Hb seriada 4/4-6/6h)','Tipagem sanguínea + Coombs','Coagulograma + plaquetas','Ureia, creatinina, eletrólitos','Função hepática','BUN/creat ratio','Lactato (hipoperfusão)','Toque retal (melena)','EDA em 24h','TC angiográfica se EDA negativa e sangramento ativo','D-dímero, troponina se cardiopata'],
  ARRAY['Choque hemorrágico (HCT < 25%, lactato > 2)','Hematêmese maciça com via aérea ameaçada (IOT)','Cirrótico com sangramento (alta mortalidade — internar UTI)','Coagulopatia (varfarina, DOACs, hepatopatia)','Plaquetas < 50.000','Comorbidades graves (Charlson alto)','Ressangramento durante internação','Idade > 65 anos com sangramento maciço'],
  'Cochrane + AGA 2021 + Brazilian Consensus 2023',
  'https://gi.org/guideline/upper-gastrointestinal-and-ulcer-bleeding/',
  '2021-04-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 18. ESTADO DE MAL EPILÉPTICO
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'estado-mal-epileptico',
  'Estado de mal epiléptico (EME)',
  'Neurologia',
  'PA / Emergência / UTI',
  'Crise > 5 min OU crises recorrentes sem recuperação completa entre elas. Emergência neurológica — quanto mais demora pra tratar, mais refratário fica. Mortalidade 10-30% em adultos.',
  $$[
    {"item":"EME convulsivo","def":"crises tônico-clônicas contínuas ou recorrentes > 5 min sem recuperação"},
    {"item":"EME não-convulsivo","def":"alteração de consciência persistente sem atividade motora — exige EEG"},
    {"item":"EME refratário","def":"persiste após 2 anticonvulsivantes adequados (tipicamente BZD + 1 de segunda linha)"},
    {"item":"EME super-refratário","def":"> 24h ou recorre após desmame de anestésico"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"0-5 min: ABC + acesso venoso","detalhes":"Proteção via aérea (decúbito lateral, cânula de Guedel). O2 alta vazão. Glicemia capilar (HGT). Se HGT < 60 mg/dL: tiamina 100 mg IV + glicose 50% 50 mL"},
    {"passo":2,"acao":"5-20 min — 1ª linha: BENZODIAZEPÍNICO","detalhes":"Lorazepam 4 mg IV (pode repetir 4 mg em 10 min) — preferido (menos recorrência, RAMPART trial). Diazepam 10 mg IV (ou 0,2 mg/kg) — alternativa. Midazolam 10 mg IM (ou 0,2 mg/kg) se sem acesso (RAMPART). Pediatria: midazolam 0,2 mg/kg IM"},
    {"passo":3,"acao":"20-40 min — 2ª linha","detalhes":"Fenitoína 20 mg/kg IV (max 50 mg/min) OU fosfenitoína (mais segura, menos hipotensão e flebite). Levetiracetam 60 mg/kg IV em 10 min (ESET trial: equivalente, melhor perfil). Valproato 40 mg/kg IV (cuidado em hepatopatia)"},
    {"passo":4,"acao":"40-60 min — REFRATÁRIO: induzir coma","detalhes":"Midazolam 0,2 mg/kg bolus + 0,05-2 mg/kg/h BIC. Propofol 2 mg/kg + 2-10 mg/kg/h. Pentobarbital 5 mg/kg + 1-3 mg/kg/h. Manter coma 24-48h, com EEG contínuo (alvo: surto-supressão ou cessação eletrográfica). IOT obrigatória"},
    {"passo":5,"acao":"Investigar causa","detalhes":"Sempre: HGT, eletrólitos (Na, Ca, Mg), função renal/hepática, gasometria, hemograma, toxicológico (cocaína, álcool, isoniazida), antiepilépticos séricos (subdosagem). TC crânio (sangramento, AVC, tumor, abscesso). LCR se febre/imunossupressão. EEG"},
    {"passo":6,"acao":"Tratar causas reversíveis","detalhes":"Hipoglicemia → glicose. Hiponatremia grave → SF 3%. Eclâmpsia → sulfato de Mg. Wernicke (etilista) → tiamina IV. Encefalite → aciclovir IV empírico. Intoxicação por isoniazida → piridoxina"},
    {"passo":7,"acao":"Após estabilização","detalhes":"Manter anticonvulsivante de manutenção (geralmente o que funcionou + 1 a longo prazo). RM de crânio. Avaliação neurológica. Plano ambulatorial com neuro"}
  ]$$::jsonb,
  ARRAY['HGT capilar imediato','Eletrólitos (Na, K, Ca, Mg, P)','Função renal e hepática','Gasometria arterial','Hemograma','Toxicológico (urinário e sangue se suspeita)','Anti-epilépticos séricos (subdosagem é causa frequente)','TC crânio','EEG (essencial em EME não-convulsivo)','Punção lombar se febre/imunossupressão','RM crânio (após estabilização)','Beta-HCG'],
  ARRAY['Status sem resposta a 1 BZD + 1 de segunda linha (refratário — UTI)','Aspiração / IRpA','Hipertermia maligna (> 40°C — risco rabdomiólise)','Glicemia < 50 não corrigida','Eclâmpsia (gestante > 20s) — sulfato de Mg de imediato','Suspeita de meningite/encefalite','TCE recente','Trauma associado durante a crise (fraturas)','Recém-nascido com convulsão (sempre internar UTI ped)'],
  'AAN/NCS 2016 + Brazilian Consensus 2020',
  'https://onlinelibrary.wiley.com/doi/full/10.1111/epi.13121',
  '2016-02-09',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 19. MENINGITE BACTERIANA AGUDA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'meningite-bacteriana',
  'Meningite bacteriana aguda',
  'Neurologia / Infectologia',
  'PA / Emergência / UTI',
  'Inflamação das meninges por bactéria. Mortalidade 10-25%, sequelas em 30%. Cada hora de atraso no ATB aumenta mortalidade. ATB empírico imediato + dexametasona em pneumococo suspeito.',
  $$[
    {"item":"Tríade clássica","def":"febre + cefaleia + rigidez de nuca (apenas 44% têm os 3); 95% têm 2 deles ou alteração mental"},
    {"item":"Sinais meníngeos","def":"Kernig, Brudzinski, rigidez nuca — pouco sensíveis"},
    {"item":"Petéquias / púrpura","def":"sugere meningococo (Waterhouse-Friderichsen)"},
    {"item":"LCR bacteriana","def":"turvo, > 1000 células (pred PMN), proteína > 100, glicose < 40 (ou < 0,4× sérica), Gram + cultura"},
    {"item":"Etiologia adulto","def":"S. pneumoniae > N. meningitidis > L. monocytogenes (> 50 anos, imunossuprimido) > Hib (raro pós-vacina)"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Suspeita = ATB IMEDIATO (não esperar exames)","detalhes":"Cada hora de atraso aumenta mortalidade. Coletar 2 hemoculturas e iniciar ATB em ≤ 30 min, idealmente antes da TC/PL"},
    {"passo":2,"acao":"ATB empírico por idade/contexto","detalhes":"Adulto < 50 anos: ceftriaxona 2 g IV 12/12h + vancomicina 15-20 mg/kg IV 8/8h (cobertura pneumo R). > 50a / imunossuprimido / gestante: + ampicilina 2 g IV 4/4h (Listeria). RN: ampicilina + cefotaxima ou gentamicina. Pós-cirurgia neuro / trauma penetrante: vanco + cefepime/meropenem"},
    {"passo":3,"acao":"Dexametasona 10 mg IV ANTES ou junto da 1ª dose ATB (BENEFÍCIO em pneumococo)","detalhes":"Manter 10 mg 6/6h × 4 dias. Reduz mortalidade e perda auditiva em pneumococo. Suspender se Gram não-pneumococo"},
    {"passo":4,"acao":"Avaliar necessidade de TC antes da PL","detalhes":"Indicações de TC ANTES de PL: imunossupressão, doença SNC prévia, convulsão recente, papiledema, déficit focal, alteração de consciência (Glasgow < 11), > 60 anos. NÃO são indicações: cefaleia + febre + rigidez sem os anteriores"},
    {"passo":5,"acao":"Punção lombar","detalhes":"Anestesia local. Manometria. Coletar 4 tubos: bioquímica, citológico, microbiologia (Gram + cultura), guarda. Se LCR turvo: bacteriana até prova contrária"},
    {"passo":6,"acao":"Direcionar ATB pelo Gram/cultura","detalhes":"S. pneumoniae sensível: ceftriaxone 2 g 12/12h × 10-14 dias. N. meningitidis: ceftriaxona × 5-7 dias + quimioprofilaxia contatos (rifampicina ou ciprofloxacino). H. influenzae: ceftriaxona × 7 dias. L. monocytogenes: ampicilina + gentamicina × 21 dias"},
    {"passo":7,"acao":"Suporte intensivo","detalhes":"Monitorização hemodinâmica. SF 0,9% se hipotenso (cuidado com hiponatremia/SIADH). Manter normotermia, normoglicemia. Anticonvulsivante se crise. Evitar hipertensão intracraniana grave (cabeceira 30°)"},
    {"passo":8,"acao":"Profilaxia para contatos próximos","detalhes":"Meningococo: rifampicina 600 mg 12/12h × 2 dias OU ciprofloxacino 500 mg dose única OU ceftriaxona 250 mg IM. H. influenzae tipo b: rifampicina × 4 dias se contato com criança não-vacinada"},
    {"passo":9,"acao":"Notificação compulsória imediata","detalhes":"Todas meningites bacterianas no Brasil. Contatar vigilância epidemiológica para investigação de cluster"}
  ]$$::jsonb,
  ARRAY['Hemoculturas 2 pares ANTES do ATB','TC crânio (se indicado)','Punção lombar com manometria + 4 tubos LCR','Hemograma com leucograma','PCR, lactato','Eletrólitos, função renal','Coagulograma','Glicemia (capilar e LCR pareada)','HIV (todo paciente)','Cultura de qualquer ferida cutânea/IDSA'],
  ARRAY['Choque séptico','Petéquias/púrpura ascendente (Waterhouse-Friderichsen — meningococo)','Glasgow < 8 (IOT)','Convulsões','Sinais de hipertensão intracraniana / herniação','Coagulopatia (CIVD)','Coma após 48h de ATB adequado (drenar abscesso? ressonância)','Suspeita de TB ou fungos (curso subagudo, imunossupressão)','RN com fontanela abaulada'],
  'IDSA 2017 + Brazilian Consensus 2019 + WHO 2024',
  'https://www.idsociety.org/practice-guideline/bacterial-meningitis/',
  '2017-09-20',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 20. APENDICITE AGUDA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'apendicite',
  'Apendicite aguda',
  'Cirurgia geral',
  'PA / Emergência',
  'Inflamação aguda do apêndice, geralmente por obstrução do lúmen. Causa mais comum de abdome cirúrgico. Apresentação clássica em < 50% dos casos. Tratamento padrão: apendicectomia (laparoscópica preferível).',
  $$[
    {"item":"Sequência clássica","def":"dor periumbilical → migra para fossa ilíaca direita (FID) → náuseas/vômitos → febre baixa"},
    {"item":"Sinais físicos","def":"McBurney (dor à palpação 1/3 distal entre umbigo e EIAS), Blumberg (dor à descompressão), Rovsing (pressão FIE causa dor FID), psoas (dor à extensão coxa), obturador (dor à rotação interna coxa flexionada)"},
    {"item":"Alvarado score (≥ 7 = alta probabilidade)","def":"M (migração dor 1) A (anorexia 1) N (náusea 1) T (sensibilidade FID 2) R (rebote 1) E (elevação T 1) L (leucocitose 2) S (shift left, 1)"},
    {"item":"Atipia","def":"crianças, idosos, gestantes (apêndice deslocado), retrocecal (dor lombar/flanco), pelvis (sintomas urinários/diarreia)"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"História + exame focado","detalhes":"Cronologia da dor, característica, irradiação, fatores. Exame abdominal completo (descartar peritonite difusa, massa, hérnias). Toque retal/vaginal em casos selecionados"},
    {"passo":2,"acao":"Score (Alvarado ou AIR) + exames básicos","detalhes":"Hemograma (leucocitose com desvio em 80%), PCR, EAS (excluir ITU). Beta-HCG em mulher idade fértil"},
    {"passo":3,"acao":"Imagem","detalhes":"USG abdominal: 1ª linha em criança, jovem magra, gestante (sem radiação). TC abdome com contraste: padrão-ouro em adulto/obeso (sensibilidade 96%). RM em gestante se USG inconclusivo"},
    {"passo":4,"acao":"Achados de imagem","detalhes":"Apêndice > 6 mm não-compressível, parede espessada > 2 mm, gordura periapendicular borrada, fecalitos. Complicações: abscesso, perfuração, fleimão"},
    {"passo":5,"acao":"Pré-operatório","detalhes":"Jejum, hidratação IV (cristaloide), analgesia (não mascara diagnóstico — Cochrane 2011), antiemético, ATB EV uma única dose 30-60 min antes (cefoxitina 2 g, amoxi-clavulanato, ceftriaxona+metronidazol)"},
    {"passo":6,"acao":"APENDICECTOMIA — escolha","detalhes":"Laparoscópica (1ª escolha): menos infecção de FO, alta mais rápida. Aberta (Mc Burney): se laparo indisponível, suspeita de neoplasia, peritonite difusa com instabilidade"},
    {"passo":7,"acao":"Apendicite complicada (abscesso, fleimão)","detalhes":"Drenagem percutânea + ATB IV (4-7d) + apendicectomia 'a frio' em 6-8 semanas (controverso — alguns serviços operam imediatamente). Cirurgia de emergência se peritonite generalizada ou falha de drenagem"},
    {"passo":8,"acao":"Tratamento conservador (não-cirúrgico)","detalhes":"Apendicite não-complicada SEM fecalito: estudos APPAC mostram ~70% sucesso com ATB isolado, mas 27% recidiva em 1 ano. Reservar para pacientes com risco cirúrgico alto ou que recusam cirurgia"},
    {"passo":9,"acao":"Pós-operatório","detalhes":"Dieta progressiva 6-12h pós-op. Alta em 24-48h se laparo + sem complicações. Histopatológico (descartar tumor neuroendócrino, mucinoso, GIST). Retorno ambulatorial em 14d"}
  ]$$::jsonb,
  ARRAY['Hemograma com leucograma','PCR','EAS','Beta-HCG','Eletrólitos + função renal','Lactato (suspeita perfuração)','USG abdominal','TC abdome com contraste se USG não conclusivo','RM em gestante','Hemoculturas se sepse','Lipase/amilase (DD pancreatite)','Coagulograma pré-op'],
  ARRAY['Peritonite generalizada (cirurgia imediata)','Sepse / instabilidade hemodinâmica','Sinal de Rovsing positivo + febre alta + Leuco > 20.000','Massa palpável (abscesso ou neoplasia)','Suspeita de perfuração com pneumoperitônio','Gestante (apêndice migra cranialmente — desafio diagnóstico)','RN com clínica abdominal (raro mas grave)','Idoso com apresentação atípica (alta mortalidade por atraso)'],
  'WSES 2020 + Brazilian Surgery Consensus',
  'https://wjes.biomedcentral.com/articles/10.1186/s13017-020-00306-3',
  '2020-04-15',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 21. PANCREATITE AGUDA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'pancreatite-aguda',
  'Pancreatite aguda',
  'Gastroenterologia',
  'PA / Emergência / UTI',
  'Inflamação aguda do pâncreas, principalmente por cálculo biliar (40%) ou álcool (30%). Diagnóstico Atlanta 2012: 2/3 critérios. Estratificar gravidade — leve (80%) vs moderada/grave (20%) muda manejo radicalmente.',
  $$[
    {"item":"Critérios Atlanta 2012 (≥ 2)","def":"(1) dor abdominal compatível, (2) lipase ou amilase > 3× LSN, (3) imagem com pancreatite"},
    {"item":"Etiologia (BIG-FAT)","def":"Biliar > Álcool > pós-CPRE, hipertrigliceridemia > 1000, hipercalcemia, drogas (azatioprina, valproato), trauma, autoimune, pós-op"},
    {"item":"Gravidade Atlanta 2012","def":"Leve (sem falência orgânica nem complicação local), moderadamente grave (falência transitória < 48h ou complicação local), grave (falência persistente > 48h)"},
    {"item":"Escores prognósticos","def":"BISAP (admissão), Ranson (48h), APACHE II. PCR > 150 às 48h sugere grave"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Confirmar diagnóstico","detalhes":"Dor epigástrica em barra com irradiação dorsal + náuseas/vômitos + lipase > 3× LSN. Lipase mais específica que amilase. Imagem (USG/TC) confirma e busca etiologia"},
    {"passo":2,"acao":"Identificar etiologia","detalhes":"USG abdome (cálculo biliar — fazer em todos). Triglicérides (> 1000). Cálcio. ALT > 150 sugere biliar (VPP 95%). História álcool, drogas, pós-CPRE"},
    {"passo":3,"acao":"Estratificar gravidade","detalhes":"BISAP (admissão): BUN > 25, alt mental, SIRS, idade > 60, derrame pleural. ≥ 3 = grave. Hematócrito alto (hemoconcentração) ou que sobe nas 1as 24h prediz grave"},
    {"passo":4,"acao":"Hidratação agressiva mas controlada","detalhes":"Ringer lactato 5-10 mL/kg/h nas primeiras 24h (estudos WATERFALL 2022 sugerem moderada melhor que agressiva). Reavaliar diurese (> 0,5 mL/kg/h) e BUN cada 8-12h. Cuidado em IC, idoso, IRC"},
    {"passo":5,"acao":"Analgesia","detalhes":"Dipirona + opioide (morfina, hidromorfona, fentanil). Mito: morfina causa espasmo de Oddi — não há evidência clínica relevante. EVITAR meperidina (efeito não comprovado, neurotoxicidade)"},
    {"passo":6,"acao":"Suporte nutricional","detalhes":"Pancreatite leve: dieta VO precoce (12-24h) se tolerar. Não retardar com 'jejum estrito'. Pancreatite grave: NE precoce (< 48h) por SNE pós-pilórica preferível. NPT só se NE impossível por > 5-7 dias"},
    {"passo":7,"acao":"ATB — apenas em casos selecionados","detalhes":"NÃO usar profilaticamente. Indicação: necrose pancreática infectada (deterioração clínica + gás na TC). Empírico: meropenem ou cipro + metronidazol (boa penetração pancreática). Coletar cultura do material drenado"},
    {"passo":8,"acao":"CPRE em pancreatite biliar","detalhes":"INDICAÇÃO: colangite associada OU obstrução biliar persistente. NÃO indicado em pancreatite biliar leve sem obstrução. Colecistectomia ANTES da alta em pancreatite biliar leve (reduz recorrência), em 6-8 sem na grave"},
    {"passo":9,"acao":"Complicações tardias","detalhes":"Pseudocisto (4-6 semanas — drenagem se sintomático ou > 6 cm). Necrose infectada (drenagem step-up: percutânea/endoscópica antes de cirurgia). Fístula pancreática. Diabetes secundário. Insuficiência exócrina"}
  ]$$::jsonb,
  ARRAY['Lipase + amilase','Hemograma (Hct seriado)','Função renal (BUN seriado)','Cálcio, magnésio, fósforo','Função hepática (ALT, GGT)','Triglicérides','Glicemia','Lactato (gravidade)','Gasometria','PCR seriada','LDH','USG abdome em todos (cálculo biliar)','TC abdome com contraste se grave ou após 72h sem melhora','EUS / colangio-RM em pancreatite recorrente sem causa aparente','Beta-HCG'],
  ARRAY['Falência orgânica persistente > 48h (UTI)','Hematócrito > 44% ou que sobe (hemoconcentração — má perfusão)','BUN > 20 ou subindo','SIRS persistente após 48h','Necrose pancreática extensa em TC','Sinais de Cullen (umbigo) ou Grey-Turner (flancos) — hemorragia retroperitoneal, rara mas grave','Colangite associada (febre + icterícia + dor) — CPRE urgente','Obesidade (IMC > 30) é fator de risco para gravidade','SDRA (10-25% em PA grave)'],
  'IAP/APA 2013 + AGA 2018 + ACG 2024',
  'https://gi.org/guideline/acute-pancreatitis/',
  '2024-04-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 22. COLECISTITE AGUDA
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'colecistite-aguda',
  'Colecistite aguda',
  'Cirurgia geral',
  'PA / Emergência',
  'Inflamação aguda da vesícula, em geral por obstrução cística por cálculo (95%). Tratamento: colecistectomia laparoscópica precoce (< 72h dos sintomas) é o padrão moderno (Tokyo 2018).',
  $$[
    {"item":"Critérios Tokyo 2018 (todos os 3 grupos)","def":"A. Local: dor HD + Murphy ou massa palpável. B. Sistêmico: febre ou PCR/Leuco aumentados. C. Imagem: USG/TC com sinais de colecistite. Definitivo = A + B + C; suspeito = A + B"},
    {"item":"Sinal de Murphy","def":"interrupção da inspiração à palpação subcostal direita"},
    {"item":"Murphy ecográfico","def":"dor à passagem do transdutor sobre vesícula — VPP 92%"},
    {"item":"Gravidade Tokyo 2018","def":"I (leve), II (moderada com leucocitose, massa, > 72h), III (grave com falência orgânica)"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"USG abdome (1ª escolha)","detalhes":"Cálculo + parede vesícula > 4 mm + líquido pericolecístico + Murphy ecográfico. Sensibilidade 81%, especificidade 83%"},
    {"passo":2,"acao":"Se USG inconclusivo: TC abdome ou cintilografia HIDA","detalhes":"HIDA: padrão-ouro funcional (não-visualização da vesícula = obstrução cística). TC útil pra complicações (perfuração, abscesso)"},
    {"passo":3,"acao":"Tratamento clínico inicial","detalhes":"Jejum, hidratação IV (Ringer lactato), analgesia (dipirona + opioide), antiemético, ATB IV após hemoculturas"},
    {"passo":4,"acao":"ATB empírico","detalhes":"Comunidade leve/moderada: cefuroxima ou amoxi-clavulanato. Hospitalar / grave / idoso / imunossuprimido: piperacilina-tazo OU cefepime + metronidazol OU meropenem. Duração: 4-7 dias após colecistectomia (Cochrane 2018)"},
    {"passo":5,"acao":"Colecistectomia laparoscópica PRECOCE (< 72h)","detalhes":"Padrão-ouro Tokyo 2018: cirurgia precoce reduz internação, complicações e custos vs cirurgia tardia. Conversão pra aberta em ~10% (anatomia distorcida, sangramento)"},
    {"passo":6,"acao":"Alternativa: colecistostomia percutânea","detalhes":"Pacientes graves (Tokyo III) ou com alto risco cirúrgico (idoso, comorbidades) — drenagem por punção USG-guiada. Cirurgia eletiva em 6-8 sem após estabilização"},
    {"passo":7,"acao":"Colangite associada (Charcot: febre, icterícia, dor)","detalhes":"Reanimar + ATB amplo + CPRE com drenagem biliar emergencial (< 24h se grave). Colecistectomia depois da resolução"},
    {"passo":8,"acao":"Complicações tardias","detalhes":"Empiema, gangrena, perfuração (< 10% mas alta mortalidade), fístula bilio-entérica, íleo biliar (cálculo passa para intestino — obstrução), Mirizzi (cálculo no infundíbulo comprime ducto comum)"}
  ]$$::jsonb,
  ARRAY['Hemograma (leucocitose com desvio)','PCR','Função hepática (ALT, GGT, fosfatase alcalina, BT)','Lipase/amilase (DD pancreatite biliar)','Eletrólitos','Coagulograma','Beta-HCG','USG abdome','TC abdome se complicação','HIDA scan se diagnóstico duvidoso','Hemoculturas se sepse','Colangio-RM em coledocolitíase suspeita'],
  ARRAY['Peritonite generalizada (perfuração — cirurgia urgente)','Sepse / choque','Tríade de Charcot (colangite associada — CPRE urgente)','Gangrena ou enfisema vesicular ao exame de imagem','Idoso > 75a com Tokyo II/III (alta mortalidade — colecistostomia preferível)','Coagulopatia (AAS + clopidogrel: difícil suspender no agudo)','Imunossuprimidos (apresentação atípica e oligossintomática — manter alta suspeita)','Cirrose Child-Pugh C (cirurgia muito arriscada — drenagem percutânea)'],
  'Tokyo Guidelines 2018 + WSES 2020 + Cochrane 2018',
  'https://onlinelibrary.wiley.com/doi/10.1002/jhbp.515',
  '2018-03-30',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 23. AVC HEMORRÁGICO (HEMORRAGIA INTRAPARENQUIMATOSA)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'avc-hemorragico',
  'AVC hemorrágico (HIP — hemorragia intraparenquimatosa)',
  'Neurologia',
  'Emergência / UTI',
  '15-30% dos AVCs. Mortalidade 30 dias 30-50%. Causa: HAS (60%, profunda), AAC (lobar em idoso), MAV em jovem, drogas. TC sem contraste estabelece diagnóstico. Manejo: estabilizar PA, reverter coagulopatia, suporte intensivo.',
  $$[
    {"item":"TC sem contraste","def":"hiperdensidade no parênquima, sem ou com extensão ventricular/SAH"},
    {"item":"Localização","def":"Profunda (núcleos da base, tálamo) → HAS. Lobar → AAC, neoplasia, MAV. Cerebelo → cirurgia se > 3 cm ou rebaixamento. Tronco → péssimo prognóstico"},
    {"item":"Score ICH (mortalidade 30d)","def":"Glasgow (3-4=2, 5-12=1, 13-15=0), volume (≥30 mL=1), hemorragia ventricular (1), localização infratentorial (1), idade ≥80 (1). 0=0%, 5=72%, 6=100%"},
    {"item":"Spot sign","def":"sinal de extravasamento ativo na angio-TC, prediz expansão"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Confirmação diagnóstica imediata","detalhes":"TC sem contraste em ≤ 25 min da chegada (igual AVC isq). AngioTC se suspeita de aneurisma, MAV, fístula"},
    {"passo":2,"acao":"Avaliação neurológica + suporte ABC","detalhes":"NIHSS, Glasgow, midríase. IOT se Glasgow ≤ 8, falência via aérea, agitação que impeça exame. Cabeceira 30°"},
    {"passo":3,"acao":"Controle agressivo de PA","detalhes":"INTERACT-2 e ATACH-2: PAS alvo 130-140 nas primeiras 24h reduz expansão e melhora desfecho. Drogas: nicardipino BIC (preferida), labetalol IV, esmolol. Evitar nitroprussiato (aumenta PIC)"},
    {"passo":4,"acao":"Reversão URGENTE de anticoagulação","detalhes":"Varfarina + INR ≥ 1,4: vit K 10 mg IV + complexo protrombínico (CCP) 25-50 U/kg (PFC se CCP indisponível, mais lento). DOAC: andexanet alfa (anti-Xa: rivaroxabana, apixabana) ou idarucizumabe (dabigatrana). HBPM: protamina parcial. Antiplaquetário: NÃO transfundir plaquetas de rotina (PATCH 2016 mostrou pior desfecho)"},
    {"passo":5,"acao":"Controle de glicemia","detalhes":"Alvo 140-180 mg/dL. Hipoglicemia e hiperglicemia pioram lesão"},
    {"passo":6,"acao":"Anticonvulsivante","detalhes":"NÃO profilático rotina. Se convulsão: levetiracetam 60 mg/kg IV + manutenção. EEG se rebaixamento desproporcional (status não-convulsivo)"},
    {"passo":7,"acao":"Hipertensão intracraniana","detalhes":"Cabeceira 30°, sedação, normocapnia (PaCO2 35-40). Manitol 1 g/kg IV ou salina hipertônica 3% se herniação iminente. DVE se hidrocefalia obstrutiva (extensão ventricular). Craniectomia descompressiva considerada caso a caso"},
    {"passo":8,"acao":"Cirurgia","detalhes":"INDICAÇÃO: hematoma cerebelar > 3 cm com deterioração ou compressão de tronco / hidrocefalia. STICH e MISTIE: cirurgia minimamente invasiva pode ter benefício em alguns casos lobares superficiais. Considerar consulta neurocirurgia em todos"},
    {"passo":9,"acao":"Prevenção secundária","detalhes":"Tratar HAS rigorosamente (alvo < 130/80). Suspender estatina é controverso (manter na maioria). Anticoagulação em FA pós-HIP: discussão multidisciplinar; geralmente manter suspensa por 4-8 sem, depois reavaliar (DOAC > varfarina em segurança)"}
  ]$$::jsonb,
  ARRAY['TC crânio sem contraste','AngioTC se suspeita de aneurisma/MAV','Glicemia capilar','Coagulograma + plaquetas','INR (essencial em anticoagulado)','Hemograma','Função renal e hepática','Eletrólitos','Troponina (lesão miocárdica neurogênica é comum)','RX tórax','ECG','Beta-HCG','Toxicológico se < 50 anos sem causa aparente','RM crânio em coorte estável (descartar tumor, MAV)'],
  ARRAY['Glasgow ≤ 8 (IOT)','Volume hematoma > 30 mL','Hemorragia intraventricular volumosa','Pupilas anisocóricas / arreativas (herniação iminente)','Bradicardia + HAS + irregularidade respiratória (Cushing — herniação)','Hematoma cerebelar > 3 cm com sintomas (cirurgia urgente)','INR > 5 ou plaquetas < 50.000','Sangramento simultâneo (multifocal — pensar em metástase, vasculite, abuso de drogas)'],
  'AHA/ASA 2022 + Diretriz Brasileira AVC 2023',
  'https://www.ahajournals.org/doi/10.1161/STR.0000000000000407',
  '2022-05-17',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 24. LESÃO RENAL AGUDA (LRA / IRA)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'lra',
  'Lesão renal aguda (LRA / IRA)',
  'Nefrologia',
  'Enfermaria / UTI',
  'Queda abrupta da função renal (horas a dias). Diagnóstico KDIGO: Cr ↑ ≥ 0,3 mg/dL em 48h OU ↑ 1,5× basal em 7d OU diurese < 0,5 mL/kg/h por > 6h. Classificar pré/intra/pós-renal direciona tratamento.',
  $$[
    {"item":"KDIGO estágios","def":"1: Cr ↑ 1,5-1,9× ou ↑ 0,3; 2: Cr ↑ 2-2,9×; 3: Cr ↑ ≥ 3× ou Cr ≥ 4 ou diálise"},
    {"item":"Pré-renal (60%)","def":"hipovolemia, IC, sepse, drogas (IECA + AINE), estenose renal. Ureia/Cr > 20, FENa < 1%, sódio urinário < 20"},
    {"item":"Intra-renal (35%)","def":"NTA (isquemia/toxinas), GN, NIA (drogas), microangiopatia. FENa > 2%"},
    {"item":"Pós-renal (5%)","def":"obstrução: HPB, neoplasia, cálculo bilateral. USG com hidronefrose"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Identificar e suspender NEFROTOXINAS","detalhes":"Suspender: AINE, IECA/BRA (em pré-renal), aminoglicosídeo, contraste iodado, vancomicina (ou ajustar nível), anfo B convencional. Substituir por alternativa não-nefrotóxica"},
    {"passo":2,"acao":"Avaliar volemia","detalhes":"PA ortostática, JVP, edema, congestão pulmonar, US POCUS (VCI, linhas B). Hipovolêmico: cristaloide 500-1000 mL. Hipervolêmico: diurético. Normal: ajustar conforme balanço"},
    {"passo":3,"acao":"Investigar etiologia","detalhes":"EAS (proteinúria, hematúria, cilindros), USG renal (tamanho, hidronefrose). Sódio urinário + FENa (pré vs intra). Se causa não óbvia: complemento, imunológico, biópsia em IRA inexplicada com proteinúria/hematúria"},
    {"passo":4,"acao":"Tratar causa específica","detalhes":"Pré-renal: volume cristaloide. Intra-renal: corticoide se NIA suspeita; tratamento específico de GN/microangiopatia. Pós-renal: cateter vesical (HPB), USG-nefrostomia se obstrução alta"},
    {"passo":5,"acao":"Manejo de complicações","detalhes":"Hiperpotassemia: gluconato Ca + insulina/glicose + beta2 + bicarbonato/quelante. Acidose metabólica: bicarbonato se pH < 7,1. Sobrecarga volêmica: diurético em alta dose, furo BIC. Uremia (encefalopatia, pericardite, sangramento): diálise"},
    {"passo":6,"acao":"Indicações ABSOLUTAS de TRS (regra AEIOU)","detalhes":"Acidose metabólica refratária (pH < 7,1). Eletrolíticos: hiperK > 6,5 refratário. Intoxicação dialisável (lítio, salicilato, metanol, etilenoglicol). Sobrecarga volêmica refratária. Uremia sintomática (pericardite, encefalopatia, sangramento)"},
    {"passo":7,"acao":"Modalidade de TRS","detalhes":"HD intermitente: paciente estável. CRRT (CVVH, CVVHD): instável hemodinâmico, edema cerebral, alto débito catabólico. PIRRT: intermediário"},
    {"passo":8,"acao":"Pós-LRA — seguimento","detalhes":"30% dos sobreviventes não recuperam função basal. Acompanhamento nefrologista em 3 meses. Risco aumentado de DRC e LRA recorrente. Educar sobre AINE e nefrotoxinas"}
  ]$$::jsonb,
  ARRAY['Creatinina + ureia (seriadas)','Eletrólitos completos (Na, K, Cl, Ca, P, Mg)','Gasometria arterial','Hemograma','EAS (proteinúria, hematúria, cilindros)','Sódio urinário + creatinina urinária (FENa)','Proteína urinária / razão A/C ou P/C','USG renal e vias urinárias (descartar pós-renal)','Doppler renal se trombose suspeita','Imunológico se GN suspeita: ANA, ANCA, anti-MBG, complemento C3/C4, crioglobulinas','Sorologia HBV/HCV/HIV','Eletroforese de proteínas (mieloma)','Lactato (sepse)','Toxicológico se necessário'],
  ARRAY['Hipercalemia > 6,5 mEq/L com alterações ECG','Acidose grave (pH < 7,1) refratária','Edema agudo de pulmão refratário a furo','Uremia sintomática (encefalopatia, pericardite, sangramento)','Anuria > 12h','Suspeita de microangiopatia trombótica (esquizócitos, plaquetopenia)','Rabdomiólise grave (CK > 5000 + mioglobinúria)','Síndrome do espremido / lise tumoral','LRA + proteinúria nefrótica + hematúria → biópsia renal urgente','Insuficiência renal pós-contraste com Cr subindo'],
  'KDIGO 2012 + AGA 2023 + Brazilian Nephrology 2022',
  'https://kdigo.org/guidelines/acute-kidney-injury/',
  '2012-03-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 25. DISTÚRBIOS DO POTÁSSIO
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'disturbios-potassio',
  'Distúrbios do potássio (hipo e hipercalemia)',
  'Nefrologia / Emergência',
  'Enfermaria / Emergência / UTI',
  'K+ é o principal cátion intracelular. Distúrbios graves causam arritmia maligna. Hipocalemia: K < 3,5. Hipercalemia: K > 5,5. Sempre confirmar (afastar pseudo) e correlacionar com ECG.',
  $$[
    {"item":"Hipocalemia","def":"Leve 3,0-3,4 / Moderada 2,5-2,9 / Grave < 2,5"},
    {"item":"Hipercalemia","def":"Leve 5,5-5,9 / Moderada 6,0-6,4 / Grave ≥ 6,5 ou alterações ECG"},
    {"item":"Pseudo-hipercalemia","def":"hemólise da amostra, leucocitose > 100k, trombocitose > 1M, garrote prolongado. Repetir sem garrote"},
    {"item":"Causas hipoK","def":"perdas GI (vômito, diarreia, laxante), perdas renais (diurético, hiperaldo, Bartter, hipoMg), shift intracelular (insulina, beta2, alcalose)"},
    {"item":"Causas hiperK","def":"IRA/DRC, drogas (IECA/BRA/espiro/AINE/heparina/SMX-TMP), acidose, lise (rabdomiólise, tumoral, hemólise), Addison"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"HIPOCALEMIA — ECG e ritmo","detalhes":"Achados: T achatada, U proeminente, depressão ST, prolongamento QT. Risco: arritmia ventricular (torsades), digital toxicidade"},
    {"passo":2,"acao":"HIPOCALEMIA — corrigir Mg JUNTO","detalhes":"Hipomagnesemia impede correção. Sempre dosar e repor: MgSO4 1-2 g IV em 1h se Mg < 1,8"},
    {"passo":3,"acao":"HIPOCALEMIA — repor","detalhes":"VO se possível (KCl 40-80 mEq/dia divididos). IV se K < 2,5 ou sintomas: KCl 10-20 mEq/h em veia central; periférica max 10 mEq/h em 100 mL SF (irritante). NUNCA bolus IV (risco arritmia fatal). Recheck K em 2-4h"},
    {"passo":4,"acao":"HIPERCALEMIA — confirmar e ECG IMEDIATO","detalhes":"ECG sequencial: T apiculada (precoce) → PR prolongado → P alargado/desaparece → QRS alargado → onda sinusoidal → FV/PCR. K > 6,5 OU qualquer alteração ECG = emergência"},
    {"passo":5,"acao":"HIPERCALEMIA — ESTABILIZAR membrana (1ª prioridade)","detalhes":"Gluconato de cálcio 10% 10-30 mL IV em 5-10 min (cardiocirculatório protege miocárdio em 1-3 min, dura 30-60 min). NÃO reduz K — dá tempo. Pode repetir. CUIDADO em digoxinotoxicidade (preferir cloreto de cálcio)"},
    {"passo":6,"acao":"HIPERCALEMIA — SHIFT intracelular","detalhes":"Insulina regular 10 U IV + glicose 25 g IV (50 mL SG 50%): início 15-30 min, dura 4-6h, reduz K 0,5-1,2. Beta-2 nebulização 10-20 mg salbutamol: aditivo à insulina, ↓ K 0,5-1. Bicarbonato 50 mEq IV: SÓ se acidose metabólica concomitante (não funciona em K isolado)"},
    {"passo":7,"acao":"HIPERCALEMIA — REMOVER do organismo","detalhes":"Furosemida 40-80 mg IV se função renal preservada. Resinas: patiromer (Veltassa) ou ZS-9 (Lokelma) — moderno, eficaz, custo alto. SPS (Kayexalate): controverso, risco isquemia cólica, evitar em pós-op. HEMODIÁLISE: definitivo, indicado se K > 6,5 + ECG alterado refratário ou DRC oligo/anúrica"},
    {"passo":8,"acao":"PARAR causas e prevenir recorrência","detalhes":"HipoK: trocar diurético poupador K, suplementar cronicamente, tratar Bartter/Gitelman. HiperK: suspender IECA/BRA/espiro/AINE/SMX-TMP; baixar K dietético (banana, laranja, melão, batata, tomate); patiromer crônico se DRC com indicação de IECA"}
  ]$$::jsonb,
  ARRAY['Eletrólitos (K, Na, Cl, Mg, Ca, P)','Gasometria arterial','Função renal (Cr, ureia)','Glicemia','ECG (TODOS — repetir após cada intervenção em hiperK)','Hemograma (lise tumoral, hemólise)','Lactato','CK e mioglobina (rabdomiólise)','EAS','Cortisol e ACTH se Addison suspeita','Renina + aldosterona se hiperaldo suspeita','Digoxina sérica se em uso'],
  ARRAY['K > 6,5 OU qualquer alteração ECG (emergência absoluta)','QRS > 120 ms ou onda sinusoidal (PCR iminente)','Bradicardia com K alto + uso de digoxina (toxicidade — NÃO usar Ca, antídoto é Digibind)','HipoK < 2,0 com sintomas (paralisia, arritmia)','HipoK refratária — pensar hipoMg, perdas tubulares, hipovolemia','Lise tumoral (paciente oncológico em quimio)','Rabdomiólise + IRA + hiperK (síndrome do espremido)','Hipotermia + bradicardia + hiperK (pós-PCR)','Pseudo-hipercalemia (técnica de coleta) — repetir antes de tratar'],
  'KDIGO + AHA + Brazilian Nephrology Consensus',
  'https://www.kidney-international.org/article/S0085-2538(20)30269-7/fulltext',
  '2020-04-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 26. TROMBOSE VENOSA PROFUNDA (TVP)
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'tvp',
  'Trombose venosa profunda (TVP)',
  'Hematologia / Cardiologia',
  'Atenção primária / PA',
  'Trombo em veia profunda, geralmente MMII. Triada de Virchow: estase, lesão endotelial, hipercoagulabilidade. Risco principal: TEP (até 50% sem tratamento).',
  $$[
    {"item":"Apresentação clínica","def":"edema unilateral, dor, calor, eritema, empastamento. Sinal de Homans (dor à dorsiflexão): pouco sensível"},
    {"item":"Wells DVT score","def":"≥ 2 = provável; < 2 + D-dímero negativo afasta. Itens: câncer ativo, paralisia/imobilização, acamado > 3d, dor ao trajeto venoso, edema MI inteiro, edema panturrilha > 3 cm, edema com cacifo, veias colaterais, TVP prévia, DD igualmente provável (-2)"},
    {"item":"D-dímero","def":"VPN alta. < 500 ng/mL (idade-ajustado em > 50a: idade × 10) afasta em pré-teste baixo"},
    {"item":"USG doppler MMII","def":"padrão-ouro. Sensibilidade 95% para TVP proximal"},
    {"item":"Localização","def":"Distal (panturrilha): menos embolizante, considerar acompanhamento ou anticoag 6 sem. Proximal (poplítea/femoral/ilíaca): anticoagulação obrigatória"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Calcular Wells DVT","detalhes":"≥ 2 = provável → USG doppler. < 2 → D-dímero; se negativo afasta, se positivo USG"},
    {"passo":2,"acao":"USG doppler MMII","detalhes":"Avaliar compressibilidade venosa, fluxo, presença de trombo ecogênico. Repetir em 5-7d se inicial negativo mas alta suspeita"},
    {"passo":3,"acao":"Iniciar anticoagulação se diagnóstico confirmado","detalhes":"DOAC 1ª escolha em paciente sem câncer (rivaroxabana 15 mg 12/12h × 21d → 20 mg/dia OU apixabana 10 mg 12/12h × 7d → 5 mg 12/12h). HBPM (enoxa 1 mg/kg 12/12h SC) em câncer ativo (CARAVAGGIO 2020 mostrou DOAC = HBPM em câncer). Varfarina + heparina overlap se DOAC não disponível"},
    {"passo":4,"acao":"Casos especiais — internar","detalhes":"TVP iliofemoral extensa com compressão arterial (phlegmasia cerulea/alba dolens), gestante, sangramento ativo, IRC clcr < 15, alto risco hemorrágico. Considerar trombólise dirigida por cateter em iliofemoral ameaçando isquemia"},
    {"passo":5,"acao":"Filtro de VCI","detalhes":"INDICAÇÃO: contraindicação absoluta a anticoagulação OU TVP/TEP recorrente apesar de anticoag adequada. Remover assim que possível (evitar permanente — risco síndrome pós-trombótica)"},
    {"passo":6,"acao":"Duração","detalhes":"Provocada (cirurgia, gestação, imobilização) e fator removível: 3 meses. Não-provocada 1º episódio: 3-6 meses, considerar prolongado se baixo risco hemorrágico. Recorrente / não-provocada com alto risco / câncer ativo / SAF: indefinida"},
    {"passo":7,"acao":"Investigação de trombofilia (selecionada)","detalhes":"Indicações: TEV não-provocado em < 50a, recorrente, em sítios atípicos (cerebral, mesentérica), história familiar forte. Pesquisar: FV Leiden, mutação protrombina G20210A, deficiência prot C/S, antitrombina, SAF, homocistinemia. NÃO investigar de rotina — não muda conduta na maioria"},
    {"passo":8,"acao":"Síndrome pós-trombótica (PROFILAXIA)","detalhes":"Meias elásticas (compressão graduada 30-40 mmHg) por 1-2 anos: REDUZ pós-trombótica em alguns estudos (controverso após SOX 2014). Mobilização precoce (não restringir)"},
    {"passo":9,"acao":"Profilaxia primária TEV em hospitalizado","detalhes":"Padua score (clínico) ou Caprini (cirúrgico). Alto risco → enoxa 40 mg SC/dia ou HNF 5000 U 8/8h. Alternativa: compressão pneumática se sangramento contraindica anticoagulação. Continuar 7-14d ou até deambulação"}
  ]$$::jsonb,
  ARRAY['Wells DVT score','D-dímero (em pré-teste baixo/médio)','USG doppler MMII','Hemograma','Função renal (DOACs precisam ajuste)','Função hepática','Coagulograma','Beta-HCG (gestante: HBPM, NÃO DOAC nem varfarina)','Trombofilia se indicado (proteínas C/S, antitrombina, FV Leiden, SAF, homocisteína)','Imagem de tórax / AngioTC se dispneia (TEP concomitante? até 50%)','Pesquisa de neoplasia oculta em > 50a com TEV não-provocado (idade-ajustado)'],
  ARRAY['Phlegmasia cerulea/alba dolens (extremidade fria, cianótica/branca, edema massivo) — risco isquemia, considerar trombectomia','TVP em sítio atípico (cerebral, mesentérica) — investigar paroxística noturna, mieloproliferativo, malignidade','Sangramento ativo / cirurgia recente — filtro VCI','Gestação — HBPM apenas, contraindicado DOAC e varfarina (D no 1º T, X no 3º)','Recorrência apesar de anticoagulação adequada — investigar trombofilia, malignidade oculta, aderência','Câncer + TVP — DOAC ou HBPM (CARAVAGGIO, HOKUSAI-VTE-Cancer)','Idade < 50 sem fator desencadeante — investigar trombofilia + neoplasia oculta'],
  'CHEST 2021 + ASH 2020 + Brazilian Hematology Consensus',
  'https://journal.chestnet.org/article/S0012-3692(21)01506-3/fulltext',
  '2021-08-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();

-- ============================================================
-- 27. HIPOGLICEMIA NO ADULTO
-- ============================================================
INSERT INTO public.wb_protocols (
  slug, titulo, categoria, nivel_atencao, resumo,
  criterios_diagnosticos, conduta_passos, exames_solicitar, red_flags,
  fonte, fonte_url, data_diretriz, published
) VALUES (
  'hipoglicemia',
  'Hipoglicemia no adulto',
  'Endocrinologia',
  'Atenção primária / Emergência',
  'Glicemia < 70 mg/dL com sintomas. Em diabético, principal complicação aguda de tratamento. Não-diabético: investigar causa (jejum vs reativa pós-prandial). Hipoglicemia repetida pode causar hipoglycemia unawareness.',
  $$[
    {"item":"Tríade de Whipple","def":"(1) sintomas compatíveis + (2) glicemia ≤ 70 mg/dL documentada + (3) resolução com glicose"},
    {"item":"Sintomas adrenérgicos (50-70 mg/dL)","def":"sudorese, tremor, taquicardia, palpitação, fome, ansiedade — alertam"},
    {"item":"Sintomas neuroglicopênicos (< 50 mg/dL)","def":"confusão, sonolência, alteração visual, convulsão, coma — graves"},
    {"item":"Hipoglicemia inadvertida (unawareness)","def":"perda de sintomas adrenérgicos por hipoglicemias repetidas — alta morbidade"}
  ]$$::jsonb,
  $$[
    {"passo":1,"acao":"Reconhecer e confirmar","detalhes":"HGT capilar IMEDIATO. Sintomas de hipoglicemia + valor < 70 mg/dL. Em comatoso/inconsciente: presumir e tratar até HGT pronto"},
    {"passo":2,"acao":"Paciente CONSCIENTE e cooperativo (regra dos 15)","detalhes":"15 g carboidrato simples VO: 150 mL suco de laranja OU 1 colher de açúcar OU 3 balas de açúcar OU comprimido de glicose. Esperar 15 min, recheck HGT. Se ainda < 70: repetir 15 g. Quando normalizar: refeição completa pra evitar recidiva"},
    {"passo":3,"acao":"Paciente INCONSCIENTE / impossível VO","detalhes":"Glicose 50% 50 mL IV em bolus (25 g) — preferida em hospital. Repetir se HGT não normalizar em 5-10 min. Glucagon 1 mg IM/SC/IN em domicílio (não funciona se depleção de glicogênio: etilista, jejum prolongado, hepatopatia)"},
    {"passo":4,"acao":"Manutenção em casos refratários ou drogas long-acting","detalhes":"BIC SG 5% ou 10% (50-100 mL/h) para evitar recidiva. Especialmente em sulfonilureia, glargina, hipoglicemia factícia, insulinoma. Manter HGT 1/1h durante 24h se sulfonilureia (octreotide 50 mcg SC se refratária)"},
    {"passo":5,"acao":"Suspender / reduzir agente causador","detalhes":"Reduzir dose insulina/sulfonilureia. Trocar glibenclamida por gliclazida em idoso (Beers). Educar sobre dose, horário, exercício, álcool"},
    {"passo":6,"acao":"Investigar causa em NÃO-diabético","detalhes":"Hipoglicemia em jejum: insulinoma, insuficiência adrenal/hipofisária, sepse, hepatopatia, drogas (sulfa, salicilato, álcool, quinino, etc). Hipoglicemia reativa pós-prandial: pós-bariátrica (dumping tardio), pré-DM. Coletar amostra DURANTE hipoglicemia para insulina, peptídeo C, beta-hidroxibutirato, sulfa screening, cortisol"},
    {"passo":7,"acao":"Educação do paciente diabético","detalhes":"Reconhecer sintomas, sempre carregar carboidrato rápido, monitorar HGT, ajustar dose conforme exercício, evitar álcool em jejum, usar pulseira de alerta. Em unawareness: reduzir alvo glicêmico por 2-3 sem (HbA1c 7-7,5) para recuperar percepção"},
    {"passo":8,"acao":"Hipoglicemia recorrente em DM1: avaliar tecnologia","detalhes":"Sensor contínuo (CGM) reduz hipoglicemia em 30-50%. Bomba de insulina com algoritmo híbrido (sistema fechado parcial). Glucagon nasal de emergência"}
  ]$$::jsonb,
  ARRAY['HGT capilar (sempre antes e durante tratamento)','Glicemia laboratorial','Em não-diabético: insulina + peptídeo C + pró-insulina + beta-hidroxibutirato + sulfa urina (DURANTE hipo)','Cortisol matinal','TSH, T4 livre','ALT, AST, função hepática (etilista, hepatopatia)','Função renal','Eletrólitos','Hemograma','Lactato (sepse)','Glicogênio se Glucagon falhou (depleção)','Beta-HCG'],
  ARRAY['Hipoglicemia em paciente em uso de sulfonilureia (long-acting — 24-72h em internação)','Insulina glargina/degludec (efeito 24-42h)','Etilismo agudo + jejum (depleção glicogênio — glucagon não funciona)','Hipoglicemia + hipotensão refratária (insuficiência adrenal — cortisol baixo, hidrocortisona 100 mg IV imediato)','Hipoglicemia + paciente oncológico em quimio (insulinoma metastático? lise tumoral?)','Hipoglicemia recorrente sem causa em não-diabético (insulinoma — investigar com jejum prolongado supervisionado)','Hipoglicemia neonatal (RN < 47 mg/dL — protocolo pediátrico)','Coma + hipoglicemia + déficit focal (descartar AVC concomitante após corrigir)'],
  'ADA 2024 + Endocrine Society 2009 + SBD',
  'https://diabetesjournals.org/care/article/47/Supplement_1/S1/153951',
  '2024-01-01',
  true
) ON CONFLICT (slug) DO UPDATE SET conduta_passos = EXCLUDED.conduta_passos, updated_at = now();
