CREATE TABLE product_barcodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  item_id UUID NOT NULL REFERENCES public.product_items(id) ON DELETE RESTRICT,
  barcode TEXT NOT NULL,
  barcode_type TEXT NOT NULL DEFAULT 'ean13',
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, barcode)
);

ALTER TABLE product_barcodes ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX idx_pb_unique_primary
  ON product_barcodes(item_id) WHERE is_primary = true;

CREATE INDEX idx_barcodes_lookup ON product_barcodes(organization_id, barcode);
CREATE INDEX idx_barcodes_item ON product_barcodes(item_id);
