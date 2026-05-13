-- Seed CID-10 — top 150 codigos mais usados na pratica clinica brasileira.
-- Dados publicos via DATASUS (CSV oficial em https://datasus.saude.gov.br/cid-10).
-- Resto da CID-10 (~14k codigos) pode ser importado via script externo
-- conforme demanda.

INSERT INTO public.wb_icd10 (code, descricao_pt, capitulo, capitulo_titulo) VALUES
-- ── I — Doencas infecciosas (A00-B99) ──────────────────────────
('A09',  'Diarreia e gastroenterite de origem infecciosa presumida', 'I', 'Doenças infecciosas e parasitárias'),
('A15',  'Tuberculose respiratória, com confirmação bacteriológica', 'I', 'Doenças infecciosas e parasitárias'),
('A41.9','Septicemia não especificada', 'I', 'Doenças infecciosas e parasitárias'),
('A90',  'Dengue clássico', 'I', 'Doenças infecciosas e parasitárias'),
('A91',  'Febre hemorrágica devida ao vírus da dengue', 'I', 'Doenças infecciosas e parasitárias'),
('B05',  'Sarampo', 'I', 'Doenças infecciosas e parasitárias'),
('B19',  'Hepatite viral não especificada', 'I', 'Doenças infecciosas e parasitárias'),
('B20',  'Doença pelo HIV resultando em doenças infecciosas e parasitárias', 'I', 'Doenças infecciosas e parasitárias'),
('B24',  'Doença pelo HIV não especificada', 'I', 'Doenças infecciosas e parasitárias'),
('B34.9','Infecção viral não especificada', 'I', 'Doenças infecciosas e parasitárias'),
('B54',  'Malária não especificada', 'I', 'Doenças infecciosas e parasitárias'),

-- ── II — Neoplasias (C00-D48) ──────────────────────────────────
('C18',  'Neoplasia maligna do cólon', 'II', 'Neoplasias'),
('C34.9','Neoplasia maligna dos brônquios ou pulmão, não especificada', 'II', 'Neoplasias'),
('C50',  'Neoplasia maligna da mama', 'II', 'Neoplasias'),
('C61',  'Neoplasia maligna da próstata', 'II', 'Neoplasias'),
('C73',  'Neoplasia maligna da glândula tireoide', 'II', 'Neoplasias'),
('C92.0','Leucemia mieloide aguda', 'II', 'Neoplasias'),
('D25',  'Leiomioma do útero', 'II', 'Neoplasias'),
('D50',  'Anemia por deficiência de ferro', 'III', 'Doenças do sangue e órgãos hematopoéticos'),

-- ── IV — Endocrinas/metabolicas (E00-E90) ──────────────────────
('E03.9','Hipotireoidismo não especificado', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E05',  'Tireotoxicose (hipertireoidismo)', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E10',  'Diabetes mellitus tipo 1', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E11',  'Diabetes mellitus tipo 2', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E14',  'Diabetes mellitus não especificado', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E66',  'Obesidade', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E78',  'Distúrbios do metabolismo de lipoproteínas e outras lipidemias', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E86',  'Depleção de volume (desidratação)', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),
('E87.6','Hipopotassemia', 'IV', 'Doenças endócrinas, nutricionais e metabólicas'),

-- ── V — Mentais (F00-F99) ──────────────────────────────────────
('F03',  'Demência não especificada', 'V', 'Transtornos mentais e comportamentais'),
('F10',  'Transtornos mentais devido ao uso de álcool', 'V', 'Transtornos mentais e comportamentais'),
('F20',  'Esquizofrenia', 'V', 'Transtornos mentais e comportamentais'),
('F31',  'Transtorno afetivo bipolar', 'V', 'Transtornos mentais e comportamentais'),
('F32',  'Episódio depressivo', 'V', 'Transtornos mentais e comportamentais'),
('F33',  'Transtorno depressivo recorrente', 'V', 'Transtornos mentais e comportamentais'),
('F41',  'Outros transtornos ansiosos', 'V', 'Transtornos mentais e comportamentais'),
('F90',  'Transtornos hipercinéticos (TDAH)', 'V', 'Transtornos mentais e comportamentais'),

-- ── VI — Sistema nervoso (G00-G99) ─────────────────────────────
('G20',  'Doença de Parkinson', 'VI', 'Doenças do sistema nervoso'),
('G35',  'Esclerose múltipla', 'VI', 'Doenças do sistema nervoso'),
('G40',  'Epilepsia', 'VI', 'Doenças do sistema nervoso'),
('G43',  'Enxaqueca', 'VI', 'Doenças do sistema nervoso'),
('G44',  'Outras síndromes de cefaleia', 'VI', 'Doenças do sistema nervoso'),
('G45',  'Acidente vascular cerebral isquêmico transitório (AIT)', 'VI', 'Doenças do sistema nervoso'),

-- ── IX — Circulatorio (I00-I99) ────────────────────────────────
('I10',  'Hipertensão essencial (primária)', 'IX', 'Doenças do aparelho circulatório'),
('I11',  'Doença cardíaca hipertensiva', 'IX', 'Doenças do aparelho circulatório'),
('I20',  'Angina pectoris', 'IX', 'Doenças do aparelho circulatório'),
('I21',  'Infarto agudo do miocárdio', 'IX', 'Doenças do aparelho circulatório'),
('I21.0','IAM da parede anterior', 'IX', 'Doenças do aparelho circulatório'),
('I21.4','IAM subendocárdico', 'IX', 'Doenças do aparelho circulatório'),
('I25',  'Doença isquêmica crônica do coração', 'IX', 'Doenças do aparelho circulatório'),
('I48',  'Fibrilação e flutter atrial', 'IX', 'Doenças do aparelho circulatório'),
('I50',  'Insuficiência cardíaca', 'IX', 'Doenças do aparelho circulatório'),
('I50.0','Insuficiência cardíaca congestiva', 'IX', 'Doenças do aparelho circulatório'),
('I63',  'Acidente vascular cerebral isquêmico', 'IX', 'Doenças do aparelho circulatório'),
('I64',  'Acidente vascular cerebral, não especificado', 'IX', 'Doenças do aparelho circulatório'),
('I80',  'Tromboflebite e flebotrombose', 'IX', 'Doenças do aparelho circulatório'),
('I82',  'Outra embolia e trombose venosa', 'IX', 'Doenças do aparelho circulatório'),
('I83',  'Varizes dos membros inferiores', 'IX', 'Doenças do aparelho circulatório'),

-- ── X — Respiratorio (J00-J99) ─────────────────────────────────
('J00',  'Nasofaringite aguda (resfriado comum)', 'X', 'Doenças do aparelho respiratório'),
('J02',  'Faringite aguda', 'X', 'Doenças do aparelho respiratório'),
('J03',  'Amigdalite aguda', 'X', 'Doenças do aparelho respiratório'),
('J06',  'Infecções agudas das vias aéreas superiores', 'X', 'Doenças do aparelho respiratório'),
('J11',  'Influenza (gripe) devida a vírus não identificado', 'X', 'Doenças do aparelho respiratório'),
('J15',  'Pneumonia bacteriana não classificada em outra parte', 'X', 'Doenças do aparelho respiratório'),
('J18',  'Pneumonia por microorganismo não especificado', 'X', 'Doenças do aparelho respiratório'),
('J20',  'Bronquite aguda', 'X', 'Doenças do aparelho respiratório'),
('J21',  'Bronquiolite aguda', 'X', 'Doenças do aparelho respiratório'),
('J44',  'Doença pulmonar obstrutiva crônica (DPOC)', 'X', 'Doenças do aparelho respiratório'),
('J44.1','DPOC com exacerbação aguda', 'X', 'Doenças do aparelho respiratório'),
('J45',  'Asma', 'X', 'Doenças do aparelho respiratório'),
('J46',  'Estado de mal asmático', 'X', 'Doenças do aparelho respiratório'),
('J81',  'Edema pulmonar', 'X', 'Doenças do aparelho respiratório'),
('J96',  'Insuficiência respiratória não classificada em outra parte', 'X', 'Doenças do aparelho respiratório'),

-- ── XI — Digestivo (K00-K93) ───────────────────────────────────
('K21',  'Doença do refluxo gastroesofágico', 'XI', 'Doenças do aparelho digestivo'),
('K25',  'Úlcera gástrica', 'XI', 'Doenças do aparelho digestivo'),
('K27',  'Úlcera péptica', 'XI', 'Doenças do aparelho digestivo'),
('K29',  'Gastrite e duodenite', 'XI', 'Doenças do aparelho digestivo'),
('K35',  'Apendicite aguda', 'XI', 'Doenças do aparelho digestivo'),
('K40',  'Hérnia inguinal', 'XI', 'Doenças do aparelho digestivo'),
('K56',  'Íleo paralítico e obstrução intestinal sem hérnia', 'XI', 'Doenças do aparelho digestivo'),
('K57',  'Doença diverticular do intestino', 'XI', 'Doenças do aparelho digestivo'),
('K59',  'Outros transtornos funcionais do intestino', 'XI', 'Doenças do aparelho digestivo'),
('K70',  'Doença alcoólica do fígado', 'XI', 'Doenças do aparelho digestivo'),
('K71',  'Doença tóxica do fígado', 'XI', 'Doenças do aparelho digestivo'),
('K74',  'Fibrose e cirrose hepáticas', 'XI', 'Doenças do aparelho digestivo'),
('K80',  'Colelitíase', 'XI', 'Doenças do aparelho digestivo'),
('K81',  'Colecistite', 'XI', 'Doenças do aparelho digestivo'),
('K85',  'Pancreatite aguda', 'XI', 'Doenças do aparelho digestivo'),
('K92.2','Hemorragia gastrointestinal não especificada', 'XI', 'Doenças do aparelho digestivo'),

-- ── XII — Pele (L00-L99) ───────────────────────────────────────
('L03',  'Celulite', 'XII', 'Doenças da pele e tecido subcutâneo'),
('L20',  'Dermatite atópica', 'XII', 'Doenças da pele e tecido subcutâneo'),
('L23',  'Dermatite alérgica de contato', 'XII', 'Doenças da pele e tecido subcutâneo'),
('L40',  'Psoríase', 'XII', 'Doenças da pele e tecido subcutâneo'),
('L50',  'Urticária', 'XII', 'Doenças da pele e tecido subcutâneo'),

-- ── XIII — Osteomuscular (M00-M99) ─────────────────────────────
('M05',  'Artrite reumatoide soropositiva', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M06',  'Outras artrites reumatoides', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M10',  'Gota', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M16',  'Coxartrose (artrose do quadril)', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M17',  'Gonartrose (artrose do joelho)', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M19',  'Outras artroses', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M25',  'Outros transtornos articulares', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M54',  'Dorsalgia', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M54.5','Dor lombar baixa (lombalgia)', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),
('M81',  'Osteoporose sem fratura patológica', 'XIII', 'Doenças do sistema osteomuscular e tecido conjuntivo'),

-- ── XIV — Geniturinario (N00-N99) ──────────────────────────────
('N18',  'Doença renal crônica', 'XIV', 'Doenças do aparelho geniturinário'),
('N19',  'Insuficiência renal não especificada', 'XIV', 'Doenças do aparelho geniturinário'),
('N20',  'Calculose do rim e do ureter', 'XIV', 'Doenças do aparelho geniturinário'),
('N30',  'Cistite', 'XIV', 'Doenças do aparelho geniturinário'),
('N39.0','Infecção do trato urinário, sem localização especificada', 'XIV', 'Doenças do aparelho geniturinário'),
('N40',  'Hiperplasia da próstata', 'XIV', 'Doenças do aparelho geniturinário'),
('N91',  'Menstruação ausente, escassa ou rara', 'XIV', 'Doenças do aparelho geniturinário'),
('N92',  'Menstruação excessiva, frequente e irregular', 'XIV', 'Doenças do aparelho geniturinário'),
('N95',  'Transtornos da menopausa e do climatério', 'XIV', 'Doenças do aparelho geniturinário'),

-- ── XV — Gravidez/parto (O00-O99) ──────────────────────────────
('O14',  'Pré-eclâmpsia', 'XV', 'Gravidez, parto e puerpério'),
('O15',  'Eclâmpsia', 'XV', 'Gravidez, parto e puerpério'),
('O24',  'Diabetes mellitus na gravidez', 'XV', 'Gravidez, parto e puerpério'),
('O80',  'Parto único espontâneo', 'XV', 'Gravidez, parto e puerpério'),
('O82',  'Parto único por cesariana', 'XV', 'Gravidez, parto e puerpério'),

-- ── XVIII — Sintomas/sinais (R00-R99) ──────────────────────────
('R00.0','Taquicardia não especificada', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R03.0','Pressão arterial elevada sem diagnóstico de hipertensão', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R05',  'Tosse', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R06',  'Anormalidades da respiração', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R07.4','Dor torácica não especificada', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R10',  'Dor abdominal e pélvica', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R11',  'Náusea e vômitos', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R19.7','Diarreia não especificada', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R42',  'Tontura e instabilidade', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R50',  'Febre de origem desconhecida', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R51',  'Cefaleia', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R55',  'Síncope e colapso', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R56',  'Convulsões não classificadas em outra parte', 'XVIII', 'Sintomas, sinais e achados anormais'),
('R63.0','Anorexia', 'XVIII', 'Sintomas, sinais e achados anormais'),

-- ── XIX — Lesoes/intoxicacoes (S00-T98) ────────────────────────
('S06',  'Traumatismo intracraniano', 'XIX', 'Lesões e envenenamentos'),
('S72',  'Fratura do fêmur', 'XIX', 'Lesões e envenenamentos'),
('T14',  'Traumatismo de região não especificada do corpo', 'XIX', 'Lesões e envenenamentos'),
('T78.0','Choque anafilático devido a alimento', 'XIX', 'Lesões e envenenamentos'),
('T78.2','Choque anafilático não especificado', 'XIX', 'Lesões e envenenamentos'),

-- ── XXI — Fatores que influenciam saude (Z00-Z99) ──────────────
('Z00',  'Exame geral e investigação de pessoas sem queixas', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z11',  'Exame especial de rastreamento', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z23',  'Necessidade de imunização contra doença bacteriana isolada', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z34',  'Supervisão de gravidez normal', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z39',  'Exame e atendimento pós-parto', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z51',  'Outros cuidados médicos', 'XXI', 'Fatores que influenciam o estado de saúde'),
('Z71',  'Aconselhamento médico não classificado em outra parte', 'XXI', 'Fatores que influenciam o estado de saúde')

ON CONFLICT (code) DO NOTHING;
