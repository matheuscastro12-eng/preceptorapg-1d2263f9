import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useAdmin } from '@/hooks/useAdmin';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import PageTransition from '@/components/PageTransition';
import PageSkeleton from '@/components/PageSkeleton';
import ProfileDropdown from '@/components/ProfileDropdown';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Check, X, Layers, Brain, Sparkles, Trash2, ChevronRight, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

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
  const { user, loading: authLoading, signOut } = useAuth();
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

  useEffect(() => {
    if (user) fetchCards();
  }, [user]);

  const fetchCards = async () => {
    try {
      const { data, count } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact' })
        .order('next_review', { ascending: true });

      if (data) {
        const cards = data as Flashcard[];
        setAllCards(cards);
        buildDecks(cards);
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildDecks = (cards: Flashcard[]) => {
    const now = new Date().toISOString();
    const deckMap = new Map<string, { cards: Flashcard[]; dueCount: number; area: string | null }>();

    for (const card of cards) {
      const key = card.source_id || card.area || 'sem_origem';
      if (!deckMap.has(key)) {
        deckMap.set(key, { cards: [], dueCount: 0, area: card.area });
      }
      const deck = deckMap.get(key)!;
      deck.cards.push(card);
      if (card.next_review <= now) deck.dueCount++;
      // Use most specific area label
      if (card.area && !deck.area) deck.area = card.area;
    }

    // Fetch resumo names for labels
    const sourceIds = cards.filter(c => c.source_id).map(c => c.source_id!);
    const uniqueSourceIds = [...new Set(sourceIds)];

    if (uniqueSourceIds.length > 0) {
      supabase
        .from('fechamentos')
        .select('id, tema')
        .in('id', uniqueSourceIds)
        .then(({ data: fechamentos }) => {
          const nameMap = new Map<string, string>();
          fechamentos?.forEach(f => nameMap.set(f.id, f.tema));

          const builtDecks: Deck[] = [];
          deckMap.forEach((val, key) => {
            builtDecks.push({
              key,
              label: nameMap.get(key) || val.area || 'Flashcards gerais',
              area: val.area,
              totalCards: val.cards.length,
              dueCards: val.dueCount,
            });
          });
          builtDecks.sort((a, b) => b.dueCards - a.dueCards);
          setDecks(builtDecks);
        });
    } else {
      const builtDecks: Deck[] = [];
      deckMap.forEach((val, key) => {
        builtDecks.push({
          key,
          label: val.area || 'Flashcards gerais',
          area: val.area,
          totalCards: val.cards.length,
          dueCards: val.dueCount,
        });
      });
      builtDecks.sort((a, b) => b.dueCards - a.dueCards);
      setDecks(builtDecks);
    }
  };

  const startDeck = (deckKey: string | 'all') => {
    const now = new Date().toISOString();
    let filtered: Flashcard[];
    if (deckKey === 'all') {
      filtered = allCards.filter(c => c.next_review <= now);
    } else {
      filtered = allCards.filter(c => {
        const cardKey = c.source_id || c.area || 'sem_origem';
        return cardKey === deckKey && c.next_review <= now;
      });
    }
    setDueCards(filtered);
    setSelectedDeck(deckKey);
    setCurrentIndex(0);
    setFlipped(false);
    setReviewedCount(0);
  };

  const handleReview = async (quality: 'easy' | 'good' | 'hard' | 'again') => {
    const card = dueCards[currentIndex];
    if (!card) return;

    let newEase = card.ease_factor;
    let newInterval = card.interval_days;
    let newReps = card.repetitions;

    switch (quality) {
      case 'again':
        newInterval = 1; newReps = 0; newEase = Math.max(1.3, newEase - 0.2); break;
      case 'hard':
        newInterval = Math.max(1, Math.round(newInterval * 1.2)); newEase = Math.max(1.3, newEase - 0.15); newReps += 1; break;
      case 'good':
        newInterval = newReps === 0 ? 1 : newReps === 1 ? 6 : Math.round(newInterval * newEase); newReps += 1; break;
      case 'easy':
        newInterval = newReps === 0 ? 4 : Math.round(newInterval * newEase * 1.3); newEase += 0.15; newReps += 1; break;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    await supabase.from('flashcards').update({
      interval_days: newInterval,
      ease_factor: newEase,
      repetitions: newReps,
      next_review: nextReview.toISOString(),
    }).eq('id', card.id);

    setReviewedCount(prev => prev + 1);
    setFlipped(false);

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      toast({ title: '🎉 Sessão completa!', description: `Você revisou ${reviewedCount + 1} cards.` });
      setSelectedDeck(null);
      fetchCards();
    }
  };

  const deleteCard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id);
    setDueCards(prev => prev.filter(c => c.id !== id));
    setAllCards(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Card removido' });
    if (currentIndex >= dueCards.length - 1 && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const deleteDeck = async (deckKey: string) => {
    const idsToDelete = allCards
      .filter(c => (c.source_id || c.area || 'sem_origem') === deckKey)
      .map(c => c.id);
    
    if (idsToDelete.length === 0) return;
    
    await supabase.from('flashcards').delete().in('id', idsToDelete);
    setAllCards(prev => prev.filter(c => !idsToDelete.includes(c.id)));
    setDecks(prev => prev.filter(d => d.key !== deckKey));
    toast({ title: 'Deck removido', description: `${idsToDelete.length} cards excluídos.` });
  };

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const totalDue = decks.reduce((sum, d) => sum + d.dueCards, 0);
  const totalAll = allCards.length;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80 safe-area-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => selectedDeck ? setSelectedDeck(null) : navigate('/menu')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />{selectedDeck ? 'Decks' : 'Voltar'}
            </Button>
            <div className="h-6 w-px bg-border/50" />
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <Layers className="h-4 w-4 text-primary" />
              </div>
              <span className="text-lg font-bold text-gradient-medical">Flashcards</span>
            </div>
          </div>
          <ProfileDropdown userEmail={user.email || ''} onLogout={signOut} />
        </div>
      </header>

      <main className="flex-1 container relative py-6 px-4">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : totalAll === 0 ? (
          <EmptyState navigate={navigate} />
        ) : selectedDeck === null ? (
          <DeckList
            decks={decks}
            totalDue={totalDue}
            totalAll={totalAll}
            onStartDeck={startDeck}
            onDeleteDeck={deleteDeck}
          />
        ) : dueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Check className="h-10 w-10 text-primary mb-4" />
            <h2 className="text-xl font-bold mb-2">Nenhum card pendente neste deck</h2>
            <Button variant="outline" onClick={() => setSelectedDeck(null)} className="mt-4">Voltar aos decks</Button>
          </div>
        ) : (
          <ReviewSession
            dueCards={dueCards}
            currentIndex={currentIndex}
            flipped={flipped}
            reviewedCount={reviewedCount}
            onFlip={() => setFlipped(!flipped)}
            onReview={handleReview}
            onDelete={deleteCard}
          />
        )}
      </main>
    </PageTransition>
  );
};

