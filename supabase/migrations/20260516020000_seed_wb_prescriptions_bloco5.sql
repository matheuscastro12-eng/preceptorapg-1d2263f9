-- PreceptorBook: Prescrições Bloco 5 (6 doenças)
-- Anemia ferropriva, influenza, TB pulmonar, HIV PEP, pré-eclâmpsia/eclâmpsia, planejamento familiar

-- 1. ANEMIA FERROPRIVA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'anemia-ferropriva',
  'Anemia ferropriva — manejo',
  'Anemia',
  'Hb baixa + ferritina < 30 ng/mL (ou < 100 com inflamação) + saturação transferrina < 20%',
  'Ambulatorial',
  'Investigar CAUSA antes de repor (sangramento oculto em ≥40a). Sulfato ferroso 100-200 mg ferro elementar/dia, dias alternados é tão eficaz quanto diário.',
  $$[
    {"droga":"Sulfato ferroso (1ª escolha)","dose":"100-200 mg ferro elementar/dia (1-2 cp 60mg 3x/dia OU 1 cp em DIAS ALTERNADOS — igual eficácia, melhor tolerância)","via":"VO em jejum + vit C/suco cítrico","frequencia":"diária ou dias alternados","duracao":"3 meses APÓS Hb normalizar (repor estoque)","obs":"resposta esperada ↑Hb 1 g/dL em 2-4 sem. Reavaliar em 4 sem","drug_slug":"sulfato-ferroso"},
    {"droga":"Ferro polimaltose (alternativa oral)","dose":"100 mg ferro elementar/dia","via":"VO (pode com refeição)","obs":"melhor tolerância GI que sulfato; eficácia similar"},
    {"droga":"Ferro IV (sacarato/carboximaltose)","dose":"sacarato: 100-200 mg IV cada 1-3 dias até dose total. Carboximaltose: 750-1000 mg IV dose única","via":"IV","obs":"INDICADO em: 1) intolerância oral, 2) má absorção (DII, gastrectomia, bariátrica), 3) DRC com EPO, 4) gestante >34 sem com anemia grave, 5) refratário, 6) necessidade reposição rápida (pré-cirurgia)"},
    {"droga":"Vit C (potencializa absorção)","dose":"500 mg junto ao ferro","via":"VO","obs":"opcional — suco de laranja é equivalente"},
    {"droga":"Transfusão de hemácias","obs":"reservada para anemia sintomática + Hb <7 (geral) ou <8 (cardiopata, idoso). Não corrige causa, é ponte"}
  ]$$::jsonb,
  ARRAY[
    'INVESTIGAR CAUSA — anemia ferropriva é SINTOMA, não diagnóstico. ≥40a com ferropriva: investigar TGI (EDA + colono) — descartar CA',
    'CAUSAS comuns: 1) menstruação aumentada (mulher pré-menopausa), 2) gestação, 3) sangramento oculto TGI (úlcera, AINE, neoplasia), 4) má absorção (celíaca, H. pylori, bariátrica), 5) hookworm em ambientes endêmicos',
    'TOMAR EM JEJUM + vit C — laticínios/café/chá/IBP REDUZEM absorção em 50%',
    'ESCURECIMENTO DE FEZES: orientar paciente que é normal (não confundir com melena)',
    'CAUSA + REPOSIÇÃO simultâneos — não esperar terminar investigação para começar ferro',
    'Em RN/lactente: leite materno 4-6 meses + introdução alimentar oportuna previne'
  ],
  ARRAY['Hemograma com VCM, RDW, índices','Ferritina sérica + saturação transferrina + ferro sérico + TIBC','Reticulócitos','EAS (hematúria oculta)','Sangue oculto fezes (3 amostras)','EDA + colono em ≥40a, sintomas, refratário','Anti-transglutaminase (celíaca)','Pesquisa H. pylori','Cinética para investigar (gestação, perda crônica)','Hb fetal e eletroforese se talassemia suspeita','Beta-HCG mulher idade fértil'],
  ARRAY['NÃO IGNORAR ANEMIA ASSINTOMÁTICA EM ≥40a — pode ser CA cólon/estômago oculto','Ferritina pode estar FALSAMENTE NORMAL em inflamação (PCR alto) — usar saturação <20% como adjuvante; alvo ferritina ≥100 em paciente inflamado','TRANSFUSÃO em paciente jovem assintomático com ferropriva crônica é DESNECESSÁRIA — ferro IV resolve em horas-dias','REPOR ALÉM da normalização da Hb — manter por 3 meses APÓS para refazer estoque','EM IRC com EPO: SEM FERRO ADEQUADO, EPO não funciona — ferro IV é regra'],
  'OMS 2017 / ABEM 2024',
  'https://www.who.int/publications/i/item/9789241549912',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 2. INFLUENZA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'influenza-tratamento',
  'Influenza — tratamento e profilaxia',
  'Influenza',
  'Síndrome gripal (febre + sintoma respiratório + ≥1 sintoma sistêmico) em situação epidemiológica',
  'Ambulatorial / PA',
  'Oseltamivir <48h sintomas em alto risco. Tratar gestante, criança <2a, ≥60a, comorbidade, imunossuprimido — mesmo após 48h.',
  $$[
    {"droga":"Oseltamivir (1ª linha) — TRATAMENTO","dose":"75 mg 12/12h × 5 dias (peso-ajustado em peds: ≤15kg 30, 16-23 45, 24-40 60, >40 75 mg)","via":"VO","frequencia":"12/12h","duracao":"5 dias","obs":"INICIAR <48h sintomas (benefício maior) — em alto risco, tratar mesmo >48h","drug_slug":"oseltamivir"},
    {"droga":"Oseltamivir — PROFILAXIA pós-exposição","dose":"75 mg/dia × 7-10 dias","via":"VO","obs":"em alto risco com exposição domiciliar/profissional. NÃO substitui vacina"},
    {"droga":"Vacina influenza ANUAL","dose":"intramuscular","obs":"GRUPOS PRIORITÁRIOS no SUS: ≥60a, gestante/puérpera, criança 6m-6a, profissional saúde, comorbidade, indígena, professor, gente em situação de rua, sistema prisional, FFAA. Aplicação anual — vírus muta"},
    {"droga":"Sintomáticos","dose":"paracetamol 500-1000 mg 6/6h (febre, mialgia)","via":"VO","obs":"hidratação, repouso. EVITAR AAS em <16 anos (Reye)"},
    {"droga":"Internação + suporte (SRAG)","obs":"sinais alarme: dispneia, SatO2 <95%, taquipneia, hipotensão, alteração consciência, descompensação comorbidade. CTI se hipoxemia refratária / VM"},
    {"droga":"Corticoide sistêmico — NÃO ROTINEIRO","obs":"evitar em influenza não complicada — pode prolongar replicação viral. Em SRAG grave: discutir caso a caso"}
  ]$$::jsonb,
  ARRAY[
    'COLETAR PCR/IFD se SRAG/internação/grupo prioritário (não atrasar tratamento)',
    'NÃO esperar resultado para tratar suspeita em alto risco (gestante, criança, imunossuprimido)',
    'ISOLAMENTO respiratório (gotícula) em hospital. Em casa: 7 dias do início sintomas',
    'PARACETAMOL > AAS em peds (Reye)',
    'PROFILAXIA POR VACINA: campanha anual abril-maio é estratégia primária — eficácia 40-60% mas reduz desfechos graves'
  ],
  ARRAY['PCR painel viral (SRAG/internação/grupo prioritário) — coletar em 5 dias do início','Hemograma + PCR','Rx tórax (suspeita pneumonia bacteriana secundária)','Gasometria + lactato em SRAG','Função renal + hepática se grave','SatO2'],
  ARRAY['GESTANTE com influenza tem MORTALIDADE MAIOR (especialmente 2º-3º trim) — TRATAR IMEDIATAMENTE com oseltamivir','SUPERINFECÇÃO BACTERIANA (S. aureus, S. pneumoniae) em queda do 5º-7º dia: nova febre + piora — adicionar ATB','SRAG (síndrome respiratória aguda grave): SatO2 <95%, FR >24, hipotensão → internar','EM CRIANÇA: alerta para eventos neuropsiquiátricos com oseltamivir (Japão) — orientar família observar comportamento','VACINA NÃO CAUSA GRIPE — desinformação. Vacina é vírus inativado/fragmentado'],
  'Diretriz MS Influenza 2024 / IDSA 2018',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/i/influenza',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 3. TUBERCULOSE PULMONAR
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'tuberculose-pulmonar',
  'Tuberculose pulmonar — esquema básico (PNCT)',
  'Tuberculose',
  'TB pulmonar confirmada (baciloscopia ou TRM-TB ou cultura) ou clinico-radiologicamente compatível',
  'Ambulatorial / Atenção Básica',
  'RHZE 2 meses + RH 4 meses (PNCT). DOT (dose observada) é GOLD STANDARD — reduz abandono.',
  $$[
    {"droga":"Esquema básico — Fase intensiva (2 meses)","dose":"RHZE em comprimido único pela faixa de peso: <20kg 1 cp/4kg; 20-35kg 2 cp; 36-50kg 3 cp; 51-70kg 4 cp; >70kg 5 cp","via":"VO em jejum","frequencia":"1x/dia (manhã)","duracao":"2 meses","obs":"RHZE = Rifampicina 150 + Isoniazida 75 + Pirazinamida 400 + Etambutol 275 mg","drug_slug":"rifampicina"},
    {"droga":"Esquema básico — Fase manutenção (4 meses)","dose":"RH em comprimido único: 36-50kg 2 cp; 51-70kg 3 cp; >70 4 cp","via":"VO em jejum","frequencia":"1x/dia","duracao":"4 meses","obs":"RH = Rifampicina 150 + Isoniazida 75 mg","drug_slug":"isoniazida"},
    {"droga":"Piridoxina (B6) — profilaxia neuropatia","dose":"25-50 mg/dia","via":"VO","obs":"OBRIGATÓRIA em: gestante, lactante, etilista, desnutrido, DM, IRC, HIV, idoso"},
    {"droga":"Esquema TB + HIV (TARV simultâneo)","obs":"INICIAR TARV em até 2-8 semanas após início TB. Se CD4 <50: iniciar TARV em 2 semanas. ATENÇÃO: rifampicina REDUZ DOLUTEGRAVIR — dose dupla (50 mg 12/12h) ou trocar para esquema com efavirenz"},
    {"droga":"Esquema MDR-TB (multirresistente)","obs":"resistência a R+H — esquema individualizado com bedaquilina + linezolida + delamanida + outras. ENCAMINHAR centro referência"}
  ]$$::jsonb,
  ARRAY[
    'NOTIFICAÇÃO COMPULSÓRIA — SINAN. Investigação de contatos obrigatória',
    'TRATAMENTO DIRETAMENTE OBSERVADO (DOT/TDO) é PADRÃO OURO — reduz abandono e MDR',
    'BACILOSCOPIA mensal até negativar (esperar negativar 2-3 meses)',
    'GESTAÇÃO: RHZE é SEGURO (etambutol, rifampicina e INH não teratogênicos). Suplementar piridoxina',
    'TODO PACIENTE COM TB → testar HIV (oferecer)',
    'CONTATOS DOMICILIARES: investigar TB latente (PPD/IGRA + Rx tórax) → tratar latente conforme idade/imunossupressão',
    'ALCOÓLATRA: maior risco abandono e hepatotoxicidade — DOT obrigatório'
  ],
  ARRAY['Baciloscopia escarro 2 amostras (TRM-TB se disponível)','Cultura + teste sensibilidade (TS)','Rx tórax PA + perfil','TGO/TGP basal + mensal','Função renal','Sorologia HIV (oferecer)','Sorologia HBV/HCV','Glicemia (DM aumenta risco)','PPD/IGRA (em contatos)','Beta-HCG mulher idade fértil'],
  ARRAY['HEPATOTOXICIDADE: monitor enzimas. Suspender se TGO >5x basal sem sintomas, >3x com sintomas (icterícia, dor HCD). Reintroduzir uma droga por vez','RIFAMPICINA reduz contraceptivos hormonais — orientar BARREIRA, IUD ou DMPA injetável','TB + HIV: rifampicina interage com TARV. Cuidar timing de início (síndrome reconstituição imune — SIRI)','TB EM GESTANTE: tratar normalmente — risco materno-fetal de NÃO TRATAR > efeitos adversos','EM IDOSO/HEPATOPATA: pode precisar substituir Z (pirazinamida) ou monitor mais frequente','RIRH = COR LARANJA-AVERMELHADA URINA/SUOR/LÁGRIMA — orientar paciente, mancha lente contato'],
  'PNCT MS 2024 / OMS 2024',
  'https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/t/tuberculose',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 4. PROFILAXIA HIV — PEP / PrEP
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'hiv-profilaxia-pep-prep',
  'HIV — profilaxia pós-exposição (PEP) e pré-exposição (PrEP)',
  'HIV',
  'PEP: exposição de risco <72h (ocupacional, sexual, violência sexual). PrEP: alto risco contínuo (HSH, parceiros sorodiscordantes, profissional sexo)',
  'PA / Ambulatorial (CTA)',
  'PEP é EMERGÊNCIA — <72h, idealmente <2h. PrEP é prevenção contínua. Ambos disponíveis no SUS.',
  $$[
    {"droga":"PEP — esquema preferencial 28 dias","dose":"Tenofovir 300 mg + Lamivudina 300 mg + Dolutegravir 50 mg, todos 1x/dia","via":"VO","frequencia":"1x/dia (mesmo horário)","duracao":"28 dias COMPLETOS","obs":"INICIAR <72h da exposição (idealmente <2h). NÃO INTERROMPER. Disponibilizado pelo SUS em qualquer UPA/Hospital","drug_slug":"tenofovir"},
    {"droga":"PEP — esquema alternativo (intolerância DTG)","dose":"TDF + 3TC + raltegravir 400 mg 12/12h, ou + atazanavir/r","obs":"discutir com infectologia"},
    {"droga":"PrEP — esquema diário","dose":"Tenofovir 300 mg + Emtricitabina 200 mg (Truvada) — 1 cp/dia","via":"VO","frequencia":"1x/dia","duracao":"contínuo enquanto persistir risco","obs":"DISPONÍVEL NO SUS desde 2017. Eficácia 99% se aderente. Disponível em Centro Testagem (CTA) ou SAE","drug_slug":"tenofovir"},
    {"droga":"PrEP — esquema sob demanda 2-1-1 (HSH)","dose":"2 cp 2-24h ANTES sexo + 1 cp 24h depois + 1 cp 48h depois","obs":"OPÇÃO EM HSH com sexo previsível. Não recomendado para mulheres cis (eficácia menor)"},
    {"droga":"Profilaxia hepatite B (em vítima sem vacina)","dose":"vacina HBV (D0, 1m, 6m) + imunoglobulina HBIG 0,06 mL/kg IM se fonte HBsAg+","obs":"se vacina prévia incompleta: completar; se completa há mais de 5 anos: avaliar anti-HBs"},
    {"droga":"Anticoncepção de emergência (em violência sexual)","dose":"levonorgestrel 1,5 mg dose única VO","obs":"se exposição <72h. DIU Cu até 120h é mais eficaz","drug_slug":"levonorgestrel-emergencia"},
    {"droga":"ATB DST (violência sexual / risco DST)","dose":"ceftriaxona 500 mg IM + azitromicina 1 g VO + metronidazol 2 g VO dose única","obs":"profilaxia gonorreia, clamídia, tricomonas. Avaliar sífilis"}
  ]$$::jsonb,
  ARRAY[
    'PEP É EMERGÊNCIA — buscar atendimento <72h, idealmente <2h. SUS disponibiliza',
    'AVALIAR FONTE se conhecida e disponível: testagem rápida HIV/HBV/HCV. Se fonte HIV+ controlada, ainda fazer PEP',
    'EXPOSIÇÃO DE BAIXO RISCO (mucosa íntegra, urina/saliva, contato breve): pode não indicar PEP — discutir',
    'EXPOSIÇÃO DE RISCO ALTO: percutânea com agulha contaminada, sexo desprotegido com fonte HIV+ ou desconhecida em alta prevalência, violência sexual',
    'TESTAR HIV/HBV/HCV/SÍFILIS basal + 4 sem + 12 sem (todas) + 6 meses se fonte HCV',
    'PrEP: ENTREGUE EM CTA/SAE — sorologia trimestral, função renal, pesquisa DST',
    'CADASTRO em sistema de farmácia pública (SISMEDEX / PNC PrEP)'
  ],
  ARRAY['Sorologia HIV (rápida + ELISA basal + 4 + 12 sem)','HBsAg, anti-HBc, anti-HBs','Anti-HCV (basal + 6 meses se fonte +)','VDRL/teste rápido sífilis','Função renal (basal + a cada 3-6 meses em PrEP)','Beta-HCG basal mulher idade fértil','Hepatite C tratada se fonte HCV+ (não previne, monitorar)'],
  ARRAY['PEP <72h — janela CRÍTICA. Após 72h não há benefício comprovado','ADESÃO 28 DIAS é essencial — interrupção reduz eficácia significativamente','PrEP NÃO PREVINE outras DSTs — orientar PRESERVATIVO + rastreio trimestral','TESTAR HIV ANTES DE PrEP — em paciente HIV+ não diagnosticado, PrEP cria resistência (TDF+FTC monoterapia funcional)','SOROCONVERSÃO em uso de PEP/PrEP: trocar para esquema completo de TARV imediatamente','VIOLÊNCIA SEXUAL: notificação compulsória + acolhimento + PEP + AE + DST + acompanhamento psicológico + denúncia (se desejado)'],
  'Diretriz MS PEP/PrEP 2024',
  'https://www.gov.br/aids/pt-br/centrais-de-conteudo/pcdts',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 5. PRÉ-ECLÂMPSIA / ECLÂMPSIA
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'pre-eclampsia-eclampsia',
  'Pré-eclâmpsia / Eclâmpsia — manejo',
  'Pré-eclâmpsia',
  'Gestante ≥20 sem com PA ≥140/90 + proteinúria ≥300 mg/24h ou disfunção orgânica (PE) ou + convulsão (eclâmpsia)',
  'PA / Centro obstétrico / UTI',
  'PARTO é o tratamento definitivo. Sulfato de magnésio para prevenção/tratamento de convulsão. Anti-hipertensivo se PAS ≥160 ou PAD ≥110.',
  $$[
    {"droga":"Sulfato de magnésio (PROFILAXIA/TTO eclâmpsia) — Zuspan","dose":"4 g IV em 20 min ATAQUE + 1-2 g/h BIC × 24h pós-parto OU pós-última crise","via":"IV","frequencia":"contínua","duracao":"24h","obs":"PRIMEIRA ESCOLHA — em pré-eclâmpsia COM SINAIS DE GRAVIDADE e em ECLÂMPSIA (Magpie). Monitor reflexos/FR/diurese","drug_slug":"sulfato-magnesio"},
    {"droga":"Sulfato de magnésio — Pritchard (alternativo IM)","dose":"4 g IV (10 mL 20% em 20 min) + 10 g IM (5 g em cada glúteo) → 5 g IM 4/4h × 24h","via":"IV + IM","obs":"se BIC indisponível","drug_slug":"sulfato-magnesio"},
    {"droga":"Hidralazina (anti-HAS de emergência)","dose":"5 mg IV bolus, repetir 5-10 mg cada 20 min, max 30 mg","via":"IV","obs":"PRIMEIRA ESCOLHA em emergência hipertensiva gestacional. Alvo: PA <160/110 (não normotensão — risco perfusão fetal)"},
    {"droga":"Nifedipino (anti-HAS oral)","dose":"10 mg VO, repetir 20 min se necessário, max 50 mg em 1h","via":"VO","obs":"alternativa quando hidralazina indisponível ou contínuo. NÃO sublingual (queda PA brusca)"},
    {"droga":"Labetalol IV (alternativa)","dose":"10-20 mg IV bolus em 2 min, repetir cada 10 min, max 300 mg","via":"IV","obs":"alfa+beta bloqueador. Eficaz mas menos disponível no SUS"},
    {"droga":"Metildopa (manutenção em PE leve / HAS gestacional)","dose":"250-1000 mg 8/8h","via":"VO","obs":"PRIMEIRA ESCOLHA crônica em gestante (segura). Alternativa: nifedipino LP, labetalol"},
    {"droga":"Corticoide para maturação pulmonar fetal","dose":"betametasona 12 mg IM 24/24h × 2 doses (ou dexametasona 6 mg IM 12/12h × 4 doses)","via":"IM","obs":"24-34 sem se parto previsto em 7 dias. Reduz mortalidade neonatal 50%","drug_slug":"dexametasona"},
    {"droga":"AAS profilaxia (em alto risco — gestações futuras/atual com fator)","dose":"100 mg/dia","via":"VO","duracao":"a partir 12-16 sem até 36 sem","obs":"em ALTO RISCO PE: PE prévia, HAS crônica, DM, doença renal, autoimune, gestação múltipla. Reduz PE pré-termo 60%"}
  ]$$::jsonb,
  ARRAY[
    'PARTO é tratamento DEFINITIVO — em PE com sinais de gravidade ≥34 sem ou eclâmpsia: PARTO sempre',
    'PE LEVE/sem gravidade: avaliação ambulatorial, parto a termo (37 sem)',
    'PE COM SINAIS DE GRAVIDADE: PA ≥160/110, proteinúria 5g/24h, sintomas (cefaleia, escotomas, epigastralgia), edema agudo pulmão, plaquetas <100k, TGO 2x, Cr ≥1,1, oligúria',
    'HELLP: hemólise + TGO/TGP elevadas + plaquetopenia — gravíssimo, parto urgente',
    'INVESTIGAR fatores de risco em pré-natal: histórico, PA basal, USG morfológico com Doppler de artérias uterinas (24-26 sem)',
    'AAS profilaxia ALTERA CURSO da doença em alto risco — ASPRE trial'
  ],
  ARRAY['PA seriada (consultório + MAPA se HAS crônica)','Proteinúria 24h ou relação P/Cr','Hemograma (plaquetopenia)','Função renal (Cr, ácido úrico)','TGO/TGP (HELLP)','LDH + bilirrubina indireta + esfregaço (hemólise)','BCF + USG fetal + Doppler umbilical','Cardiotocografia em PE com sinais de gravidade'],
  ARRAY['SULFATO MAGNÉSIO: monitor reflexo patelar, FR, diurese — antídoto gluconato Ca++','HIDRALAZINA EV: pode causar taquicardia reflexa fetal — monitor BCF','EVITAR REDUZIR PA TOO RÁPIDO ou MUITO BAIXA — risco hipoperfusão fetal/IUGR. Alvo PAS 140-150, PAD 90-100','EM ECLÂMPSIA: NÃO É INDICAÇÃO de cesariana per se — via de parto avaliada caso a caso','PARTO PRÉ-TERMO <34 sem: corticoide para maturação pulmonar SEMPRE','HAS CRÔNICA + GESTAÇÃO: SUSPENDER IECA/BRA (teratogênicos) — trocar por metildopa, nifedipino, labetalol','EVITAR: AINE em PE com PE/disfunção renal — pode piorar'],
  'FEBRASGO 2023 / ACOG 2020',
  'https://www.febrasgo.org.br/pt/protocolos',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();

