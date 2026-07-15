-- ============================================================
-- INVENTORY: Add created_at support
-- ============================================================

-- Safely add created_at column (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'inventory' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.inventory ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END;
$$;

-- Backfill existing rows with updated_at as a reasonable creation time
UPDATE public.inventory SET created_at = updated_at WHERE created_at IS DISTINCT FROM updated_at;

-- ============================================================
-- RPC: ADJUST INVENTORY (Manual Stock Adjustment)
-- ============================================================

CREATE OR REPLACE FUNCTION public.adjust_inventory(
  p_org_id UUID,
  p_branch_id UUID,
  p_item_id UUID,
  p_quantity_change NUMERIC(15,4),
  p_reason TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_qty_before NUMERIC(15,4);
  v_qty_after NUMERIC(15,4);
  v_item_org_id UUID;
  v_branch_org_id UUID;
  v_track_inventory BOOLEAN;
  v_allows_decimal BOOLEAN;
  v_err_msg TEXT;
BEGIN
  -- 1. Resolve authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 2. Validate organization membership
  IF NOT public.is_organization_member(p_org_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not a member of this organization');
  END IF;

  -- 3. Validate inventory adjustment permission
  IF NOT public.has_permission(p_org_id, 'inventory.adjust', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- 4. Validate branch belongs to organization
  SELECT organization_id INTO v_branch_org_id
  FROM public.branches
  WHERE id = p_branch_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch not found');
  END IF;

  IF v_branch_org_id != p_org_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch does not belong to this organization');
  END IF;

  -- 5. Validate item and resolve decimal behavior
  SELECT
    pi.organization_id,
    p.track_inventory,
    COALESCE(u.allows_decimal, false) AS allows_decimal
  INTO v_item_org_id, v_track_inventory, v_allows_decimal
  FROM public.product_items pi
  JOIN public.products p ON p.id = pi.product_id
  LEFT JOIN public.units u ON u.id = p.unit_id
  WHERE pi.id = p_item_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item not found');
  END IF;

  IF v_item_org_id != p_org_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item does not belong to this organization');
  END IF;

  IF NOT COALESCE(v_track_inventory, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Item does not track inventory');
  END IF;

  -- 6. Validate quantity change
  IF p_quantity_change IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity change is required');
  END IF;

  IF p_quantity_change = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity change must be non-zero');
  END IF;

  IF p_quantity_change > 999999.9999 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity change exceeds maximum allowed');
  END IF;

  IF p_quantity_change < -999999.9999 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quantity change exceeds minimum allowed');
  END IF;

  -- Enforce decimal precision
  IF NOT v_allows_decimal AND p_quantity_change != floor(p_quantity_change) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Decimal quantities not allowed for this item');
  END IF;

  -- 7. Validate reason
  IF p_reason IS NULL OR length(trim(p_reason)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason is required');
  END IF;

  IF length(p_reason) > 100 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Reason must be 100 characters or less');
  END IF;

  -- 8. Validate notes length if provided
  IF p_notes IS NOT NULL AND length(p_notes) > 500 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Notes must be 500 characters or less');
  END IF;

  -- 9. Lock inventory row and get current quantity
  SELECT quantity_on_hand INTO v_qty_before
  FROM public.inventory
  WHERE organization_id = p_org_id
    AND branch_id = p_branch_id
    AND item_id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- Auto-create inventory record with 0 quantity
    INSERT INTO public.inventory (organization_id, branch_id, item_id, quantity_on_hand)
    VALUES (p_org_id, p_branch_id, p_item_id, 0)
    ON CONFLICT (organization_id, branch_id, item_id) DO NOTHING;

    v_qty_before := 0;
  END IF;

  -- 10. Calculate new quantity and prevent negative stock
  v_qty_after := v_qty_before + p_quantity_change;

  IF v_qty_after < 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient stock',
      'available', v_qty_before,
      'requested', -p_quantity_change
    );
  END IF;

  -- 11. Update inventory atomically
  UPDATE public.inventory
  SET quantity_on_hand = v_qty_after,
      updated_at = now()
  WHERE organization_id = p_org_id
    AND branch_id = p_branch_id
    AND item_id = p_item_id;

  -- 12. Create inventory movement record
  INSERT INTO public.inventory_movements
    (organization_id, branch_id, item_id, movement_type,
     quantity_change, quantity_before, quantity_after,
     reference, notes, created_by)
  VALUES (p_org_id, p_branch_id, p_item_id, 'adjustment',
          p_quantity_change, v_qty_before, v_qty_after,
          p_reason, p_notes, v_user_id);

  -- 13. Return success
  RETURN jsonb_build_object(
    'success', true,
    'item_id', p_item_id,
    'quantity_before', v_qty_before,
    'quantity_after', v_qty_after,
    'quantity_change', p_quantity_change
  );

EXCEPTION
  WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_err_msg = CONSTRAINT_NAME;
    RETURN jsonb_build_object('success', false, 'error', 'Concurrent adjustment conflict: ' || COALESCE(v_err_msg, 'unique violation'));
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.adjust_inventory FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.adjust_inventory TO authenticated;
