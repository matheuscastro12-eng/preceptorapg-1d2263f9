-- Add new columns to fechamentos table to support saving exams
ALTER TABLE public.fechamentos 
ADD COLUMN tipo text NOT NULL DEFAULT 'fechamento',
ADD COLUMN exam_config jsonb;

-- Update existing records to have proper type
UPDATE public.fechamentos SET tipo = 'fechamento' WHERE tipo IS NULL;

-- Add check constraint for valid types
ALTER TABLE public.fechamentos 
ADD CONSTRAINT fechamentos_tipo_check 
CHECK (tipo IN ('fechamento', 'prova', 'caso_clinico'));

-- Create index for better performance when filtering by type
CREATE INDEX idx_fechamentos_tipo ON public.fechamentos(tipo);
CREATE INDEX idx_fechamentos_user_tipo ON public.fechamentos(user_id, tipo);