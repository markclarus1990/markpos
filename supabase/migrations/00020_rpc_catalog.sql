-- ============================================================
-- TENANT-CONSISTENCY TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_product_org_consistency()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = NEW.category_id AND organization_id = NEW.organization_id) THEN
      RAISE EXCEPTION 'Category does not belong to the same organization';
    END IF;
  END IF;
  IF NEW.brand_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id = NEW.brand_id AND organization_id = NEW.organization_id) THEN
      RAISE EXCEPTION 'Brand does not belong to the same organization';
    END IF;
  END IF;
  IF NEW.unit_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.units
      WHERE id = NEW.unit_id
        AND (is_system = true OR organization_id = NEW.organization_id)
    ) THEN
      RAISE EXCEPTION 'Unit is not available for this organization';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_org_consistency
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_org_consistency();

CREATE OR REPLACE FUNCTION public.enforce_product_item_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id != (SELECT organization_id FROM public.products WHERE id = NEW.product_id) THEN
    RAISE EXCEPTION 'Product item organization must match parent product organization';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_item_org
  BEFORE INSERT OR UPDATE ON public.product_items
  FOR EACH ROW EXECUTE FUNCTION public.enforce_product_item_org();

CREATE OR REPLACE FUNCTION public.enforce_barcode_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id != (SELECT organization_id FROM public.product_items WHERE id = NEW.item_id) THEN
    RAISE EXCEPTION 'Barcode organization must match parent item organization';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_barcode_org
  BEFORE INSERT OR UPDATE ON public.product_barcodes
  FOR EACH ROW EXECUTE FUNCTION public.enforce_barcode_org();

CREATE OR REPLACE FUNCTION public.enforce_image_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.organization_id != (SELECT organization_id FROM public.products WHERE id = NEW.product_id) THEN
    RAISE EXCEPTION 'Image organization must match parent product organization';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_image_org
  BEFORE INSERT OR UPDATE ON public.product_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_image_org();

