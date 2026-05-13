import { useMemo, useState } from 'react';
import { parseMindMap, type StudyCard, type SectionCategory } from './parseMindMap';
import {
  ChevronDown, ChevronRight, BookOpen, Search,
  Network, LayoutGrid,
} from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/* ─── Tokens de categoria ─────────────────────────────────────
 * Cada categoria semantica ganha cor + icone proprios. Tudo dentro
 * do pmed editorial (verde escuro + ouro + neutros).
 */

const CATEGORY_TOKENS: Record<SectionCategory, {
  label: string;
  icon: string; // material symbols name
  color: string;
}> = {
  bases:       { label: 'Bases',         icon: 'hub',            color: '#005344' },
  epidemio:    { label: 'Epidemiologia', icon: 'monitoring',     color: '#0E7C63' },
  clinica:     { label: 'Clínica',       icon: 'clinical_notes', color: '#1A8A5F' },
  tratamento:  { label: 'Tratamento',    icon: 'medication',     color: '#8A6F26' },
  prognostico: { label: 'Prognóstico',   icon: 'monitor_heart',  color: '#94731E' },
  outros:      { label: 'Geral',         icon: 'menu_book',      color: '#4A5568' },
};

const CATEGORY_ORDER: SectionCategory[] = ['bases', 'epidemio', 'clinica', 'tratamento', 'prognostico', 'outros'];

type Mode = 'visual' | 'panel';

interface MindMapViewProps {
  content: string;
  topic: string;
}

