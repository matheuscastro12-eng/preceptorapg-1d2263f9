
# Castro's PBL - Plano de Implementação

## Visão Geral
Aplicativo de suporte ao estudo para estudantes de medicina utilizando metodologia PBL/APG. O sistema usa IA para gerar automaticamente "Fechamentos de Objetivos" com alta densidade técnica, seguindo o padrão acadêmico da rede AFYA.

---

## 1. Tela de Autenticação
- **Login/Cadastro** com email e senha
- Visual dark mode com tons de azul/verde médico
- Logo e branding "Castro's PBL"

## 2. Dashboard Principal
- Painel com pesquisas recentes do usuário
- Acesso rápido para gerar novo fechamento
- Estatísticas pessoais (total de temas estudados)
- Biblioteca de conteúdos salvos

## 3. Gerador de Fechamento (Core Feature)
**Formulário de entrada:**
- Campo para "Tema Central" (obrigatório)
- Campo para "Objetivos de Aprendizado" (opcional)
- Botão para gerar conteúdo com IA

**Área de resultado:**
- Conteúdo formatado com markdown
- Seções conforme estrutura definida (Classificação, Desenvolvimento Técnico, Referências)
- Opções: Salvar, Copiar, Compartilhar via link, Exportar PDF

## 4. Biblioteca Pessoal
- Lista de todos os fechamentos salvos
- Filtros por data, tema, classificação (morfofuncional/clínico)
- Busca por palavras-chave
- Opção de favoritar conteúdos importantes

## 5. Compartilhamento e Turmas
- Gerar link público para compartilhar fechamento específico
- Criar/participar de grupos de estudo
- Visualizar conteúdos compartilhados pela turma

---

## Tecnologias Backend
- **Lovable Cloud** para banco de dados e autenticação
- **Lovable AI** (Gemini) para geração dos fechamentos
- Armazenamento seguro do histórico de estudos

---

## Design Visual
- **Modo escuro** como padrão
- Paleta: tons de azul escuro, verde médico e branco
- Tipografia limpa e hierárquica para facilitar leitura
- Formatação rica com negrito em termos-chave e listas estruturadas
