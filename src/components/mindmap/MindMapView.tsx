import { useMemo, useState } from 'react';
import { parseMindMap, type StudyCard, type SectionCategory } from './parseMindMap';
import { ChevronDown, ChevronRight, BookOpen, Search } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

/* ─── Tokens de categoria ──────────────────────────────────────
 * Cada categoria semantica ganha cor + icone proprios pra o aluno
 * reconhecer de bate-pronto onde esta cada bloco. Tudo dentro do
 * pmed editorial (verde escuro + ouro + neutros).
 */

const CATEGORY_TOKENS: Record<SectionCategory, {
  label: string;
  icon: string; // material symbols name
  /** cor primaria — usada na barra esquerda + chip */
  color: string;
  /** background suave do chip */
  bg: string;
  /** cor de texto do chip */
  fg: string;
}> = {
  bases:       { label: 'Bases',       icon: 'hub',           color: '#005344', bg: '#005344/0.08',  fg: '#003D32' },
  epidemio:    { label: 'Epidemiologia', icon: 'monitoring',  color: '#0e7c63', bg: '#0e7c63/0.08',  fg: '#0e5e4d' },
  clinica:     { label: 'Clínica',     icon: 'clinical_notes', color: '#1a8a5f', bg: '#1a8a5f/0.08', fg: '#0d5b3d' },
  tratamento:  { label: 'Tratamento',  icon: 'medication',    color: '#8a6f26', bg: '#C9A84C/0.15',  fg: '#7a5f1a' },
  prognostico: { label: 'Prognóstico', icon: 'monitor_heart', color: '#94731e', bg: '#94731e/0.10',  fg: '#6e5618' },
  outros:      { label: 'Geral',       icon: 'menu_book',     color: '#4a5568', bg: '#4a5568/0.08',  fg: '#3e4945' },
};

const CATEGORY_ORDER: SectionCategory[] = ['bases', 'epidemio', 'clinica', 'tratamento', 'prognostico', 'outros'];

/* ─── Componente ─── */

interface MindMapViewProps {
  content: string;
  topic: string;
}

