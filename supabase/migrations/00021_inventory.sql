CREATE TYPE inventory_movement_type AS ENUM ('purchase', 'sale', 'adjustment', 'return', 'transfer_in', 'transfer_out');

CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE RESTRICT,
  quantity_on_hand NUMERIC(15,4) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, branch_id, item_id)
);

ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inventory_org_branch ON inventory(organization_id, branch_id);
CREATE INDEX idx_inventory_item ON inventory(item_id);

CREATE TABLE inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE RESTRICT,
  movement_type inventory_movement_type NOT NULL,
  quantity_change NUMERIC(15,4) NOT NULL,
  quantity_before NUMERIC(15,4) NOT NULL,
  quantity_after NUMERIC(15,4) NOT NULL,
  sale_id UUID,
  reference TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_inv_movements_org_branch ON inventory_movements(organization_id, branch_id);
CREATE INDEX idx_inv_movements_item ON inventory_movements(item_id);
CREATE INDEX idx_inv_movements_sale ON inventory_movements(sale_id) WHERE sale_id IS NOT NULL;
