INSERT INTO permissions (code, name, description, module) VALUES
  ('dashboard.view', 'View Dashboard', 'Access the dashboard', 'dashboard'),
  ('pos.access', 'Access POS', 'Use the point of sale terminal', 'pos'),
  ('products.view', 'View Products', 'View product catalog', 'products'),
  ('products.create', 'Create Products', 'Add new products', 'products'),
  ('products.edit', 'Edit Products', 'Modify existing products', 'products'),
  ('products.delete', 'Delete Products', 'Remove products from catalog', 'products'),
  ('inventory.view', 'View Inventory', 'View inventory levels', 'inventory'),
  ('inventory.adjust', 'Adjust Inventory', 'Make inventory adjustments', 'inventory'),
  ('customers.view', 'View Customers', 'View customer list', 'customers'),
  ('customers.create', 'Create Customers', 'Add new customers', 'customers'),
  ('customers.edit', 'Edit Customers', 'Modify customer details', 'customers'),
  ('sales.view', 'View Sales', 'View sales history', 'sales'),
  ('sales.refund', 'Process Refunds', 'Issue refunds and returns', 'sales'),
  ('expenses.view', 'View Expenses', 'View expense records', 'expenses'),
  ('expenses.create', 'Create Expenses', 'Add new expenses', 'expenses'),
  ('expenses.approve', 'Approve Expenses', 'Approve expense reports', 'expenses'),
  ('reports.view', 'View Reports', 'Access reporting module', 'reports'),
  ('employees.view', 'View Employees', 'View employee list', 'employees'),
  ('employees.manage', 'Manage Employees', 'Add and manage employees', 'employees'),
  ('branches.view', 'View Branches', 'View branch information', 'branches'),
  ('branches.manage', 'Manage Branches', 'Create and manage branches', 'branches'),
  ('settings.view', 'View Settings', 'Access settings', 'settings'),
  ('settings.manage', 'Manage Settings', 'Modify organization settings', 'settings')
ON CONFLICT (code) DO NOTHING;

DO $$
DECLARE
  owner_role_id UUID;
  admin_role_id UUID;
  manager_role_id UUID;
  cashier_role_id UUID;
  inventory_role_id UUID;
BEGIN
  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (NULL, 'owner', 'Full access to all features and settings', true)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO owner_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (NULL, 'admin', 'Administrative access excluding billing', true)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO admin_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (NULL, 'manager', 'Day-to-day operations management', true)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO manager_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (NULL, 'cashier', 'POS terminal and basic operations', true)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO cashier_role_id;

  INSERT INTO roles (organization_id, name, description, is_system)
  VALUES (NULL, 'inventory_staff', 'Inventory management access', true)
  ON CONFLICT (organization_id, name) DO NOTHING
  RETURNING id INTO inventory_role_id;

  IF owner_role_id IS NULL THEN
    SELECT id INTO owner_role_id FROM roles WHERE name = 'owner' AND organization_id IS NULL;
  END IF;
  IF admin_role_id IS NULL THEN
    SELECT id INTO admin_role_id FROM roles WHERE name = 'admin' AND organization_id IS NULL;
  END IF;
  IF manager_role_id IS NULL THEN
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager' AND organization_id IS NULL;
  END IF;
  IF cashier_role_id IS NULL THEN
    SELECT id INTO cashier_role_id FROM roles WHERE name = 'cashier' AND organization_id IS NULL;
  END IF;
  IF inventory_role_id IS NULL THEN
    SELECT id INTO inventory_role_id FROM roles WHERE name = 'inventory_staff' AND organization_id IS NULL;
  END IF;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT owner_role_id, id FROM permissions
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT admin_role_id, id FROM permissions
  WHERE code NOT IN ('settings.manage', 'branches.manage', 'employees.manage')
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT manager_role_id, id FROM permissions
  WHERE code IN (
    'dashboard.view', 'pos.access', 'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.adjust', 'customers.view', 'customers.create', 'customers.edit',
    'sales.view', 'sales.refund', 'expenses.view', 'expenses.create',
    'reports.view', 'employees.view', 'branches.view', 'settings.view'
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT cashier_role_id, id FROM permissions
  WHERE code IN (
    'dashboard.view', 'pos.access', 'products.view',
    'inventory.view', 'customers.view', 'customers.create',
    'sales.view', 'branches.view'
  )
  ON CONFLICT DO NOTHING;

  INSERT INTO role_permissions (role_id, permission_id)
  SELECT inventory_role_id, id FROM permissions
  WHERE code IN (
    'dashboard.view', 'products.view', 'products.create', 'products.edit',
    'inventory.view', 'inventory.adjust',
    'reports.view', 'branches.view'
  )
  ON CONFLICT DO NOTHING;
END;
$$;
