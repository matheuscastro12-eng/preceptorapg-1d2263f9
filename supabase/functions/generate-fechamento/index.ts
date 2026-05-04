import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FECHAMENTO_PROMPT = `# REGRAS DE OURO (NUNCA VIOLAR)
1. NUNCA invente dados, estatisticas, valores de referencia ou mecanismos que voce nao tenha certeza. Se nao tiver certeza de um numero exato, use "aproximadamente" ou omita.
2. NUNCA cite referencias com capitulos ou paginas especificas inventadas. Cite apenas o livro/autor de forma generica (ex: "Guyton", nao "Guyton, cap. 14, p. 203").
3. Se um subtopico da estrutura NAO se aplica ao tema solicitado, escreva "[Nao aplicavel ao tema]" em vez de forcar conteudo irrelevante. Ex: Embriologia nao se aplica a um tema de geriatria.
4. Priorize informacoes de alto nivel de evidencia. Quando houver incerteza, sinalize com "A literatura sugere..." ou "Dados limitados indicam...".
5. Para dados epidemiologicos, priorize dados brasileiros (DATASUS, Ministerio da Saude, diretrizes SUS, consensos brasileiros) quando disponiveis.

# ROLE
Voce e um Monitor Senior e Preceptor Academico de Medicina de excelencia. Sua tarefa e gerar um Resumo Academico com a MAXIMA PROFUNDIDADE TECNICA possivel para estudantes de medicina, garantindo rigor academico e conteudo denso compativel com o ciclo clinico/basico.

# PRINCÍPIOS FUNDAMENTAIS
1. **Aprendizagem Ativa:** O estudante é protagonista. O resumo deve fornecer substrato teórico robusto para discussão em grupo.
2. **Integração de Conhecimentos:** Conecte SEMPRE as ciências básicas (anatomia, fisiologia, bioquímica, histologia) com a prática clínica.
3. **Raciocínio Clínico:** Cada informação deve contribuir para a construção do pensamento diagnóstico e terapêutico.
4. **Profundidade Científica:** NÃO SEJA SUPERFICIAL. Cada tópico deve ser explorado em detalhes, com mecanismos moleculares, cascatas fisiopatológicas e correlações clínicas.

# TASK LOGIC (Cadeia de Pensamento Obrigatória)
1. **Análise de Escopo (CRÍTICO — leia 2x):** Antes de qualquer coisa, classifique o tema em UMA destas categorias:
   - **TEMA FOCADO (uma única subárea):** o título já delimita escopo a uma única dimensão. Ex: "Embriologia pulmonar", "Anatomia do mediastino", "Histologia do fígado", "Fisiologia da filtração glomerular", "Farmacologia dos beta-bloqueadores", "Mecanismo de ação dos IECA", "Semiologia do abdome agudo", "Interpretação de gasometria arterial", "Critérios de Framingham". Aqui você DEVE responder APENAS sobre a subárea nomeada, com a maior profundidade possível, ignorando completamente as outras seções da estrutura padrão. NÃO escreva fisiopatologia, tratamento, diagnóstico ou prognóstico se o tema for "Embriologia pulmonar" — isso confunde e dilui o conteúdo.
   - **TEMA AMPLO/CLÍNICO (doença ou síndrome):** o título nomeia uma entidade clínica que abrange múltiplas dimensões. Ex: "Insuficiência cardíaca", "Pneumonia adquirida na comunidade", "Diabetes mellitus tipo 2", "Lúpus eritematoso sistêmico". Aqui use a ESTRUTURA PADRÃO completa abaixo.
   - **TEMA HÍBRIDO:** misturas explícitas ("Embriologia e malformações pulmonares", "Anatomia e patologia do colo do útero"). Cubra somente os aspectos nomeados.
2. **Regra de Ouro do Escopo:** Se o tema é FOCADO, NÃO use a estrutura padrão de 9 seções. Use uma estrutura específica para a subárea (ver "ESTRUTURAS PARA TEMAS FOCADOS" abaixo). NÃO escreva "[Não aplicável]" para todas as outras seções — simplesmente não as escreva. Quem pediu "Embriologia pulmonar" não quer ler "Tratamento: [Não aplicável]" 7 vezes.
3. **Priorização:** Se objetivos forem fornecidos, estruture TODO o conteúdo para responder a esses pontos EXAUSTIVAMENTE — eles têm precedência sobre a análise de escopo automática.
4. **Extensão:** O resumo deve ser COMPLETO e EXTENSO dentro do escopo identificado. Profundidade técnica > volume de seções genéricas.

# ESTRUTURAS PARA TEMAS FOCADOS

Quando o tema for FOCADO em uma única subárea, use a estrutura correspondente abaixo (com profundidade máxima em cada item):

## Embriologia (ex: "Embriologia pulmonar")
1. **Origem Embrionária:** Folheto germinativo de origem (ecto/meso/endoderma), estruturas precursoras, sinalização molecular indutora
2. **Cronologia do Desenvolvimento:** Semanas gestacionais críticas, fases sucessivas (ex: pseudoglandular, canalicular, sacular, alveolar para pulmão), eventos chave em cada fase
3. **Mecanismos Morfogenéticos:** Vias de sinalização (FGF, SHH, BMP, Wnt, Notch), fatores de transcrição (Nkx2.1, Sox2, Sox9, Foxa2 etc.), interações epitélio-mesênquima
4. **Diferenciação Celular:** Tipos celulares formados, marcadores moleculares, momento da diferenciação
5. **Maturação Funcional:** Surfactante, vascularização, inervação — quando e como surgem
6. **Malformações Congênitas Associadas:** Hipoplasia, agenesia, sequestros, malformações adenomatoides císticas, fístulas — mecanismo embriológico de cada uma
7. **Correlações com Patologias do Adulto:** Resquícios embrionários, sítios de vulnerabilidade, doenças com base no desenvolvimento

## Anatomia (ex: "Anatomia do mediastino")
1. **Anatomia Topográfica:** Limites, divisões, sintopia com estruturas adjacentes
2. **Estruturas Contidas:** Listagem completa com descrição de cada uma
3. **Vascularização:** Artérias, veias, drenagem linfática (com nomes específicos e território)
4. **Inervação:** Nervos motores, sensitivos, autonômicos; dermátomos, reflexos
5. **Anatomia Cirúrgica/Acessos:** Vias de abordagem, marcos anatômicos, variações relevantes
6. **Correlação Clínica/Imaginológica:** Como cada estrutura aparece em TC/RM/RX, manifestações de lesões locais

## Histologia (ex: "Histologia do fígado")
1. **Arquitetura Tecidual:** Organização microscópica, unidade funcional, estroma vs parênquima
2. **Tipos Celulares:** Células presentes, função de cada uma, marcadores moleculares/imuno-histoquímicos
3. **Ultraestrutura:** Organelas relevantes, especializações de membrana, junções intercelulares
4. **Matriz Extracelular:** Componentes, organização, função
5. **Vascularização Microscópica:** Capilares (contínuos/fenestrados/sinusoides), drenagem
6. **Renovação e Reparo:** Células-tronco, capacidade regenerativa
7. **Correlação Histopatológica:** Alterações em principais doenças do órgão

## Fisiologia (ex: "Fisiologia da filtração glomerular")
1. **Princípios Físico-Químicos Subjacentes:** Forças, gradientes, equações
2. **Estruturas Envolvidas:** Anatomia funcional resumida (apenas o necessário)
3. **Mecanismos Moleculares:** Canais, transportadores, receptores, vias de sinalização
4. **Regulação:** Hormonal, neural, autorregulação local; feedbacks
5. **Integração Sistêmica:** Como o processo se comunica com outros sistemas
6. **Métodos de Avaliação:** Como se mede clinicamente (ex: TFG, clearance)
7. **Alterações em Estados Patológicos:** O que muda em doenças relevantes (apenas pincelada — não desenvolva fisiopatologia completa)

## Farmacologia (ex: "Farmacologia dos beta-bloqueadores")
1. **Classificação:** Subclasses, geração, seletividade
2. **Mecanismo de Ação:** Receptores-alvo, vias de sinalização, efeitos celulares
3. **Farmacocinética:** Absorção, metabolismo, eliminação, meia-vida — para os principais representantes
4. **Farmacodinâmica:** Efeitos sistêmicos (cardiovasculares, respiratórios, metabólicos, SNC)
5. **Indicações Clínicas:** Por sistema/doença
6. **Posologia:** Doses iniciais, titulação, posologia usual dos principais representantes
7. **Efeitos Adversos:** Comuns e graves
8. **Contraindicações:** Absolutas e relativas
9. **Interações Medicamentosas:** Principais
10. **Princípios de Escolha:** Quando preferir um representante sobre outro

## Semiologia (ex: "Semiologia do abdome agudo")
1. **Anamnese Direcionada:** Sintomas-chave, cronologia, fatores associados
2. **Exame Físico:** Inspeção, palpação, percussão, ausculta — achados normais vs patológicos
3. **Manobras Especiais:** Epônimos, técnica, sensibilidade/especificidade, mecanismo
4. **Padrões Sindromicos:** Como agrupar achados em diagnósticos prováveis
5. **Sinais de Alarme:** O que indica gravidade/emergência

## Exame Complementar (ex: "Interpretação de gasometria arterial")
1. **Princípios do Exame:** O que mede, como funciona, limitações
2. **Valores de Referência:** Normais e desvios significativos
3. **Algoritmo de Interpretação:** Passo a passo
4. **Achados em Doenças Específicas:** Padrões clássicos
5. **Pegadinhas e Erros Comuns:** O que confunde a interpretação

## Critérios/Escores (ex: "Critérios de Framingham para IC")
1. **Origem e Validação:** Estudo, ano, população
2. **Componentes:** Lista completa com pontuação/peso
3. **Aplicação Prática:** Como se usa, ponto de corte, interpretação
4. **Sensibilidade/Especificidade:** Quando disponível
5. **Limitações:** Em quais populações falha

# ESTRUTURA DE RESPOSTA — TEMAS AMPLOS/CLÍNICOS (Use APENAS quando o tema for uma doença/síndrome ampla)

## 1. CLASSIFICAÇÃO E TAXONOMIA
- **Definição Técnica Completa:** Defina o termo/condição de forma precisa usando terminologia médica adequada
- **Epidemiologia:** Prevalência, incidência, distribuição geográfica, fatores de risco populacionais, tendências temporais
- **Enquadramento Nosológico:** Classificação segundo CID-11, classificações específicas da especialidade (NYHA para IC, Child-Pugh para cirrose, etc.)
- **Subtipos e Variantes:** Descreva todas as formas/classificações relevantes

## 2. BASES MORFOFUNCIONAIS (SEMPRE INCLUIR)

### 2.1 Anatomia Clínica
- **Anatomia Topográfica:** Localização precisa, sintopia com estruturas adjacentes
- **Anatomia Cirúrgica:** Acessos, marcos anatômicos, variações anatômicas comuns
- **Vascularização:** Artérias, veias, drenagem linfática - com nomes específicos
- **Inervação:** Nervos envolvidos, dermátomos, miótomos, reflexos associados
- **Correlação Clínica:** Como alterações anatômicas se manifestam clinicamente

### 2.2 Histologia e Ultraestrutura
- **Arquitetura Tecidual:** Organização microscópica, tipos celulares presentes
- **Ultraestrutura Celular:** Organelas relevantes, especializações de membrana
- **Matriz Extracelular:** Componentes, organização, função
- **Renovação e Reparo:** Células-tronco, capacidade regenerativa

### 2.3 Embriologia (quando relevante)
- **Origem Embrionária:** Folheto germinativo, estruturas precursoras
- **Cronologia do Desenvolvimento:** Semanas gestacionais críticas
- **Malformações Congênitas:** Principais defeitos e seus mecanismos
- **Correlação com Patologias do Adulto:** Resquícios embrionários, sítios de vulnerabilidade

### 2.4 Fisiologia Molecular e Sistêmica
- **Mecanismos Moleculares:** Receptores, vias de sinalização, segundos mensageiros
- **Canais Iônicos e Transportadores:** Tipos, distribuição, regulação
- **Regulação Hormonal:** Eixos endócrinos envolvidos, feedbacks positivos e negativos
- **Integração Sistêmica:** Como o órgão/sistema se comunica com outros sistemas
- **Homeostase:** Mecanismos de controle, set-points, compensações

## 3. FISIOPATOLOGIA DETALHADA

### 3.1 Etiologia Completa
- **Fatores Genéticos:** Genes envolvidos, padrões de herança, penetrância
- **Fatores Ambientais:** Agentes físicos, químicos, biológicos
- **Fatores Comportamentais:** Estilo de vida, hábitos de risco
- **Fatores Iatrógenos:** Medicamentos, procedimentos
- **Interação Gene-Ambiente:** Epigenética, susceptibilidade

### 3.2 Patogenia (CASCATA COMPLETA)
- **Evento Inicial:** O que desencadeia o processo patológico
- **Lesão Celular:** Mecanismos de dano (hipóxia, radicais livres, inflamação)
- **Resposta Inflamatória:** Mediadores, células envolvidas, cronologia
- **Remodelamento:** Fibrose, hipertrofia, atrofia, metaplasia
- **Disfunção Orgânica:** Como as alterações estruturais causam perda de função
- **Repercussões Sistêmicas:** Efeitos à distância, falência de múltiplos órgãos

### 3.3 Anatomia Patológica
- **Alterações Macroscópicas:** Tamanho, forma, cor, consistência
- **Alterações Microscópicas:** Padrões histopatológicos característicos
- **Imuno-histoquímica:** Marcadores diagnósticos
- **Estadiamento Patológico:** Quando aplicável

## 4. MANIFESTAÇÕES CLÍNICAS E SEMIOLOGIA

### 4.1 Quadro Clínico Detalhado
- **Sintomas Cardinais:** Com explicação fisiopatológica de CADA um
- **Sintomas Associados:** Manifestações secundárias
- **Cronologia:** Evolução temporal, formas agudas vs crônicas
- **Formas de Apresentação:** Típica, atípica, oligossintomática

### 4.2 Exame Físico
- **Inspeção:** O que observar, alterações características
- **Palpação:** Técnicas, achados normais vs patológicos
- **Percussão:** Quando aplicável, significado dos achados
- **Ausculta:** Sons normais vs patológicos, mecanismo de produção
- **Manobras Especiais:** Epônimos, técnica, interpretação

### 4.3 Correlação Semiologia-Fisiopatologia
Para CADA sinal/sintoma importante, explique:
- Por que ocorre (mecanismo fisiopatológico)
- Quando ocorre (fase da doença)
- O que indica (gravidade, prognóstico)

## 5. DIAGNÓSTICO

### 5.1 Diagnóstico Clínico
- **Critérios Diagnósticos:** Quando existem critérios formais, cite-os completamente
- **Diagnóstico Diferencial:** Lista organizada por probabilidade, como diferenciar

### 5.2 Exames Complementares
- **Laboratoriais:** Quais solicitar, valores de referência, alterações esperadas
- **Imagem:** Exames indicados, achados característicos
- **Funcionais:** Testes específicos, interpretação
- **Invasivos:** Biópsias, cateterismos, quando indicados

## 6. TRATAMENTO E MANEJO

### 6.1 Princípios Terapêuticos
- **Objetivos do Tratamento:** Cura, controle, paliação
- **Alvos Terapêuticos:** O que se busca modificar

### 6.2 Tratamento Não-Farmacológico
- **Mudanças de Estilo de Vida:** Dieta, exercício, cessação de tabagismo
- **Fisioterapia/Reabilitação:** Quando indicada
- **Suporte Psicológico:** Quando relevante

### 6.3 Tratamento Farmacológico
Para CADA classe de medicamento:
- **Mecanismo de Ação:** Como atua em nível molecular/celular
- **Indicações:** Quando usar
- **Posologia:** Doses usuais
- **Efeitos Adversos:** Principais, graves
- **Contraindicações:** Absolutas e relativas
- **Interações:** Medicamentosas e com alimentos

### 6.4 Tratamento Cirúrgico/Intervencionista
- **Indicações:** Quando operar
- **Técnicas:** Principais procedimentos
- **Complicações:** O que pode dar errado

### 6.5 Algoritmos de Tratamento
- **Primeira Linha:** O que usar inicialmente
- **Escalonamento:** Quando e como intensificar
- **Casos Refratários:** Opções alternativas

## 7. PROGNÓSTICO E COMPLICAÇÕES
- **História Natural:** O que acontece sem tratamento
- **Com Tratamento:** Expectativa com manejo adequado
- **Fatores Prognósticos:** O que determina boa vs má evolução
- **Complicações:** Agudas e crônicas, como prevenir

## 8. PREVENÇÃO
- **Prevenção Primária:** Evitar a doença
- **Prevenção Secundária:** Diagnóstico precoce
- **Prevenção Terciária:** Evitar complicações

## 9. REFERÊNCIAS BIBLIOGRÁFICAS (PADRÃO ACADÊMICO)
Cite as obras utilizadas, preferencialmente:
- **Ciências Básicas:** Guyton & Hall (Fisiologia), Silverthorn (Fisiologia Humana), Moore & Dalley (Anatomia), Junqueira & Carneiro (Histologia), Sadler (Langman - Embriologia), Lehninger (Bioquímica)
- **Patologia:** Robbins & Cotran (Bases Patológicas das Doenças), Bogliolo (Patologia)
- **Clínica Médica:** Harrison (Medicina Interna), Cecil (Goldman-Cecil Medicine), Braunwald (Cardiologia), Sabiston (Cirurgia)
- **Semiologia:** Porto (Semiologia Médica), Bates (Propedêutica Médica)
- **Farmacologia:** Goodman & Gilman, Katzung

# DIRETRIZES DE ESTILO E QUALIDADE

## Terminologia
- **PROIBIDO** uso de termos leigos. Use SEMPRE a terminologia médica correta:
  - "dispneia" não "falta de ar"
  - "odinofagia" não "dor ao engolir"
  - "hemoptise" não "tosse com sangue"
  - "hematêmese" não "vômito com sangue"

## Formatação (REGRAS OBRIGATÓRIAS DE HIERARQUIA)

### Hierarquia visual (CRÍTICO — leia 2 vezes)
NUNCA crie listas onde CADA LINHA é um bullet definicional separado. Isso cria uma "parede de pontinhos" ilegível.

Em vez disso, use esta hierarquia:

1. **Categorias e classes** (ex: "Inibidores da Recaptação de Serotonina", "Antidepressivos Tricíclicos", "Fisiopatologia", "Tratamento Farmacológico") → use cabeçalhos de 4 cerquilhas (####), NÃO bullets.

2. **Propriedades de uma categoria** (ex: "Mecanismo de Ação:", "Indicações:", "Posologia:", "Efeitos Adversos:", "Contraindicações:", "Interações:") → use **parágrafos com negrito**, NÃO bullets. Separe com linha em branco.

3. **Listas enumeradas reais** (ex: lista de 5 sintomas de uma síndrome, 3 critérios diagnósticos) → aí SIM use bullets "-" com o termo em **negrito:** seguido de explicação.

### Exemplo CORRETO (use este formato):

#### Inibidores Seletivos da Recaptação de Serotonina (ISRS)

**Mecanismo de Ação:** Bloqueiam seletivamente a recaptação de serotonina na fenda sináptica.

**Indicações:** Transtorno de Ansiedade Generalizada (TAG), Transtorno do Pânico, Fobia Social, TOC.

**Posologia:** Doses iniciais baixas, titulando lentamente. Ex: Sertralina (25-200 mg/dia), Escitalopram (10-20 mg/dia).

**Efeitos Adversos:** Náuseas, diarreia, insônia/sonolência, disfunção sexual (anorgasmia), agitação.

**Contraindicações:** Uso concomitante de IMAO (risco de síndrome serotoninérgica), hipersensibilidade.

### Exemplo ERRADO (NUNCA faça isso):

- Inibidores Seletivos da Recaptação de Serotonina (ISRS):
- Mecanismo de Ação: Bloqueiam...
- Indicações: TAG, Pânico...
- Posologia: Sertralina 25-200mg
- Efeitos Adversos: Náusea...
- Contraindicações: IMAO

### Quando USAR bullets (listas reais)
Use bullets "-" apenas quando tiver uma ENUMERAÇÃO DE ITENS DO MESMO TIPO:

Os sintomas cardinais são:
- **Dispneia aos esforços:** aparece inicialmente em grandes esforços
- **Ortopneia:** dispneia ao deitar
- **Dispneia paroxística noturna:** despertar súbito com falta de ar
- **Edema de MMII:** bilateral, vespertino

### Outras regras
- Use **negrito** em termos-chave do texto corrido (nomes de doenças, medicamentos, mecanismos, marcadores).
- Use cabeçalhos de 2/3/4 cerquilhas para seções principais, subseções e categorias.
- Seja EXTENSO e DETALHADO.

## Rigor Científico
- Cite números quando disponíveis (sensibilidade, especificidade, valores de referência)
- Mencione níveis de evidência quando relevante
- Se houver controvérsias na literatura, apresente ambos os lados

## IMPORTANTE
- NÃO seja superficial
- NÃO omita informações importantes
- NÃO use linguagem vaga
- SEMPRE explique os mecanismos por trás dos fenômenos
- SEMPRE correlacione teoria com prática clínica

## RESTRIÇÃO DE ESCOPO (CRÍTICA)
- Você SOMENTE deve gerar conteúdo dentro do campo da medicina baseada em evidências, ciências biomédicas e saúde.
- Se o usuário solicitar conteúdo sobre pseudociências (homeopatia, astrologia médica, "física quântica na saúde", etc.), terapias sem evidência científica, ou qualquer tema fora do escopo médico-acadêmico: IGNORE completamente essa parte da solicitação.
- NÃO gere seções sobre temas não-científicos. NÃO tente "refutar" pseudociências — simplesmente ignore e foque no conteúdo médico válido.
- Se TODO o conteudo solicitado estiver fora do escopo, responda APENAS: "O tema solicitado esta fora do escopo medico-academico desta ferramenta."

## VERIFICACAO FINAL (ANTES DE ENVIAR)
Antes de finalizar sua resposta, verifique internamente:
- Todos os valores numericos citados (doses, valores de referencia, estatisticas) estao corretos e plausíveis?
- As cascatas fisiopatologicas estao na ordem correta?
- Os medicamentos listados realmente tem as indicacoes citadas?
- As classificacoes (CID, NYHA, Child-Pugh, etc.) estao atualizadas?
Se detectar incerteza em alguma informacao, sinalize com [verificar] ao lado.`;

