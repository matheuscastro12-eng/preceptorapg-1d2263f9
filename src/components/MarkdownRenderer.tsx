import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/** Diagramas desativados — os resumos sao 100% textuais. Blocos ```mermaid```
 *  (de resumos antigos) sao ocultados; o texto ao redor ja explica o conceito. */
function renderCodeNode(props: any, inlineClass: string): React.ReactNode {
  const { className, children } = props;
  const lang = /language-(\w+)/.exec(className || '')?.[1];
  if (lang === 'mermaid') {
    return null;
  }
  return <code className={inlineClass}>{children}</code>;
}

export interface PubMedArticleMeta {
  pmid: string;
  title: string;
  journal?: string;
  year?: string;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  isTyping?: boolean;
  variant?: 'default' | 'rich';
  pubmedMap?: Record<string, PubMedArticleMeta>;
}

/* ── helpers for rich variant ── */

const extractText = (children: React.ReactNode): string => {
  if (typeof children === 'string') return children;
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children && typeof children === 'object' && 'props' in (children as any)) {
    return extractText((children as any).props.children);
  }
  return '';
};

const getHeadingIcon = (text: string): string => {
  const t = text.toLowerCase();
  if (t.includes('fisiopatologia') || t.includes('patogenia') || t.includes('patofisiologia')) return 'hub';
  if (t.includes('quadro clínico') || t.includes('manifestações') || t.includes('sinais e sintomas') || t.includes('sintomas')) return 'clinical_notes';
  if (t.includes('diagnóstico')) return 'diagnosis';
  if (t.includes('exame')) return 'labs';
  if (t.includes('tratamento') || t.includes('manejo') || t.includes('terapêutica') || t.includes('terapia') || t.includes('conduta')) return 'medication';
  if (t.includes('epidemiologia')) return 'monitoring';
  if (t.includes('etiologia') || t.includes('causa')) return 'biotech';
  if (t.includes('fatores de risco') || t.includes('fator de risco')) return 'warning';
  if (t.includes('prevenção') || t.includes('profilaxia')) return 'shield';
  if (t.includes('prognóstico')) return 'trending_up';
  if (t.includes('complicações') || t.includes('complicação')) return 'error';
  if (t.includes('classificação')) return 'category';
  if (t.includes('definição') || t.includes('conceito')) return 'description';
  if (t.includes('introdução')) return 'info';
  if (t.includes('conclusão') || t.includes('resumo') || t.includes('considerações')) return 'summarize';
  if (t.includes('referências') || t.includes('bibliografia')) return 'menu_book';
  if (t.includes('farmacologia') || t.includes('medicamento')) return 'pharmacy';
  if (t.includes('anatomia') || t.includes('histologia')) return 'skeleton';
  return 'article';
};

