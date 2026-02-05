
# Plano de Modernização - Castro's PBL

## Visão Geral das Mudanças
Transformar a interface atual em um design moderno e dinâmico inspirado em aplicativos de IA como Doctor Wise, adicionar estatísticas reais do banco de dados e implementar uma barra de progresso durante a geração.

---

## 1. Estatísticas Pessoais (Dados Reais do Banco)

### Implementação
- Criar query para buscar estatísticas do usuário logado:
  - Total de fechamentos gerados
  - Total de favoritos
  - Temas estudados este mês
- Exibir em cards compactos no topo do dashboard
- Dados carregados em tempo real do Supabase

### Cards de Estatísticas
- Total de Fechamentos
- Fechamentos Favoritos
- Gerados este Mês
- Ícones animados e cores diferenciadas

---

## 2. Barra de Progresso (1-100%)

### Lógica de Estimativa
Como a API de streaming não fornece progresso real, implementarei uma barra de progresso **simulada inteligente**:
- Inicio rápido (0-20%) nos primeiros 3 segundos
- Progresso gradual (20-80%) ao longo de ~90 segundos
- Aceleração (80-95%) quando começa a receber dados
- Conclusão (95-100%) quando o streaming termina

### Visual
- Barra animada com gradiente médico
- Porcentagem numérica visível
- Mensagens de status dinâmicas ("Analisando tema...", "Gerando conteúdo técnico...", etc.)

---

## 3. Redesign Moderno (Estilo AI App)

### Layout Geral
- **Sidebar fixa** à esquerda com navegação e estatísticas
- **Área central expandida** para o gerador e resultado
- **Header minimalista** com gradiente sutil
- **Animações suaves** em interações

### Paleta Visual Atualizada
- Background: tons mais profundos com camadas (glass morphism)
- Acentos: gradientes animados no hover
- Cards: bordas com glow sutil, sombras mais pronunciadas
- Botões: hover com scale e glow effect

### Componentes Modernizados
- **Campo de entrada** maior e mais proeminente (estilo prompt de IA)
- **Resultado** em área de destaque com animação de typing
- **Biblioteca** em drawer lateral ou seção colapsável
- **Botões de ação** flutuantes com ícones maiores

### Animações
- Fade-in nos resultados conforme texto aparece
- Pulse suave nos cards de estatísticas
- Transições smooth entre estados
- Skeleton loading para carregamentos

---

## 4. Arquivos a Modificar

### `src/pages/Dashboard.tsx`
- Adicionar hook para buscar estatísticas
- Implementar barra de progresso com estado
- Redesenhar layout completo para formato moderno
- Adicionar animações e transições

### `src/index.css`
- Novas classes de animação
- Estilos de glass morphism
- Efeitos de glow e gradientes animados

### `src/components/FechamentoLibrary.tsx`
- Redesenhar para formato mais compacto
- Adicionar transições suaves

### Novos Componentes
- `src/components/StatsCard.tsx` - Card de estatística individual
- `src/components/ProgressBar.tsx` - Barra de progresso customizada (ou usar o existente com customização)

---

## Detalhes Técnicos

### Query de Estatísticas
```sql
-- Total de fechamentos do usuário
SELECT COUNT(*) FROM fechamentos WHERE user_id = ?

-- Total de favoritos
SELECT COUNT(*) FROM fechamentos WHERE user_id = ? AND favorito = true

-- Este mês
SELECT COUNT(*) FROM fechamentos 
WHERE user_id = ? AND created_at >= date_trunc('month', now())
```

### Barra de Progresso (Pseudocódigo)
```text
1. Ao clicar "Gerar":
   - Iniciar timer de progresso simulado
   - 0-20% em 3 segundos (fase inicial rápida)
   - 20-75% gradual ~1% a cada 1.2 segundos
   
2. Ao receber primeiro chunk de dados:
   - Acelerar para 80%
   
3. Ao receber chunks contínuos:
   - Incrementar 0.5% por chunk (max 95%)
   
4. Ao completar streaming:
   - Finalizar em 100% com animação
```

### Estrutura de Layout Moderno
```text
┌─────────────────────────────────────────────┐
│  Header: Logo + Stats Cards + Logout        │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Input Area (Tema + Objetivos)       │   │
│  │  [Botão Gerar com Glow]              │   │
│  │  [Barra de Progresso]                │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Resultado (Full Width, Expandido)   │   │
│  │  [Ações: Salvar, Copiar, PDF]        │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  Biblioteca (Colapsável)             │   │
│  └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## Resultado Esperado
- Interface moderna e profissional comparável a apps de IA de mercado
- Estatísticas reais do banco de dados, sem dados fictícios
- Feedback visual claro durante geração com barra de progresso
- Experiência mais fluida e dinâmica
