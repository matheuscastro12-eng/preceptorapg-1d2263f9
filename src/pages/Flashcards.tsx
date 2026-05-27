import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Check, X, Layers, Brain, Sparkles, Trash2, ChevronRight, BookOpen, Plus, Loader2, FolderTree } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRecordReview } from '@/hooks/useGamification';
import { useStudyPlanContext, markPlanActivityComplete } from '@/hooks/useStudyPlanContext';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  source_type: string;
  source_id: string | null;
  area: string | null;
  tema: string | null;
  secao: string | null;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

// Deck de um tema (doença/condição). Pode ter subseções dentro
// (cards novos) ou ser um deck "flat" (cards legacy sem tema).
interface TemaDeck {
  key: string;          // tema string OU "legacy:<source_id|area>"
  label: string;
  totalCards: number;
  dueCards: number;
  isLegacy: boolean;    // true = card antigo, sem hierarquia
  secoes: SecaoDeck[];  // [] para legacy
}

interface SecaoDeck {
  key: string;          // nome da seção
  totalCards: number;
  dueCards: number;
}

// Seções padrão do construtor de deck. A IA preenche `secao` com
// exatamente uma dessas strings (mais "Objetivos específicos" se
// o aluno tiver preenchido a caixa livre).
const DEFAULT_SECTIONS = [
  'Definição/Classificação',
  'Epidemiologia',
  'Fisiopatologia',
  'Etiologia',
  'Fatores de risco',
  'Quadro clínico',
  'Diagnóstico',
  'Diagnóstico diferencial',
  'Tratamento',
  'Complicações',
  'Prognóstico',
  'Pontos de prova',
] as const;
type Section = typeof DEFAULT_SECTIONS[number];

type View = 'temas' | 'subsecoes' | 'review';

