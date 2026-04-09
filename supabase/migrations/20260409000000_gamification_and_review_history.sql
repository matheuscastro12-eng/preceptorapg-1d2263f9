-- ═══════════════════════════════════════════════
-- GAMIFICATION SYSTEM + REVIEW HISTORY
-- ═══════════════════════════════════════════════

-- 1. User progression (XP, level, streaks)
CREATE TABLE IF NOT EXISTS public.user_progression (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_xp    INTEGER NOT NULL DEFAULT 0,
  level       INTEGER NOT NULL DEFAULT 1,
  streak_days INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  cards_reviewed_total INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_progression ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progression" ON public.user_progression FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progression" ON public.user_progression FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progression" ON public.user_progression FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 2. XP ledger (audit trail of XP changes)
CREATE TABLE IF NOT EXISTS public.xp_ledger (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      TEXT NOT NULL, -- 'review_easy', 'review_good', 'review_hard', 'review_again', 'streak_7', 'streak_30', 'badge_unlocked', 'daily_bonus'
  amount      INTEGER NOT NULL,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.xp_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own xp" ON public.xp_ledger FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own xp" ON public.xp_ledger FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_xp_ledger_user ON public.xp_ledger(user_id, created_at DESC);

-- 3. Achievement definitions (seeded below)
CREATE TABLE IF NOT EXISTS public.achievement_definitions (
  id          TEXT PRIMARY KEY, -- slug: 'first_review', 'week_warrior', etc.
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  icon        TEXT NOT NULL, -- lucide icon name
  xp_reward   INTEGER NOT NULL DEFAULT 0,
  criteria    JSONB NOT NULL, -- machine-readable criteria
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.achievement_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view achievements" ON public.achievement_definitions FOR SELECT TO authenticated USING (true);

-- 4. User achievements (unlocked badges)
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL REFERENCES public.achievement_definitions(id),
  unlocked_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Flashcard review history (for analytics + proper SM-2)
CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id         UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quality         TEXT NOT NULL, -- 'again', 'hard', 'good', 'easy'
  ease_before     NUMERIC NOT NULL,
  ease_after      NUMERIC NOT NULL,
  interval_before INTEGER NOT NULL,
  interval_after  INTEGER NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own reviews" ON public.flashcard_reviews FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_flashcard_reviews_user ON public.flashcard_reviews(user_id, created_at DESC);
CREATE INDEX idx_flashcard_reviews_card ON public.flashcard_reviews(card_id);

-- ═══════════════════════════════════════════════
-- SEED ACHIEVEMENT DEFINITIONS
-- ═══════════════════════════════════════════════

INSERT INTO public.achievement_definitions (id, name, description, icon, xp_reward, criteria) VALUES
  ('first_review',    'Primeira Revisao',   'Complete sua primeira revisao de flashcard',          'zap',          25,  '{"type":"reviews","count":1}'),
  ('ten_reviews',     'Estudante Dedicado', 'Revise 10 flashcards',                               'book-open',    50,  '{"type":"reviews","count":10}'),
  ('fifty_reviews',   'Mente Afiada',       'Revise 50 flashcards',                               'brain',       100,  '{"type":"reviews","count":50}'),
  ('hundred_reviews', 'Mestre da Revisao',  'Revise 100 flashcards',                              'award',       200,  '{"type":"reviews","count":100}'),
  ('five_hundred',    'Lenda Academica',    'Revise 500 flashcards',                              'crown',       500,  '{"type":"reviews","count":500}'),
  ('streak_3',        'Foco Inicial',       'Mantenha um streak de 3 dias consecutivos',          'flame',        30,  '{"type":"streak","days":3}'),
  ('streak_7',        'Semana Guerreira',   'Mantenha um streak de 7 dias consecutivos',          'target',       75,  '{"type":"streak","days":7}'),
  ('streak_14',       'Duas Semanas',       'Mantenha um streak de 14 dias consecutivos',         'shield',      150,  '{"type":"streak","days":14}'),
  ('streak_30',       'Mes de Ferro',       'Mantenha um streak de 30 dias consecutivos',         'trophy',      300,  '{"type":"streak","days":30}'),
  ('accuracy_80',     'Precisao Cirurgica', 'Tenha 80%+ de acerto em 20+ flashcards revisados',   'crosshair',   100,  '{"type":"accuracy","min_pct":80,"min_reviews":20}'),
  ('first_deck',      'Primeiro Deck',      'Crie seu primeiro deck de flashcards',               'layers',       20,  '{"type":"decks","count":1}'),
  ('five_decks',      'Colecionador',       'Tenha 5 decks de flashcards',                        'library',      75,  '{"type":"decks","count":5}')
ON CONFLICT (id) DO NOTHING;
