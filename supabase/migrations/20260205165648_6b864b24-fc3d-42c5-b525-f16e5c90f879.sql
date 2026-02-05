-- Create table for storing generated closures
CREATE TABLE public.fechamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tema TEXT NOT NULL,
  objetivos TEXT,
  resultado TEXT NOT NULL,
  favorito BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fechamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own fechamentos" 
ON public.fechamentos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own fechamentos" 
ON public.fechamentos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own fechamentos" 
ON public.fechamentos 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own fechamentos" 
ON public.fechamentos 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_fechamentos_updated_at
BEFORE UPDATE ON public.fechamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();