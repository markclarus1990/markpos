CREATE OR REPLACE FUNCTION create_organization_onboarding(
  org_name TEXT,
  org_slug TEXT,
  branch_name TEXT,
  branch_code TEXT,
  org_timezone TEXT DEFAULT 'Asia/Manila',
  org_currency_code TEXT DEFAULT 'PHP',
  org_country_code TEXT DEFAULT 'PH',
  branch_address TEXT DEFAULT NULL,
  branch_phone TEXT DEFAULT NULL,
  branch_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_org_id UUID;
  new_branch_id UUID;
  owner_role_id UUID;
  result JSONB;
BEGIN
  SELECT id INTO owner_role_id FROM public.roles
  WHERE name = 'owner' AND organization_id IS NULL;

  IF owner_role_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'System roles not initialized');
  END IF;

  INSERT INTO public.organizations (name, slug, timezone, currency_code, country_code)
  VALUES (org_name, org_slug, org_timezone, org_currency_code, org_country_code)
  RETURNING id INTO new_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role_id)
  VALUES (new_org_id, auth.uid(), owner_role_id);

  INSERT INTO public.branches (organization_id, name, code, address, phone, email)
  VALUES (new_org_id, branch_name, branch_code, branch_address, branch_phone, branch_email)
  RETURNING id INTO new_branch_id;

  INSERT INTO public.branch_staff (branch_id, user_id, role_id)
  VALUES (new_branch_id, auth.uid(), owner_role_id);

  result := jsonb_build_object(
    'success', true,
    'organization_id', new_org_id,
    'branch_id', new_branch_id
  );

  RETURN result;
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Organization slug or branch code already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION create_organization_onboarding IS 'Atomically creates organization, owner membership, first branch, and branch staff assignment. Must be called by an authenticated user.';