-- 6. PLANEJAMENTO FAMILIAR / CONTRACEPÇÃO
INSERT INTO public.wb_prescriptions (
  slug, titulo, doenca, condicao_clinica, contexto, resumo,
  itens, orientacoes_gerais, exames_complementares, alertas,
  fonte, fonte_url, published
) VALUES (
  'planejamento-familiar',
  'Planejamento familiar — métodos contraceptivos',
  'Anticoncepção',
  'Mulher/casal em idade reprodutiva buscando método contraceptivo',
  'Ambulatorial / Atenção Básica',
  'LARC (DIU/implante) é mais eficaz e custo-efetivo. Avaliar critérios elegibilidade OMS antes de prescrever hormonal. Sempre incluir DST (preservativo).',
  $$[
    {"droga":"DIU de cobre (LARC)","dose":"inserção uterina","via":"IU","duracao":"10 anos","obs":"NÃO HORMONAL. Eficácia 99%. Pode aumentar fluxo menstrual/cólica. Disponível SUS"},
    {"droga":"DIU hormonal (Mirena/Kyleena — levonorgestrel)","dose":"inserção uterina","via":"IU","duracao":"5-7 anos","obs":"Eficácia 99,8%. Reduz fluxo menstrual (útil em SOP, miomatose, hipermenorragia)"},
    {"droga":"Implante subdérmico (Implanon — etonogestrel)","dose":"68 mg subdérmico","via":"SC braço","duracao":"3 anos","obs":"Eficácia 99,9%. Disponível SUS para grupos prioritários (adolescente, indígena, situação rua, HIV)"},
    {"droga":"ACO combinado (estrogênio+progestagênio)","dose":"etinilestradiol 20-30 mcg + levonorgestrel/desogestrel/drospirenona — 1 cp/dia × 21 dias + 7d pausa","via":"VO","obs":"Eficácia 91% (uso típico). MEC OMS: contraindicado se HAS não controlada, AVC, IAM, TEV prévia, lúpus com SAF, fumante ≥35a, enxaqueca com aura, hepatopatia"},
    {"droga":"Minipílula (apenas progestagênio)","dose":"desogestrel 75 mcg/dia OU noretisterona 0,35 mg/dia","via":"VO (USO CONTÍNUO sem pausa)","obs":"para LACTANTE, contraindicação a estrogênio, fumante ≥35a. Atrasada >3h reduz eficácia"},
    {"droga":"Injetável trimestral (DMPA)","dose":"medroxiprogesterona acetato 150 mg IM cada 3 meses","via":"IM","obs":"Eficácia 94%. Pode causar irregularidade menstrual + ganho peso + redução DMO (uso prolongado)"},
    {"droga":"Injetável mensal (combinado)","dose":"estradiol valerato 5 mg + noretisterona 50 mg IM mensal","via":"IM","obs":"alternativa a ACO. Mesmas contraindicações de estrogênio"},
    {"droga":"Preservativo masculino (camisinha)","obs":"ÚNICO método que previne DST. Eficácia 87% (uso típico). DEVE ser orientado SEMPRE em conjunto"},
    {"droga":"Anticoncepção emergência (LNG)","dose":"levonorgestrel 1,5 mg dose única VO até 72h coito","obs":"resgate. NÃO substitui contracepção contínua","drug_slug":"levonorgestrel-emergencia"},
    {"droga":"Laqueadura tubária (irreversível)","obs":"Lei nº 9.263/96: ≥21a OU ≥2 filhos vivos. Consentimento + 60 dias reflexão. SUS disponibiliza"},
    {"droga":"Vasectomia (irreversível)","obs":"≥21a OU ≥2 filhos vivos. Pequeno procedimento ambulatorial. SUS disponibiliza"}
  ]$$::jsonb,
  ARRAY[
    'CRITÉRIOS DE ELEGIBILIDADE OMS (categorias 1-4): 1=usar; 2=geralmente usar; 3=geralmente NÃO usar; 4=CONTRAINDICADO',
    'AVALIAR: HAS, tabagismo+idade, diabetes, dislipidemia, enxaqueca com aura, TEV prévia, hepatopatia, lúpus, neoplasia',
    'LARC (DIU/implante) deve ser PRIMEIRA OFERTA — mais eficaz, custo-efetivo, sem dependência da memória',
    'PRESERVATIVO sempre orientado para DST — mesmo com método contraceptivo',
    'PÓS-PARTO: lactante puro pode usar minipílula a partir 6 sem; DIU pode ser inserido pós-placenta ou após 4 sem; ACO combinado evitar até 6 sem (TEV)',
    'ADOLESCENTE: pode iniciar com qualquer método (LARC seguro). Não exigir consentimento parental para contracepção (Estatuto da Criança e do Adolescente)'
  ],
  ARRAY['PA','IMC + circunferência abdominal','Glicemia + perfil lipídico (avaliar antes de hormonal)','Beta-HCG (descartar gestação antes de iniciar)','EAS','Sorologias HIV/sífilis (oferecer)','Citologia oncótica conforme protocolo','USG transvaginal (DIU, miomas)'],
  ARRAY['ACO COMBINADO + TABAGISMO ≥35a = CONTRAINDICADO (TEV/IAM)','TEV PRÉVIO = CONTRAINDICAÇÃO ABSOLUTA a estrogênio (qualquer dose)','HAS NÃO CONTROLADA + ACO combinado = aumenta risco AVC','ENXAQUECA COM AURA + ACO combinado = AVC isquêmico ↑','DMPA: redução DMO em adolescente (recuperação 2-3 anos pós-suspensão)','EM POSSÍVEL GESTAÇÃO (atraso, sintomas): TESTAR antes de inserir DIU/implante','DIU NÃO É ABORTIVO — age impedindo fertilização (cobre = espermicida; LNG = muco hostil + redução motilidade)'],
  'OMS Critérios Elegibilidade 2015 / Federal MS 2018',
  'https://www.who.int/publications/i/item/9789241549158',
  true
) ON CONFLICT (slug) DO UPDATE SET itens = EXCLUDED.itens, updated_at = now();
