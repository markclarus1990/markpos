CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  storage_bucket TEXT NOT NULL DEFAULT 'product-images',
  storage_path TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(storage_bucket, storage_path)
);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_product_images_product ON product_images(product_id);
CREATE INDEX idx_product_images_org ON product_images(organization_id);
