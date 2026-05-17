-- O modal de 1:1 permite registrar sem necessariamente apontar um lider
-- (times pequenos / 1:1 entre pares). Garante que lider_id aceita NULL.
-- Idempotente: se ja for nullable, no-op.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_one_on_ones'
      AND column_name = 'lider_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.admin_one_on_ones ALTER COLUMN lider_id DROP NOT NULL;
  END IF;
END $$;
