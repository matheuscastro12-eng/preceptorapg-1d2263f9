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
          primaryColor: '#CDE6D4',          // verde mais saturado (não cinza)
          primaryTextColor: '#0A2E1C',
          primaryBorderColor: '#1B5E3B',
          lineColor: '#1B5E3B',             // setas verde forte, não marrom-cinza
          secondaryColor: '#F3E2B8',        // ouro
          secondaryBorderColor: '#A88A33',
          secondaryTextColor: '#5C3F00',
          tertiaryColor: '#EAF3EC',
          tertiaryBorderColor: '#1B5E3B',
          mainBkg: '#CDE6D4',
          clusterBkg: '#F7F4EE',
          clusterBorder: '#D7CFBC',
          titleColor: '#0F4128',
          edgeLabelBackground: '#FBF8F2',
          fontFamily: "'Manrope', system-ui, sans-serif",
          fontSize: '14px',
        },
        flowchart: { curve: 'basis', htmlLabels: true, padding: 14 },
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

  return colorizeFlowchart(s);
}

/**
 * Dá cor semântica a flowcharts/graphs (estavam monocromáticos/"cinza"):
 *  - causa-raiz (nós sem seta de entrada) → verde escuro forte
 *  - desfechos finais (nós sem seta de saída) → ouro/âmbar
 *  - intermediários → verde tint
 * Só roda se a IA NÃO tiver colocado classDef/style próprios.
 */
function colorizeFlowchart(src: string): string {
  if (!/^\s*(flowchart|graph)\s/im.test(src)) return src;
  if (/\b(classDef|class\s+[A-Za-z0-9_,]+\s+\w|style\s+[A-Za-z0-9_]+\s)/.test(src)) return src;

  const ARROW = /\s(?:--+>|===*>|-\.->|--+|===*|-\.-)\s*(?:\|[^|]*\|\s*)?/;
  const idOf = (token: string): string | null => {
    const t = token.trim();
    const m = t.match(/^([A-Za-z0-9_]+)/);
    return m ? m[1] : null;
  };
  const refs = (side: string): string[] =>
    side.split('&').map(idOf).filter((x): x is string => !!x);

  const all = new Set<string>();
  const hasIn = new Set<string>();
  const hasOut = new Set<string>();

  for (const rawLine of src.split('\n')) {
    const line = rawLine.trim();
    if (!line || /^(flowchart|graph|subgraph|end|classDef|class |style |%%)/.test(line)) continue;
    if (!ARROW.test(line)) {
      const single = idOf(line);
      if (single) all.add(single);
      continue;
    }
    const parts = line.split(ARROW).filter(Boolean);
    for (let i = 0; i < parts.length; i++) {
      const ids = refs(parts[i]);
      ids.forEach((id) => all.add(id));
      if (i > 0) ids.forEach((id) => hasIn.add(id));
      if (i < parts.length - 1) ids.forEach((id) => hasOut.add(id));
    }
  }

  if (all.size < 3) return src; // diagrama pequeno demais pra valer a pena

  const roots: string[] = [];
  const leaves: string[] = [];
  const mids: string[] = [];
  all.forEach((id) => {
    const inn = hasIn.has(id);
    const out = hasOut.has(id);
    if (!inn && out) roots.push(id);
    else if (inn && !out) leaves.push(id);
    else mids.push(id);
  });

  const lines: string[] = [
    'classDef cmRoot fill:#1B5E3B,stroke:#0F4128,stroke-width:2px,color:#FFFFFF,font-weight:600;',
    'classDef cmMid fill:#CDE6D4,stroke:#1B5E3B,stroke-width:1.5px,color:#0A2E1C;',
    'classDef cmLeaf fill:#F3E2B8,stroke:#A88A33,stroke-width:2px,color:#5C3F00,font-weight:600;',
  ];
  if (roots.length) lines.push(`class ${roots.join(',')} cmRoot;`);
  if (mids.length) lines.push(`class ${mids.join(',')} cmMid;`);
  if (leaves.length) lines.push(`class ${leaves.join(',')} cmLeaf;`);

  return src.replace(/\s*$/, '') + '\n' + lines.join('\n') + '\n';
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
