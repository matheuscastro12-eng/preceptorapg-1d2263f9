import { useEffect, useRef, useState } from 'react';

/**
 * Renderiza um bloco ```mermaid``` como SVG.
 *
 * - mermaid é carregado dinamicamente (lazy import) — ~500KB, só baixa
 *   quando um resumo realmente tem diagrama.
 * - Erros de sintaxe da IA NÃO quebram a página: cai num fallback que
 *   mostra o código do diagrama em texto (ainda legível pro aluno).
 */

let mermaidLoader: Promise<typeof import('mermaid')> | null = null;
function loadMermaid() {
  if (!mermaidLoader) {
    mermaidLoader = import('mermaid').then((mod) => {
      mod.default.initialize({
        startOnLoad: false,
        securityLevel: 'strict', // sanitiza — bloqueia script/HTML injetado
        theme: 'base',
        themeVariables: {
          primaryColor: '#E5EFE7',
          primaryTextColor: '#0A2E1C',
          primaryBorderColor: '#1B5E3B',
          lineColor: '#5A5247',
          secondaryColor: '#F6EFD8',
          tertiaryColor: '#FBF8F2',
          fontFamily: "'Manrope', system-ui, sans-serif",
          fontSize: '14px',
        },
        flowchart: { curve: 'basis', htmlLabels: true, padding: 12 },
      });
      return mod;
    });
  }
  return mermaidLoader;
}

let idCounter = 0;

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mmd-${++idCounter}-${Date.now()}`);

  useEffect(() => {
    let cancelled = false;
    const src = (code || '').trim();
    if (!src) { setFailed(true); return; }

    loadMermaid()
      .then(async (mod) => {
        try {
          // parse valida a sintaxe antes de renderizar (não joga no DOM se quebrar)
          await mod.default.parse(src);
          const { svg } = await mod.default.render(idRef.current, src);
          if (!cancelled) { setSvg(svg); setFailed(false); }
        } catch {
          if (!cancelled) setFailed(true);
        }
      })
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => { cancelled = true; };
  }, [code]);

  if (failed) {
    // Fallback legível — não quebra o resumo se a IA mandar sintaxe inválida
    return (
      <pre
        className="my-5 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600"
        style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
      >
        {code}
      </pre>
    );
  }

  if (!svg) {
    return (
      <div className="my-5 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 py-10 text-sm text-slate-400">
        Gerando diagrama…
      </div>
    );
  }

  return (
    <div
      className="mermaid-diagram my-6 flex justify-center overflow-x-auto rounded-lg border border-slate-200 bg-white p-4"
      // eslint-disable-next-line react/no-danger -- svg vem do mermaid com securityLevel:'strict' (sanitizado)
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
