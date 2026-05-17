import { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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

  // Gradiente clínico de gravidade:
  //  azul   = fator desencadeante / causa-raiz (ponto de partida)
  //  verde  = mecanismo fisiopatológico (processo)
  //  vermelho = complicação / desfecho grave (gravidade)
  const lines: string[] = [
    'classDef cmRoot fill:#1A4D8C,stroke:#123A6B,stroke-width:2px,color:#FFFFFF,font-weight:600;',
    'classDef cmMid fill:#CDE6D4,stroke:#1B5E3B,stroke-width:1.5px,color:#0A2E1C;',
    'classDef cmLeaf fill:#F4D3CC,stroke:#B6452C,stroke-width:2px,color:#7A2A18,font-weight:600;',
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
  const [expanded, setExpanded] = useState(false);
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
    <>
      <div className="my-6 rounded-lg border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-3 py-1.5">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Diagrama
          </span>
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[#005344] hover:bg-[#006D5B]/10 transition-colors"
            title="Ampliar diagrama"
          >
            <Maximize2 className="h-3.5 w-3.5" />
            Ampliar
          </button>
        </div>
        <div
          className="mermaid-diagram flex cursor-zoom-in justify-center overflow-x-auto p-4"
          onClick={() => setExpanded(true)}
          title="Clique para ampliar"
          // eslint-disable-next-line react/no-danger -- svg vem do mermaid com securityLevel:'strict' (sanitizado)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {expanded && (
        <MermaidLightbox svg={svg} onClose={() => setExpanded(false)} />
      )}
    </>
  );
}

/* ─── Lightbox com zoom + pan ─── */
function MermaidLightbox({ svg, onClose }: { svg: string; onClose: () => void }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  const reset = useCallback(() => { setScale(1); setPos({ x: 0, y: 0 }); }, []);
  const zoom = useCallback((delta: number) => {
    setScale((s) => Math.min(5, Math.max(0.4, +(s + delta).toFixed(2))));
  }, []);

  // Esc fecha, +/- controla zoom; trava scroll do body
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === '+' || e.key === '=') zoom(0.25);
      else if (e.key === '-') zoom(-0.25);
      else if (e.key === '0') reset();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, zoom, reset]);

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    zoom(e.deltaY < 0 ? 0.15 : -0.15);
  };
  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragRef.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.px + (e.clientX - dragRef.current.x),
      y: dragRef.current.py + (e.clientY - dragRef.current.y),
    });
  };
  const onPointerUp = () => { dragRef.current = null; };

  return (
    <div
      className="fixed inset-0 z-[1000] flex flex-col bg-slate-900/80 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between px-4 py-3"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-sm font-medium text-white/80">Diagrama — arraste para mover, scroll para zoom</span>
        <div className="flex items-center gap-1.5">
          <button onClick={() => zoom(-0.25)} className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" title="Diminuir (-)"><ZoomOut className="h-4 w-4" /></button>
          <span className="min-w-[3rem] text-center text-sm font-mono text-white/70">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoom(0.25)} className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" title="Aumentar (+)"><ZoomIn className="h-4 w-4" /></button>
          <button onClick={reset} className="rounded-md bg-white/10 p-2 text-white hover:bg-white/20" title="Resetar (0)"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="ml-2 rounded-md bg-white/10 p-2 text-white hover:bg-white/20" title="Fechar (Esc)"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {/* Canvas */}
      <div
        className="relative flex-1 touch-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{ cursor: dragRef.current ? 'grabbing' : 'grab' }}
      >
        <div
          className="absolute left-1/2 top-1/2 [&_svg]:max-w-none"
          style={{
            transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transformOrigin: 'center center',
            transition: dragRef.current ? 'none' : 'transform 0.08s ease-out',
          }}
          // eslint-disable-next-line react/no-danger -- svg sanitizado (securityLevel:strict)
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
