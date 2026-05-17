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

/**
 * Normaliza a saída da IA pra sintaxe Mermaid válida. A IA frequentemente:
 *  - usa setas tipográficas (⟶ → ⇒ –>) em vez de "-->"
 *  - deixa parênteses/colchetes dentro de [labels] sem aspas (quebra o parser)
 *  - encapsula com **negrito** ou aspas curvas
 * Isso torna o render resiliente sem depender 100% do prompt.
 */
function normalizeMermaid(raw: string): string {
  let s = raw.trim();

  // 1. Setas tipográficas -> sintaxe mermaid
  s = s
    .replace(/\s*[⟶→⇒➝➔➜⟹]\s*/g, ' --> ')
    .replace(/\s*[–—]>\s*/g, ' --> ')   // en/em dash + >
    .replace(/\s*-\s+->\s*/g, ' --> ')   // "- ->"
    .replace(/\s*==+>\s*/g, ' ==> ')
    .replace(/\s*\.\.+>\s*/g, ' -.-> ');

  // 2. Aspas curvas -> retas
  s = s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

  // 3. Remove **negrito**/`crase` que a IA às vezes coloca
  s = s.replace(/\*\*/g, '').replace(/`/g, '');

  // 4. Auto-aspas em labels de nós que contenham caractere problemático
  //    (parêntese, dois-pontos, vírgula, /, %, etc) e ainda não estejam
  //    entre aspas. Trata cada tipo de nó pelo seu fechamento natural:
  //      ID[retangulo]  ID(arredondado)  ID{losango}
  const wrap = (label: string) => `"${label.trim().replace(/"/g, "'")}"`;
  const needsQuote = (l: string) =>
    !/^\s*".*"\s*$/.test(l) && /[()[\]{}:;/%&|<>#]/.test(l);

  // ID[ ... ]  (até o primeiro ] — labels não costumam conter ])
  s = s.replace(/(^|\s)([A-Za-z0-9_]+)\[([^\]\n]*)\]/g,
    (m, pre, id, label) => needsQuote(label) ? `${pre}${id}[${wrap(label)}]` : m);
  // ID{ ... }
  s = s.replace(/(^|\s)([A-Za-z0-9_]+)\{([^}\n]*)\}/g,
    (m, pre, id, label) => needsQuote(label) ? `${pre}${id}{${wrap(label)}}` : m);
  // ID( ... )  (apenas 1 nível — losango/estádio)
  s = s.replace(/(^|\s)([A-Za-z0-9_]+)\(([^)\n]*)\)/g,
    (m, pre, id, label) => needsQuote(label) ? `${pre}${id}(${wrap(label)})` : m);

  return s;
}

interface MermaidDiagramProps {
  code: string;
}

export default function MermaidDiagram({ code }: MermaidDiagramProps) {
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const idRef = useRef(`mmd-${++idCounter}-${Date.now()}`);

  useEffect(() => {
    let cancelled = false;
    const cleaned = normalizeMermaid(code || '');
    if (!cleaned) { setFailed(true); return; }

    loadMermaid()
      .then(async (mod) => {
        // Tenta a versão normalizada; se falhar, tenta o código cru como
        // ultimo recurso (caso a normalização tenha estragado algo válido).
        for (const candidate of [cleaned, (code || '').trim()]) {
          try {
            await mod.default.parse(candidate);
            const { svg } = await mod.default.render(idRef.current, candidate);
            if (!cancelled) { setSvg(svg); setFailed(false); }
            return;
          } catch { /* tenta o próximo candidato */ }
        }
        if (!cancelled) setFailed(true);
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
