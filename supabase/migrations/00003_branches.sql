CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Manila',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, code)
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_branches_organization ON branches(organization_id);
CREATE INDEX idx_branches_active ON branches(organization_id, is_active) WHERE is_active = true;

CREATE OR REPLACE FUNCTION handle_branch_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_branch_updated
  BEFORE UPDATE ON branches
  FOR EACH ROW
  EXECUTE FUNCTION handle_branch_update();