export default function MindMapView({ content, topic }: MindMapViewProps) {
  const { cards } = useMemo(() => parseMindMap(content, topic), [content, topic]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeCategory, setActiveCategory] = useState<SectionCategory | 'all'>('all');
  const [search, setSearch] = useState('');

  // Conta cards por categoria
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: cards.length };
    for (const card of cards) c[card.category] = (c[card.category] || 0) + 1;
    return c;
  }, [cards]);

  // Filtra
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

  // Estimativa de tempo de revisao deste mapa (baseado em key points totais)
  const totalPoints = cards.reduce((s, c) => s + c.keyPoints.length + c.subsections.reduce((ss, sub) => ss + sub.keyPoints.length, 0), 0);
  const reviewMinutes = Math.max(2, Math.ceil(totalPoints * 0.4));

  if (cards.length === 0) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BookOpen className="h-10 w-10 mx-auto text-[#94a3b8] opacity-50 mb-3" strokeWidth={1.2} />
          <p className="text-[13px] text-[#4a5568] font-semibold">Mapa não disponível</p>
          <p className="text-[11.5px] text-[#94a3b8] mt-1">
            Este resumo não tem seções <code className="font-mono text-[10px]">##</code> suficientes pra construir um painel de estudo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto" style={{ background: '#fafbfa' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* ─── Header editorial ─── */}
        <header className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
          <div className="px-5 sm:px-7 py-5">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2 mb-2">
              <span className="w-6 h-px bg-[#C9A84C]" />
              Painel de estudo
            </p>
            <h1 className="font-['Manrope'] font-bold text-[22px] sm:text-[26px] tracking-[-0.02em] leading-[1.1] text-[#191C1D] mb-2">
              {topic}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11.5px] text-[#4a5568]">
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                ~{reviewMinutes} min de revisão
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">layers</span>
                {cards.length} seç{cards.length === 1 ? 'ão' : 'ões'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">format_list_bulleted</span>
                {totalPoints} pontos-chave
              </span>
            </div>
          </div>
        </header>

        {/* ─── Filtros: busca + chips categoria ─── */}
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94a3b8]" />
            <input
              type="search"
              placeholder="Buscar conceito, termo, ponto…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-9 pr-3 rounded-xl border-2 border-slate-200 bg-white text-[13px] text-[#191C1D] placeholder:text-[#94a3b8] focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/06 outline-none transition-all"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <CategoryChip
              active={activeCategory === 'all'}
              onClick={() => setActiveCategory('all')}
              label="Tudo"
              count={counts.all}
              colorClass="bg-[#191C1D] text-white"
            />
            {CATEGORY_ORDER.map((cat) => {
              if (!counts[cat]) return null;
              const t = CATEGORY_TOKENS[cat];
              return (
                <CategoryChip
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => setActiveCategory(cat)}
                  label={t.label}
                  count={counts[cat]}
                  customStyle={activeCategory === cat
                    ? { background: t.color, color: '#fff' }
                    : { background: t.color + '12', color: t.color, border: `1px solid ${t.color}26` }}
                />
              );
            })}
          </div>
        </div>

        {/* ─── Grid de cards ─── */}
        {visibleCards.length === 0 ? (
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
            {visibleCards.map((card) => (
              <Card key={card.id} card={card} expanded={!!expanded[card.id]} onToggle={() => toggle(card.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Sub-componentes ─── */

function CategoryChip({
  active, onClick, label, count, colorClass, customStyle,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  colorClass?: string;
  customStyle?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-[11.5px] font-bold transition-all ${
        active ? 'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.15)]' : 'hover:opacity-90'
      } ${colorClass ?? ''}`}
      style={customStyle}
    >
      {label}
      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${active ? 'bg-white/20' : 'bg-current opacity-15'}`} style={active ? undefined : { color: 'inherit' }}>
        {count}
      </span>
    </button>
  );
}

function Card({ card, expanded, onToggle }: { card: StudyCard; expanded: boolean; onToggle: () => void }) {
  const t = CATEGORY_TOKENS[card.category];
  return (
    <article className="relative bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all hover:shadow-[0_8px_20px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-0.5">
      {/* barra lateral de categoria */}
      <span className="absolute left-0 top-0 bottom-0 w-1" style={{ background: t.color }} />

      <div className="pl-5 pr-4 py-4">
        {/* header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[9.5px] font-bold uppercase tracking-[0.14em] mb-1.5"
                 style={{ background: t.color + '14', color: t.color }}>
              <span className="material-symbols-outlined text-[12px]">{t.icon}</span>
              {t.label} · {String(card.index).padStart(2, '0')}
            </div>
            <h2 className="font-['Manrope'] font-bold text-[15px] tracking-[-0.01em] text-[#191C1D] leading-tight">
              {card.title}
            </h2>
          </div>
        </div>

        {/* termos-chave */}
        {card.terms.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {card.terms.map((term, i) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border bg-white"
                    style={{ borderColor: t.color + '30', color: t.color }}>
                {term}
              </span>
            ))}
          </div>
        )}

        {/* key points */}
        {card.keyPoints.length > 0 && (
          <ul className="space-y-1.5 mb-3">
            {card.keyPoints.map((p, i) => (
              <li key={i} className="text-[12.5px] leading-snug text-[#3E4945] flex gap-2">
                <span className="shrink-0 mt-1 h-1.5 w-1.5 rounded-full" style={{ background: t.color, opacity: 0.6 }} />
                <span>
                  <strong className="text-[#191C1D] font-semibold">{p.title}</strong>
                  {p.text !== p.title && p.text.length > p.title.length && (
                    <span className="text-[#4a5568]"> — {p.text.slice(p.title.length).replace(/^[:\-—\s]+/, '')}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* subsecoes (resumido) */}
        {card.subsections.length > 0 && !expanded && (
          <div className="flex flex-wrap gap-1 mt-2 pt-3 border-t border-slate-100">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#94a3b8] w-full mb-1">Subseções</span>
            {card.subsections.map((sub, i) => (
              <span key={i} className="text-[10.5px] font-medium text-[#4a5568] px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                {sub.title}
              </span>
            ))}
          </div>
        )}

        {/* Expandir/colapsar */}
        {(card.fullText.length > 200 || card.subsections.length > 0) && (
          <button
            onClick={onToggle}
            className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] hover:opacity-70 transition-opacity"
            style={{ color: t.color }}
          >
            {expanded ? <><ChevronDown className="h-3 w-3" /> Recolher</> : <><ChevronRight className="h-3 w-3" /> Ver conteúdo completo</>}
          </button>
        )}

        {/* conteudo expandido */}
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
