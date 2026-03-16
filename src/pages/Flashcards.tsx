import { useState, useEffect, useCallback } from 'react';
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
import { ArrowLeft, RotateCcw, Check, X, Layers, Brain, Sparkles, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface Flashcard {
  id: string;
  front: string;
  back: string;
  source_type: string;
  area: string | null;
  next_review: string;
  interval_days: number;
  ease_factor: number;
  repetitions: number;
}

const Flashcards = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { hasAccess, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCards, setDueCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [totalCards, setTotalCards] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);

  useEffect(() => {
    if (user) fetchCards();
  }, [user]);

  const fetchCards = async () => {
    try {
      const { data: allCards, count } = await supabase
        .from('flashcards')
        .select('*', { count: 'exact' })
        .order('next_review', { ascending: true });

      if (allCards) {
        setCards(allCards as Flashcard[]);
        setTotalCards(count || 0);
        const now = new Date().toISOString();
        setDueCards((allCards as Flashcard[]).filter(c => c.next_review <= now));
      }
    } catch (error) {
      console.error('Error fetching flashcards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (quality: 'easy' | 'good' | 'hard' | 'again') => {
    const card = dueCards[currentIndex];
    if (!card) return;

    let newEase = card.ease_factor;
    let newInterval = card.interval_days;
    let newReps = card.repetitions;

    switch (quality) {
      case 'again':
        newInterval = 1;
        newReps = 0;
        newEase = Math.max(1.3, newEase - 0.2);
        break;
      case 'hard':
        newInterval = Math.max(1, Math.round(newInterval * 1.2));
        newEase = Math.max(1.3, newEase - 0.15);
        newReps += 1;
        break;
      case 'good':
        newInterval = newReps === 0 ? 1 : newReps === 1 ? 6 : Math.round(newInterval * newEase);
        newReps += 1;
        break;
      case 'easy':
        newInterval = newReps === 0 ? 4 : Math.round(newInterval * newEase * 1.3);
        newEase += 0.15;
        newReps += 1;
        break;
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
      fetchCards();
      setCurrentIndex(0);
      setReviewedCount(0);
    }
  };

  const deleteCard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id);
    setCards(prev => prev.filter(c => c.id !== id));
    setDueCards(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Card removido' });
  };

  if (authLoading || subLoading || adminLoading) return <PageSkeleton variant="dashboard" />;
  if (!user) return <Navigate to="/auth" replace />;
  if (!hasAccess && !isAdmin) return <Navigate to="/pricing" replace />;

  const currentCard = dueCards[currentIndex];
  const progress = dueCards.length > 0 ? (reviewedCount / dueCards.length) * 100 : 0;

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/20 backdrop-blur-xl bg-background/80 safe-area-top">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate('/menu')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />Voltar
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
        ) : totalCards === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Layers className="h-8 w-8 text-primary/40" />
            </div>
            <h2 className="text-xl font-bold mb-2">Nenhum flashcard ainda</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Flashcards são gerados automaticamente quando você erra questões em simulados ou gera resumos. Continue estudando!
            </p>
            <div className="flex gap-3">
              <Button onClick={() => navigate('/dashboard')} className="gap-2">
                <Brain className="h-4 w-4" />Gerar Resumo
              </Button>
              <Button variant="outline" onClick={() => navigate('/exam?mode=prova')} className="gap-2">
                <Sparkles className="h-4 w-4" />Fazer Simulado
              </Button>
            </div>
          </div>
        ) : dueCards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-2">Tudo em dia! 🎉</h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-2">
              Você tem {totalCards} cards no total. Nenhum para revisar agora.
            </p>
            <p className="text-xs text-muted-foreground">Volte mais tarde para revisar.</p>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-6">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{reviewedCount}/{dueCards.length} revisados</span>
                <Badge variant="outline" className="text-xs">{totalCards} total</Badge>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Card */}
            {currentCard && (
              <div
                className="relative cursor-pointer min-h-[280px] sm:min-h-[320px]"
                onClick={() => setFlipped(!flipped)}
              >
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
                      {currentCard.area && (
                        <Badge variant="outline" className="mb-4 text-xs">{currentCard.area}</Badge>
                      )}
                      <p className={`text-base sm:text-lg leading-relaxed ${flipped ? 'text-foreground' : 'font-medium'}`}>
                        {flipped ? currentCard.back : currentCard.front}
                      </p>
                      {!flipped && (
                        <p className="text-xs text-muted-foreground mt-4">Toque para ver a resposta</p>
                      )}
                    </Card>
                  </motion.div>
                </AnimatePresence>
              </div>
            )}

            {/* Review buttons */}
            {flipped && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-4 gap-2"
              >
                <Button variant="outline" size="sm" onClick={() => handleReview('again')} className="flex-col h-auto py-3 border-destructive/30 hover:bg-destructive/10">
                  <RotateCcw className="h-4 w-4 text-destructive mb-1" />
                  <span className="text-[10px]">De novo</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReview('hard')} className="flex-col h-auto py-3 border-amber-500/30 hover:bg-amber-500/10">
                  <X className="h-4 w-4 text-amber-500 mb-1" />
                  <span className="text-[10px]">Difícil</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReview('good')} className="flex-col h-auto py-3 border-primary/30 hover:bg-primary/10">
                  <Check className="h-4 w-4 text-primary mb-1" />
                  <span className="text-[10px]">Bom</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleReview('easy')} className="flex-col h-auto py-3 border-primary/30 hover:bg-primary/10">
                  <Sparkles className="h-4 w-4 text-primary mb-1" />
                  <span className="text-[10px]">Fácil</span>
                </Button>
              </motion.div>
            )}

            {/* Delete */}
            {currentCard && (
              <div className="flex justify-center">
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1" onClick={() => deleteCard(currentCard.id)}>
                  <Trash2 className="h-3 w-3" />Remover card
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
    </PageTransition>
  );
};

export default Flashcards;
