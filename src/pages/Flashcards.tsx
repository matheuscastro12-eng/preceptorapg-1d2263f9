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
    let newEase = card.ease_factor, newInterval = card.interval_days, newReps = card.repetitions;
    switch (quality) {
      case 'again': newInterval = 1; newReps = 0; newEase = Math.max(1.3, newEase - 0.2); break;
      case 'hard': newInterval = Math.max(1, Math.round(newInterval * 1.2)); newEase = Math.max(1.3, newEase - 0.15); newReps += 1; break;
      case 'good': newInterval = newReps === 0 ? 1 : newReps === 1 ? 6 : Math.round(newInterval * newEase); newReps += 1; break;
      case 'easy': newInterval = newReps === 0 ? 4 : Math.round(newInterval * newEase * 1.3); newEase += 0.15; newReps += 1; break;
    }
    const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + newInterval);
    await supabase.from('flashcards').update({ interval_days: newInterval, ease_factor: newEase, repetitions: newReps, next_review: nextReview.toISOString() }).eq('id', card.id);
    setReviewedCount(prev => prev + 1);
    setFlipped(false);
    if (currentIndex < dueCards.length - 1) setCurrentIndex(prev => prev + 1);
    else { toast({ title: 'Sessão completa!', description: `Você revisou ${reviewedCount + 1} cards.` }); setSelectedDeck(null); fetchCards(); }
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
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);
  const totalAll = allCards.length;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Page header */}
        <div className="mb-8 flex items-center gap-3">
          {selectedDeck && (
            <button onClick={() => setSelectedDeck(null)} className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-emerald-700 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Decks
            </button>
          )}
          <h1 className="text-2xl font-extrabold tracking-tight text-emerald-900" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {selectedDeck ? 'Revisando' : 'Flashcards'}
          </h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-6 w-6 animate-spin border-2 border-[#126b62] border-t-transparent rounded-full" />
          </div>
        ) : totalAll === 0 ? (
          <EmptyState navigate={navigate} />
        ) : selectedDeck === null ? (
          <DeckList decks={decks} totalDue={totalDue} totalAll={totalAll} onStartDeck={startDeck} onDeleteDeck={deleteDeck} />
        ) : dueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-12 w-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(18,107,98,0.1)' }}>
              <Check className="h-6 w-6" style={{ color: '#126b62' }} />
            </div>
            <h2 className="text-lg font-semibold text-emerald-900 mb-1" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Nenhum card pendente</h2>
            <p className="text-sm text-slate-500 mb-6">Tudo em dia neste deck. Volte amanhã!</p>
            <Button variant="outline" onClick={() => setSelectedDeck(null)}>Voltar aos decks</Button>
          </div>
        ) : (
          <ReviewSession dueCards={dueCards} currentIndex={currentIndex} flipped={flipped} reviewedCount={reviewedCount} onFlip={() => setFlipped(!flipped)} onReview={handleReview} onDelete={deleteCard} />
        )}
      </div>
    </DashboardLayout>
  );
};

function DeckList({ decks, totalDue, totalAll, onStartDeck, onDeleteDeck }: { decks: Deck[]; totalDue: number; totalAll: number; onStartDeck: (k: string | 'all') => void; onDeleteDeck: (k: string) => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{totalAll} cards · {totalDue} para revisar hoje</p>
        </div>
        {totalDue > 0 && (
          <button onClick={() => onStartDeck('all')} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-[#e2fff9] transition-all active:scale-95" style={{ background: 'linear-gradient(135deg, #126b62, #005e56)' }}>
            <Sparkles className="h-3.5 w-3.5" /> Revisar todos ({totalDue})
          </button>
        )}
      </div>

      <div className="rounded-xl overflow-hidden border border-slate-100 shadow-[0_8px_32px_0_rgba(44,52,52,0.06)]" style={{ background: '#ffffff' }}>
        {decks.map((deck, i) => (
          <motion.div
            key={deck.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.35), duration: 0.3, ease: 'easeOut' }}
          >
            <div
              className={`group flex items-center gap-3 px-5 py-4 transition-all duration-200 border-b border-slate-50 last:border-0 ${
                deck.dueCards > 0 ? 'cursor-pointer hover:bg-emerald-50/50' : 'opacity-70'
              }`}
              onClick={() => deck.dueCards > 0 ? onStartDeck(deck.key) : undefined}
            >
              <div className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110" style={{ background: 'rgba(18,107,98,0.08)' }}>
                <BookOpen className="h-4 w-4 transition-colors duration-200 group-hover:text-emerald-600" style={{ color: '#126b62' }} strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 truncate transition-colors duration-200 group-hover:text-emerald-800" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{deck.label}</p>
                <p className="text-[11px] text-slate-400">
                  {deck.totalCards} cards
                  {deck.dueCards > 0 && <span className="ml-1.5 font-semibold" style={{ color: '#126b62' }}>· {deck.dueCards} pendentes</span>}
                  {deck.dueCards === 0 && <span className="ml-1.5 text-green-400">· ✓ em dia</span>}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  className="h-7 w-7 flex items-center justify-center rounded-lg text-slate-200 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95"
                  onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.key); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                {deck.dueCards > 0 && (
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-200" />
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
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
              <p className="text-[11px] uppercase tracking-widest font-semibold mb-6" style={{ color: flipped ? '#126b62' : '#abb4b3' }}>
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
    <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
      <div className="h-14 w-14 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(18,107,98,0.1)' }}>
        <Layers className="h-7 w-7" style={{ color: '#126b62' }} strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-bold text-emerald-900 mb-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Nenhum flashcard ainda</h2>
      <p className="text-sm text-slate-500 mb-8 leading-relaxed">Gere flashcards a partir dos seus resumos na Biblioteca ou ao errar questões em simulados.</p>
      <div className="flex gap-3">
        <button onClick={() => navigate('/library')} className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#e2fff9]" style={{ background: 'linear-gradient(135deg, #126b62, #005e56)' }}>
          <BookOpen className="h-4 w-4" /> Ir à Biblioteca
        </button>
        <Button variant="outline" onClick={() => navigate('/exam?mode=prova')} className="gap-1.5">
          <Brain className="h-4 w-4" /> Simulado
        </Button>
      </div>
    </div>
  );
}

export default Flashcards;
