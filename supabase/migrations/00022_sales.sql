CREATE TYPE sale_status AS ENUM ('completed', 'refunded', 'voided');

CREATE SEQUENCE receipt_number_seq START 1;

CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  receipt_number TEXT NOT NULL,
  subtotal NUMERIC(15,4) NOT NULL,
  total NUMERIC(15,4) NOT NULL,
  status sale_status NOT NULL DEFAULT 'completed',
  payment_method TEXT NOT NULL DEFAULT 'cash',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sales_org ON sales(organization_id);
CREATE INDEX idx_sales_branch ON sales(branch_id);
CREATE INDEX idx_sales_user ON sales(user_id);
CREATE INDEX idx_sales_receipt ON sales(receipt_number);
CREATE INDEX idx_sales_created ON sales(created_at DESC);

CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  sku TEXT,
  quantity NUMERIC(15,4) NOT NULL,
  unit_price NUMERIC(15,4) NOT NULL,
  subtotal NUMERIC(15,4) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_item ON sale_items(item_id);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  amount_tendered NUMERIC(15,4) NOT NULL,
  change_amount NUMERIC(15,4) NOT NULL DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_payments_sale ON payments(sale_id);

ALTER TABLE public.inventory_movements
  ADD CONSTRAINT fk_inventory_movements_sale
  FOREIGN KEY (sale_id) REFERENCES public.sales(id);