const MI = ({ name, fill = false, className = '' }: { name: string; fill?: boolean; className?: string }) => (
  <span
    className={`material-symbols-outlined shrink-0 ${className}`}
    style={{ fontVariationSettings: fill ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
  >
    {name}
  </span>
);

/* ── default components ── */
const defaultComponents: Record<string, React.ComponentType<any>> = {
  img: () => null,
  h1: ({ children }: any) => (
    <h1 className="mb-6 mt-8 text-2xl font-bold text-primary first:mt-0 pb-3 border-b-2 border-primary/30">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => (
    <h2 className="mb-4 mt-8 text-xl font-bold text-foreground bg-secondary/30 rounded-lg px-4 py-2 border-l-4 border-primary">
      {children}
    </h2>
  ),
  h3: ({ children }: any) => (
    <h3 className="mb-3 mt-6 text-lg font-semibold text-foreground flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-primary" />
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-foreground/90">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="mb-4 leading-relaxed text-foreground/90 text-base">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-5 ml-6 space-y-2 text-foreground/90 list-disc">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-5 ml-6 space-y-2 text-foreground/90 list-decimal">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed">{children}</li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-primary">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-muted-foreground">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <blockquote className="my-6 border-l-4 border-primary bg-primary/5 rounded-r-lg py-4 px-5 italic">
      {children}
    </blockquote>
  ),
  a: ({ href, children }: any) => {
    const isPubMed = typeof href === 'string' && href.includes('pubmed.ncbi.nlm.nih.gov');
    const text = extractText(children);
    if (isPubMed) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-primary/10 text-primary text-[0.85em] font-semibold hover:bg-primary hover:text-primary-foreground transition-colors no-underline align-baseline"
          title={`Abrir no PubMed: ${text}`}
        >
          <span className="material-symbols-outlined text-[12px]" style={{ fontSize: '12px' }}>open_in_new</span>
          {text}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
        {children}
      </a>
    );
  },
  code: (props: any) => renderCodeNode(props, "rounded-md bg-secondary px-2 py-1 text-sm font-mono text-primary"),
  pre: ({ children }: any) => {
    // Se o conteúdo é um diagrama mermaid, não envolve em <pre> (já vem como bloco)
    const child: any = Array.isArray(children) ? children[0] : children;
    const cls = child?.props?.className || '';
    if (/language-mermaid/.test(cls)) return <>{children}</>;
    return <pre className="my-5 overflow-x-auto rounded-lg border border-border bg-secondary/40 p-4 text-sm">{children}</pre>;
  },
  hr: () => <hr className="my-8 border-border/30" />,
  table: ({ children }: any) => (
    <div className="my-6 overflow-x-auto rounded-lg border border-border -mx-1">
      <table className="w-full text-sm border-collapse min-w-[600px]">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-secondary/50 border-b-2 border-border">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left font-semibold text-foreground border-r border-border/30 last:border-r-0 whitespace-nowrap">{children}</th>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-border/30 last:border-b-0 even:bg-secondary/20">{children}</tr>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 border-r border-border/30 last:border-r-0 align-top">{children}</td>
  ),
};

/* ── rich components ── */
const richComponents: Record<string, React.ComponentType<any>> = {
  img: () => null,
  h1: ({ children }: any) => (
    <h1 className="mb-6 mt-8 text-2xl font-extrabold text-[#191c1d] first:mt-0 pb-3 border-b border-slate-200 font-['Manrope']">
      {children}
    </h1>
  ),
  h2: ({ children }: any) => {
    const text = extractText(children);
    const icon = getHeadingIcon(text);
    return (
      <h2 className="flex items-center gap-3 mb-4 mt-10 text-xl font-bold text-[#191c1d] first:mt-0 font-['Manrope']">
        <MI name={icon} className="text-[#006D5B] text-[24px]" />
        {children}
      </h2>
    );
  },
  h3: ({ children }: any) => (
    <h3 className="mb-3 mt-6 text-sm font-bold text-[#006D5B]">
      {children}
    </h3>
  ),
  h4: ({ children }: any) => (
    <h4 className="mb-2 mt-4 text-base font-semibold text-[#3e4945]">{children}</h4>
  ),
  p: ({ children }: any) => (
    <p className="mb-4 leading-[1.8] text-[#3e4945] text-[15px]">{children}</p>
  ),
  ul: ({ children }: any) => (
    <ul className="mb-5 space-y-2.5 text-[#3e4945]">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="mb-5 space-y-3 text-[#3e4945] rich-ol">{children}</ol>
  ),
  li: ({ children }: any) => (
    <li className="leading-relaxed flex items-start gap-2.5 text-[15px]">
      <span className="w-1.5 h-1.5 rounded-full bg-[#006D5B] mt-2.5 shrink-0" />
      <span className="flex-1">{children}</span>
    </li>
  ),
  strong: ({ children }: any) => (
    <strong className="font-bold text-[#191c1d]">{children}</strong>
  ),
  em: ({ children }: any) => (
    <em className="italic text-[#5f6368]">{children}</em>
  ),
  blockquote: ({ children }: any) => (
    <div className="my-5 flex items-start gap-3 bg-[#e8f5f0] border-l-4 border-[#006D5B] rounded-r-xl py-4 px-5">
      <MI name="info" fill className="text-[#006D5B] text-[20px] mt-0.5" />
      <div className="text-sm text-[#3e4945] [&>p]:mb-0 [&>p]:italic [&>p]:leading-relaxed flex-1">{children}</div>
    </div>
  ),
  a: ({ href, children }: any) => {
    const isPubMed = typeof href === 'string' && href.includes('pubmed.ncbi.nlm.nih.gov');
    const text = extractText(children);
    if (isPubMed) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 rounded bg-[#006D5B]/10 text-[#005344] text-[0.85em] font-semibold hover:bg-[#006D5B] hover:text-white transition-colors no-underline align-baseline"
          title={`Abrir no PubMed: ${text}`}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>open_in_new</span>
          {text}
        </a>
      );
    }
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#006D5B] underline underline-offset-2 hover:text-[#005344]">
        {children}
      </a>
    );
  },
  code: (props: any) => renderCodeNode(props, "rounded-md bg-[#f3f4f5] px-2 py-1 text-sm font-mono text-[#006D5B]"),
  pre: ({ children }: any) => {
    const child: any = Array.isArray(children) ? children[0] : children;
    const cls = child?.props?.className || '';
    if (/language-mermaid/.test(cls)) return <>{children}</>;
    return <pre className="my-5 overflow-x-auto rounded-lg border border-slate-200 bg-[#f3f4f5] p-4 text-sm">{children}</pre>;
  },
  hr: () => <hr className="my-10 border-slate-200/60" />,
  table: ({ children }: any) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-slate-200/60 bg-white shadow-sm">
      <table className="w-full text-sm border-collapse min-w-[600px]">{children}</table>
    </div>
  ),
  thead: ({ children }: any) => (
    <thead className="bg-[#f3f4f5] border-b border-slate-200">{children}</thead>
  ),
  th: ({ children }: any) => (
    <th className="px-4 py-3 text-left font-bold text-[11px] uppercase tracking-wider text-[#5f6368] border-r border-slate-200/40 last:border-r-0">{children}</th>
  ),
  tr: ({ children }: any) => (
    <tr className="border-b border-slate-100 last:border-b-0 even:bg-[#f8faf9]">{children}</tr>
  ),
  td: ({ children }: any) => (
    <td className="px-4 py-3 border-r border-slate-100 last:border-r-0 align-top text-[#3e4945]">{children}</td>
  ),
};