-- ============================================================
-- RPC: CREATE PRODUCT CATALOG ENTRY
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_product_catalog_entry(
  p_org_id UUID,
  p_product_type TEXT,
  p_name TEXT,
  p_category_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_unit_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_track_inventory BOOLEAN DEFAULT true,
  p_low_stock_threshold INT DEFAULT 10,
  p_items JSONB DEFAULT '[]'::jsonb,
  p_status TEXT DEFAULT 'active'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_product_id UUID;
  v_item RECORD;
  v_item_id UUID;
  v_active_items INT;
  v_constraint_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF NOT public.has_permission(p_org_id, 'products.create', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND organization_id = p_org_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Category not found in this organization');
    END IF;
  END IF;

  IF p_brand_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id = p_brand_id AND organization_id = p_org_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Brand not found in this organization');
    END IF;
  END IF;

  IF p_unit_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.units
      WHERE id = p_unit_id AND (is_system = true OR organization_id = p_org_id)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unit not available for this organization');
    END IF;
  END IF;

  v_active_items := jsonb_array_length(p_items);

  IF p_product_type = 'simple' THEN
    IF v_active_items != 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Simple product must have exactly one item');
    END IF;
  ELSIF p_product_type = 'variant' THEN
    IF v_active_items < 2 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Variant product must have at least two items');
    END IF;
  ELSIF p_product_type = 'service' THEN
    IF v_active_items != 1 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Service product must have exactly one item');
    END IF;
    p_track_inventory := false;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'Invalid product type');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    name TEXT, sku TEXT, cost_price NUMERIC, selling_price NUMERIC,
    sort_order INT, barcode TEXT, barcode_type TEXT
  )
  LOOP
    IF p_product_type = 'variant' AND (v_item.name IS NULL OR trim(v_item.name) = '') THEN
      RETURN jsonb_build_object('success', false, 'error', 'Each variant must have a non-empty name');
    END IF;

    IF v_item.selling_price IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Each item must have a selling price');
    END IF;
    IF v_item.selling_price < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Selling price must be >= 0');
    END IF;

    IF v_item.cost_price IS NOT NULL AND v_item.cost_price < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Cost price must be >= 0');
    END IF;

    IF v_item.barcode IS NOT NULL AND trim(v_item.barcode) <> '' THEN
      IF length(trim(v_item.barcode)) < 1 OR length(trim(v_item.barcode)) > 100 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Barcode must be between 1 and 100 characters');
      END IF;
      IF trim(v_item.barcode) ~ '[\x00-\x1f\x7f]' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Barcode contains control characters');
      END IF;
      IF v_item.barcode_type = 'ean13' AND NOT trim(v_item.barcode) ~ '^\d{13}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'EAN-13 must be exactly 13 digits');
      END IF;
      IF v_item.barcode_type = 'ean8' AND NOT trim(v_item.barcode) ~ '^\d{8}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'EAN-8 must be exactly 8 digits');
      END IF;
      IF v_item.barcode_type = 'upc_a' AND NOT trim(v_item.barcode) ~ '^\d{12}$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'UPC-A must be exactly 12 digits');
      END IF;
      IF v_item.barcode_type = 'code128' AND NOT trim(v_item.barcode) ~ '^[\x20-\x7e]+$' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Code 128 contains invalid characters');
      END IF;
    END IF;
  END LOOP;

  INSERT INTO public.products (
    organization_id, category_id, brand_id, unit_id, product_type,
    name, description, track_inventory, low_stock_threshold, status
  ) VALUES (
    p_org_id, p_category_id, p_brand_id, p_unit_id, p_product_type::public.product_type,
    p_name, p_description, p_track_inventory, p_low_stock_threshold, p_status::public.product_status
  )
  RETURNING id INTO v_product_id;

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    name TEXT, sku TEXT, cost_price NUMERIC, selling_price NUMERIC,
    sort_order INT, barcode TEXT, barcode_type TEXT
  )
  LOOP
    INSERT INTO public.product_items (
      product_id, organization_id, name, sku, cost_price, selling_price, sort_order
    ) VALUES (
      v_product_id, p_org_id,
      COALESCE(v_item.name, ''),
      NULLIF(upper(trim(COALESCE(v_item.sku, ''))), ''),
      v_item.cost_price,
      v_item.selling_price,
      COALESCE(v_item.sort_order, 0)
    )
    RETURNING id INTO v_item_id;

    IF v_item.barcode IS NOT NULL AND trim(v_item.barcode) <> '' THEN
      INSERT INTO public.product_barcodes (organization_id, item_id, barcode, barcode_type, is_primary)
      VALUES (p_org_id, v_item_id, trim(v_item.barcode), COALESCE(v_item.barcode_type, 'ean13'), true);
    END IF;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'product_id', v_product_id);

