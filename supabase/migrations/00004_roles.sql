CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

COMMENT ON TABLE roles IS 'System-wide roles have NULL organization_id. Custom org roles reference their organization.';

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_roles_organization ON roles(organization_id);

CREATE OR REPLACE FUNCTION handle_role_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_role_updated
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION handle_role_update();