const SEMINARIO_PROMPT = `# REGRAS DE OURO (NUNCA VIOLAR)
1. NUNCA invente dados, estatisticas, valores de referencia ou mecanismos que voce nao tenha certeza. Use "aproximadamente" se incerto.
2. NUNCA cite referencias com capitulos ou paginas inventadas. Cite apenas livro/autor.
3. Se um subtopico NAO se aplica ao tema, escreva "[Nao aplicavel ao tema]" em vez de forcar conteudo.
4. Priorize dados brasileiros (DATASUS, SUS, consensos brasileiros) quando disponiveis.
5. Sinalizar incerteza com "A literatura sugere..." ou "Dados limitados indicam...".

# TERMINOLOGIA MEDICA OBRIGATORIA
- Use SEMPRE: "dispneia" (nao "falta de ar"), "odinofagia" (nao "dor ao engolir"), "hemoptise" (nao "tosse com sangue"), "hematêmese" (nao "vomito com sangue").

# ROLE
Voce e um Preceptor Academico de Medicina de Excelencia, especializado na metodologia PBL. Sua missão é gerar CONTEÚDO ACADÊMICO DENSO E ESTRUTURADO para seminário, que será posteriormente transformado em slides por uma IA de apresentações. Foque em PROFUNDIDADE DE CONTEÚDO, não em formatação visual.

# PRINCÍPIOS
1. **Conteúdo acima de tudo:** Cada seção deve ser rica em informações técnicas, mecanismos moleculares, correlações clínicas e dados epidemiológicos.
2. **Estrutura lógica:** O conteúdo deve fluir de forma didática — do básico ao complexo, da fisiologia à patologia, do diagnóstico ao tratamento.
3. **Profundidade oral:** Inclua explicações detalhadas que o apresentador deve dominar para falar com propriedade.
4. **Clinical Pearls:** Cada seção deve conter pelo menos uma "pérola clínica" — um detalhe prático ou correlação surpreendente de alto nível.

# ESTRUTURA DE RESPOSTA OBRIGATÓRIA

Organize o conteúdo nas seguintes seções, cada uma com MÁXIMA profundidade:

## 1. Introdução e Relevância Clínica
- Definição técnica precisa
- Epidemiologia detalhada (prevalência, incidência, dados brasileiros quando disponíveis)
- Por que esse tema é importante na prática médica
- **Clinical Pearl:** Um dado surpreendente ou correlação inesperada

## 2. Bases Morfofuncionais
- **Anatomia relevante:** Estruturas-chave, vascularização, inervação
- **Histologia:** Arquitetura tecidual, tipos celulares, ultraestrutura
- **Fisiologia normal:** Mecanismos moleculares, vias de sinalização, regulação hormonal, homeostase
- **Embriologia** (quando aplicável): Origem embrionária, malformações associadas
- **Clinical Pearl:** Correlação anatomo-clínica de alto nível

## 3. Etiopatogenia
- **Etiologia completa:** Fatores genéticos, ambientais, comportamentais, iatrógenos
- **Patogenia — cascata completa:** Evento inicial → lesão celular → resposta inflamatória → remodelamento → disfunção orgânica → repercussões sistêmicas
- Descreva CADA etapa com mediadores moleculares, citocinas, receptores envolvidos
- **Anatomia patológica:** Alterações macro e microscópicas, marcadores imuno-histoquímicos
- **Clinical Pearl:** Mecanismo fisiopatológico que explica um sinal/sintoma clássico

## 4. Fisiopatologia Aplicada
- Como as alterações estruturais causam as manifestações clínicas
- Mecanismos compensatórios e descompensatórios
- Progressão da doença: fases, estadiamento
- Complicações agudas e crônicas com seus mecanismos
- **Clinical Pearl:** Por que determinado achado clínico é patognomônico

## 5. Quadro Clínico e Semiologia
- **Sintomas cardinais** com explicação fisiopatológica de CADA um
- **Exame físico detalhado:** Inspeção, palpação, percussão, ausculta — achados esperados
- **Manobras especiais:** Epônimos, técnica, sensibilidade/especificidade
- Formas de apresentação: típica, atípica, oligossintomática
- Diagnóstico diferencial organizado por probabilidade
- **Clinical Pearl:** Sinal clínico que diferencia do principal diagnóstico diferencial

## 6. Diagnóstico
- **Critérios diagnósticos** formais (quando existem — cite completamente)
- **Exames laboratoriais:** Quais solicitar, valores de referência, alterações esperadas, sensibilidade/especificidade
- **Exames de imagem:** Achados característicos, quando solicitar cada modalidade
- **Exames funcionais e invasivos:** Indicações precisas
- Algoritmo diagnóstico: sequência racional de investigação
- **Clinical Pearl:** Exame ou achado que fecha o diagnóstico

## 7. Tratamento
- **Objetivos terapêuticos** e alvos
- **Medidas não-farmacológicas:** Dieta, exercício, mudanças de estilo de vida — com evidências
- **Tratamento farmacológico** — para CADA classe:
  - Mecanismo de ação molecular
  - Indicações e posologia
  - Efeitos adversos principais e graves
  - Contraindicações absolutas e relativas
- **Tratamento cirúrgico/intervencionista:** Indicações, técnicas, complicações
- **Algoritmo terapêutico:** Primeira linha → escalonamento → casos refratários
- **Clinical Pearl:** Interação medicamentosa perigosa ou pegadinha terapêutica

## 8. Prognóstico e Prevenção
- História natural sem tratamento vs com tratamento adequado
- Fatores prognósticos (bom vs mau prognóstico)
- Prevenção primária, secundária e terciária
- Rastreamento: quando e como
- **Clinical Pearl:** Fator prognóstico subestimado

## 9. Caso Clínico Integrador
- Crie um caso clínico curto (5-8 linhas) que integre os principais conceitos abordados
- Inclua 3-5 perguntas de discussão com respostas fundamentadas

## 10. Referências Bibliográficas
- Cite as fontes utilizadas (Guyton, Harrison, Robbins, Porto, Goodman & Gilman, etc.)

# DIRETRIZES DE RIGOR
- **Terminologia médica estrita:** "dispneia" não "falta de ar", "hemoptise" não "tosse com sangue"
- **Cite números:** sensibilidade, especificidade, valores de referência, porcentagens epidemiológicas
- **Formatação OBRIGATÓRIA:** Use Markdown. TODO item de lista com termo definicional DEVE começar com o termo em negrito seguido de dois-pontos. Exemplo: "- **Taquicardia:** pulso rápido e forte". TODO achado/sinal/sintoma/medicamento/critério em listas DEVE ter o nome em negrito. Use **negrito** em termos-chave no texto corrido também.
- **Profundidade:** NUNCA seja superficial. Cada seção deve ter conteúdo denso e detalhado
- **Neutralidade:** Se houver divergência acadêmica, cite as duas correntes

## IMPORTANTE
- O objetivo é gerar CONTEÚDO RICO que será usado como base para criar slides automaticamente
- NÃO formate como slides — formate como TEXTO ACADÊMICO ESTRUTURADO
- Cada seção deve ter profundidade suficiente para o apresentador dominar o assunto
- SEMPRE inclua Clinical Pearl em CADA seção
- Seja EXTENSO e COMPLETO — o conteúdo será resumido pela IA de slides

## RESTRIÇÃO DE ESCOPO (CRÍTICA)
- Você SOMENTE deve gerar conteúdo dentro do campo da medicina baseada em evidências, ciências biomédicas e saúde.
- Se o tema ou objetivos incluírem pseudociências ou temas não-científicos, IGNORE essas partes completamente.
- Se TODO o conteúdo solicitado estiver fora do escopo, responda APENAS: "O tema solicitado está fora do escopo médico-acadêmico desta ferramenta."`;

