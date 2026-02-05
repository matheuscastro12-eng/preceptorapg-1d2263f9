
# Plano: Toggle Dark/Light Mode, Renomear Botão e Melhorar Formatação

## Visão Geral
1. Adicionar toggle de tema escuro/claro no ProfileDropdown
2. Renomear "Gerar Fechamento" para "Estudar"
3. Melhorar a formatação do resultado com espaçamentos e visual mais profissional

---

## 1. Toggle de Tema (Dark/Light Mode)

### Implementação
- Utilizar a biblioteca `next-themes` já instalada no projeto
- Adicionar `ThemeProvider` no `App.tsx` para gerenciar o estado do tema
- Remover a classe `dark` fixa do `html` no CSS
- Adicionar switch de tema no `ProfileDropdown` com ícones de sol/lua

### Arquivos a Modificar
- `src/App.tsx`: Envolver app com `ThemeProvider`
- `src/index.css`: Remover `@apply dark` do html
- `src/components/ProfileDropdown.tsx`: Adicionar toggle com `useTheme()`

---

## 2. Renomear Botão

### Mudança
- Trocar texto "Gerar Fechamento" para "Estudar"
- Manter ícone de Sparkles

### Arquivo
- `src/pages/Dashboard.tsx`: Alterar texto do botão

---

## 3. Melhorar Formatação do Resultado

### Melhorias no MarkdownRenderer
- Aumentar espaçamento entre seções
- Adicionar bordas/backgrounds sutis para separar seções
- Melhorar contraste e legibilidade
- Adicionar estilos para tabelas (caso existam)
- Melhorar visual de listas com bullets customizados
- Adicionar padding e margens mais generosas

### CSS Adicional
- Criar classe `.markdown-content` com estilos refinados
- Adicionar separadores visuais entre seções h2
- Melhorar visual de blockquotes e código

### Arquivo
- `src/components/MarkdownRenderer.tsx`: Refinar componentes
- `src/index.css`: Adicionar estilos para `.markdown-content`

---

## Detalhes Técnicos

### ThemeProvider Setup
```tsx
// App.tsx
import { ThemeProvider } from 'next-themes';

<ThemeProvider attribute="class" defaultTheme="dark">
  {/* routes */}
</ThemeProvider>
```

### Toggle no ProfileDropdown
```tsx
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Sun, Moon } from 'lucide-react';

const { theme, setTheme } = useTheme();

<div className="flex items-center justify-between">
  <span>Modo Claro</span>
  <Switch 
    checked={theme === 'light'} 
    onCheckedChange={(checked) => setTheme(checked ? 'light' : 'dark')} 
  />
</div>
```

### Formatação Melhorada no Markdown
- Headings h2: Adicionar background sutil e padding
- Listas: Espaçamento maior entre itens, bullets com cor primária
- Parágrafos: Line-height maior para melhor leitura
- Seções: Margin-top maior para separar conteúdo
- Strong/Bold: Destaque com cor primária

---

## Resultado Esperado
- Toggle funcional para alternar entre tema claro e escuro
- Botão renomeado para "Estudar"
- Resultado formatado de forma mais profissional e legível
