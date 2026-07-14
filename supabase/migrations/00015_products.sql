CREATE TYPE product_status AS ENUM ('active', 'inactive', 'archived');
CREATE TYPE product_type AS ENUM ('simple', 'variant', 'service');

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  category_id UUID REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  unit_id UUID REFERENCES public.units(id),
  product_type product_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  track_inventory BOOLEAN NOT NULL DEFAULT true,
  low_stock_threshold INT NOT NULL DEFAULT 10,
  status product_status NOT NULL DEFAULT 'active',
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (product_type <> 'service' OR track_inventory = false)
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_products_organization ON products(organization_id);
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX idx_products_category ON products(organization_id, category_id);

CREATE TABLE product_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL DEFAULT '',
  sku TEXT,
  cost_price NUMERIC(15,4),
  selling_price NUMERIC(15,4),
  sort_order INT NOT NULL DEFAULT 0,
  status product_status NOT NULL DEFAULT 'active',
  archived_at TIMESTAMPTZ,
  archived_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (selling_price IS NULL OR selling_price >= 0),
  CHECK (cost_price IS NULL OR cost_price >= 0)
);

ALTER TABLE product_items ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX uq_product_items_org_sku_ci
  ON product_items (organization_id, lower(trim(sku)))
  WHERE sku IS NOT NULL AND trim(sku) <> '';

CREATE INDEX idx_product_items_organization ON product_items(organization_id);
CREATE INDEX idx_product_items_sku_trgm ON product_items USING gin(sku gin_trgm_ops)
  WHERE sku IS NOT NULL;
CREATE INDEX idx_product_items_product ON product_items(product_id);
