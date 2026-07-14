-- Migrate existing permission codes to canonical names
UPDATE public.permissions
SET code = 'products.update', name = 'Update Products', description = 'Edit existing products'
WHERE code = 'products.edit';

UPDATE public.permissions
SET code = 'products.archive', name = 'Archive Products', description = 'Archive and restore products'
WHERE code = 'products.delete';

-- Seed new permission codes for catalog management
INSERT INTO public.permissions (code, name, description, module) VALUES
  ('categories.manage', 'Manage Categories', 'Create, update, and archive categories', 'products'),
  ('brands.manage', 'Manage Brands', 'Create, update, and archive brands', 'products'),
  ('units.manage', 'Manage Units', 'Create, update, and archive units', 'products')
ON CONFLICT (code) DO NOTHING;

-- Assign new permissions to existing system roles
DO $$
DECLARE
  v_owner_id UUID;
  v_admin_id UUID;
  v_manager_id UUID;
  v_cashier_id UUID;
  v_inventory_id UUID;
  v_cat_perm_id UUID;
  v_brand_perm_id UUID;
  v_unit_perm_id UUID;
  v_product_archive_perm_id UUID;
BEGIN
  SELECT id INTO v_owner_id FROM public.roles WHERE name = 'owner' AND organization_id IS NULL;
  SELECT id INTO v_admin_id FROM public.roles WHERE name = 'admin' AND organization_id IS NULL;
  SELECT id INTO v_manager_id FROM public.roles WHERE name = 'manager' AND organization_id IS NULL;
  SELECT id INTO v_cashier_id FROM public.roles WHERE name = 'cashier' AND organization_id IS NULL;
  SELECT id INTO v_inventory_id FROM public.roles WHERE name = 'inventory_staff' AND organization_id IS NULL;

  SELECT id INTO v_cat_perm_id FROM public.permissions WHERE code = 'categories.manage';
  SELECT id INTO v_brand_perm_id FROM public.permissions WHERE code = 'brands.manage';
  SELECT id INTO v_unit_perm_id FROM public.permissions WHERE code = 'units.manage';
  SELECT id INTO v_product_archive_perm_id FROM public.permissions WHERE code = 'products.archive';

  -- Owner: all new permissions
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (v_owner_id, v_cat_perm_id),
    (v_owner_id, v_brand_perm_id),
    (v_owner_id, v_unit_perm_id),
    (v_owner_id, v_product_archive_perm_id)
  ON CONFLICT DO NOTHING;

  -- Admin: categories, brands, units manage
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (v_admin_id, v_cat_perm_id),
    (v_admin_id, v_brand_perm_id),
    (v_admin_id, v_unit_perm_id),
    (v_admin_id, v_product_archive_perm_id)
  ON CONFLICT DO NOTHING;

  -- Manager: categories, brands, units manage
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (v_manager_id, v_cat_perm_id),
    (v_manager_id, v_brand_perm_id),
    (v_manager_id, v_unit_perm_id),
    (v_manager_id, v_product_archive_perm_id)
  ON CONFLICT DO NOTHING;

  -- Inventory staff: categories, brands, units manage
  INSERT INTO public.role_permissions (role_id, permission_id) VALUES
    (v_inventory_id, v_cat_perm_id),
    (v_inventory_id, v_brand_perm_id),
    (v_inventory_id, v_unit_perm_id),
    (v_inventory_id, v_product_archive_perm_id)
  ON CONFLICT DO NOTHING;
END;
$$;