const Flashcards = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const recordReview = useRecordReview();
  const planCtx = useStudyPlanContext();

  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<TemaDeck[]>([]);
  const [view, setView] = useState<View>('temas');
  const [selectedTema, setSelectedTema] = useState<string | null>(null);
  const [selectedSecao, setSelectedSecao] = useState<string | null>(null);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);

  // Criação de deck — modal com seções selecionáveis
  const [creatingDeck, setCreatingDeck] = useState(false);
  const [newDeckTopic, setNewDeckTopic] = useState('');
  const [selectedSections, setSelectedSections] = useState<Set<Section>>(new Set(DEFAULT_SECTIONS));
  const [customObjectives, setCustomObjectives] = useState('');
  const [cardCount, setCardCount] = useState(15);
  const [generatingDeck, setGeneratingDeck] = useState(false);

  const planAutoMarkedRef = useRef(false);

  useEffect(() => { if (user) fetchCards(); }, [user]);

  // Deep link do cronograma: pré-preencher e iniciar fluxo
  useEffect(() => {
    if (loading) return;
    if (!planCtx.isFromPlan) return;
    const action = new URLSearchParams(window.location.search).get('action');

    if (action === 'create' && planCtx.tema && !creatingDeck && !generatingDeck) {
      setNewDeckTopic(planCtx.tema);
      setCreatingDeck(true);
    } else if (action === 'review' && planCtx.tema) {
      const tema = planCtx.tema.toLowerCase();
      const match = decks.find(d => d.label.toLowerCase().includes(tema));
      if (match && match.dueCards > 0 && view === 'temas') openTema(match.key);
      else if (decks.length > 0 && view === 'temas') startReview('all');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, planCtx.isFromPlan, decks.length]);

  const fetchCards = async () => {
    try {
      const { data } = await supabase.from('flashcards').select('*').order('next_review', { ascending: true });
      if (data) { const cards = data as Flashcard[]; setAllCards(cards); buildDecks(cards); }
    } catch (error) { console.error('Error fetching flashcards:', error); }
    finally { setLoading(false); }
  };

  /**
   * Constrói a hierarquia de decks:
   * - Cards com `tema` → agrupados por tema, e dentro por `secao`
   * - Cards legacy (tema null) → agrupados pela chave antiga (source_id || area)
   */
  const buildDecks = (cards: Flashcard[]) => {
    const now = new Date().toISOString();

    // ── Themed cards: tema → secao ──
    const themed = new Map<string, { all: Flashcard[]; bySecao: Map<string, Flashcard[]> }>();
    // ── Legacy cards: source_id || area ──
    const legacy = new Map<string, { cards: Flashcard[]; area: string | null }>();

    for (const card of cards) {
      if (card.tema) {
        if (!themed.has(card.tema)) themed.set(card.tema, { all: [], bySecao: new Map() });
        const t = themed.get(card.tema)!;
        t.all.push(card);
        const sec = card.secao || 'Sem seção';
        if (!t.bySecao.has(sec)) t.bySecao.set(sec, []);
        t.bySecao.get(sec)!.push(card);
      } else {
        const key = `legacy:${card.source_id || card.area || 'sem_origem'}`;
        if (!legacy.has(key)) legacy.set(key, { cards: [], area: card.area });
        legacy.get(key)!.cards.push(card);
      }
    }

    const builtThemed: TemaDeck[] = [];
    themed.forEach((val, tema) => {
      const totalCards = val.all.length;
      const dueCards = val.all.filter(c => c.next_review <= now).length;
      const secoes: SecaoDeck[] = [];
      val.bySecao.forEach((secCards, secao) => {
        secoes.push({
          key: secao,
          totalCards: secCards.length,
          dueCards: secCards.filter(c => c.next_review <= now).length,
        });
      });
      // Ordem das seções: respeita DEFAULT_SECTIONS quando possível, "Sem seção" e "Objetivos específicos" no fim
      secoes.sort((a, b) => {
        const ia = (DEFAULT_SECTIONS as readonly string[]).indexOf(a.key);
        const ib = (DEFAULT_SECTIONS as readonly string[]).indexOf(b.key);
        if (ia === -1 && ib === -1) return a.key.localeCompare(b.key);
        if (ia === -1) return 1;
        if (ib === -1) return -1;
        return ia - ib;
      });
      builtThemed.push({ key: tema, label: tema, totalCards, dueCards, isLegacy: false, secoes });
    });

    // ── Resolve legacy: tenta achar nome do fechamento para os com source_id ──
    const legacySourceIds = [...new Set(cards.filter(c => !c.tema && c.source_id).map(c => c.source_id!))];

    const finalizeLegacy = (nameMap: Map<string, string>) => {
      const builtLegacy: TemaDeck[] = [];
      legacy.forEach((val, key) => {
        const totalCards = val.cards.length;
        const dueCards = val.cards.filter(c => c.next_review <= now).length;
        const sourceIdMatch = key.replace('legacy:', '');
        const label = nameMap.get(sourceIdMatch) || val.area || 'Flashcards gerais';
        builtLegacy.push({ key, label, totalCards, dueCards, isLegacy: true, secoes: [] });
      });
      const combined = [...builtThemed, ...builtLegacy].sort((a, b) => b.dueCards - a.dueCards);
      setDecks(combined);
    };

    if (legacySourceIds.length > 0) {
      supabase.from('fechamentos').select('id, tema').in('id', legacySourceIds).then(({ data: fechamentos }) => {
        const nameMap = new Map<string, string>();
        fechamentos?.forEach(f => nameMap.set(f.id, f.tema));
        finalizeLegacy(nameMap);
      });
    } else {
      finalizeLegacy(new Map());
    }
  };

  /** Abre a tela de subseções (drill-down num tema). Para decks legacy, vai direto pra revisão. */
  const openTema = (deckKey: string) => {
    const deck = decks.find(d => d.key === deckKey);
    if (!deck) return;
    if (deck.isLegacy) {
      startReview(deckKey);
    } else {
      setSelectedTema(deckKey);
      setView('subsecoes');
    }
  };

  /** Inicia sessão de revisão. deckKey pode ser 'all', uma chave de deck, ou um tema (com secao opcional). */
  const startReview = (deckKey: string | 'all', secao?: string) => {
    const now = new Date().toISOString();
    let filtered: Flashcard[];
    if (deckKey === 'all') {
      filtered = allCards.filter(c => c.next_review <= now);
    } else {
      const deck = decks.find(d => d.key === deckKey);
      if (!deck) return;
      if (deck.isLegacy) {
        const legacyId = deck.key.replace('legacy:', '');
        filtered = allCards.filter(c => !c.tema && (c.source_id || c.area || 'sem_origem') === legacyId && c.next_review <= now);
      } else {
        filtered = allCards.filter(c => c.tema === deck.key && c.next_review <= now);
        if (secao) filtered = filtered.filter(c => (c.secao || 'Sem seção') === secao);
      }
    }
    setDueCards(filtered);
    setSelectedTema(deckKey === 'all' ? null : deckKey);
    setSelectedSecao(secao ?? null);
    setCurrentIndex(0); setFlipped(false); setReviewedCount(0);
    setView('review');
  };

  const handleReview = async (quality: 'easy' | 'good' | 'hard' | 'again') => {
    const card = dueCards[currentIndex];
    if (!card) return;

    const easeBefore = card.ease_factor;
    const intervalBefore = card.interval_days;

    const { sm2 } = await import('@/hooks/useGamification');
    const { ease: newEase, interval: newInterval, reps: newReps } = sm2(quality, card.ease_factor, card.interval_days, card.repetitions);

    const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + newInterval);
    await supabase.from('flashcards').update({ interval_days: newInterval, ease_factor: newEase, repetitions: newReps, next_review: nextReview.toISOString() }).eq('id', card.id);

    recordReview.mutate({
      cardId: card.id, quality, easeBefore, easeAfter: newEase, intervalBefore, intervalAfter: newInterval,
    });

    setReviewedCount(prev => prev + 1);
    setFlipped(false);
    if (currentIndex < dueCards.length - 1) setCurrentIndex(prev => prev + 1);
    else {
      toast({ title: 'Sessão completa!', description: `Você revisou ${reviewedCount + 1} cards. +XP!` });
      if (planCtx.isFromPlan && planCtx.planDay && planCtx.actIdx !== null && !planAutoMarkedRef.current) {
        planAutoMarkedRef.current = true;
        markPlanActivityComplete(planCtx.planDay, planCtx.actIdx);
      }
      backToTemas();
      fetchCards();
    }
  };

  const deleteCard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id);
    setDueCards(prev => prev.filter(c => c.id !== id));
    setAllCards(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Card removido' });
    if (currentIndex >= dueCards.length - 1 && currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  /** Apaga um tema inteiro (todos os cards do tema). */
  const deleteDeck = async (deckKey: string) => {
    const deck = decks.find(d => d.key === deckKey);
    if (!deck) return;
    let ids: string[];
    if (deck.isLegacy) {
      const legacyId = deck.key.replace('legacy:', '');
      ids = allCards.filter(c => !c.tema && (c.source_id || c.area || 'sem_origem') === legacyId).map(c => c.id);
    } else {
      ids = allCards.filter(c => c.tema === deck.key).map(c => c.id);
    }
    if (!ids.length) return;
    if (!confirm(`Apagar ${ids.length} cards deste deck?`)) return;
    await supabase.from('flashcards').delete().in('id', ids);
    setAllCards(prev => prev.filter(c => !ids.includes(c.id)));
    setDecks(prev => prev.filter(d => d.key !== deckKey));
    if (selectedTema === deckKey) backToTemas();
    toast({ title: 'Deck removido', description: `${ids.length} cards excluídos.` });
  };

  const backToTemas = () => {
    setView('temas');
    setSelectedTema(null);
    setSelectedSecao(null);
  };

  const handleCreateDeckFromTopic = async () => {
    const topic = newDeckTopic.trim();
    if (topic.length < 3) {
      toast({ title: 'Tema muito curto', description: 'Informe pelo menos 3 caracteres.', variant: 'destructive' });
      return;
    }
    if (selectedSections.size === 0) {
      toast({ title: 'Selecione ao menos uma seção', description: 'Marque pelo menos 1 categoria de conteúdo.', variant: 'destructive' });
      return;
    }
    setGeneratingDeck(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: {
          topic,
          sections: Array.from(selectedSections),
          custom_objectives: customObjectives.trim() || undefined,
          count: cardCount,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const created = data?.count ?? 0;
      toast({
        title: 'Deck criado!',
        description: `${created} flashcards de "${topic}" prontos para revisar.`,
      });
      setCreatingDeck(false);
      setNewDeckTopic('');
      setCustomObjectives('');
      setSelectedSections(new Set(DEFAULT_SECTIONS));
      setCardCount(15);
      await fetchCards();

      if (planCtx.isFromPlan && planCtx.planDay && planCtx.actIdx !== null && !planAutoMarkedRef.current) {
        planAutoMarkedRef.current = true;
        markPlanActivityComplete(planCtx.planDay, planCtx.actIdx);
      }
    } catch (e) {
      toast({ title: 'Erro ao gerar', description: (e as Error).message, variant: 'destructive' });
    } finally {
      setGeneratingDeck(false);
    }
  };

  const toggleSection = (sec: Section) => {
    setSelectedSections(prev => {
      const next = new Set(prev);
      if (next.has(sec)) next.delete(sec); else next.add(sec);
      return next;
    });
  };

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;

  const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);
  const totalAll = allCards.length;
  const currentTemaDeck = useMemo(
    () => (selectedTema ? decks.find(d => d.key === selectedTema) ?? null : null),
    [selectedTema, decks]
  );

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {loading ? (
          <FlashcardsSkeleton />
        ) : creatingDeck ? (
          <CreateDeckPanel
            topic={newDeckTopic}
            onTopicChange={setNewDeckTopic}
            selectedSections={selectedSections}
            onToggleSection={toggleSection}
            customObjectives={customObjectives}
            onCustomChange={setCustomObjectives}
            cardCount={cardCount}
            onCountChange={setCardCount}
            generating={generatingDeck}
            onCancel={() => { setCreatingDeck(false); setNewDeckTopic(''); }}
            onCreate={handleCreateDeckFromTopic}
            fromPlan={planCtx.isFromPlan}
          />
        ) : totalAll === 0 ? (
          <EmptyState navigate={navigate} onCreateNew={() => setCreatingDeck(true)} />
        ) : view === 'temas' ? (
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-9">
              <header className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
                    <span className="w-6 h-px bg-[#C9A84C]" />
                    Repetição espaçada
                  </p>
                  <h1 className="font-['Manrope'] font-bold text-[28px] sm:text-[34px] tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
                    Memorize sem esforço com{' '}
                    <em className="not-italic font-medium text-[#8a6f26]">
                      flashcards
                    </em>
                    .
                  </h1>
                  <p className="text-sm text-[#4a5568] mt-3 max-w-[52ch] leading-relaxed">
                    Algoritmo SM-2 calibra o intervalo de cada card pelo seu desempenho.
                    Revise pouco, lembre por meses.
                  </p>
                </div>
                <button
                  onClick={() => setCreatingDeck(true)}
                  className="shrink-0 inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-[#005344] text-white text-sm font-bold hover:bg-[#003D32] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Novo deck
                </button>
              </header>

              <DeckList decks={decks} totalDue={totalDue} totalAll={totalAll} onOpenTema={openTema} onStartReviewAll={() => startReview('all')} onDeleteDeck={deleteDeck} />
            </div>
          </div>
        ) : view === 'subsecoes' && currentTemaDeck ? (
          <SubsecoesPanel
            tema={currentTemaDeck}
            onBack={backToTemas}
            onReviewAll={() => startReview(currentTemaDeck.key)}
            onReviewSecao={(sec) => startReview(currentTemaDeck.key, sec)}
            onDeleteDeck={() => deleteDeck(currentTemaDeck.key)}
          />
        ) : (
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-6">
              <div className="flex items-center gap-3 flex-wrap">
                <button onClick={() => {
                  if (selectedTema && !decks.find(d => d.key === selectedTema)?.isLegacy) {
                    setView('subsecoes'); setSelectedSecao(null);
                  } else {
                    backToTemas();
                  }
                }} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] transition-colors active:scale-95">
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar
                </button>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                  {currentTemaDeck ? currentTemaDeck.label : 'Revisão'}
                  {selectedSecao && <span className="text-[#94a3b8] font-normal normal-case tracking-normal"> · {selectedSecao}</span>}
                </span>
              </div>

              {dueCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4 bg-[#005344]/10">
                    <Check className="h-6 w-6 text-[#005344]" />
                  </div>
                  <h2 className="font-['Manrope'] font-bold text-[18px] text-[#191C1D] mb-1">Nenhum card pendente</h2>
                  <p className="text-sm text-[#4a5568] mb-6">Tudo em dia neste deck. Volte amanhã!</p>
                  <Button variant="outline" onClick={backToTemas}>Voltar aos decks</Button>
                </div>
              ) : (
                <ReviewSession dueCards={dueCards} currentIndex={currentIndex} flipped={flipped} reviewedCount={reviewedCount} onFlip={() => setFlipped(!flipped)} onReview={handleReview} onDelete={deleteCard} />
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

// ───────────────────────────────────────────────────────────────────
function FlashcardsSkeleton() {
  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
      <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-9">
        <div>
          <div className="h-3 w-40 rounded bg-slate-100 animate-pulse mb-3" />
          <div className="h-9 w-3/4 max-w-md rounded bg-slate-100 animate-pulse mb-2" />
          <div className="h-9 w-2/3 max-w-sm rounded bg-slate-100 animate-pulse mb-3" />
          <div className="h-4 w-full max-w-lg rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
          <div className="h-[58px] rounded-xl bg-slate-100 animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
          <div className="rounded-xl border-2 border-slate-200 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100 last:border-0">
                <div className="h-9 w-9 rounded-lg bg-slate-100 animate-pulse" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-slate-100 animate-pulse" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
function CreateDeckPanel({
  topic, onTopicChange, selectedSections, onToggleSection, customObjectives, onCustomChange, cardCount, onCountChange, generating, onCancel, onCreate, fromPlan,
}: {
  topic: string;
  onTopicChange: (s: string) => void;
  selectedSections: Set<Section>;
  onToggleSection: (s: Section) => void;
  customObjectives: string;
  onCustomChange: (s: string) => void;
  cardCount: number;
  onCountChange: (n: number) => void;
  generating: boolean;
  onCancel: () => void;
  onCreate: () => void;
  fromPlan: boolean;
}) {
  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
      <div className="px-5 sm:px-8 md:px-12 py-9 md:py-12">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] transition-colors mb-6"
          disabled={generating}
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar
        </button>

        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
          <span className="w-6 h-px bg-[#C9A84C]" />
          Novo deck
        </p>
        <h1 className="font-['Manrope'] font-bold text-[28px] sm:text-[34px] tracking-[-0.025em] leading-[1.05] text-[#191C1D] mb-3">
          Crie flashcards a partir{' '}
          <em className="not-italic font-medium text-[#8a6f26]">de um tema</em>.
        </h1>
        <p className="text-sm text-[#4a5568] mb-8 max-w-[60ch] leading-relaxed">
          Informe a doença/condição, selecione as subseções que quer estudar e o PreceptorMED
          gera os flashcards organizados.
        </p>

        <div className="max-w-2xl space-y-7">
          {/* Tema */}
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
              Tema do deck *
            </label>
            <input
              value={topic}
              onChange={(e) => onTopicChange(e.target.value)}
              placeholder="Ex: Insuficiência Cardíaca com FE reduzida"
              disabled={generating}
              autoFocus
              className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow disabled:opacity-50"
            />
            <p className="text-[11px] text-[#94a3b8] mt-1.5">
              Quanto mais específico, melhores os flashcards. "IAM com supra de ST" &gt; "Cardio".
            </p>
          </div>

          {/* Seções */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568]">
                O que incluir no deck
              </label>
              <span className="text-[11px] text-[#94a3b8] font-mono">
                {selectedSections.size}/{DEFAULT_SECTIONS.length}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DEFAULT_SECTIONS.map((sec) => {
                const checked = selectedSections.has(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => !generating && onToggleSection(sec)}
                    disabled={generating}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[12px] font-medium text-left transition-all ${
                      checked
                        ? 'bg-[#005344]/8 border-[#005344]/40 text-[#003D32]'
                        : 'bg-white border-slate-200 text-[#94a3b8] hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    <span className={`h-3.5 w-3.5 rounded-[3px] border flex items-center justify-center shrink-0 ${
                      checked ? 'bg-[#005344] border-[#005344]' : 'border-slate-300'
                    }`}>
                      {checked && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                    </span>
                    <span className="leading-tight">{sec}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#94a3b8] mt-2">Desmarque as seções que não quer no deck.</p>
          </div>

          {/* Objetivos específicos */}
          <div>
            <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568] mb-2">
              Objetivos específicos <span className="font-normal normal-case tracking-normal text-[#94a3b8]">(opcional)</span>
            </label>
            <textarea
              value={customObjectives}
              onChange={(e) => onCustomChange(e.target.value)}
              placeholder='Ex: "Quero focar em critérios de Framingham, manejo de descompensação aguda e diferença entre ICFEr e ICFEp"'
              disabled={generating}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 text-sm focus:outline-none focus:border-[#005344] focus:ring-4 focus:ring-[#005344]/10 transition-shadow disabled:opacity-50 resize-none"
            />
            <p className="text-[11px] text-[#94a3b8] mt-1.5">
              Aponte tópicos extras ou ângulos que você quer priorizar. A IA dá peso a esses pontos.
            </p>
          </div>

          {/* Quantidade */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#4a5568]">
                Quantos flashcards?
              </label>
              <span className="text-[13px] font-bold text-[#005344] font-mono">{cardCount}</span>
            </div>
            <input
              type="range"
              min={5}
              max={30}
              step={1}
              value={cardCount}
              onChange={(e) => onCountChange(Number(e.target.value))}
              disabled={generating}
              className="w-full accent-[#005344] disabled:opacity-50"
            />
            <div className="flex justify-between text-[10px] text-[#94a3b8] mt-1">
              <span>5</span>
              <span>15</span>
              <span>30</span>
            </div>
          </div>

          {fromPlan && (
            <div className="p-3 rounded-lg bg-[#005344]/5 border border-[#005344]/15 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-[#005344] shrink-0 mt-0.5" />
              <p className="text-xs text-[#005344] leading-relaxed">
                Vindo do seu cronograma. Após gerar, a atividade será marcada como concluída automaticamente.
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={onCancel}
              disabled={generating}
              className="px-5 h-12 rounded-xl text-sm font-bold text-[#4a5568] hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onCreate}
              disabled={generating || topic.trim().length < 3 || selectedSections.size === 0}
              className="flex-1 inline-flex items-center justify-center gap-2 h-12 rounded-xl bg-gradient-to-br from-[#003D32] via-[#005344] to-[#006D5B] text-white text-sm font-bold shadow-[0_8px_24px_-4px_rgba(0,109,91,0.4)] hover:shadow-[0_12px_28px_-4px_rgba(0,109,91,0.55)] disabled:opacity-50 transition-all"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  PreceptorMED gerando flashcards (~25s)...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C9A84C]" />
                  Gerar deck
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
function DeckList({ decks, totalDue, totalAll, onOpenTema, onStartReviewAll, onDeleteDeck }: { decks: TemaDeck[]; totalDue: number; totalAll: number; onOpenTema: (k: string) => void; onStartReviewAll: () => void; onDeleteDeck: (k: string) => void }) {
  return (
    <>
      {/* ── Hoje ── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
            ① Para hoje
          </label>
          <span className="font-mono text-[10.5px] font-bold text-[#005344]">
            {totalDue}/{totalAll}
          </span>
        </div>
        <button
          onClick={() => totalDue > 0 && onStartReviewAll()}
          disabled={totalDue === 0}
          className="w-full h-[58px] rounded-xl font-['Manrope'] font-bold text-[15px] tracking-[-0.005em] text-white inline-flex items-center justify-center gap-2.5 transition-all disabled:cursor-not-allowed group relative overflow-hidden"
          style={{
            background: totalDue > 0
              ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)'
              : '#94a3b8',
            boxShadow: totalDue > 0 ? '0 8px 24px -8px rgba(0,109,91,0.45)' : 'none',
          }}
        >
          {totalDue > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          )}
          <div className="relative flex items-center gap-2.5">
            {totalDue > 0 ? (
              <>
                <Sparkles className="w-[18px] h-[18px] text-[#C9A84C]" />
                Revisar todos · {totalDue} pendentes
              </>
            ) : (
              'Tudo em dia · volte amanhã'
            )}
          </div>
        </button>
      </section>

      {/* ── Decks ── */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568] inline-flex items-center gap-2">
            ② Decks por tema
            <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
              clique pra ver as subseções
            </span>
          </label>
        </div>
        <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
          {decks.map((deck, i) => (
            <motion.div
              key={deck.key}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25, ease: 'easeOut' }}
            >
              <div
                className={`group flex items-center gap-3 px-4 py-3.5 transition-all border-b border-slate-100 last:border-0 cursor-pointer hover:bg-[#005344]/[0.03]`}
                onClick={() => onOpenTema(deck.key)}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-[#005344]/8">
                  {deck.isLegacy ? (
                    <BookOpen className="h-[16px] w-[16px] text-[#005344]" strokeWidth={1.75} />
                  ) : (
                    <FolderTree className="h-[16px] w-[16px] text-[#005344]" strokeWidth={1.75} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Manrope'] text-[13px] font-bold text-[#191C1D] truncate">{deck.label}</p>
                  <p className="text-[11px] text-[#94a3b8]">
                    {deck.totalCards} cards
                    {!deck.isLegacy && deck.secoes.length > 0 && (
                      <span className="ml-1.5 text-[#94a3b8]">· {deck.secoes.length} {deck.secoes.length === 1 ? 'seção' : 'seções'}</span>
                    )}
                    {deck.dueCards > 0 && <span className="ml-1.5 font-bold text-[#005344]">· {deck.dueCards} pendentes</span>}
                    {deck.dueCards === 0 && <span className="ml-1.5 text-[#8a6f26]">· em dia</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all active:scale-95"
                    onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.key); }}
                    aria-label="Remover deck"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#005344] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────
function SubsecoesPanel({ tema, onBack, onReviewAll, onReviewSecao, onDeleteDeck }: {
  tema: TemaDeck;
  onBack: () => void;
  onReviewAll: () => void;
  onReviewSecao: (sec: string) => void;
  onDeleteDeck: () => void;
}) {
  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
      <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-7">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Todos os decks
        </button>

        <header className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
              <span className="w-6 h-px bg-[#C9A84C]" />
              Subseções
            </p>
            <h1 className="font-['Manrope'] font-bold text-[26px] sm:text-[32px] tracking-[-0.025em] leading-[1.1] text-[#191C1D]">
              {tema.label}
            </h1>
            <p className="text-sm text-[#4a5568] mt-2">
              {tema.totalCards} cards no total
              {tema.dueCards > 0 && <span className="ml-1.5 font-semibold text-[#005344]">· {tema.dueCards} pendentes</span>}
              {tema.dueCards === 0 && <span className="ml-1.5 text-[#8a6f26]">· em dia</span>}
            </p>
          </div>
          <button
            onClick={onDeleteDeck}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" /> Apagar deck inteiro
          </button>
        </header>

        {/* Revisar tudo do tema */}
        <button
          onClick={() => tema.dueCards > 0 && onReviewAll()}
          disabled={tema.dueCards === 0}
          className="w-full h-[58px] rounded-xl font-['Manrope'] font-bold text-[15px] tracking-[-0.005em] text-white inline-flex items-center justify-center gap-2.5 transition-all disabled:cursor-not-allowed group relative overflow-hidden"
          style={{
            background: tema.dueCards > 0 ? 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' : '#94a3b8',
            boxShadow: tema.dueCards > 0 ? '0 8px 24px -8px rgba(0,109,91,0.45)' : 'none',
          }}
        >
          {tema.dueCards > 0 && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C9A84C]/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
          )}
          <div className="relative flex items-center gap-2.5">
            {tema.dueCards > 0 ? (
              <>
                <Sparkles className="w-[18px] h-[18px] text-[#C9A84C]" />
                Revisar todas as seções · {tema.dueCards} pendentes
              </>
            ) : (
              'Tudo em dia · volte amanhã'
            )}
          </div>
        </button>

        {/* Lista de seções */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <label className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
              Ou escolha uma seção
            </label>
          </div>
          <div className="rounded-xl border-2 border-slate-200 bg-white overflow-hidden">
            {tema.secoes.map((secao, i) => (
              <motion.div
                key={secao.key}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3), duration: 0.25, ease: 'easeOut' }}
              >
                <div
                  className={`group flex items-center gap-3 px-4 py-3.5 transition-all border-b border-slate-100 last:border-0 ${
                    secao.dueCards > 0 ? 'cursor-pointer hover:bg-[#005344]/[0.03]' : 'opacity-60'
                  }`}
                  onClick={() => secao.dueCards > 0 && onReviewSecao(secao.key)}
                >
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-[#005344]/8">
                    <BookOpen className="h-[16px] w-[16px] text-[#005344]" strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-['Manrope'] text-[13px] font-bold text-[#191C1D] truncate">{secao.key}</p>
                    <p className="text-[11px] text-[#94a3b8]">
                      {secao.totalCards} cards
                      {secao.dueCards > 0 && <span className="ml-1.5 font-bold text-[#005344]">· {secao.dueCards} pendentes</span>}
                      {secao.dueCards === 0 && <span className="ml-1.5 text-[#8a6f26]">· em dia</span>}
                    </p>
                  </div>
                  {secao.dueCards > 0 && (
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#005344] group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
function ReviewSession({ dueCards, currentIndex, flipped, reviewedCount, onFlip, onReview, onDelete }: { dueCards: Flashcard[]; currentIndex: number; flipped: boolean; reviewedCount: number; onFlip: () => void; onReview: (q: 'easy' | 'good' | 'hard' | 'again') => void; onDelete: (id: string) => void }) {
  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? (reviewedCount / dueCards.length) * 100 : 0;
  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{reviewedCount} de {dueCards.length} revisados</span>
          {currentCard?.secao && <span className="px-2 py-0.5 rounded bg-[#e9efee] text-[11px] text-slate-600">{currentCard.secao}</span>}
          {!currentCard?.secao && currentCard?.area && <span className="px-2 py-0.5 rounded bg-[#e9efee] text-[11px] text-slate-600">{currentCard.area}</span>}
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {currentCard && (
        <div className="relative cursor-pointer min-h-[260px] sm:min-h-[300px] group/card" onClick={onFlip}>
          <AnimatePresence mode="wait">
            <motion.div
              key={flipped ? 'back' : 'front'}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="rounded-xl p-8 min-h-[260px] sm:min-h-[300px] flex flex-col justify-center items-center text-center transition-shadow duration-200 hover:shadow-[0_16px_48px_0_rgba(44,52,52,0.10)]"
              style={{ background: flipped ? '#f0faf8' : '#ffffff', border: flipped ? '2px solid rgba(18,107,98,0.3)' : '2px solid #e2eae9', boxShadow: '0 8px 32px 0 rgba(44,52,52,0.06)' }}
            >
              <p className="text-xs font-semibold mb-6" style={{ color: flipped ? '#126b62' : '#abb4b3' }}>
                {flipped ? 'Resposta' : 'Pergunta'}
              </p>
              <p className="text-base sm:text-lg leading-relaxed font-medium text-emerald-900">{flipped ? currentCard.back : currentCard.front}</p>
              {!flipped && <p className="text-xs text-slate-300 mt-8">Clique para revelar a resposta</p>}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          {[
            { q: 'again' as const, icon: <RotateCcw className="h-4 w-4" />, label: 'De novo', color: '#ef4444', bg: '#fef2f2', border: 'rgba(239,68,68,0.3)' },
            { q: 'hard' as const, icon: <X className="h-4 w-4" />, label: 'Difícil', color: '#f59e0b', bg: '#fffbeb', border: 'rgba(245,158,11,0.3)' },
            { q: 'good' as const, icon: <Check className="h-4 w-4" />, label: 'Bom', color: '#126b62', bg: '#f0faf8', border: 'rgba(18,107,98,0.3)' },
            { q: 'easy' as const, icon: <Sparkles className="h-4 w-4" />, label: 'Fácil', color: '#3b82f6', bg: '#eff6ff', border: 'rgba(59,130,246,0.3)' },
          ].map(b => (
            <button key={b.q} onClick={() => onReview(b.q)} className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl transition-colors"
              style={{ color: b.color, background: b.bg, border: `1px solid ${b.border}` }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {b.icon}
              <span className="text-[10px] font-semibold">{b.label}</span>
            </button>
          ))}
        </motion.div>
      )}

      {currentCard && (
        <div className="flex justify-center">
          <button className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-red-400 transition-colors" onClick={() => onDelete(currentCard.id)}>
            <Trash2 className="h-3 w-3" /> Remover card
          </button>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
function EmptyState({ navigate, onCreateNew }: { navigate: (p: string) => void; onCreateNew: () => void }) {
  return (
    <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
      <div className="px-5 sm:px-8 md:px-12 py-12 md:py-16 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-5 bg-[#005344]/10">
          <Layers className="h-7 w-7 text-[#005344]" strokeWidth={1.5} />
        </div>
        <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
          <span className="w-6 h-px bg-[#C9A84C]" />
          Flashcards
        </p>
        <h2 className="font-['Manrope'] font-bold text-[24px] sm:text-[28px] tracking-[-0.025em] leading-[1.1] text-[#191C1D] mb-3">
          Nenhum flashcard{' '}
          <em className="not-italic font-medium text-[#8a6f26]">ainda</em>.
        </h2>
        <p className="text-sm text-[#4a5568] mb-8 leading-relaxed">
          Gere flashcards de qualquer tema clínico, dos seus resumos da Biblioteca ou
          ao errar questões em simulados.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' }}
          >
            <Plus className="h-4 w-4" /> Criar deck por tema
          </button>
          <Button variant="outline" onClick={() => navigate('/library')} className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Ir à Biblioteca
          </Button>
          <Button variant="outline" onClick={() => navigate('/exam?mode=prova')} className="gap-1.5">
            <Brain className="h-4 w-4" /> Simulado
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
