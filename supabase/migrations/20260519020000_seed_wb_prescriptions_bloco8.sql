-- PreceptorBook: Prescrições Bloco 8 (5 doenças)
-- CA mama adjuvante, dermatite atópica, glaucoma, escabiose, diarreia aguda peds

-- 1. CA MAMA RH+ — adjuvante
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'ca-mama-adjuvante-rh',
  'CA mama RH+ — terapia hormonal adjuvante',
  'Câncer de mama',
  'CA mama receptor hormonal+ (estrogênio e/ou progesterona+) pós-cirurgia ± quimio ± radio',
  'Ambulatorial (oncologia)',
  'Tamoxifeno em pré-menopausa, inibidor de aromatase em pós-menopausa. 5-10 anos. Reduz recidiva 40-50%, mortalidade 30%.',
  $$[
    {"droga":"Tamoxifeno (pré-menopausa)","dose":"20 mg/dia","via":"VO","duracao":"5 anos (estender 10a se alto risco — ATLAS, aTTom)","obs":"PRIMEIRA ESCOLHA. Anticoncepção não-hormonal obrigatória. Avisar sobre fogachos, sangramento, risco TEV/CA endométrio","drug_slug":"tamoxifeno"},
    {"droga":"Anastrozol (pós-menopausa)","dose":"1 mg/dia","via":"VO","duracao":"5-10 anos","obs":"PRIMEIRA ESCOLHA pós-menopausa. Superior a tamoxifeno (ATAC). Cuidado osteoporose","drug_slug":"anastrozol"},
    {"droga":"Letrozol / exemestano (alternativas IA)","dose":"letrozol 2,5 mg/dia OU exemestano 25 mg/dia","via":"VO","obs":"alternativas equivalentes ao anastrozol — escolha por perfil tolerância individual"},
    {"droga":"Switch tamoxifeno → IA (pós-menopausa após 2-3a tamoxifeno)","obs":"se virou pós-menopausa durante tratamento ou para reduzir efeitos colaterais — evidência (BIG 1-98)"},
    {"droga":"Supressão ovariana (em pré-menopausa alto risco)","dose":"goserelina 3,6 mg SC mensal OU ooforectomia","obs":"associar a tamoxifeno OU IA em pré-menopausa de muito alto risco (SOFT/TEXT trials). Decisão multidisciplinar"},
    {"droga":"CDK4/6 inibidor (alto risco)","dose":"abemaciclibe 150 mg 12/12h × 2 anos (em adjuvante alto risco — monarchE)","obs":"em N+ ou alto risco. Caro, neutropenia, diarreia, TEV"},
    {"droga":"Cálcio + vit D (em IA)","dose":"cálcio 1000-1200 mg + vit D 800-2000 UI/dia","obs":"obrigatório com IA (acelera osteoporose)","drug_slug":"colecalciferol"},
    {"droga":"Bisfosfonato (em IA com baixa DMO)","dose":"alendronato 70 mg/sem OU ácido zoledrônico 4 mg IV cada 6 meses","obs":"se DEXA com osteoporose ou alto risco. Ácido zoledrônico em adjuvante reduz recidiva óssea","drug_slug":"alendronato"}
  ]$$::jsonb,
  ARRAY[
    'STATUS HORMONAL: definir status RH e HER2 ANTES de iniciar terapia adjuvante',
    'PRÉ vs PÓS-MENOPAUSA: definir status menstrual + FSH/LH em casos atípicos. Decisão muda tratamento',
    'TRATAMENTO INTERDISCIPLINAR: cirurgia + radio + quimio (se indicada) + hormônioterapia adjuvante. Ordem e timing definidos por oncologista',
    'EFEITOS COLATERAIS são frequentes — manejar para garantir adesão (interrupção precoce reduz benefício)',
    'GINECOLOGISTA: avaliação anual durante uso (USG transvaginal em tamoxifeno, sintomas vasomotores)',
    'OSTEOPOROSE em IA: DEXA basal + a cada 1-2 anos. Considerar bisfosfonato precoce',
    'REAVALIAR a cada 5 anos: continuar até 10 se alto risco; suspender se baixo risco e sem evidência'
  ],
  ARRAY['Mamografia anual (mama remanescente)','RM mama anual em alto risco (BRCA, mama densa)','USG transvaginal anual em tamoxifeno','DEXA basal + a cada 1-2 anos em IA','Perfil lipídico em IA','TGO/TGP semestral','Avaliação ginecológica anual','Sintomas TEV (tamoxifeno) / fratura (IA)'],
  ARRAY['TAMOXIFENO + ISRS POTENTE INIBIDOR CYP2D6 (paroxetina, fluoxetina) = REDUZ EFICÁCIA — preferir sertralina, escitalopram, venlafaxina','TAMOXIFENO em mulher com história TEV/AVC: contraindicado. Alternativa em pré-menopausa: supressão ovariana + IA','IA em mulher pré-menopausa SEM SUPRESSÃO OVARIANA = ineficaz/contraindicado (ovário responde com mais estrogênio)','SUSPENSÃO PRECOCE compromete benefício — discutir efeitos colaterais e estratégias antes de descontinuar','GESTAÇÃO PÓS-CA MAMA: discutir com onco. Anticoncepção não-hormonal durante e ≥3 meses pós-tamoxifeno','OBESIDADE + IA = aromatase periférica continua produzindo estrogênio — perda de peso é importante'],
  'NCCN 2024 / ESMO 2023',
  'https://www.nccn.org/guidelines',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. DERMATITE ATÓPICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'dermatite-atopica',
  'Dermatite atópica — manejo',
  'Dermatite atópica',
  'Eczema crônico recidivante + prurido + xerose + distribuição típica + atopia familiar',
  'Ambulatorial',
  'Hidratação 2-3x/dia + corticoide tópico em crise + inibidor calcineurina manutenção. Em casos graves: dupilumabe.',
  $$[
    {"droga":"Hidratante / emoliente (BASE — todos os pacientes)","dose":"aplicar 2-3x/dia em pele inteira (mín 250-500 g/sem adulto)","via":"tópico","duracao":"contínuo, vitalício","obs":"BASE DO TRATAMENTO. Sem hidratação adequada = recidivas frequentes. Preferir produtos sem perfume/álcool/parabeno"},
    {"droga":"Corticoide tópico — crise","dose":"baixa potência (hidrocortisona 1%) face/dobras/peds; média (mometasona 0,1%) tronco; alta (betametasona 0,1%) pés/mãos. 1-2x/dia","via":"tópico","duracao":"≤2 sem em crise","obs":"REGRA fingertip unit. EVITAR potência alta em face/dobras/peds. Step-down após melhora","drug_slug":"betametasona-topica"},
    {"droga":"Tacrolimo / pimecrolimo (inibidor calcineurina)","dose":"tacrolimo 0,03% (peds 2-15a) ou 0,1% (>16a) — 2x/dia","via":"tópico","obs":"manutenção em face/dobras (sem atrofia). 1ª linha em pele fina. Sensação ardência inicial. Black Box risco linfoma (controverso, evidência fraca)"},
    {"droga":"Anti-histamínico para prurido noturno (uso curto)","dose":"hidroxizina 25 mg ou difenidramina 25-50 mg ao deitar","via":"VO","duracao":"crise","obs":"sedação ajuda no sono. NÃO em manutenção em peds (paradoxal)","drug_slug":"difenidramina"},
    {"droga":"ATB tópico/sistêmico (infecção secundária)","dose":"tópico mupirocina 2% 8/8h × 5d. Sistêmico: cefalexina 500 mg 6/6h × 7d","obs":"S. aureus comum colonizador → infecção. Não usar ATB profilático rotineiro","drug_slug":"cefalexina"},
    {"droga":"Banhos de imersão diluída em hipoclorito (bleach baths)","dose":"½ xícara 2,5% hipoclorito em banheira cheia × 5-10 min, 2x/sem","obs":"reduz colonização S. aureus. Evidência moderada"},
    {"droga":"Dupilumabe (DA grave refratária)","dose":"600 mg SC ATAQUE → 300 mg cada 2 sem","via":"SC","obs":"em DA grave refratária. CARO. Anti-IL4Rα — bloqueia IL-4/IL-13. Conjuntivite é efeito adverso comum"},
    {"droga":"Corticoide sistêmico (uso EXCEPCIONAL)","obs":"NÃO ROTINEIRO. Apenas em crise grave incapacitante curtíssimo prazo (5-7d). Rebote frequente"},
    {"droga":"Fototerapia (UVB banda estreita)","obs":"DA moderada-grave refratária a tópicos. 3x/sem por 2-3 meses"}
  ]$$::jsonb,
  ARRAY[
    'BANHO MORNO (não quente) ≤10 min + sabonete suave/syndet, secar SEM esfregar (toalha) + APLICAR HIDRATANTE em pele ainda úmida (3 min após banho)',
    'EVITAR: sabão alcalino, perfume, lã, calor extremo, suor não enxaguado',
    'IDENTIFICAR GATILHOS: alergeno alimentar (leite, ovo em peds), ácaro, pólen, estresse, cosmético',
    'ALÉRGENOS ALIMENTARES NÃO SÃO CAUSA HABITUAL em DA — testar apenas se suspeita clínica clara, NÃO restringir empiricamente (déficit nutricional)',
    'PEDS: introdução precoce de alimentos alergênicos (amendoim 4-6 meses) reduz incidência de alergia (LEAP study)',
    'COMORBIDADES: rinite alérgica, asma, alergia alimentar — investigar e tratar',
    'PSICOSSOCIAL: prurido afeta sono, escola/trabalho, autoestima — apoio importante'
  ],
  ARRAY['IgE total (suporte ao diagnóstico — não obrigatório)','Hemograma (eosinofilia)','Cultura cutânea se infecção','Testes alérgicos (RAST/prick) em casos selecionados','Avaliação nutricional em peds com restrição'],
  ARRAY['CORTICOIDE TÓPICO POTENTE EM FACE/DOBRAS/PEDS = atrofia, telangiectasia, dermatite perioral. Limitar uso, preferir baixa potência','SÍNDROME DA RETIRADA DE CORTICOIDE: paciente que usou potente cronicamente pode ter rebote → rotação progressiva para menos potente + inibidor calcineurina','ECZEMA HERPETICUM: piora súbita + lesões em saca-bocado + febre = INFECÇÃO HSV em DA = EMERGÊNCIA dermatológica (aciclovir IV)','EM PEDS: corticoide CRÔNICO pode afetar crescimento (raro mas existe). Usar potências baixas','MANUTENÇÃO COM TACROLIMO 2x/sem nos locais frequentemente afetados (proactive therapy) reduz recidivas (PETITE study)','DUPILUMABE: caro mas mudou prognóstico de DA grave — discutir acesso (judicialização)'],
  'AAD 2014 / EuroGuiDerm 2022',
  'https://www.aad.org/member/clinical-quality/guidelines/atopic-dermatitis',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. GLAUCOMA DE ÂNGULO ABERTO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'glaucoma-angulo-aberto',
  'Glaucoma de ângulo aberto — manejo crônico',
  'Glaucoma',
  'PIO elevada + alteração disco óptico (excavação) + perda campo visual em ângulo iridocorneal aberto',
  'Ambulatorial (oftalmologia)',
  'Reduzir PIO em ≥25%. Análogo prostaglandina é 1ª escolha. Adicionar BB se necessário. Cirurgia/laser em refratário.',
  $$[
    {"droga":"Latanoprosta (1ª escolha)","dose":"1 gota 1x/dia (NOITE)","via":"oftálmico","obs":"PRIMEIRA LINHA — reduz PIO ~30%, 1x/dia. Alternativas: bimatoprosta, travoprosta. Avisar sobre hiperpigmentação íris + crescimento cílios","drug_slug":"latanoprosta"},
    {"droga":"Timolol 0,5% (associação ou alternativa)","dose":"1 gota 12/12h","via":"oftálmico","obs":"associar se latanoprosta não atinge alvo. Cuidado em asma/DPOC/cardiopata (absorção sistêmica). Oclusão punctal","drug_slug":"timolol-colirio"},
    {"droga":"Brimonidina (alfa-2 agonista)","dose":"1 gota 12/12h","via":"oftálmico","obs":"alternativa a BB em paciente com asma. Reduz produção + aumenta drenagem. Sonolência, boca seca"},
    {"droga":"Dorzolamida (inibidor anidrase carbônica tópico)","dose":"1 gota 12/12h ou 8/8h","via":"oftálmico","obs":"alternativa. Reduz produção humor aquoso. Combinada com timolol (Cosopt) é prática"},
    {"droga":"Acetazolamida VO (refratário ou pré-cirurgia)","dose":"250 mg 6/6h ou 500 mg 12/12h LP","via":"VO","obs":"reservada — muitos efeitos sistêmicos (parestesia, fadiga, cálculo renal). Curto prazo"},
    {"droga":"Pilocarpina (mióticos — 4ª linha)","dose":"1 gota 4x/dia","via":"oftálmico","obs":"raramente usado hoje. Visão borrada, miose"},
    {"droga":"Trabeculoplastia a laser (SLT — Selective Laser Trabeculoplasty)","obs":"alternativa a colírio em alguns pacientes. LiGHT trial: SLT como 1ª linha é viável. Reduz PIO 20-30%, dura 3-5 anos"},
    {"droga":"Cirurgia (trabeculectomia, MIGS)","obs":"em glaucoma refratário ou progressão apesar máximo tratamento clínico. Trabeculectomia é padrão; MIGS são minimamente invasivas"}
  ]$$::jsonb,
  ARRAY[
    'OFTALMOLOGISTA é quem deve seguir — médico geral apenas garantir adesão e renovar receita',
    'CAMPO VISUAL automatizado (Humphrey) e OCT do nervo óptico a cada 6-12 meses — monitor progressão',
    'PIO ALVO: redução ≥25% basal OU <18 mmHg em geral; pode ser <12 em glaucoma avançado',
    'OCLUSÃO PUNCTAL após instilar (1-2 min) reduz absorção sistêmica em 50-70%',
    'ADESÃO É CRÍTICA — paciente assintomático, dificulta. Educação contínua',
    'PERDA VISUAL POR GLAUCOMA É IRREVERSÍVEL — diagnóstico precoce é chave',
    'RASTREIO em ≥40a + fator de risco (familiar 1º grau, raça negra, diabetes, miopia alta)'
  ],
  ARRAY['PIO (tonometria — Goldmann padrão ouro)','Gonioscopia (avaliar ângulo)','Disco óptico (avaliação direta + OCT)','Campo visual (perimetria automatizada)','Espessura corneana central (paquimetria — corrige PIO)','Fundoscopia direta'],
  ARRAY['BB TÓPICO + ASMA/DPOC GRAVE = broncoespasmo. Preferir alfa-agonista (brimonidina) ou inibidor anidrase carbônica','BB TÓPICO + BRADICARDIA/BAV/IC: cuidado — absorção sistêmica. Oclusão punctal mandatória','GLAUCOMA AGUDO DE ÂNGULO FECHADO é EMERGÊNCIA OFTALMOLÓGICA — dor + cefaleia + vômito + visão borrada com halos. PIO 50-80. Tratamento agudo: pilocarpina + timolol + brimonidina + acetazolamida + manitol IV. ENCAMINHAR URGENTE','EM PACIENTE COM HIPERTENSÃO OCULAR (PIO alta sem dano): tratar se alto risco (paquimetria fina, raça negra, idade)','SUSPENSÃO ABRUPTA do colírio = elevação PIO rebote — orientar continuidade','PROGRESSÃO APESAR de tratamento máximo: SLT → cirurgia. Não esperar perda visual completa'],
  'AAO 2020 / SBG 2023',
  'https://www.aao.org/preferred-practice-pattern/primary-open-angle-glaucoma-ppp',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. ESCABIOSE
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'escabiose-sarna',
  'Escabiose (sarna) — manejo',
  'Escabiose',
  'Prurido intenso noturno + lesões pápulo-vesiculares em espaços interdigitais, axila, virilha, mama, pênis + contato com paciente afetado',
  'Ambulatorial',
  'Permetrina 5% tópica é primeira escolha. Tratar TODOS contactantes simultaneamente. Em casos especiais: ivermectina VO.',
  $$[
    {"droga":"Permetrina 5% creme (1ª escolha)","dose":"aplicar do PESCOÇO AOS PÉS à noite, deixar 8-14h, lavar pela manhã. REPETIR em 7-14 dias","via":"tópico","duracao":"1 noite + repetição em 7-14d","obs":"PRIMEIRA ESCOLHA. Tratar TODOS contactantes (família, parceiros) simultaneamente, mesmo assintomáticos. Lavar roupas/lençóis 60°C","drug_slug":"permetrina"},
    {"droga":"Ivermectina VO (alternativa ou casos especiais)","dose":"200 mcg/kg dose única (~12 mg adulto 60 kg). Repetir em 7-14 dias","via":"VO","duracao":"1 dose + repetição","obs":"em: 1) institucionalizado / surto (mais prático), 2) escabiose CROSTOSA (Norueguesa) — 3-7 doses associadas a permetrina, 3) intolerância tópica, 4) refratário","drug_slug":"ivermectina"},
    {"droga":"Anti-histamínico (prurido)","dose":"hidroxizina 25 mg ou difenidramina 25-50 mg ao deitar","via":"VO","obs":"sintomático. Prurido pode persistir 4 sem após cura — não confundir com falha","drug_slug":"difenidramina"},
    {"droga":"Corticoide tópico (eczematização secundária)","dose":"hidrocortisona 1% 2x/dia × 1 sem","via":"tópico","obs":"para reação inflamatória residual. Não é tratamento da escabiose"},
    {"droga":"ATB se infecção secundária","dose":"cefalexina 500 mg 6/6h × 7d","obs":"impetiginização (S. aureus, S. pyogenes)","drug_slug":"cefalexina"},
    {"droga":"Escabiose crostosa (Norueguesa)","obs":"em imunossuprimido — alta carga parasitária, MUITO contagiosa. Permetrina + ivermectina simultâneas + isolamento. Repetir várias vezes"}
  ]$$::jsonb,
  ARRAY[
    'TRATAR TODOS CONTACTANTES DOMICILIARES SIMULTANEAMENTE — sem isso, reinfecção certa. Mesmo se assintomáticos (incubação 4-6 sem)',
    'LAVAGEM: roupas, lençóis, toalhas, brinquedos de pelúcia — ÁGUA QUENTE (≥60°C) ou fervura. Itens não laváveis: SACO PLÁSTICO FECHADO 3-7 dias (ácaro morre sem hospedeiro humano)',
    'PRURIDO PERSISTE 2-4 SEMANAS APÓS CURA — orientar paciente. Não é falha de tratamento',
    'EM PEDS <2 MESES: discutir com derma/peds (permetrina pode ser usada com cautela)',
    'EM GESTANTE/LACTANTE: permetrina é 1ª escolha (categoria B)',
    'NOTIFICAR (depende município) em surto institucional',
    'CONTROLE de cura: avaliar 4 sem após — sem novos prurido / lesões = curado'
  ],
  ARRAY['Diagnóstico CLÍNICO + epidemiológico (geralmente suficiente)','Dermatoscopia (encontrar túnel)','Raspado cutâneo + microscopia (Sarcoptes scabiei)','Em escabiose crostosa: pesquisa hospedeiro com ácaros (alta carga)'],
  ARRAY['REINFECÇÃO É REGRA SE NÃO TRATAR CONTACTANTES — orientar fortemente','APLICAR EM PELE SECA, NÃO LOGO APÓS BANHO — penetração melhor com pele seca','PRURIDO PERSISTENTE >4 sem: 1) reinfecção (avaliar contactantes/ambiente), 2) eczematização → corticoide tópico, 3) escabiose crostosa subdiagnosticada','EM IMUNOSSUPRIMIDO: pode ser ESCABIOSE CROSTOSA (Norueguesa) — milhões de ácaros, alta contagiosidade. Isolamento + tratamento múltiplo','SARNA SEXUALMENTE TRANSMITIDA: em adulto sexualmente ativo — investigar/orientar sobre outras DSTs','CRIANÇA EM CRECHE: comunicar instituição, tratar contactantes próximos'],
  'IDSA 2018 / SBPed 2022',
  'https://www.idsociety.org/practice-guideline/scabies/',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. DIARREIA AGUDA PEDIÁTRICA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'diarreia-aguda-peds',
  'Diarreia aguda — manejo pediátrico',
  'Diarreia',
  'Criança com diarreia <14 dias (geralmente viral — rotavírus, norovírus)',
  'Ambulatorial / PA',
  'Hidratação oral é PRIMEIRA. Avaliação grau de desidratação (Plano A/B/C). Manter alimentação. Zinco em <5a.',
  $$[
    {"droga":"PLANO A — sem desidratação (95% dos casos)","obs":"SRO após cada evacuação: <1a 50-100 mL; 1-10a 100-200 mL; >10a 200 mL ou ad libitum. MANTER alimentação habitual + leite materno","drug_slug":"soro-reidratacao-oral"},
    {"droga":"PLANO B — alguma desidratação (turgor diminuído, mucosa seca, taquicardia leve, irritabilidade)","obs":"SRO 75 mL/kg em 4 HORAS sob observação. Reavaliar a cada 2h. Se aceitar bem e melhora: alta com Plano A. Se piora ou vômito incoercível: Plano C","drug_slug":"soro-reidratacao-oral"},
    {"droga":"PLANO C — desidratação grave (letargia, choque, anúria)","dose":"SF 0,9% IV: <12 meses 100 mL/kg em 6h (30 mL/kg em 1h + 70 mL/kg em 5h); ≥12 meses 100 mL/kg em 3h (30 mL/kg em 30 min + 70 mL/kg em 2,5h)","via":"IV","obs":"INTERNAR. Reavaliar a cada 30 min. Quando alerta + aceita: trocar para SRO"},
    {"droga":"Zinco","dose":"<6 meses 10 mg/dia × 14 dias; ≥6 meses 20 mg/dia × 14 dias","via":"VO","obs":"reduz duração da diarreia + reduz recorrência nos 2-3 meses seguintes (OMS recomenda em todo <5a)"},
    {"droga":"Ondansetrona (vômito persistente)","dose":"<15 kg 2 mg; 15-30 kg 4 mg; >30 kg 8 mg — DOSE ÚNICA VO","via":"VO (orodispersível)","obs":"reduz necessidade de hidratação IV em paciente com vômito. Não em uso prolongado","drug_slug":"ondansetrona"},
    {"droga":"Probióticos (adjuvantes)","dose":"Saccharomyces boulardii 250-500 mg 12/12h × 5d OU Lactobacillus rhamnosus GG","via":"VO","obs":"reduz duração ~1 dia em diarreia infecciosa. Evidência moderada"},
    {"droga":"ATB — APENAS em indicações específicas","obs":"NÃO ROTINEIROS. Indicações: cólera, shigelose grave, salmonelose em <3m ou imunossuprimido, disenteria com sangue + febre. Azitromicina 10 mg/kg/dia × 3d é boa primeira escolha"},
    {"droga":"NÃO USAR antiespasmódicos / loperamida em <12 anos","obs":"contraindicados — risco íleo paralítico, megacólon tóxico em criança. Em adulto: loperamida pode ser usada se sem febre/sangue"}
  ]$$::jsonb,
  ARRAY[
    'AVALIAÇÃO DE DESIDRATAÇÃO: sinais — turgor cutâneo, mucosa, lágrima, fontanela, FC, FR, perfusão, diurese, peso atual vs habitual. Plano (A/B/C) define conduta',
    'MANTER LEITE MATERNO + ALIMENTAÇÃO HABITUAL (NÃO RESTRINGIR) — pausar somente em vômito incoercível. Evitar suco/refrigerante (osmoticidade alta piora)',
    'EM PEDS SAUDÁVEL DOENÇA AUTOLIMITADA — geralmente 5-7 dias. Tratamento é hidratação',
    'NÃO USAR ANTI-DIARREICOS em peds <12a (loperamida contraindicada)',
    'INTERNAR: desidratação grave, vômito incoercível, sangue + febre alta, alteração consciência, comorbidade, falha hidratação oral',
    'PREVENÇÃO: lavagem mãos, água tratada, alimentação adequada, vacina rotavírus (ROTA 2 doses no SUS — esquema 6m e 4m)',
    'AOS PAIS: orientar SINAIS DE ALARME — letargia, sem urinar 6h, sangue em fezes, febre alta, vômito persistente, abdome distendido'
  ],
  ARRAY['Geralmente CLÍNICO — sem exames','EAS / EPF se diarreia >14 dias ou imunossuprimido','Coprocultura se sangue/febre/imunossuprimido/grave','Hemograma + eletrólitos em desidratação grave','Gasometria em choque (acidose)','Glicemia capilar (hipoglicemia em criança em jejum prolongado)','Lactato (perfusão)'],
  ARRAY['INTOLERÂNCIA À LACTOSE TRANSITÓRIA pós-diarreia (1-2 sem) — pode prolongar diarreia. Trocar fórmula sem lactose temporariamente em peds com diarreia >7d','SÍNDROME HEMOLÍTICO-URÊMICA (SHU) por E. coli O157:H7: diarreia sanguinolenta + IRA + plaquetopenia + anemia hemolítica. EVITAR ATB (pode piorar liberando toxina shiga)','VOLUMETRIA EM PEDS: peso é GUIA. Perda 5% = leve, 10% = moderada, 15% = grave','EM RN: desidratação progride RAPIDAMENTE — limiar baixo para internar','VACINA ROTAVÍRUS reduziu hospitalização por 70-90% no Brasil','EVITAR EXCESSO DE LÍQUIDO HIPOTÔNICO: água pura sem eletrólitos pode causar hiponatremia em peds desidratado'],
  'OMS Diarreia 2017 / SBP 2022',
  'https://www.sbp.com.br/imprensa/detalhe/nid/diarreia-aguda',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
