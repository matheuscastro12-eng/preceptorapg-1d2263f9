
-- Table for fixed ENAMED question bank
CREATE TABLE public.enamed_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero integer NOT NULL,
  area text NOT NULL, -- 'clinica_medica', 'cirurgia', 'ginecologia_obstetricia', 'pediatria', 'saude_coletiva'
  enunciado text NOT NULL,
  alternativa_a text NOT NULL,
  alternativa_b text NOT NULL,
  alternativa_c text NOT NULL,
  alternativa_d text NOT NULL,
  gabarito text NOT NULL, -- 'A', 'B', 'C', 'D'
  explicacao text,
  ano integer NOT NULL DEFAULT 2025,
  anulada boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.enamed_questions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read questions
CREATE POLICY "Authenticated users can view enamed questions"
  ON public.enamed_questions
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage questions
CREATE POLICY "Admins can manage enamed questions"
  ON public.enamed_questions
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Table for user ENAMED attempt results
CREATE TABLE public.enamed_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  modo text NOT NULL, -- 'completo', 'area', 'revisao'
  area_filter text, -- null for completo/revisao
  total_questions integer NOT NULL,
  correct_answers integer NOT NULL,
  percentage numeric(5,2) NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}',
  source text NOT NULL DEFAULT 'banco', -- 'banco' or 'ia'
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.enamed_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enamed attempts"
  ON public.enamed_attempts
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enamed attempts"
  ON public.enamed_attempts
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
