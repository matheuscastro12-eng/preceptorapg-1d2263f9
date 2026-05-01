import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import PageSkeleton from '@/components/PageSkeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Check, X, Layers, Brain, Sparkles, Trash2, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useRecordReview } from '@/hooks/useGamification';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  source_type: string;
  source_id: string | null;
  area: string | null;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

interface Deck {
  key: string;
  label: string;
  area: string | null;
  totalCards: number;
  dueCards: number;
}

const Flashcards = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();
  const recordReview = useRecordReview();

  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string | null>(null);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => { if (user) fetchCards(); }, [user]);

  const fetchCards = async () => {
    try {
      const { data } = await supabase.from('flashcards').select('*', { count: 'exact' }).order('next_review', { ascending: true });
      if (data) { const cards = data as Flashcard[]; setAllCards(cards); buildDecks(cards); }
    } catch (error) { console.error('Error fetching flashcards:', error); }
    finally { setLoading(false); }
  };

  const buildDecks = (cards: Flashcard[]) => {
    const now = new Date().toISOString();
    const deckMap = new Map<string, { cards: Flashcard[]; dueCount: number; area: string | null }>();
    for (const card of cards) {
      const key = card.source_id || card.area || 'sem_origem';
      if (!deckMap.has(key)) deckMap.set(key, { cards: [], dueCount: 0, area: card.area });
      const deck = deckMap.get(key)!;
      deck.cards.push(card);
      if (card.next_review <= now) deck.dueCount++;
      if (card.area && !deck.area) deck.area = card.area;
    }
    const sourceIds = [...new Set(cards.filter(c => c.source_id).map(c => c.source_id!))];
    if (sourceIds.length > 0) {
      supabase.from('fechamentos').select('id, tema').in('id', sourceIds).then(({ data: fechamentos }) => {
        const nameMap = new Map<string, string>();
        fechamentos?.forEach(f => nameMap.set(f.id, f.tema));
        const builtDecks: Deck[] = [];
        deckMap.forEach((val, key) => builtDecks.push({ key, label: nameMap.get(key) || val.area || 'Flashcards gerais', area: val.area, totalCards: val.cards.length, dueCards: val.dueCount }));
        setDecks(builtDecks.sort((a, b) => b.dueCards - a.dueCards));
      });
    } else {
      const builtDecks: Deck[] = [];
      deckMap.forEach((val, key) => builtDecks.push({ key, label: val.area || 'Flashcards gerais', area: val.area, totalCards: val.cards.length, dueCards: val.dueCount }));
      setDecks(builtDecks.sort((a, b) => b.dueCards - a.dueCards));
    }
  };

  const startDeck = (deckKey: string | 'all') => {
    const now = new Date().toISOString();
    const filtered = deckKey === 'all'
      ? allCards.filter(c => c.next_review <= now)
      : allCards.filter(c => (c.source_id || c.area || 'sem_origem') === deckKey && c.next_review <= now);
    setDueCards(filtered); setSelectedDeck(deckKey); setCurrentIndex(0); setFlipped(false); setReviewedCount(0);
  };

  const handleReview = async (quality: 'easy' | 'good' | 'hard' | 'again') => {
    const card = dueCards[currentIndex];
    if (!card) return;

    const easeBefore = card.ease_factor;
    const intervalBefore = card.interval_days;

    // Proper SM-2 algorithm
    const { sm2 } = await import('@/hooks/useGamification');
    const { ease: newEase, interval: newInterval, reps: newReps } = sm2(quality, card.ease_factor, card.interval_days, card.repetitions);

    const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + newInterval);
    await supabase.from('flashcards').update({ interval_days: newInterval, ease_factor: newEase, repetitions: newReps, next_review: nextReview.toISOString() }).eq('id', card.id);

    // Record review + award XP (fire and forget)
    recordReview.mutate({
      cardId: card.id, quality, easeBefore, easeAfter: newEase, intervalBefore, intervalAfter: newInterval,
    });

    setReviewedCount(prev => prev + 1);
    setFlipped(false);
    if (currentIndex < dueCards.length - 1) setCurrentIndex(prev => prev + 1);
    else { toast({ title: 'Sessao completa!', description: `Voce revisou ${reviewedCount + 1} cards. +XP!` }); setSelectedDeck(null); fetchCards(); }
  };

  const deleteCard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id);
    setDueCards(prev => prev.filter(c => c.id !== id));
    setAllCards(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Card removido' });
    if (currentIndex >= dueCards.length - 1 && currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const deleteDeck = async (deckKey: string) => {
    const ids = allCards.filter(c => (c.source_id || c.area || 'sem_origem') === deckKey).map(c => c.id);
    if (!ids.length) return;
    await supabase.from('flashcards').delete().in('id', ids);
    setAllCards(prev => prev.filter(c => !ids.includes(c.id)));
    setDecks(prev => prev.filter(d => d.key !== deckKey));
    toast({ title: 'Deck removido', description: `${ids.length} cards excluídos.` });
  };

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  // Free users can access flashcards (with daily limit enforced in generation)

  const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);
  const totalAll = allCards.length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin border-2 border-[#005344] border-t-transparent rounded-full" />
          </div>
        ) : totalAll === 0 ? (
          <EmptyState navigate={navigate} />
        ) : selectedDeck === null ? (
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-9">
              <header>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[#005344] inline-flex items-center gap-2.5 mb-3">
                  <span className="w-6 h-px bg-[#C9A84C]" />
                  Repetição espaçada
                </p>
                <h1 className="font-['Manrope'] font-bold text-[28px] sm:text-[34px] tracking-[-0.025em] leading-[1.05] text-[#191C1D]">
                  Memorize sem<br />
                  esforço com{' '}
                  <em className="not-italic font-medium text-[#8a6f26]">
                    flashcards
                  </em>
                  .
                </h1>
                <p className="text-sm text-[#4a5568] mt-3 max-w-[52ch] leading-relaxed">
                  Algoritmo SM-2 calibra o intervalo de cada card pelo seu desempenho.
                  Revise pouco, lembre por meses.
                </p>
              </header>

              <DeckList decks={decks} totalDue={totalDue} totalAll={totalAll} onStartDeck={startDeck} onDeleteDeck={deleteDeck} />
            </div>
          </div>
        ) : (
          <div className="relative bg-white rounded-3xl border border-slate-200 shadow-[0_1px_2px_rgba(25,28,29,0.04)] overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-[#003D32] via-[#005344] via-[#006D5B] to-[#C9A84C]" />
            <div className="px-5 sm:px-8 md:px-12 py-7 sm:py-9 md:py-12 space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedDeck(null)} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#94a3b8] hover:text-[#005344] transition-colors active:scale-95">
                  <ArrowLeft className="h-3.5 w-3.5" /> Decks
                </button>
                <span className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#4a5568]">
                  Revisão
                </span>
              </div>

              {dueCards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4 bg-[#005344]/10">
                    <Check className="h-6 w-6 text-[#005344]" />
                  </div>
                  <h2 className="font-['Manrope'] font-bold text-[18px] text-[#191C1D] mb-1">Nenhum card pendente</h2>
                  <p className="text-sm text-[#4a5568] mb-6">Tudo em dia neste deck. Volte amanhã!</p>
                  <Button variant="outline" onClick={() => setSelectedDeck(null)}>Voltar aos decks</Button>
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

function DeckList({ decks, totalDue, totalAll, onStartDeck, onDeleteDeck }: { decks: Deck[]; totalDue: number; totalAll: number; onStartDeck: (k: string | 'all') => void; onDeleteDeck: (k: string) => void }) {
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
          onClick={() => totalDue > 0 && onStartDeck('all')}
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
            ② Decks
            <span className="text-[9.5px] font-medium normal-case tracking-normal text-[#94a3b8]">
              por origem
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
                className={`group flex items-center gap-3 px-4 py-3.5 transition-all border-b border-slate-100 last:border-0 ${
                  deck.dueCards > 0 ? 'cursor-pointer hover:bg-[#005344]/[0.03]' : 'opacity-60'
                }`}
                onClick={() => deck.dueCards > 0 ? onStartDeck(deck.key) : undefined}
              >
                <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 bg-[#005344]/8">
                  <BookOpen className="h-[16px] w-[16px] text-[#005344]" strokeWidth={1.75} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-['Manrope'] text-[13px] font-bold text-[#191C1D] truncate">{deck.label}</p>
                  <p className="text-[11px] text-[#94a3b8]">
                    {deck.totalCards} cards
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
                  {deck.dueCards > 0 && (
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#005344] group-hover:translate-x-0.5 transition-all" />
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </>
  );
}

function ReviewSession({ dueCards, currentIndex, flipped, reviewedCount, onFlip, onReview, onDelete }: { dueCards: Flashcard[]; currentIndex: number; flipped: boolean; reviewedCount: number; onFlip: () => void; onReview: (q: 'easy' | 'good' | 'hard' | 'again') => void; onDelete: (id: string) => void }) {
  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? (reviewedCount / dueCards.length) * 100 : 0;
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{reviewedCount} de {dueCards.length} revisados</span>
          {currentCard?.area && <span className="px-2 py-0.5 rounded bg-[#e9efee] text-[11px] text-slate-600">{currentCard.area}</span>}
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

function EmptyState({ navigate }: { navigate: (p: string) => void }) {
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
          Gere flashcards a partir dos seus resumos na Biblioteca ou ao errar
          questões em simulados.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            style={{ background: 'linear-gradient(135deg, #003D32 0%, #005344 50%, #006D5B 100%)' }}
          >
            <BookOpen className="h-4 w-4" /> Ir à Biblioteca
          </button>
          <Button variant="outline" onClick={() => navigate('/exam?mode=prova')} className="gap-1.5">
            <Brain className="h-4 w-4" /> Simulado
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Flashcards;
