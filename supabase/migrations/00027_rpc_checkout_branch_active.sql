-- ============================================================
-- HARDEN complete_sale WITH ACTIVE-BRANCH VALIDATION
-- ============================================================
-- Adds authoritative branch-exists, branch-org-match,
-- and is_active = true check before checkout proceeds.
-- ============================================================

CREATE OR REPLACE FUNCTION public.complete_sale(
  p_branch_id UUID,
  p_items JSONB,
  p_amount_tendered NUMERIC(15,4),
  p_zero_price_confirmed BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_item JSONB;
  v_item_record RECORD;
  v_product_record RECORD;
  v_unit_record RECORD;
  v_sale_id UUID;
  v_receipt_num TEXT;
  v_subtotal NUMERIC(15,4) := 0;
  v_line_total NUMERIC(15,4);
  v_quantity NUMERIC(15,4);
  v_unit_price NUMERIC(15,4);
  v_has_zero_price BOOLEAN := false;
  v_change NUMERIC(15,4);
  v_qty_before NUMERIC(15,4);
  v_item_idx INT := 0;
  v_total_items INT;
  v_item_data JSONB;
  v_item_ids UUID[];
  v_quantities NUMERIC[];
  v_prices NUMERIC[];
  v_names TEXT[];
  v_skus TEXT[];
  v_track_flags BOOLEAN[];
  v_err_msg TEXT;
BEGIN
  -- 1. Resolve authenticated user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- 2. Resolve organization
  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = v_user_id AND is_active = true
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'No active organization membership');
  END IF;

  -- 3. Validate branch exists, belongs to organization, and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.branches
    WHERE id = p_branch_id
      AND organization_id = v_org_id
      AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch is inactive or unavailable');
  END IF;

  -- 4. Validate branch staff access
  IF NOT EXISTS (
    SELECT 1 FROM public.branch_staff
    WHERE branch_id = p_branch_id AND user_id = v_user_id AND is_active = true
  ) AND NOT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = v_org_id AND user_id = v_user_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'No access to this branch');
  END IF;

  -- 5. Validate POS permission
  IF NOT public.has_permission(v_org_id, 'pos.access', v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient POS permissions');
  END IF;

  -- 6. Validate items
  IF p_items IS NULL OR jsonb_typeof(p_items) != 'array' OR jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cart is empty');
  END IF;

  v_total_items := jsonb_array_length(p_items);
  v_item_ids := '{}'::UUID[];
  v_quantities := '{}'::NUMERIC[];
  v_prices := '{}'::NUMERIC[];
  v_names := '{}'::TEXT[];
  v_skus := '{}'::TEXT[];
  v_track_flags := '{}'::BOOLEAN[];

  -- First pass: validate all items and collect data
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(item_id UUID, quantity NUMERIC)
  LOOP
    v_item_idx := v_item_idx + 1;

    -- Validate item_id
    IF v_item.item_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': missing item ID');
    END IF;

    -- Validate quantity
    IF v_item.quantity IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': missing quantity');
    END IF;

    IF v_item.quantity <= 0 OR v_item.quantity > 99999 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': quantity must be between 1 and 99,999');
    END IF;

    -- Re-fetch item with product and unit info
    SELECT
      pi.id, pi.name, pi.sku, pi.selling_price, pi.status AS item_status,
      pi.product_id, pi.organization_id AS item_org_id,
      p.name AS product_name, p.status AS product_status, p.product_type,
      p.track_inventory, p.unit_id,
      u.allows_decimal
    INTO v_item_record
    FROM public.product_items pi
    JOIN public.products p ON p.id = pi.product_id
    LEFT JOIN public.units u ON u.id = p.unit_id
    WHERE pi.id = v_item.item_id;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': not found');
    END IF;

    -- Validate organization
    IF v_item_record.item_org_id != v_org_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': does not belong to your organization');
    END IF;

    -- Validate product status
    IF v_item_record.product_status != 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': product "' || v_item_record.product_name || '" is not active');
    END IF;

    -- Validate item status
    IF v_item_record.item_status != 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': "' || COALESCE(v_item_record.name, v_item_record.product_name) || '" is not active');
    END IF;

    -- Validate decimal quantity
    IF NOT COALESCE(v_item_record.allows_decimal, false) AND v_item.quantity != floor(v_item.quantity) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': decimal quantities not allowed for this product');
    END IF;

    -- Get authoritative price
    v_unit_price := v_item_record.selling_price;
    IF v_unit_price IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': no selling price set');
    END IF;

    IF v_unit_price < 0 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Item ' || v_item_idx || ': invalid selling price');
    END IF;

    -- Check zero price
    IF v_unit_price = 0 THEN
      v_has_zero_price := true;
    END IF;

    -- Accumulate subtotal
    v_line_total := v_unit_price * v_item.quantity;
    v_subtotal := v_subtotal + v_line_total;

    -- Store for second pass
    v_item_ids := array_append(v_item_ids, v_item.item_id);
    v_quantities := array_append(v_quantities, v_item.quantity);
    v_prices := array_append(v_prices, v_unit_price);
    v_names := array_append(v_names, COALESCE(v_item_record.name, v_item_record.product_name));
    v_skus := array_append(v_skus, v_item_record.sku);
    v_track_flags := array_append(v_track_flags, v_item_record.track_inventory);
  END LOOP;

  -- Validate zero-price confirmation
  IF v_has_zero_price AND NOT p_zero_price_confirmed THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'zero_price_confirmation_required',
      'has_zero_price', true
    );
  END IF;

  -- Validate cash received
  IF p_amount_tendered IS NULL OR p_amount_tendered < v_subtotal THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Insufficient cash amount',
      'required', v_subtotal,
      'received', p_amount_tendered
    );
  END IF;

  -- Calculate change
  v_change := p_amount_tendered - v_subtotal;

  -- Generate receipt number
  v_receipt_num := 'RCP-' || to_char(now(), 'YYYYMMDD') || '-' || LPAD(nextval('receipt_number_seq')::TEXT, 5, '0');

  -- Insert sale
  INSERT INTO public.sales (organization_id, branch_id, user_id, receipt_number, subtotal, total, payment_method)
  VALUES (v_org_id, p_branch_id, v_user_id, v_receipt_num, v_subtotal, v_subtotal, 'cash')
  RETURNING id INTO v_sale_id;

  -- Second pass: insert sale items and handle inventory
  FOR v_item_idx IN 1..v_total_items LOOP
    -- Insert sale item snapshot
    INSERT INTO public.sale_items (sale_id, item_id, item_name, sku, quantity, unit_price, subtotal)
    VALUES (v_sale_id, v_item_ids[v_item_idx], v_names[v_item_idx], v_skus[v_item_idx],
            v_quantities[v_item_idx], v_prices[v_item_idx],
            v_prices[v_item_idx] * v_quantities[v_item_idx]);

    -- Handle inventory deduction
    IF v_track_flags[v_item_idx] THEN
      -- Lock and validate inventory
      SELECT quantity_on_hand INTO v_qty_before
      FROM public.inventory
      WHERE organization_id = v_org_id
        AND branch_id = p_branch_id
        AND item_id = v_item_ids[v_item_idx]
      FOR UPDATE;

      IF NOT FOUND THEN
        -- Auto-create inventory record with 0 quantity
        INSERT INTO public.inventory (organization_id, branch_id, item_id, quantity_on_hand)
        VALUES (v_org_id, p_branch_id, v_item_ids[v_item_idx], 0)
        ON CONFLICT (organization_id, branch_id, item_id) DO NOTHING;

        v_qty_before := 0;
      END IF;

      IF v_qty_before < v_quantities[v_item_idx] THEN
        RAISE EXCEPTION 'Insufficient stock for "%": % available, % requested',
          v_names[v_item_idx], v_qty_before, v_quantities[v_item_idx];
      END IF;

      -- Deduct
      UPDATE public.inventory
      SET quantity_on_hand = quantity_on_hand - v_quantities[v_item_idx],
          updated_at = now()
      WHERE organization_id = v_org_id
        AND branch_id = p_branch_id
        AND item_id = v_item_ids[v_item_idx];

      -- Record movement
      INSERT INTO public.inventory_movements
        (organization_id, branch_id, item_id, movement_type,
         quantity_change, quantity_before, quantity_after,
         sale_id, created_by)
      VALUES (v_org_id, p_branch_id, v_item_ids[v_item_idx], 'sale',
              -v_quantities[v_item_idx], v_qty_before,
              v_qty_before - v_quantities[v_item_idx],
              v_sale_id, v_user_id);
    END IF;
  END LOOP;

  -- Insert payment
  INSERT INTO public.payments (sale_id, payment_method, amount_tendered, change_amount)
  VALUES (v_sale_id, 'cash', p_amount_tendered, v_change);

  -- Return success with receipt data
  RETURN jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'receipt_number', v_receipt_num,
    'subtotal', v_subtotal,
    'total', v_subtotal,
    'amount_tendered', p_amount_tendered,
    'change', v_change
  );

EXCEPTION
  WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_err_msg = CONSTRAINT_NAME;
    RETURN jsonb_build_object('success', false, 'error', 'Concurrent sale conflict: ' || COALESCE(v_err_msg, 'unique violation'));
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.complete_sale FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_sale TO authenticated;
