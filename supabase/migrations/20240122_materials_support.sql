-- Migration: Materials Support
-- Adds: item_type to inv_line_items, creates inv_materials catalog table

-- 1. Add item_type column to inv_line_items
ALTER TABLE public.inv_line_items
  ADD COLUMN IF NOT EXISTS item_type TEXT NOT NULL DEFAULT 'labour'
  CHECK (item_type IN ('labour', 'material'));

-- 2. Create inv_materials catalog table
CREATE TABLE IF NOT EXISTS public.inv_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.inv_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  default_unit TEXT NOT NULL DEFAULT 'ea'
    CHECK (default_unit IN ('ea', 'm', 'm2', 'm3', 'kg', 'l')),
  default_unit_price DECIMAL(10,2),
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS policies for inv_materials
ALTER TABLE public.inv_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own materials"
  ON public.inv_materials FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own materials"
  ON public.inv_materials FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own materials"
  ON public.inv_materials FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own materials"
  ON public.inv_materials FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_inv_materials_user_id ON public.inv_materials(user_id);
CREATE INDEX IF NOT EXISTS idx_inv_materials_name ON public.inv_materials(user_id, name);

-- 5. Comments
COMMENT ON COLUMN public.inv_line_items.item_type IS 'Classification: labour or material';
COMMENT ON TABLE public.inv_materials IS 'User catalog of saved materials with default pricing';