/* ─── Deck List ─── */
function DeckList({ decks, totalDue, totalAll, onStartDeck, onDeleteDeck }: {
  decks: Deck[];
  totalDue: number;
  totalAll: number;
  onStartDeck: (key: string | 'all') => void;
  onDeleteDeck: (key: string) => void;
}) {
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Seus Decks</h2>
          <p className="text-xs text-muted-foreground">{totalAll} cards · {totalDue} para revisar</p>
        </div>
        {totalDue > 0 && (
          <Button size="sm" onClick={() => onStartDeck('all')} className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />Revisar todos ({totalDue})
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {decks.map((deck) => (
          <motion.div
            key={deck.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="group flex items-center gap-3 p-4 hover:border-primary/30 transition-colors cursor-pointer"
              onClick={() => deck.dueCards > 0 ? onStartDeck(deck.key) : undefined}
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{deck.label}</p>
                <p className="text-xs text-muted-foreground">
                  {deck.totalCards} cards · {deck.dueCards > 0
                    ? <span className="text-primary font-medium">{deck.dueCards} pendentes</span>
                    : 'em dia ✓'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); onDeleteDeck(deck.key); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
                {deck.dueCards > 0 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ─── Review Session ─── */
function ReviewSession({ dueCards, currentIndex, flipped, reviewedCount, onFlip, onReview, onDelete }: {
  dueCards: Flashcard[];
  currentIndex: number;
  flipped: boolean;
  reviewedCount: number;
  onFlip: () => void;
  onReview: (q: 'easy' | 'good' | 'hard' | 'again') => void;
  onDelete: (id: string) => void;
}) {
  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? (reviewedCount / dueCards.length) * 100 : 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{reviewedCount}/{dueCards.length} revisados</span>
          {currentCard?.area && <Badge variant="outline" className="text-xs">{currentCard.area}</Badge>}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {currentCard && (
        <div className="relative cursor-pointer min-h-[280px] sm:min-h-[320px]" onClick={onFlip}>
          <AnimatePresence mode="wait">
            <motion.div
              key={flipped ? 'back' : 'front'}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Card className={`p-6 sm:p-8 min-h-[280px] sm:min-h-[320px] flex flex-col justify-center items-center text-center border-2 ${
                flipped ? 'border-primary/30 bg-primary/5' : 'border-border/40'
              }`}>
                <p className={`text-base sm:text-lg leading-relaxed ${flipped ? 'text-foreground' : 'font-medium'}`}>
                  {flipped ? currentCard.back : currentCard.front}
                </p>
                {!flipped && <p className="text-xs text-muted-foreground mt-4">Toque para ver a resposta</p>}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {flipped && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-4 gap-2">
          <Button variant="outline" size="sm" onClick={() => onReview('again')} className="flex-col h-auto py-3 border-destructive/30 hover:bg-destructive/10">
            <RotateCcw className="h-4 w-4 text-destructive mb-1" /><span className="text-[10px]">De novo</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReview('hard')} className="flex-col h-auto py-3 border-amber-500/30 hover:bg-amber-500/10">
            <X className="h-4 w-4 text-amber-500 mb-1" /><span className="text-[10px]">Difícil</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReview('good')} className="flex-col h-auto py-3 border-primary/30 hover:bg-primary/10">
            <Check className="h-4 w-4 text-primary mb-1" /><span className="text-[10px]">Bom</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReview('easy')} className="flex-col h-auto py-3 border-primary/30 hover:bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary mb-1" /><span className="text-[10px]">Fácil</span>
          </Button>
        </motion.div>
      )}

      {currentCard && (
        <div className="flex justify-center">
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => onDelete(currentCard.id)}>
            <Trash2 className="h-3 w-3" />Remover card
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Layers className="h-8 w-8 text-primary/40" />
      </div>
      <h2 className="text-xl font-bold mb-2">Nenhum flashcard ainda</h2>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">
        Gere flashcards a partir dos seus resumos na Biblioteca ou ao errar questões em simulados.
      </p>
      <div className="flex gap-3">
        <Button onClick={() => navigate('/library')} className="gap-2">
          <BookOpen className="h-4 w-4" />Ir à Biblioteca
        </Button>
        <Button variant="outline" onClick={() => navigate('/exam?mode=prova')} className="gap-2">
          <Sparkles className="h-4 w-4" />Fazer Simulado
        </Button>
      </div>
    </div>
  );
}

export default Flashcards;
