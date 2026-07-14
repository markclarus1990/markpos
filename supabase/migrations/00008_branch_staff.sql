CREATE TABLE branch_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(branch_id, user_id)
);

ALTER TABLE branch_staff ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_branch_staff_branch ON branch_staff(branch_id);
CREATE INDEX idx_branch_staff_user ON branch_staff(user_id);
CREATE INDEX idx_branch_staff_active ON branch_staff(branch_id, user_id, is_active) WHERE is_active = true;
