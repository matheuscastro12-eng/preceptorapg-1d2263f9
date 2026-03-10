
CREATE TABLE public.enamed_ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_id text NOT NULL UNIQUE,
  specialty_name text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.enamed_ebooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view enamed ebooks"
  ON public.enamed_ebooks
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage enamed ebooks"
  ON public.enamed_ebooks
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
