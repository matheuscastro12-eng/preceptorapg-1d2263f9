
# Plano de Reestruturação da Interface - Castro's PBL

## Visão Geral
Reorganizar a interface para ter uma tela principal limpa e focada no gerador, com biblioteca e perfil em abas/modais separados, além de adicionar animação de typing no resultado.

---

## 1. Nova Estrutura de Navegação

### Layout Principal
```text
┌─────────────────────────────────────────────────────────────────┐
│  Header: Logo   [Gerador] [Biblioteca]         [Ícone Perfil]   │
├────────────────────────┬────────────────────────────────────────┤
│                        │                                        │
│   ÁREA DE INPUT        │           ÁREA DE RESULTADO            │
│   (Lado Esquerdo)      │           (Lado Direito)               │
│                        │                                        │
│   - Tema               │   - Texto com animação de typing       │
│   - Objetivos          │   - Botões: Salvar, Copiar, PDF        │
│   - Botão Gerar        │   - Scroll interno                     │
│   - Barra Progresso    │                                        │
│                        │                                        │
└────────────────────────┴────────────────────────────────────────┘
```

### Abas do Header
- **Gerador** (aba principal): Tela dividida com input e resultado
- **Biblioteca**: Fechamentos salvos em tela cheia
- **Perfil** (ícone no canto): Dropdown/modal com estatísticas e logout

---

## 2. Animação de Typing

### Implementação
- Criar CSS para cursor piscando no final do texto
- Aplicar efeito quando `generating === true` e texto está sendo recebido
- Remover cursor quando geração completar

### CSS Necessário
```css
@keyframes blink-cursor {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

.typing-cursor::after {
  content: '▋';
  animation: blink-cursor 1s infinite;
  color: hsl(var(--primary));
}
```

---

## 3. Componentes a Criar/Modificar

### Novos Componentes
- `src/components/ProfileDropdown.tsx`: Menu dropdown do perfil com estatísticas
- `src/pages/Library.tsx`: Página dedicada para biblioteca

### Modificações
- `src/App.tsx`: Adicionar rota `/library`
- `src/pages/Dashboard.tsx`: Redesenhar para layout lado-a-lado (input | resultado)
- `src/components/MarkdownRenderer.tsx`: Adicionar suporte para cursor de typing
- `src/index.css`: Adicionar animação de cursor

---

## 4. Detalhes Técnicos

### Dashboard Redesenhado
- Usar `grid grid-cols-2` para dividir a tela em desktop
- Input à esquerda com altura total
- Resultado à direita com scroll interno
- Mobile: empilhar verticalmente

### ProfileDropdown
- Ícone `User` ou `CircleUser` no header
- Ao clicar, abrir Popover/DropdownMenu com:
  - Email do usuário
  - Cards de estatísticas (compactos)
  - Botão de logout
- Usar componente `Popover` existente

### Animação de Typing no MarkdownRenderer
- Prop `isTyping?: boolean`
- Quando true, adicionar classe `.typing-cursor` ao container
- Container do texto recebe cursor piscando no final

### Navegação por Abas
- Usar tabs no header para alternar entre Gerador e Biblioteca
- Tabs integrados ao header de forma elegante
- Estado controlado por URL ou state local

---

## 5. Arquivos a Modificar

| Arquivo | Ação |
|---------|------|
| `src/App.tsx` | Adicionar rota `/library` |
| `src/pages/Dashboard.tsx` | Redesenhar layout lado-a-lado, remover stats e biblioteca |
| `src/pages/Library.tsx` | Nova página com FechamentoLibrary em tela cheia |
| `src/components/ProfileDropdown.tsx` | Novo componente de perfil |
| `src/components/MarkdownRenderer.tsx` | Adicionar prop isTyping com cursor |
| `src/index.css` | Adicionar keyframes de cursor piscando |

---

## Resultado Esperado
- Tela principal limpa e focada na geração
- Layout dividido: input à esquerda, resultado à direita
- Biblioteca acessível por aba dedicada
- Perfil com estatísticas em dropdown no canto superior direito
- Animação de typing enquanto IA gera conteúdo
