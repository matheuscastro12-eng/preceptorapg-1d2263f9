-- Adiciona campo mecanismo_acao em wb_drugs e preenche pras 50 drogas
-- existentes. Mecanismo é fundamental pra entender efeitos, interações
-- e contra-indicações — base do raciocínio farmacológico em prova
-- e prática.

ALTER TABLE public.wb_drugs
  ADD COLUMN IF NOT EXISTS mecanismo_acao text;

COMMENT ON COLUMN public.wb_drugs.mecanismo_acao IS
  'Mecanismo molecular/celular: alvo (receptor, enzima, canal), tipo de ação (agonista, antagonista, inibidor), via metabólica afetada.';

-- ============================================================
-- UPDATE mecanismos das 50 drogas existentes
-- ============================================================
UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe ciclooxigenase central (COX-3) e modula vias serotoninérgicas descendentes da dor. Pouca ação periférica — daí o perfil sem efeito anti-inflamatório significativo nem GI/renal típicos dos AINE.' WHERE slug = 'paracetamol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe COX-1, COX-2 e COX-3, com forte ação central. Ativa também canais TRPA1 e o sistema canabinoide, o que amplia o efeito analgésico além da via prostaglandínica.' WHERE slug = 'dipirona';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibição reversível e não-seletiva de COX-1 e COX-2 — reduz síntese de prostaglandinas inflamatórias (PGE2) e tromboxano A2 plaquetário.' WHERE slug = 'ibuprofeno';

UPDATE public.wb_drugs SET mecanismo_acao = 'Acetilação IRREVERSÍVEL de COX-1 plaquetária (efeito antiplaquetário por toda vida da plaqueta — ~7 dias) e COX-2 endotelial. Bloqueia tromboxano A2 → menor agregação.' WHERE slug = 'aas';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibição IRREVERSÍVEL da H+/K+-ATPase (bomba de prótons) nas células parietais gástricas. Pró-droga ativada em meio ácido. Efeito perdura até síntese de novas bombas (~24-48h).' WHERE slug = 'omeprazol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Amoxicilina: liga PBPs (penicillin-binding proteins) bloqueando transpeptidação da parede bacteriana → lise osmótica. Clavulanato: inibidor suicida de β-lactamases (protege a amoxi de degradação).' WHERE slug = 'amoxicilina-clavulanato';

UPDATE public.wb_drugs SET mecanismo_acao = 'Liga reversivelmente subunidade 50S do ribossomo bacteriano, bloqueando translocação peptídica e síntese proteica. Bacteriostático. Concentração intracelular alta = bom em atípicos.' WHERE slug = 'azitromicina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe PBPs bacterianas, bloqueia síntese da parede celular. Cefalosporina 1ª geração (cobertura preferencial gram-positivos da pele).' WHERE slug = 'cefalexina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe DNA-girase (topoisomerase II) e topoisomerase IV bacterianas, impedindo replicação e transcrição. Bactericida concentração-dependente.' WHERE slug = 'ciprofloxacino';

UPDATE public.wb_drugs SET mecanismo_acao = 'Pró-droga reduzida ANAEROBICAMENTE em produtos tóxicos (radicais livres) que danificam DNA bacteriano e parasitário. Inativo em ambiente aeróbico — daí a especificidade.' WHERE slug = 'metronidazol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Antagonista competitivo seletivo do receptor AT1 da angiotensina II → bloqueia vasoconstrição e secreção de aldosterona. Não afeta bradicinina (diferente do IECA — daí menos tosse/angioedema).' WHERE slug = 'losartana';

UPDATE public.wb_drugs SET mecanismo_acao = 'Bloqueia canais de cálcio tipo L preferencialmente em musculatura lisa vascular — vasodilatação arteriolar. Pouca ação miocárdica (di-hidropiridínico). Reduz pós-carga.' WHERE slug = 'anlodipino';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe co-transportador Na+/Cl- no túbulo contorcido distal → reduz reabsorção de sódio. Curiosamente reduz cálcio urinário (efeito útil em nefrolitíase). Em uso crônico, vasodilatação direta também contribui.' WHERE slug = 'hidroclorotiazida';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe co-transportador Na+/K+/2Cl- na alça ascendente espessa de Henle. Diurese potente, perda de K+/Mg2+/Ca2+. Vasodilatação venosa rápida (pré-EAP).' WHERE slug = 'furosemida';

