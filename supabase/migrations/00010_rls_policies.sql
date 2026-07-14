-- Helper: check if a user is a member of an organization
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE organization_id = org_id
      AND user_id = is_organization_member.user_id
      AND is_active = true
  );
$$;

-- Helper: check if a user has a specific permission within an organization
CREATE OR REPLACE FUNCTION has_permission(org_id UUID, permission_code TEXT, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.role_permissions rp ON om.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE om.organization_id = has_permission.org_id
      AND om.user_id = has_permission.user_id
      AND om.is_active = true
      AND p.code = has_permission.permission_code
  );
$$;

-- Helper: get the user's role for an organization
CREATE OR REPLACE FUNCTION get_organization_role(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role_id FROM public.organization_members
  WHERE organization_id = get_organization_role.org_id
    AND user_id = get_organization_role.user_id
    AND is_active = true
  LIMIT 1;
$$;

-- Helper: check if user is an owner of an organization
CREATE OR REPLACE FUNCTION is_organization_owner(org_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members om
    JOIN public.roles r ON om.role_id = r.id
    WHERE om.organization_id = is_organization_owner.org_id
      AND om.user_id = is_organization_owner.user_id
      AND om.is_active = true
      AND r.name = 'owner'
  );
$$;

-- RLS: Organizations
CREATE POLICY "Members can view their organizations"
  ON organizations FOR SELECT
  USING (is_organization_member(id));

CREATE POLICY "Owners and admins can update their organization"
  ON organizations FOR UPDATE
  USING (is_organization_owner(id) OR has_permission(id, 'settings.manage'))
  WITH CHECK (is_organization_owner(id) OR has_permission(id, 'settings.manage'));

-- RLS: Branches
CREATE POLICY "Members can view branches of their organizations"
  ON branches FOR SELECT
  USING (is_organization_member(organization_id));

CREATE POLICY "Owners and authorized members can manage branches"
  ON branches FOR INSERT
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'branches.manage')
  );

CREATE POLICY "Owners and authorized members can update branches"
  ON branches FOR UPDATE
  USING (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'branches.manage')
  )
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'branches.manage')
  );

CREATE POLICY "Owners and authorized members can delete branches"
  ON branches FOR DELETE
  USING (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'branches.manage')
  );

-- RLS: Roles
CREATE POLICY "Members can view roles of their organizations"
  ON roles FOR SELECT
  USING (
    organization_id IS NULL
    OR is_organization_member(organization_id)
  );

CREATE POLICY "Owners can manage organization roles"
  ON roles FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_organization_owner(organization_id)
  );

CREATE POLICY "Owners can update organization roles"
  ON roles FOR UPDATE
  USING (
    organization_id IS NOT NULL
    AND is_organization_owner(organization_id)
  )
  WITH CHECK (
    organization_id IS NOT NULL
    AND is_organization_owner(organization_id)
  );

CREATE POLICY "Owners can delete organization roles"
  ON roles FOR DELETE
  USING (
    organization_id IS NOT NULL
    AND is_organization_owner(organization_id)
  );

-- RLS: Permissions (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- RLS: Role Permissions
CREATE POLICY "Members can view role permissions of their organizations"
  ON role_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND (
          r.organization_id IS NULL
          OR is_organization_member(r.organization_id)
        )
    )
  );

CREATE POLICY "Owners can manage role permissions"
  ON role_permissions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id IS NOT NULL
        AND is_organization_owner(r.organization_id)
    )
  );

CREATE POLICY "Owners can delete role permissions"
  ON role_permissions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM roles r
      WHERE r.id = role_permissions.role_id
        AND r.organization_id IS NOT NULL
        AND is_organization_owner(r.organization_id)
    )
  );

-- RLS: Organization Members
CREATE POLICY "Members can view organization members"
  ON organization_members FOR SELECT
  USING (is_organization_member(organization_id));

CREATE POLICY "Owners and admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'employees.manage')
  );

CREATE POLICY "Owners and admins can update members"
  ON organization_members FOR UPDATE
  USING (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'employees.manage')
  )
  WITH CHECK (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'employees.manage')
  );

CREATE POLICY "Owners and admins can remove members"
  ON organization_members FOR DELETE
  USING (
    is_organization_owner(organization_id)
    OR has_permission(organization_id, 'employees.manage')
  );

-- RLS: Branch Staff
CREATE POLICY "Members can view branch staff"
  ON branch_staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_staff.branch_id
        AND is_organization_member(b.organization_id)
    )
  );

CREATE POLICY "Owners and admins can manage branch staff"
  ON branch_staff FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_staff.branch_id
        AND (is_organization_owner(b.organization_id) OR has_permission(b.organization_id, 'employees.manage'))
    )
  );

CREATE POLICY "Owners and admins can update branch staff"
  ON branch_staff FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_staff.branch_id
        AND (is_organization_owner(b.organization_id) OR has_permission(b.organization_id, 'employees.manage'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_staff.branch_id
        AND (is_organization_owner(b.organization_id) OR has_permission(b.organization_id, 'employees.manage'))
    )
  );

CREATE POLICY "Owners and admins can delete branch staff"
  ON branch_staff FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM branches b
      WHERE b.id = branch_staff.branch_id
        AND (is_organization_owner(b.organization_id) OR has_permission(b.organization_id, 'employees.manage'))
    )
  );