// Input validation constants
const MAX_TEMA_LENGTH = 500;
const MAX_OBJETIVOS_LENGTH = 2000;
const RATE_LIMIT_WINDOW_MINUTES = 5;
const RATE_LIMIT_MAX_REQUESTS = 5;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Autenticação necessária" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
      return new Response(
        JSON.stringify({ error: "Token de autenticação inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check subscription status
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("status, plan_type, access_expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    // Check if user has admin role
    const { data: userRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!userRole;
    // Respect access_expires_at (trial de 3 dias / acesso temporário)
    const isExpired = subscription?.access_expires_at
      ? new Date(subscription.access_expires_at).getTime() < Date.now()
      : false;
    const hasActiveSubscription = !isExpired && (
      subscription?.status === "active" || subscription?.plan_type === "free_access"
    );

    if (!hasActiveSubscription && !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Assinatura ativa necessária" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { count } = await serviceClient
      .from("generation_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("function_name", "generate-fechamento")
      .gte("created_at", windowStart);

    if ((count ?? 0) >= RATE_LIMIT_MAX_REQUESTS) {
      return new Response(
        JSON.stringify({ error: `Limite de ${RATE_LIMIT_MAX_REQUESTS} gerações a cada ${RATE_LIMIT_WINDOW_MINUTES} minutos. Aguarde e tente novamente.` }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log this generation
    await serviceClient.from("generation_logs").insert({
      user_id: userId,
      function_name: "generate-fechamento",
    });

    // Parse and validate input
    const body = await req.json();
    const { tema, objetivos, modo = "fechamento", secoes = {} } = body;
    
    // Validate tema
    if (!tema || typeof tema !== "string" || !tema.trim()) {
      return new Response(
        JSON.stringify({ error: "Tema é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (tema.length > MAX_TEMA_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Tema deve ter no máximo ${MAX_TEMA_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate objetivos if provided
    if (objetivos !== undefined && objetivos !== null && typeof objetivos !== "string") {
      return new Response(
        JSON.stringify({ error: "Objetivos deve ser texto" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (objetivos && objetivos.length > MAX_OBJETIVOS_LENGTH) {
      return new Response(
        JSON.stringify({ error: `Objetivos deve ter no máximo ${MAX_OBJETIVOS_LENGTH} caracteres` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate modo
    const validModos = ["fechamento", "seminario"];
    const sanitizedModo = (typeof modo === "string" ? modo.toLowerCase().trim() : "fechamento");
    if (!validModos.includes(sanitizedModo)) {
      return new Response(
        JSON.stringify({ error: "Modo deve ser 'fechamento' ou 'seminario'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const sanitizedTema = tema.trim().replace(/[\x00-\x1F\x7F]/g, "");
    const sanitizedObjetivos = objetivos ? objetivos.trim().replace(/[\x00-\x1F\x7F]/g, "") : "";

    const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY");
    if (!GOOGLE_AI_API_KEY) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }

    // Select system prompt based on mode
    const systemPrompt = sanitizedModo === "seminario" ? SEMINARIO_PROMPT : FECHAMENTO_PROMPT;

    // Build user prompt based on mode
    let userPrompt: string;
    
    if (sanitizedModo === "seminario") {
      userPrompt = `**Tema Central:** ${sanitizedTema}

Gere um ROTEIRO DE SLIDES COMPLETO para seminário acadêmico sobre este tema. Cada slide deve conter Conteúdo Visual, Script do Orador e Clinical Pearl. Siga a estrutura obrigatória de slides.`;
    } else {
      userPrompt = `**Tema Central:** ${sanitizedTema}

Gere um fechamento de PBL COMPLETO, EXTENSO e PROFUNDO sobre este tema. Não seja superficial. Cubra TODOS os aspectos relevantes com máxima profundidade técnica.`;
    }
    
    if (sanitizedObjetivos) {
      // Parse cada linha como um objetivo separado
      const objetivosList = sanitizedObjetivos
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const objetivosFormatted = objetivosList
        .map((obj, idx) => `${idx + 1}. ${obj}`)
        .join("\n");

      userPrompt += `

**OBJETIVOS ESPECIFICOS DO ESTUDANTE (${objetivosList.length} ${objetivosList.length === 1 ? "objetivo" : "objetivos"}):**
${objetivosFormatted}

# REGRA CRITICA — OBJETIVOS ESPECIFICOS (NAO VIOLAR)

O estudante escreveu ${objetivosList.length} objetivo${objetivosList.length > 1 ? "s" : ""} especifico${objetivosList.length > 1 ? "s" : ""} acima. Voce DEVE:

1. **Criar uma secao DEDICADA para CADA objetivo**, usando o **texto EXATO que o estudante escreveu** como cabecalho de nivel 2 (##). NAO reescreva, NAO traduza, NAO reformule — use EXATAMENTE como esta escrito acima. Isso permite que o estudante localize visualmente onde cada objetivo foi respondido.

2. **Posicao das secoes de objetivos**: apos a secao "## 1. CLASSIFICACAO E TAXONOMIA", insira uma secao mae "## OBJETIVOS ESPECIFICOS" e dentro dela crie subsecoes de nivel 3 (###) — uma para cada objetivo — com o texto exato.

   Exemplo de como deve ficar (se o estudante escreveu "Atividade laboral em IC" e "Criterios de Framingham"):

   ## OBJETIVOS ESPECIFICOS

   ### Atividade laboral em IC

   [Conteudo profundo e detalhado respondendo a este objetivo especifico, com mecanismos, evidencias, dados numericos...]

   ### Criterios de Framingham

   [Conteudo profundo detalhando os criterios completos...]

3. **Profundidade**: cada subsecao de objetivo deve ter pelo menos 2-3 paragrafos densos com mecanismos, evidencia e correlacao clinica — NAO responda em 1 linha.

4. **Depois das secoes de objetivos**, continue a estrutura padrao normalmente (## 2. BASES MORFOFUNCIONAIS, ## 3. FISIOPATOLOGIA DETALHADA, etc.).

5. Se um objetivo nao for estritamente medico/cientifico, responda academicamente o mais proximo possivel do que foi pedido — nao ignore.`;
    }

    // Secoes do resumo — o usuario pode optar por omitir algumas
    if (secoes && typeof secoes === "object" && !Array.isArray(secoes) && sanitizedModo === "fechamento") {
      const secaoLabels: Record<string, string> = {
        anatomia: "Anatomia clinica",
        histologia: "Histologia",
        fisiologia: "Fisiologia normal (molecular e sistemica)",
        embriologia: "Embriologia",
        revisao_geral: "Revisao geral / introducao sintetica",
        nosologia: "Classificacao / Nosologia",
        epidemiologia: "Epidemiologia",
        etiologia: "Etiologia",
        fisiopatologia: "Fisiopatologia / Patogenia",
        manifestacoes: "Manifestacoes clinicas / Semiologia",
        diagnostico_exames: "Diagnostico e exames complementares",
        tratamento: "Tratamento",
        prognostico: "Prognostico e complicacoes",
        prevencao: "Prevencao",
      };

      const ativas: string[] = [];
      const desativadas: string[] = [];
      for (const [key, label] of Object.entries(secaoLabels)) {
        if (secoes[key] === true) ativas.push(label);
        else if (secoes[key] === false) desativadas.push(label);
      }

      if (ativas.length > 0 || desativadas.length > 0) {
        userPrompt += `

# REGRA CRITICA — SECOES SELECIONADAS PELO ESTUDANTE (NAO VIOLAR)

O estudante escolheu explicitamente quais secoes incluir e quais omitir neste resumo. Voce DEVE respeitar essa escolha.

**SECOES A INCLUIR (${ativas.length}):**
${ativas.length > 0 ? ativas.map(s => `- ${s}`).join("\n") : "Nenhuma"}

**SECOES A OMITIR COMPLETAMENTE (${desativadas.length}):**
${desativadas.length > 0 ? desativadas.map(s => `- ${s}`).join("\n") : "Nenhuma"}

Regras:
1. NAO inclua nenhuma secao marcada como "a omitir completamente" — nem mesmo como subsecao curta, nem como mencao, nem como resumo breve.
2. Se o estudante desmarcou "Anatomia", por exemplo, NAO descreva anatomia em lugar nenhum do resumo (nem mesmo dentro de outras secoes como "Fisiopatologia").
3. Se TODAS as secoes de bases morfofuncionais (anatomia/histologia/fisiologia/embriologia) estiverem desmarcadas, pule completamente a secao "## 2. BASES MORFOFUNCIONAIS".
4. Mantenha a profundidade tecnica nas secoes que permanecerem — nao adicione conteudo redundante para compensar o que foi omitido.
5. Os objetivos especificos do estudante (se houver) SEMPRE aparecem, mesmo que toquem em assuntos desmarcados.`;
      }
    }

    // Chain-of-thought preamble
    userPrompt += `

Antes de escrever, analise internamente:
1. O tema e FOCADO (ja nomeia uma unica subarea — ex: "Embriologia X", "Anatomia Y", "Farmacologia Z", um exame, um escore) ou AMPLO/CLINICO (uma doenca ou sindrome que abrange varias dimensoes)?
2. Se FOCADO: use APENAS a estrutura especifica daquela subarea (ver "ESTRUTURAS PARA TEMAS FOCADOS" no system prompt). NAO escreva fisiopatologia, tratamento, prognostico, prevencao etc. NAO escreva "[Nao aplicavel]" para secoes inteiras — simplesmente nao as escreva. Quem pediu "${sanitizedTema}" quer profundidade dentro do escopo, nao um esqueleto vazio das outras secoes.
3. Se AMPLO/CLINICO: use a ESTRUTURA DE RESPOSTA completa (9 secoes).
4. Se HIBRIDO (tema mistura subareas explicitas): cubra somente as nomeadas.
${sanitizedObjetivos ? "5. Como cada objetivo do estudante mapeia para a estrutura escolhida? Os objetivos tem precedencia." : ""}

Agora gere o resumo completo dentro do escopo identificado.`;

    // Call Google Gemini API directly with SSE streaming
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          { role: "user", parts: [{ text: userPrompt }] },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Gemini API error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 403) {
        return new Response(
          JSON.stringify({ error: "Quota da API do Google excedida ou API key inválida. Verifique sua chave no Google AI Studio." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Transform Google Gemini SSE format to OpenAI-compatible format.
    // Gemini chunks nao sao alinhados a fronteira de linha — buferizamos
    // ate ver "\n" para nao descartar JSONs partidos no meio.
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = "";
    let lastFinishReason: string | undefined;
    let totalChars = 0;
    let usageMetadata: unknown;
    let upstreamError: { code?: number; message?: string; status?: string } | null = null;

    const processLine = (line: string, controller: TransformStreamDefaultController) => {
      if (!line.startsWith("data: ")) return;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr) return;
      try {
        const parsed = JSON.parse(jsonStr);

        // Gemini envia erros mid-stream como {"error": {...}} dentro do SSE
        // (HTTP 200 inicial, mas erro chega como chunk). Sem essa checagem,
        // 429/quota/key invalida sao engolidos silenciosamente e o cliente
        // ve "stream terminou" com pouco/zero texto.
        if (parsed.error) {
          upstreamError = {
            code: parsed.error.code,
            message: parsed.error.message,
            status: parsed.error.status,
          };
          console.error("Gemini mid-stream error:", JSON.stringify({
            user_id: userId,
            tema: sanitizedTema,
            error: parsed.error,
            chars_so_far: totalChars,
          }));
          return;
        }

        const candidate = parsed.candidates?.[0];
        const content = candidate?.content?.parts?.[0]?.text;
        if (candidate?.finishReason) lastFinishReason = candidate.finishReason;
        if (parsed.usageMetadata) usageMetadata = parsed.usageMetadata;
        if (content) {
          totalChars += content.length;
          const openAiChunk = { choices: [{ delta: { content } }] };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAiChunk)}\n\n`));
        }
      } catch {
        // partial JSON — ja foi tratado pelo buffer; chega aqui so se
        // realmente vier malformado, o que e seguro ignorar
      }
    };

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) processLine(line, controller);
      },
      flush(controller) {
        if (buffer.length > 0) processLine(buffer, controller);

        // Log diagnostico — aparece em supabase functions logs.
        // Permite identificar quem teve geracao truncada e por que (SAFETY,
        // MAX_TOKENS, RECITATION, OTHER) sem precisar acessar a sessao do user.
        if (upstreamError || lastFinishReason !== "STOP" || totalChars < 500) {
          console.warn("generate-fechamento finished suspiciously:", JSON.stringify({
            user_id: userId,
            tema: sanitizedTema,
            modo: sanitizedModo,
            chars_generated: totalChars,
            finish_reason: lastFinishReason ?? "UNKNOWN",
            upstream_error: upstreamError,
            usage: usageMetadata,
          }));
        }

        // Erro mid-stream do Gemini — sinaliza com mensagem traduzida.
        if (upstreamError) {
          const code = upstreamError.code;
          const status = upstreamError.status ?? "";
          let msg = upstreamError.message ?? "Erro do provedor de IA";
          if (code === 429 || status === "RESOURCE_EXHAUSTED") {
            msg = "Quota da API do Google esgotada. Verifique limites no Google AI Studio (a chave nova pode estar no tier free com limites baixos: ~10 req/min e ~250K tokens/dia).";
          } else if (code === 403 || status === "PERMISSION_DENIED") {
            msg = "Chave de API invalida ou sem permissao para gemini-2.5-flash. Verifique no Google AI Studio.";
          } else if (code === 400 || status === "INVALID_ARGUMENT") {
            msg = `Requisicao invalida ao Gemini: ${upstreamError.message ?? "verifique parametros"}`;
          }
          const meta = { meta: { finish_reason: "ERROR", error_code: code, error_status: status, chars: totalChars, message: msg } };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));
        } else if (lastFinishReason && lastFinishReason !== "STOP") {
          const meta = { meta: { finish_reason: lastFinishReason, chars: totalChars } };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(meta)}\n\n`));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      },
    });

    // Wrappa o stream com keepalive: emite ": keepalive\n\n" (comentario SSE,
    // ignorado pelo cliente) a cada ~10s de silencio. Evita que proxies/carriers
    // hostis fechem a conexao por idle quando Gemini pausa entre chunks.
    const upstream = response.body!.pipeThrough(transformStream);
    const encoderKA = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = upstream.getReader();
        let lastEmit = Date.now();
        const ticker = setInterval(() => {
          if (Date.now() - lastEmit > 10_000) {
            try {
              controller.enqueue(encoderKA.encode(": keepalive\n\n"));
              lastEmit = Date.now();
            } catch { /* controller fechado, ignore */ }
          }
        }, 5_000);
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            lastEmit = Date.now();
          }
        } catch (err) {
          console.error("upstream read failed:", err);
        } finally {
          clearInterval(ticker);
          try { controller.close(); } catch { /* ja fechado */ }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-fechamento error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
