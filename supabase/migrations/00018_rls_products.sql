-- Helper: check if user has a permission related to a specific product
CREATE OR REPLACE FUNCTION public.has_product_permission(
  p_product_id UUID,
  p_permission_code TEXT,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.has_permission(
    (SELECT organization_id FROM public.products WHERE id = p_product_id),
    p_permission_code,
    p_user_id
  );
$$;

-- ========== CATEGORIES ==========
CREATE POLICY "Members can view categories"
  ON public.categories FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized members can create categories"
  ON public.categories FOR INSERT
  WITH CHECK (
    public.is_organization_member(organization_id)
    AND public.has_permission(organization_id, 'categories.manage')
  );

CREATE POLICY "Authorized members can update categories"
  ON public.categories FOR UPDATE
  USING (public.has_permission(organization_id, 'categories.manage'))
  WITH CHECK (public.has_permission(organization_id, 'categories.manage'));

CREATE POLICY "Authorized members can archive categories"
  ON public.categories FOR DELETE
  USING (public.has_permission(organization_id, 'categories.manage'));

-- ========== BRANDS ==========
CREATE POLICY "Members can view brands"
  ON public.brands FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized members can create brands"
  ON public.brands FOR INSERT
  WITH CHECK (
    public.is_organization_member(organization_id)
    AND public.has_permission(organization_id, 'brands.manage')
  );

CREATE POLICY "Authorized members can update brands"
  ON public.brands FOR UPDATE
  USING (public.has_permission(organization_id, 'brands.manage'))
  WITH CHECK (public.has_permission(organization_id, 'brands.manage'));

CREATE POLICY "Authorized members can archive brands"
  ON public.brands FOR DELETE
  USING (public.has_permission(organization_id, 'brands.manage'));

-- ========== UNITS ==========
CREATE POLICY "Members can view units"
  ON public.units FOR SELECT
  USING (
    is_system = true
    OR (organization_id IS NOT NULL AND public.is_organization_member(organization_id))
  );

CREATE POLICY "Authorized members can create custom units"
  ON public.units FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND NOT is_system
    AND public.is_organization_member(organization_id)
    AND public.has_permission(organization_id, 'units.manage')
  );

CREATE POLICY "Authorized members can update custom units"
  ON public.units FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND NOT is_system
    AND public.has_permission(organization_id, 'units.manage')
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND NOT is_system
    AND public.is_organization_member(organization_id)
    AND public.has_permission(organization_id, 'units.manage')
  );

CREATE POLICY "Authorized members can delete custom units"
  ON public.units FOR DELETE
  USING (
    organization_id IS NOT NULL
    AND NOT is_system
    AND public.has_permission(organization_id, 'units.manage')
  );

-- ========== PRODUCTS ==========
CREATE POLICY "Members can view products"
  ON public.products FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct product inserts"
  ON public.products FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct product updates"
  ON public.products FOR UPDATE
  USING (false);

CREATE POLICY "Block direct product deletion"
  ON public.products FOR DELETE
  USING (false);

-- ========== PRODUCT ITEMS ==========
CREATE POLICY "Members can view product items"
  ON public.product_items FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct item inserts"
  ON public.product_items FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct item updates"
  ON public.product_items FOR UPDATE
  USING (false);

CREATE POLICY "Block direct item deletion"
  ON public.product_items FOR DELETE
  USING (false);

-- ========== PRODUCT BARCODES ==========
CREATE POLICY "Members can view barcodes"
  ON public.product_barcodes FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct barcode inserts"
  ON public.product_barcodes FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct barcode updates"
  ON public.product_barcodes FOR UPDATE
  USING (false);

CREATE POLICY "Block direct barcode deletion"
  ON public.product_barcodes FOR DELETE
  USING (false);

-- ========== PRODUCT IMAGES ==========
CREATE POLICY "Members can view images"
  ON public.product_images FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Authorized members can insert images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    public.is_organization_member(organization_id)
    AND (
      public.has_product_permission(product_id, 'products.create')
      OR public.has_product_permission(product_id, 'products.update')
    )
  );

CREATE POLICY "Authorized members can update images"
  ON public.product_images FOR UPDATE
  USING (
    public.has_product_permission(product_id, 'products.create')
    OR public.has_product_permission(product_id, 'products.update')
  )
  WITH CHECK (
    public.is_organization_member(organization_id)
    AND (
      public.has_product_permission(product_id, 'products.create')
      OR public.has_product_permission(product_id, 'products.update')
    )
  );

CREATE POLICY "Authorized members can delete images"
  ON public.product_images FOR DELETE
  USING (
    public.is_organization_member(organization_id)
    AND (
      public.has_product_permission(product_id, 'products.create')
      OR public.has_product_permission(product_id, 'products.update')
    )
  );
