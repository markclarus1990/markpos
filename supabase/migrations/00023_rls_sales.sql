-- ========== INVENTORY ==========
CREATE POLICY "Members can view inventory"
  ON public.inventory FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct inventory inserts"
  ON public.inventory FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct inventory updates"
  ON public.inventory FOR UPDATE
  USING (false);

CREATE POLICY "Block direct inventory deletes"
  ON public.inventory FOR DELETE
  USING (false);

-- ========== INVENTORY MOVEMENTS ==========
CREATE POLICY "Members can view inventory movements"
  ON public.inventory_movements FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct movement inserts"
  ON public.inventory_movements FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct movement updates"
  ON public.inventory_movements FOR UPDATE
  USING (false);

CREATE POLICY "Block direct movement deletes"
  ON public.inventory_movements FOR DELETE
  USING (false);

-- ========== SALES ==========
CREATE POLICY "Members can view sales"
  ON public.sales FOR SELECT
  USING (public.is_organization_member(organization_id));

CREATE POLICY "Block direct sale inserts"
  ON public.sales FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct sale updates"
  ON public.sales FOR UPDATE
  USING (false);

CREATE POLICY "Block direct sale deletes"
  ON public.sales FOR DELETE
  USING (false);

-- ========== SALE ITEMS ==========
CREATE POLICY "Members can view sale items"
  ON public.sale_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = sale_items.sale_id
        AND public.is_organization_member(s.organization_id)
    )
  );

CREATE POLICY "Block direct sale item inserts"
  ON public.sale_items FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct sale item updates"
  ON public.sale_items FOR UPDATE
  USING (false);

CREATE POLICY "Block direct sale item deletes"
  ON public.sale_items FOR DELETE
  USING (false);

-- ========== PAYMENTS ==========
CREATE POLICY "Members can view payments"
  ON public.payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sales s
      WHERE s.id = payments.sale_id
        AND public.is_organization_member(s.organization_id)
    )
  );

CREATE POLICY "Block direct payment inserts"
  ON public.payments FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Block direct payment updates"
  ON public.payments FOR UPDATE
  USING (false);

CREATE POLICY "Block direct payment deletes"
  ON public.payments FOR DELETE
  USING (false);