EXCEPTION
  WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
    RETURN jsonb_build_object(
      'success', false,
      'error', CASE
        WHEN v_constraint_name = 'uq_product_items_org_sku_ci' THEN 'SKU already exists in this organization'
        WHEN v_constraint_name LIKE '%product_barcodes%' THEN 'Barcode already exists in this organization'
        ELSE 'A unique constraint was violated'
      END
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.create_product_catalog_entry FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_product_catalog_entry TO authenticated;

-- ============================================================
-- RPC: UPDATE PRODUCT CATALOG ENTRY
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_product_catalog_entry(
  p_org_id UUID,
  p_product_id UUID,
  p_name TEXT DEFAULT NULL,
  p_category_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_unit_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_track_inventory BOOLEAN DEFAULT NULL,
  p_low_stock_threshold INT DEFAULT NULL,
  p_items JSONB DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_product_record RECORD;
  v_item RECORD;
  v_item_id UUID;
  v_existing_item_ids UUID[];
  v_new_item_ids UUID[];
  v_constraint_name TEXT;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF NOT public.has_permission(p_org_id, 'products.update', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  SELECT * INTO v_product_record FROM public.products WHERE id = p_product_id AND organization_id = p_org_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  IF p_category_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.categories WHERE id = p_category_id AND organization_id = p_org_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Category not found in this organization');
    END IF;
  END IF;

  IF p_brand_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.brands WHERE id = p_brand_id AND organization_id = p_org_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Brand not found in this organization');
    END IF;
  END IF;

  IF p_unit_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.units
      WHERE id = p_unit_id AND (is_system = true OR organization_id = p_org_id)
    ) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Unit not available for this organization');
    END IF;
  END IF;

  UPDATE public.products
  SET
    name = COALESCE(p_name, name),
    category_id = COALESCE(p_category_id, category_id),
    brand_id = COALESCE(p_brand_id, brand_id),
    unit_id = COALESCE(p_unit_id, unit_id),
    description = COALESCE(p_description, description),
    track_inventory = COALESCE(p_track_inventory, track_inventory),
    low_stock_threshold = COALESCE(p_low_stock_threshold, low_stock_threshold),
    status = COALESCE(p_status::public.product_status, status),
    updated_at = now()
  WHERE id = p_product_id;

  IF p_items IS NOT NULL THEN
    SELECT array_agg(id) INTO v_existing_item_ids
    FROM public.product_items WHERE product_id = p_product_id;

    v_new_item_ids := '{}'::UUID[];

    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
      id TEXT, name TEXT, sku TEXT, cost_price NUMERIC, selling_price NUMERIC,
      sort_order INT, barcode TEXT, barcode_type TEXT
    )
    LOOP
      IF v_item.selling_price IS NOT NULL AND v_item.selling_price < 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Selling price must be >= 0');
      END IF;

      IF v_item.barcode IS NOT NULL AND trim(v_item.barcode) <> '' THEN
        IF trim(v_item.barcode) ~ '[\x00-\x1f\x7f]' THEN
          RETURN jsonb_build_object('success', false, 'error', 'Barcode contains control characters');
        END IF;
      END IF;

      IF v_item.id IS NOT NULL AND v_item.id <> '' THEN
        UPDATE public.product_items
        SET
          name = COALESCE(v_item.name, name),
          sku = CASE
            WHEN v_item.sku IS NOT NULL THEN NULLIF(upper(trim(v_item.sku)), '')
            ELSE sku
          END,
          cost_price = COALESCE(v_item.cost_price, cost_price),
          selling_price = COALESCE(v_item.selling_price, selling_price),
          sort_order = COALESCE(v_item.sort_order, sort_order),
          updated_at = now()
        WHERE id = v_item.id::UUID AND product_id = p_product_id
        RETURNING id INTO v_item_id;

        v_new_item_ids := array_append(v_new_item_ids, v_item_id);
      ELSE
        INSERT INTO public.product_items (
          product_id, organization_id, name, sku, cost_price, selling_price, sort_order
        ) VALUES (
          p_product_id, p_org_id,
          COALESCE(v_item.name, ''),
          NULLIF(upper(trim(COALESCE(v_item.sku, ''))), ''),
          v_item.cost_price,
          v_item.selling_price,
          COALESCE(v_item.sort_order, 0)
        )
        RETURNING id INTO v_item_id;

        v_new_item_ids := array_append(v_new_item_ids, v_item_id);
      END IF;

      IF v_item.barcode IS NOT NULL AND trim(v_item.barcode) <> '' THEN
        INSERT INTO public.product_barcodes (organization_id, item_id, barcode, barcode_type, is_primary)
        VALUES (p_org_id, v_item_id, trim(v_item.barcode), COALESCE(v_item.barcode_type, 'ean13'), true)
        ON CONFLICT (organization_id, barcode) DO NOTHING;
      END IF;
    END LOOP;

    -- Archive items that were in the original set but not in the update
    UPDATE public.product_items
    SET status = 'archived', archived_at = now(), archived_by = v_user_id
    WHERE product_id = p_product_id
      AND id = ANY(v_existing_item_ids)
      AND id != ALL(v_new_item_ids)
      AND status = 'active';
  END IF;

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);

EXCEPTION
  WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
    RETURN jsonb_build_object(
      'success', false,
      'error', CASE
        WHEN v_constraint_name = 'uq_product_items_org_sku_ci' THEN 'SKU already exists in this organization'
        WHEN v_constraint_name LIKE '%product_barcodes%' THEN 'Barcode already exists in this organization'
        ELSE 'A unique constraint was violated'
      END
    );
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'An unexpected error occurred');
END;
$$;