UPDATE public.wb_drugs SET mecanismo_acao = 'Bloqueio β1, β2 e α1 adrenérgico — reduz FC, contratilidade e resistência vascular periférica. Efeito antioxidante e antifibrótico no miocárdio (vantagem em IC FEr).' WHERE slug = 'carvedilol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Ativa AMPK (sensor energético celular) → reduz gliconeogênese hepática (efeito principal), aumenta sensibilidade muscular à insulina, reduz absorção intestinal de glicose. Não estimula secreção de insulina (sem hipoglicemia).' WHERE slug = 'metformina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe HMG-CoA redutase (passo limitante da síntese hepática de colesterol) → upregula receptores LDL → ↑ clearance de LDL plasmático. Efeitos pleiotrópicos: anti-inflamatório, estabilização de placa.' WHERE slug = 'atorvastatina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Reposição de hormônio tireoidiano (T4) — convertido em T3 ativo nos tecidos pelas deiodinases. Atua em receptores nucleares regulando transcrição gênica.' WHERE slug = 'levotiroxina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Pró-droga ativada em prednisolona no fígado. Agonista do receptor glicocorticoide: efeito genômico (transrepressão de NF-κB e AP-1 — anti-inflamatório) e não-genômico (rápido). Imunossupressor potente.' WHERE slug = 'prednisona';

UPDATE public.wb_drugs SET mecanismo_acao = 'Agonista β2-adrenérgico de curta ação — ativa adenilato ciclase → ↑ AMPc → relaxamento da musculatura lisa brônquica. Início rápido (5 min), pico em 30-60 min, duração 4-6h.' WHERE slug = 'salbutamol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Liga PBPs bacterianas (penicillin-binding proteins) → bloqueia transpeptidação da parede celular → lise osmótica. Bactericida em fase de divisão. Sensível a β-lactamases.' WHERE slug = 'amoxicilina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe PBPs bacterianas — síntese da parede. Cefalosporina 3ª geração: amplo espectro gram-negativo, atravessa BHE (escolha em meningite bacteriana).' WHERE slug = 'ceftriaxona';

UPDATE public.wb_drugs SET mecanismo_acao = 'Liga D-Ala-D-Ala terminal do precursor da parede celular → bloqueia transglicosilação e transpeptidação. Glicopeptídeo. Resistência intrínseca em gram-negativos (não atravessa membrana externa).' WHERE slug = 'vancomicina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Liga subunidade 50S do ribossomo bacteriano (sítio próximo ao da eritromicina/macrolídeos), bloqueia formação de ligação peptídica. Bacteriostático. Bom em anaeróbios e MRSA-CA.' WHERE slug = 'clindamicina';

UPDATE public.wb_drugs SET mecanismo_acao = 'SMX inibe diidropteroato sintetase (análogo de PABA) e TMP inibe diidrofolato redutase — duas etapas SEQUENCIAIS da síntese de folato bacteriano. Sinergia bactericida.' WHERE slug = 'sulfametoxazol-trimetoprim';

UPDATE public.wb_drugs SET mecanismo_acao = 'Liga subunidade 30S do ribossomo bacteriano → bloqueia ligação do aminoacil-tRNA ao sítio A. Bacteriostático. Tetraciclina semissintética com longa meia-vida.' WHERE slug = 'doxiciclina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Pró-droga reduzida em bactérias por nitrorredutases → metabólitos reativos que danificam DNA, ribossomos e enzimas. Atinge concentrações bactericidas APENAS em urina.' WHERE slug = 'nitrofurantoina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe ECA (enzima conversora de angiotensina) — bloqueia conversão angio I → angio II E degradação de bradicinina (esta acumula → tosse, angioedema). Reduz pós-carga, pré-carga e remodelamento.' WHERE slug = 'enalapril';

UPDATE public.wb_drugs SET mecanismo_acao = 'Bloqueio β1-adrenérgico cardiosseletivo (β1 >> β2) — reduz FC, contratilidade e renina. Hidrofílico (atravessa pouco BHE — menos pesadelo, mas dose deve ser ajustada por função renal).' WHERE slug = 'atenolol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe HMG-CoA redutase hepática (síntese de colesterol). Pró-droga ativada por hidrólise. Meia-vida curta (tomar à noite — pico de síntese).' WHERE slug = 'sinvastatina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Antagonista competitivo do receptor mineralocorticoide (aldosterona) no túbulo coletor — reduz reabsorção de sódio e excreção de K+/H+. Também antagoniza receptor androgênico (daí ginecomastia).' WHERE slug = 'espironolactona';

UPDATE public.wb_drugs SET mecanismo_acao = 'Pró-droga ativada por CYP2C19 → metabólito que liga IRREVERSIVELMENTE o receptor P2Y12 do ADP plaquetário, bloqueando ativação e agregação. Polimorfismo CYP2C19 explica variabilidade.' WHERE slug = 'clopidogrel';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe vitamina K epóxido redutase (VKOR) → impede regeneração da vit K reduzida → bloqueia γ-carboxilação dos fatores II, VII, IX, X e proteínas C/S. Leva 3-5 dias pra efeito pleno (depleta fatores existentes).' WHERE slug = 'varfarina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Heparina de baixo peso molecular: liga antitrombina III (AT-III) e potencializa inibição do fator Xa (mais que IIa, ao contrário da HNF). Razão Xa:IIa de 3-4:1.' WHERE slug = 'enoxaparina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibidor DIRETO e SELETIVO do fator Xa (sem precisar de antitrombina). Bloqueia conversão protrombina → trombina, reduzindo formação de fibrina. Ação rápida (2-4h).' WHERE slug = 'rivaroxabana';