export default function MindMapView({ content, topic }: MindMapViewProps) {
  const { cards } = useMemo(() => parseMindMap(content, topic), [content, topic]);
  const [mode, setMode] = useState<Mode>('visual');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<SectionCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  // Agrupa por categoria preservando ordem original
  const byCategory = useMemo(() => {
    const m: Partial<Record<SectionCategory, StudyCard[]>> = {};
    for (const c of cards) {
      (m[c.category] ??= []).push(c);
    }
    return m;
  }, [cards]);

  const activeCategories = useMemo(
    () => CATEGORY_ORDER.filter(c => (byCategory[c]?.length ?? 0) > 0),
    [byCategory]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: cards.length };
    for (const card of cards) c[card.category] = (c[card.category] || 0) + 1;
    return c;
  }, [cards]);

  const totalPoints = useMemo(
    () => cards.reduce((s, c) => s + c.keyPoints.length + c.subsections.reduce((ss, sub) => ss + sub.keyPoints.length, 0), 0),
    [cards]
  );
  const reviewMinutes = Math.max(2, Math.ceil(totalPoints * 0.4));

  // Filtros so impactam o modo painel
  const visibleCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter(card => {
      if (activeCategory !== 'all' && card.category !== activeCategory) return false;
      if (!q) return true;
      const hay = (
        card.title + ' ' +
        card.terms.join(' ') + ' ' +
        card.keyPoints.map(p => p.title + ' ' + p.text).join(' ')
      ).toLowerCase();
      return hay.includes(q);
    });
  }, [cards, activeCategory, search]);

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  if (cards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BookOpen className="h-10 w-10 mx-auto text-[#94a3b8] opacity-50 mb-3" strokeWidth={1.2} />
          <p className="text-[13px] text-[#4a5568] font-semibold">Mapa não disponível</p>
          <p className="text-[11.5px] text-[#94a3b8] mt-1">
            Este resumo não tem seções <code className="font-mono text-[10px]">##</code> suficientes pra construir um mapa.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'linear-gradient(180deg, #fafbfa 0%, #f3f6f4 100%)' }}>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        {/* ─── Hero compartilhado ─── */}
        <Hero
          topic={topic}
          totalCards={cards.length}
          totalPoints={totalPoints}
          reviewMinutes={reviewMinutes}
          activeCategories={activeCategories}
          counts={counts}
        />

        {/* ─── Toggle de modo ─── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <ModeToggle mode={mode} setMode={setMode} />
          {mode === 'visual' && activeCategories.length > 3 && (
            <p className="text-[10px] text-[#94a3b8] inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[12px]">swipe</span>
              Arraste lateralmente para ver todas as ramificações
            </p>
          )}
        </div>

        {/* ─── Corpo ─── */}
        {mode === 'visual' ? (
          <VisualMode
            topic={topic}
            byCategory={byCategory}
            activeCategories={activeCategories}
            expanded={expanded}
            toggle={toggle}
          />
        ) : (
          <PanelMode
            search={search} setSearch={setSearch}
            activeCategory={activeCategory} setActiveCategory={setActiveCategory}
            counts={counts}
            cards={visibleCards}
            expanded={expanded} toggle={toggle}
          />
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
 * HERO — header rico com decoração SVG + barra de distribuição
 * ════════════════════════════════════════════════════════════════ */

function Hero({ topic, totalCards, totalPoints, reviewMinutes, activeCategories, counts }: {
  topic: string;
  totalCards: number;
  totalPoints: number;
  reviewMinutes: number;
  activeCategories: SectionCategory[];
  counts: Record<string, number>;
}) {
  return (
    <header className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-[0_2px_24px_-12px_rgba(0,55,40,0.12)]">
      {/* Filete superior gold→green */}
      <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] via-50% to-[#C9A84C]" />

      {/* Decoração SVG canto direito */}
      <svg
        className="absolute right-0 top-0 h-full pointer-events-none opacity-[0.07]"
        width="320" height="100%" viewBox="0 0 320 200" preserveAspectRatio="xMaxYMid slice"
      >
        <defs>
          <pattern id="med-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="0.7" fill="#005344" />
          </pattern>
          <radialGradient id="med-rad" cx="80%" cy="30%" r="60%">
            <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="200" fill="url(#med-dots)" />
        <circle cx="260" cy="60" r="55" fill="none" stroke="#005344" strokeWidth="1.2" />
        <circle cx="260" cy="60" r="38" fill="none" stroke="#005344" strokeWidth="0.8" strokeDasharray="3 3" />
        <circle cx="260" cy="60" r="22" fill="none" stroke="#C9A84C" strokeWidth="1" />
        <rect width="320" height="200" fill="url(#med-rad)" />
      </svg>

      <div className="relative px-5 sm:px-7 py-6 sm:py-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 mb-2">
          <span className="w-6 h-px bg-[#C9A84C]" />
          Mapa mental
        </p>
        <h1 className="font-['Manrope'] font-bold text-[22px] sm:text-[28px] tracking-[-0.02em] leading-[1.08] text-[#191C1D] mb-4 max-w-3xl">
          {topic}
        </h1>

        {/* Stats inline */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <Stat icon="schedule" label="Revisão" value={`~${reviewMinutes} min`} />
          <Stat icon="layers" label="Seções" value={totalCards.toString()} />
          <Stat icon="format_list_bulleted" label="Pontos" value={totalPoints.toString()} />
          <Stat icon="category" label="Categorias" value={activeCategories.length.toString()} />
        </div>

        {/* Barra de distribuição por categoria */}
        {activeCategories.length > 0 && (
          <div className="mt-5 max-w-2xl">
            <div className="flex gap-0.5 rounded-full overflow-hidden h-2 bg-slate-100">
              {activeCategories.map(cat => {
                const pct = (counts[cat] / totalCards) * 100;
                const t = CATEGORY_TOKENS[cat];
                return (
                  <div
                    key={cat}
                    className="h-full transition-all hover:opacity-80"
                    style={{ width: `${pct}%`, background: t.color }}
                    title={`${t.label}: ${counts[cat]}`}
                  />
                );
              })}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-[10.5px] text-[#4a5568]">
              {activeCategories.map(cat => {
                const t = CATEGORY_TOKENS[cat];
                return (
                  <span key={cat} className="inline-flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: t.color }} />
                    <span className="font-medium">{t.label}</span>
                    <span className="font-mono text-[#94a3b8]">{counts[cat]}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-[#005344]/[0.07] text-[#005344]">
        <span className="material-symbols-outlined text-[16px]">{icon}</span>
      </span>
      <span className="leading-tight">
        <span className="block text-[9.5px] uppercase tracking-[0.16em] text-[#94a3b8] font-bold">{label}</span>
        <span className="block text-[13px] font-bold text-[#191C1D]">{value}</span>
      </span>
    </span>
  );
}

/* ════════════════════════════════════════════════════════════════
 * MODE TOGGLE
 * ════════════════════════════════════════════════════════════════ */

function ModeToggle({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-white border border-slate-200 shadow-sm">
      <ModeBtn
        active={mode === 'visual'}
        onClick={() => setMode('visual')}
        icon={<Network className="h-3.5 w-3.5" strokeWidth={2.2} />}
      >Mapa visual</ModeBtn>
      <ModeBtn
        active={mode === 'panel'}
        onClick={() => setMode('panel')}
        icon={<LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.2} />}
      >Painel de leitura</ModeBtn>
    </div>
  );
}

function ModeBtn({ active, onClick, icon, children }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[11.5px] font-bold transition-all ${
        active
          ? 'bg-[#191C1D] text-white shadow-[0_2px_6px_-2px_rgba(0,0,0,0.3)]'
          : 'text-[#4a5568] hover:text-[#191C1D] hover:bg-slate-50'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
 * VISUAL MODE — árvore com tópico central, ramificações e nós
 * ════════════════════════════════════════════════════════════════ */

function VisualMode({ topic, byCategory, activeCategories, expanded, toggle }: {
  topic: string;
  byCategory: Partial<Record<SectionCategory, StudyCard[]>>;
  activeCategories: SectionCategory[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const cols = activeCategories.length;
  if (cols === 0) return null;

  // Largura mínima do container — garante que cards não fiquem esmagados.
  // Em telas pequenas isso ativa scroll horizontal.
  const minColWidth = 220;
  const minWidth = Math.max(640, cols * minColWidth);

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6 pb-2">
      <div style={{ minWidth: `${minWidth}px` }} className="relative">

        {/* Topic Hub — centralizado horizontalmente */}
        <div className="flex justify-center relative z-10">
          <div className="relative inline-flex items-center gap-3 px-5 sm:px-6 py-3.5 rounded-2xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white shadow-[0_10px_30px_-10px_rgba(0,77,68,0.55)] border-2 border-[#C9A84C]/60 max-w-[640px]">
            {/* Halo decoration */}
            <span className="absolute -inset-1 rounded-2xl bg-[#C9A84C] opacity-[0.08] blur-md" aria-hidden />
            <span className="relative material-symbols-outlined text-[24px] text-[#C9A84C]">psychology_alt</span>
            <div className="relative min-w-0 flex-1">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[#C9A84C]/95">Tema central</p>
              <p className="font-['Manrope'] font-bold text-[14px] sm:text-[15.5px] leading-tight line-clamp-2">{topic}</p>
            </div>
          </div>
        </div>

        {/* SVG connectors hub → categorias */}
        <div className="relative h-[64px] -mt-1">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1000 64"
            preserveAspectRatio="none"
            aria-hidden
          >
            <defs>
              {activeCategories.map(cat => (
                <linearGradient key={cat} id={`flow-${cat}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#C9A84C" stopOpacity="0.45" />
                  <stop offset="100%" stopColor={CATEGORY_TOKENS[cat].color} stopOpacity="0.85" />
                </linearGradient>
              ))}
            </defs>
            {activeCategories.map((cat, i) => {
              const xEnd = ((i + 0.5) / cols) * 1000;
              const xStart = 500;
              return (
                <g key={cat}>
                  {/* Curva mais larga em baixa opacidade — halo */}
                  <path
                    d={`M ${xStart} 0 C ${xStart} 34, ${xEnd} 34, ${xEnd} 64`}
                    stroke={CATEGORY_TOKENS[cat].color}
                    strokeOpacity="0.12"
                    strokeWidth="5"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Curva principal */}
                  <path
                    d={`M ${xStart} 0 C ${xStart} 34, ${xEnd} 34, ${xEnd} 64`}
                    stroke={`url(#flow-${cat})`}
                    strokeWidth="1.5"
                    fill="none"
                    vectorEffect="non-scaling-stroke"
                  />
                  {/* Marcador na ponta */}
                  <circle cx={xEnd} cy="64" r="2.5" fill={CATEGORY_TOKENS[cat].color} />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Colunas de categoria */}
        <div
          className="grid gap-3 sm:gap-4"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {activeCategories.map(cat => (
            <CategoryBranch
              key={cat}
              cat={cat}
              cards={byCategory[cat] ?? []}
              expanded={expanded}
              toggle={toggle}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryBranch({ cat, cards, expanded, toggle }: {
  cat: SectionCategory;
  cards: StudyCard[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  const t = CATEGORY_TOKENS[cat];
  return (
    <div className="flex flex-col gap-2.5 min-w-0">
      {/* Cabeçalho da categoria (pílula) */}
      <div className="relative">
        <div
          className="relative rounded-xl px-3 py-3 text-center shadow-[0_6px_16px_-6px_rgba(0,0,0,0.2)] border-2"
          style={{ background: t.color, borderColor: t.color, color: '#fff' }}
        >
          <span className="material-symbols-outlined text-[18px] block mb-0.5 opacity-95">{t.icon}</span>
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] leading-tight">{t.label}</p>
          <p className="text-[9px] opacity-80 font-mono mt-0.5">
            {cards.length} seç{cards.length === 1 ? 'ão' : 'ões'}
          </p>
        </div>
        {/* Cauda conectora descendo até o primeiro card */}
        <div
          className="absolute left-1/2 -translate-x-1/2 -bottom-2.5 w-[2px] h-2.5"
          style={{ background: t.color, opacity: 0.55 }}
        />
      </div>

      {/* Nós (cards de seção) */}
      <div className="flex flex-col gap-2 pt-1.5 relative">
        {/* Linha vertical sutil tipo "tronco" no eixo da categoria */}
        <span
          className="absolute left-3 top-0 bottom-0 w-px"
          style={{ background: `linear-gradient(180deg, ${t.color}40 0%, ${t.color}10 100%)` }}
          aria-hidden
        />
        {cards.map((card, idx) => (
          <VisualNode
            key={card.id}
            card={card}
            expanded={!!expanded[card.id]}
            onToggle={() => toggle(card.id)}
            isFirst={idx === 0}
          />
        ))}
      </div>
    </div>
  );
}

function VisualNode({ card, expanded, onToggle, isFirst: _isFirst }: {
  card: StudyCard;
  expanded: boolean;
  onToggle: () => void;
  isFirst: boolean;
}) {
  const t = CATEGORY_TOKENS[card.category];
  const previewPoints = card.keyPoints.slice(0, expanded ? card.keyPoints.length : 2);

  return (
    <article className="relative ml-4">
      {/* Branch connector — linha curva horizontal do tronco até o card */}
      <span
        className="absolute -left-3.5 top-5 w-3.5 h-px"
        style={{ background: t.color, opacity: 0.45 }}
        aria-hidden
      />
      <span
        className="absolute -left-4 top-[18px] w-1.5 h-1.5 rounded-full border-2 bg-white"
        style={{ borderColor: t.color }}
        aria-hidden
      />

      <button
        onClick={onToggle}
        className="group w-full text-left bg-white rounded-xl border-2 overflow-hidden transition-all hover:shadow-[0_10px_24px_-12px_rgba(0,0,0,0.22)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#005344]/30"
        style={{ borderColor: t.color + '38' }}
        aria-expanded={expanded}
      >
        {/* Acento vertical lateral */}
        <span className="absolute top-0 left-0 w-1 h-full pointer-events-none" style={{ background: t.color }} aria-hidden />

        <div className="pl-3.5 pr-3 py-2.5">
          {/* Número + Título */}
          <div className="flex items-start gap-2 mb-1.5">
            <span
              className="shrink-0 inline-flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-md text-[9.5px] font-bold font-mono"
              style={{ background: t.color + '15', color: t.color }}
            >
              {String(card.index).padStart(2, '0')}
            </span>
            <h3 className="flex-1 font-['Manrope'] font-bold text-[12.5px] tracking-[-0.005em] text-[#191C1D] leading-snug">
              {card.title}
            </h3>
            <span
              className="shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5"
              style={{ color: t.color }}
              aria-hidden
            >
              {expanded
                ? <ChevronDown className="h-3.5 w-3.5" />
                : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          </div>

          {/* Pontos-chave — colapsado mostra so o titulo (1 linha),
              expandido mostra titulo + descricao completa sem clamp. */}
          {previewPoints.length > 0 && (
            <ul className={expanded ? 'space-y-2 mb-2' : 'space-y-1 mb-1.5'}>
              {previewPoints.map((p, i) => {
                const hasDescription = expanded && p.text && p.text !== p.title;
                return (
                  <li
                    key={i}
                    className={`flex gap-1.5 ${expanded ? 'text-[11.5px] leading-relaxed text-[#3E4945]' : 'text-[10.5px] leading-snug text-[#3E4945]'}`}
                  >
                    <span
                      className="shrink-0 mt-[6px] h-1 w-1 rounded-full"
                      style={{ background: t.color, opacity: 0.7 }}
                      aria-hidden
                    />
                    <span className={expanded ? '' : 'line-clamp-1'}>
                      <strong className="text-[#191C1D] font-semibold">{p.title}</strong>
                      {hasDescription && (
                        <span className="text-[#4a5568]"> — {p.text}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Footer com metadados */}
          {(card.terms.length > 0 || card.subsections.length > 0 || card.keyPoints.length > 2) && (
            <div className="flex items-center gap-2 pt-1.5 mt-1 border-t border-slate-100 text-[9.5px] text-[#94a3b8]">
              {card.keyPoints.length > 2 && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">format_list_bulleted</span>
                  +{card.keyPoints.length - 2}
                </span>
              )}
              {card.terms.length > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">tag</span>
                  {card.terms.length}
                </span>
              )}
              {card.subsections.length > 0 && (
                <span className="inline-flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-[11px]">subdirectory_arrow_right</span>
                  {card.subsections.length}
                </span>
              )}
            </div>
          )}

          {/* Conteúdo expandido */}
          {expanded && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-100 space-y-2.5">
              {card.terms.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] mb-1">Termos-chave</p>
                  <div className="flex flex-wrap gap-1">
                    {card.terms.map((term, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-semibold border bg-white"
                        style={{ borderColor: t.color + '40', color: t.color }}
                      >
                        {term}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {card.subsections.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#94a3b8]">Subseções</p>
                  {card.subsections.map((sub, i) => (
                    <div
                      key={i}
                      className="rounded-md px-2 py-1.5 border-l-2"
                      style={{ background: t.color + '08', borderLeftColor: t.color }}
                    >
                      <p className="text-[10.5px] font-bold text-[#191C1D] mb-1 leading-tight">{sub.title}</p>
                      {sub.keyPoints.length > 0 && (
                        <ul className="space-y-0.5">
                          {sub.keyPoints.slice(0, 3).map((kp, j) => (
                            <li key={j} className="text-[10px] leading-snug text-[#4a5568] flex gap-1">
                              <span
                                className="shrink-0 mt-1 h-1 w-1 rounded-full"
                                style={{ background: t.color }}
                                aria-hidden
                              />
                              <span>{kp.title}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </button>
    </article>
  );
}

/* ════════════════════════════════════════════════════════════════
 * PANEL MODE — leitura focada com filtros e cards densos
 * ════════════════════════════════════════════════════════════════ */

function PanelMode({
  search, setSearch, activeCategory, setActiveCategory,
  counts, cards, expanded, toggle,
}: {
  search: string;
  setSearch: (s: string) => void;
  activeCategory: SectionCategory | 'all';
  setActiveCategory: (c: SectionCategory | 'all') => void;
  counts: Record<string, number>;
  cards: StudyCard[];
  expanded: Record<string, boolean>;
  toggle: (id: string) => void;
}) {
  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
          <input
            type="search"
            placeholder="Buscar conceito, termo, ponto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 rounded-xl border-2 border-slate-200 bg-white text-[13px] text-[#191C1D] placeholder:text-[#94a3b8] focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/[0.08] outline-none transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip
            active={activeCategory === 'all'}
            onClick={() => setActiveCategory('all')}
            label="Tudo"
            count={counts.all}
            customStyle={activeCategory === 'all'
              ? { background: '#191C1D', color: '#fff' }
              : { background: '#191C1D14', color: '#191C1D' }}
          />
          {CATEGORY_ORDER.map((cat) => {
            if (!counts[cat]) return null;
            const t = CATEGORY_TOKENS[cat];
            return (
              <FilterChip
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
                label={t.label}
                count={counts[cat]}
                icon={t.icon}
                customStyle={activeCategory === cat
                  ? { background: t.color, color: '#fff' }
                  : { background: t.color + '14', color: t.color, border: `1px solid ${t.color}26` }}
              />
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {cards.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 rounded-2xl px-6 py-10 text-center">
          <p className="text-[13px] text-[#4a5568] font-semibold">Nenhuma seção corresponde aos filtros.</p>
          <button
            onClick={() => { setSearch(''); setActiveCategory('all'); }}
            className="mt-2 text-[12px] font-bold text-[#005344] hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards.map((card) => (
            <FullCard
              key={card.id}
              card={card}
              expanded={!!expanded[card.id]}
              onToggle={() => toggle(card.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, count, icon, customStyle }: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  icon?: string;
  customStyle?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11.5px] font-bold transition-all ${
        active ? 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]' : 'hover:opacity-90'
      }`}
      style={customStyle}
    >
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      {label}
      <span
        className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? 'bg-white/20' : 'bg-current opacity-15'}`}
        style={active ? undefined : { color: 'inherit' }}
      >
        {count}
      </span>
    </button>
  );
}

function FullCard({ card, expanded, onToggle }: { card: StudyCard; expanded: boolean; onToggle: () => void }) {
  const t = CATEGORY_TOKENS[card.category];
  return (
    <article className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: t.color }} />

      <div className="pl-5 pr-4 py-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.14em] mb-1.5"
              style={{ background: t.color + '14', color: t.color }}
            >
              <span className="material-symbols-outlined text-[12px]">{t.icon}</span>
              {t.label} · {String(card.index).padStart(2, '0')}
            </div>
            <h2 className="font-['Manrope'] font-bold text-[15px] tracking-[-0.01em] text-[#191C1D] leading-tight">
              {card.title}
            </h2>
          </div>
        </div>

        {/* Termos */}
        {card.terms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.terms.map((term, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border bg-white"
                style={{ borderColor: t.color + '30', color: t.color }}
              >
                {term}
              </span>
            ))}
          </div>
        )}

        {/* Key points */}
        {card.keyPoints.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {card.keyPoints.map((p, i) => (
              <li key={i} className="text-[12.5px] leading-snug text-[#3E4945] flex gap-2">
                <span
                  className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full"
                  style={{ background: t.color, opacity: 0.6 }}
                />
                <span>
                  <strong className="text-[#191C1D] font-semibold">{p.title}</strong>
                  {p.text && p.text !== p.title && (
                    <span className="text-[#4a5568]"> — {p.text}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Subseções (resumido quando colapsado) */}
        {card.subsections.length > 0 && !expanded && (
          <div className="flex flex-wrap gap-1 mt-2 pt-3 border-t border-slate-100">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] w-full mb-1">Subseções</span>
            {card.subsections.map((sub, i) => (
              <span
                key={i}
                className="text-[10.5px] font-medium text-[#4a5568] px-2 py-0.5 rounded bg-slate-50 border border-slate-200"
              >
                {sub.title}
              </span>
            ))}
          </div>
        )}

        {/* Expandir / colapsar */}
        {(card.fullText.length > 200 || card.subsections.length > 0) && (
          <button
            onClick={onToggle}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-70 transition-opacity"
            style={{ color: t.color }}
          >
            {expanded
              ? <><ChevronDown className="h-3 w-3" /> Recolher</>
              : <><ChevronRight className="h-3 w-3" /> Ver conteúdo completo</>}
          </button>
        )}

        {/* Conteúdo expandido (markdown completo) */}
        {expanded && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="prose prose-sm max-w-none text-[12.5px] leading-relaxed text-[#3E4945] prose-strong:text-[#191C1D] prose-headings:font-['Manrope'] prose-headings:text-[#191C1D] prose-headings:text-[14px] prose-h3:text-[13px] prose-a:text-[#005344]">
              <MarkdownRenderer content={card.fullText} />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
