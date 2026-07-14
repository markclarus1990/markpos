CREATE TABLE units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  abbreviation TEXT NOT NULL,
  allows_decimal BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(code),
  CHECK (
    (is_system = true AND organization_id IS NULL)
    OR
    (is_system = false AND organization_id IS NOT NULL)
  )
);

ALTER TABLE units ENABLE ROW LEVEL SECURITY;

INSERT INTO units (code, name, abbreviation, allows_decimal, is_system) VALUES
  ('piece', 'Piece', 'pc', false, true),
  ('kilogram', 'Kilogram', 'kg', true, true),
  ('liter', 'Liter', 'L', true, true),
  ('box', 'Box', 'box', false, true),
  ('pack', 'Pack', 'pack', false, true),
  ('meter', 'Meter', 'm', true, true)
ON CONFLICT (code) DO NOTHING;