REVOKE EXECUTE ON FUNCTION public.update_product_catalog_entry FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_product_catalog_entry TO authenticated;

-- ============================================================
-- RPC: ARCHIVE PRODUCT
-- ============================================================

CREATE OR REPLACE FUNCTION public.archive_product(
  p_org_id UUID,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_product_archived_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF NOT public.has_permission(p_org_id, 'products.archive', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id AND organization_id = p_org_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  v_product_archived_at := now();

  UPDATE public.products
  SET status = 'archived',
      archived_at = v_product_archived_at,
      archived_by = v_user_id
  WHERE id = p_product_id AND organization_id = p_org_id;

  UPDATE public.product_items
  SET status = 'archived',
      archived_at = v_product_archived_at,
      archived_by = v_user_id
  WHERE product_id = p_product_id
    AND status IN ('active', 'inactive');

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.archive_product FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.archive_product TO authenticated;

-- ============================================================
-- RPC: RESTORE PRODUCT
-- ============================================================

CREATE OR REPLACE FUNCTION public.restore_product(
  p_org_id UUID,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_product_archived_at TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF NOT public.has_permission(p_org_id, 'products.archive', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  SELECT archived_at INTO v_product_archived_at
  FROM public.products
  WHERE id = p_product_id AND organization_id = p_org_id;

  IF v_product_archived_at IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product is not archived');
  END IF;

  UPDATE public.products
  SET status = 'active', archived_at = NULL, archived_by = NULL
  WHERE id = p_product_id;

  UPDATE public.product_items
  SET status = 'active', archived_at = NULL, archived_by = NULL
  WHERE product_id = p_product_id
    AND status = 'archived'
    AND archived_at = v_product_archived_at;

  RETURN jsonb_build_object('success', true, 'product_id', p_product_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.restore_product FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.restore_product TO authenticated;

-- ============================================================
-- RPC: ADD PRODUCT IMAGE
-- ============================================================

CREATE OR REPLACE FUNCTION public.add_product_image(
  p_org_id UUID,
  p_product_id UUID,
  p_storage_bucket TEXT,
  p_storage_path TEXT,
  p_alt_text TEXT DEFAULT NULL,
  p_sort_order INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_image_count INT;
  v_image_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  IF NOT (
    public.has_permission(p_org_id, 'products.create', v_user_id)
    OR public.has_permission(p_org_id, 'products.update', v_user_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.products WHERE id = p_product_id AND organization_id = p_org_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Product not found');
  END IF;

  SELECT count(*) INTO v_image_count
  FROM public.product_images
  WHERE product_id = p_product_id;

  IF v_image_count >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximum of 5 images per product');
  END IF;

  INSERT INTO public.product_images (organization_id, product_id, storage_bucket, storage_path, alt_text, sort_order)
  VALUES (p_org_id, p_product_id, p_storage_bucket, p_storage_path, p_alt_text, p_sort_order)
  RETURNING id INTO v_image_id;

  RETURN jsonb_build_object('success', true, 'image_id', v_image_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.add_product_image FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.add_product_image TO authenticated;

-- ============================================================
-- RPC: DELETE PRODUCT IMAGE
-- ============================================================

CREATE OR REPLACE FUNCTION public.delete_product_image(
  p_org_id UUID,
  p_image_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_image_record RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member');
  END IF;

  SELECT * INTO v_image_record
  FROM public.product_images
  WHERE id = p_image_id AND organization_id = p_org_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Image not found');
  END IF;

  IF NOT (
    public.has_product_permission(v_image_record.product_id, 'products.create', v_user_id)
    OR public.has_product_permission(v_image_record.product_id, 'products.update', v_user_id)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  DELETE FROM public.product_images WHERE id = p_image_id;

  RETURN jsonb_build_object('success', true, 'storage_bucket', v_image_record.storage_bucket, 'storage_path', v_image_record.storage_path);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_product_image FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_product_image TO authenticated;
