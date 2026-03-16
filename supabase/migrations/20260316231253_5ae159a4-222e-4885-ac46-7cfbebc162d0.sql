
-- Table for flashcards (from wrong answers and summaries)
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'exam', -- 'exam' or 'resumo'
  source_id UUID, -- optional reference to fechamentos or enamed_attempts
  area TEXT,
  next_review TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  interval_days INTEGER NOT NULL DEFAULT 1,
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  repetitions INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flashcards" ON public.flashcards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);

-- Table for top 20 topics progress
CREATE TABLE public.topic_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  topic_key TEXT NOT NULL,
  topic_name TEXT NOT NULL,
  studied BOOLEAN NOT NULL DEFAULT false,
  resumo_count INTEGER NOT NULL DEFAULT 0,
  exam_count INTEGER NOT NULL DEFAULT 0,
  last_studied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_key)
);

ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topic progress" ON public.topic_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own topic progress" ON public.topic_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own topic progress" ON public.topic_progress FOR UPDATE USING (auth.uid() = user_id);
