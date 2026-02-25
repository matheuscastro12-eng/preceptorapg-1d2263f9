
CREATE TABLE public.generation_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own logs" ON public.generation_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own logs" ON public.generation_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Index for fast rate limit queries
CREATE INDEX idx_generation_logs_user_time ON public.generation_logs (user_id, created_at DESC);

-- Auto-cleanup: delete logs older than 24h (optional, via cron or manual)