// Transforma referencias PMID em links clicaveis pro PubMed.
// Converte tanto [PMID: 12345] quanto (PMID: 12345) em links markdown.
// Se pubmedMap tiver o titulo do artigo, adiciona como title= no link
// (tooltip nativo no hover, deixando o usuario ver o artigo antes de clicar).
function linkifyPubMed(text: string, map?: Record<string, PubMedArticleMeta>): string {
  const titleFor = (pmid: string): string => {
    const meta = map?.[pmid];
    if (!meta) return '';
    const yearJournal = [meta.journal, meta.year].filter(Boolean).join(', ');
    // Escape aspas duplas pra nao quebrar o link markdown
    const raw = yearJournal ? `${meta.title} — ${yearJournal}` : meta.title;
    return ` "${raw.replace(/"/g, "'")}"`;
  };
  return text
    .replace(
      /\[PMID:\s*(\d+)\]/g,
      (_m, pmid) => `[PMID: ${pmid}](https://pubmed.ncbi.nlm.nih.gov/${pmid}/${titleFor(pmid)})`
    )
    .replace(
      /\(PMID:\s*(\d+)\)(?!\])/g,
      (_m, pmid) => `([PMID: ${pmid}](https://pubmed.ncbi.nlm.nih.gov/${pmid}/${titleFor(pmid)}))`
    );
}

// Fix malformed markdown tables that remark-gfm can't parse
function fixMarkdownTables(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Detect table rows: starts and ends with |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      // Clean up: ensure proper spacing around |
      const cleaned = trimmed
        .replace(/\|\s*/g, '| ')
        .replace(/\s*\|/g, ' |')
        .replace(/\|  +/g, '| ')
        .replace(/  +\|/g, ' |');

      result.push(cleaned);

      // If this looks like a header row and next line is NOT a separator, insert one
      const nextLine = (lines[i + 1] || '').trim();
      if (nextLine.startsWith('|') && !nextLine.match(/^\|[\s-:]+\|/)) {
        // Check if we already have a separator
        const prevLine = (result[result.length - 2] || '').trim();
        if (!prevLine.match(/^\|[\s-:]+\|/) && i > 0 && !(lines[i - 1] || '').trim().startsWith('|')) {
          // This is the first row of a table — add separator after it
          const cols = cleaned.split('|').filter(c => c.trim()).length;
          result.push('| ' + Array(cols).fill('---').join(' | ') + ' |');
        }
      }
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

const MarkdownRenderer = ({ content, className = '', isTyping = false, variant = 'default', pubmedMap }: MarkdownRendererProps) => {
  const components = variant === 'rich' ? richComponents : defaultComponents;

  // Pre-process content: transformar PMIDs em links + fix tabelas
  const linked = linkifyPubMed(content, pubmedMap);
  const processedContent = isTyping ? linked : fixMarkdownTables(linked);

  return (
    <div className={`markdown-content ${className} ${isTyping ? 'typing-cursor' : ''}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