UPDATE public.wb_drugs SET mecanismo_acao = 'Budesonida: corticoide inalatório — efeito genômico (anti-inflamatório local, reduz citocinas Th2 e IL-5). Formoterol: agonista β2 long-acting (LABA) — broncodilatação por 12h via AMPc.' WHERE slug = 'budesonida-formoterol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Antagonista dos receptores muscarínicos M3 nas vias aéreas → bloqueia broncoconstrição parassimpática e secreção de muco. Quaternário (não atravessa BHE).' WHERE slug = 'ipratropio';

UPDATE public.wb_drugs SET mecanismo_acao = 'Antagonista seletivo do receptor H1 da histamina (não-sedativo: pouco atravessa BHE). Bloqueia vasodilatação, prurido e broncoconstrição induzidos por histamina.' WHERE slug = 'loratadina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Insulina humana exógena (NPH = neutral protamine Hagedorn, suspensão com protamina e zinco que retarda absorção). Liga receptor de insulina → cascata IRS-1 → GLUT-4 → captação de glicose.' WHERE slug = 'insulina-nph';

UPDATE public.wb_drugs SET mecanismo_acao = 'Insulina humana exógena solúvel — mesmo mecanismo (receptor de insulina, GLUT-4) mas absorção rápida. Em altas doses IV, também shift K+ intracelular (uso em hiperK).' WHERE slug = 'insulina-regular';

UPDATE public.wb_drugs SET mecanismo_acao = 'Bloqueia canais de K+-ATP nas células β pancreáticas → despolarização → influxo de Ca2+ → secreção de insulina. Independente de glicemia (daí o risco de hipoglicemia prolongada).' WHERE slug = 'glibenclamida';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibidor de SGLT2 (sodium-glucose cotransporter 2) no túbulo proximal renal — bloqueia reabsorção de glicose → glicosúria osmótica + natriurese. Benefício CV/renal independe da glicemia (efeito hemodinâmico, redução pré-carga).' WHERE slug = 'dapagliflozina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibidor seletivo da recaptação de serotonina (ISRS) — bloqueia transportador SERT na fenda sináptica. Efeito antidepressivo via downregulation de receptores 5-HT (semanas).' WHERE slug = 'sertralina';

UPDATE public.wb_drugs SET mecanismo_acao = 'ISRS — inibe recaptação de serotonina via transportador SERT. Meia-vida MUITO longa (norfluoxetina 4-6 dias) — perdoa esquecimentos, mas dificulta troca pra IMAO.' WHERE slug = 'fluoxetina';

UPDATE public.wb_drugs SET mecanismo_acao = 'Modulador alostérico positivo do receptor GABA-A — aumenta frequência de abertura do canal de Cl- → hiperpolarização neuronal. Efeito ansiolítico, hipnótico, anticonvulsivante e relaxante muscular.' WHERE slug = 'clonazepam';

UPDATE public.wb_drugs SET mecanismo_acao = 'Modulador alostérico positivo do receptor GABA-A (mesmo que clonazepam). Diazepam tem meia-vida MUITO longa (metabólitos ativos por 50-100h) — daí o acúmulo em idoso.' WHERE slug = 'diazepam';

UPDATE public.wb_drugs SET mecanismo_acao = 'Mecanismo dual: agonista FRACO do receptor μ-opioide (~10× menor que morfina) + inibe recaptação de serotonina e noradrenalina (efeito tipo IRSN). Por isso síndrome serotoninérgica com ISRS.' WHERE slug = 'tramadol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Análogo de guanosina — fosforilação INICIADA por timidina-quinase VIRAL (HSV/VZV) → triciclofosfato → inibe DNA-polimerase viral E age como terminador de cadeia. Especificidade pra células infectadas.' WHERE slug = 'aciclovir';

UPDATE public.wb_drugs SET mecanismo_acao = 'Inibe lanosterol 14-α-demetilase fúngica (CYP51) → bloqueia síntese de ergosterol (componente da membrana fúngica). Fungistático na maioria, fungicida em altas doses.' WHERE slug = 'fluconazol';

UPDATE public.wb_drugs SET mecanismo_acao = 'Antagonista seletivo do receptor 5-HT3 da serotonina — bloqueia ação no centro do vômito (tronco) e nervo vago aferente do TGI. Eficaz em êmese induzida por quimioterapia (libera 5-HT das células enterocromafins).' WHERE slug = 'ondansetrona';
