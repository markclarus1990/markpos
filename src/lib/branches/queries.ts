import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const BRANCH_COOKIE = 'active_branch_id';

export async function getActiveBranchId(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const cookieBranchId = cookieStore.get(BRANCH_COOKIE)?.value;

    if (cookieBranchId) {
      const { data: branch } = await supabase
        .from('branches')
        .select('id')
        .eq('id', cookieBranchId)
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .maybeSingle();

      if (branch) return branch.id;
    }
  } catch {
    // cookies() not available (e.g. test environment), fall through to DB fallback
  }

  const { data } = await supabase
    .from('branches')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);
  return data?.[0]?.id ?? null;
}

export async function getActiveBranch(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
): Promise<{
  id: string;
  name: string;
  code: string;
  is_active: boolean;
} | null> {
  const branchId = await getActiveBranchId(supabase, orgId);
  if (!branchId) return null;

  const { data } = await supabase
    .from('branches')
    .select('id, name, code, is_active')
    .eq('id', branchId)
    .single();

  return data;
}

export async function getUserAccessibleBranches(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
  userId: string,
): Promise<Array<{ id: string; name: string; code: string; is_active: boolean }>> {
  const { data: allBranches } = await supabase
    .from('branches')
    .select('id, name, code, is_active')
    .eq('organization_id', orgId)
    .order('name');

  if (!allBranches) return [];

  const { data: isOwner } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (isOwner) return allBranches;

  const { data: staffAssignments } = await supabase
    .from('branch_staff')
    .select('branch_id')
    .eq('user_id', userId)
    .eq('is_active', true);

  const accessibleIds = new Set((staffAssignments ?? []).map((s: { branch_id: string }) => s.branch_id));
  return allBranches.filter((b: { id: string }) => accessibleIds.has(b.id));
}

export async function getBranchStaff(
  supabase: ReturnType<typeof createServerClient>,
  branchId: string,
): Promise<
  Array<{
    id: string;
    userId: string;
    roleId: string | null;
    isActive: boolean;
    userIdentifier: string;
    roleName: string | null;
  }>
> {
  const { data: assignments } = await supabase
    .from('branch_staff')
    .select(`
      id,
      user_id,
      role_id,
      is_active
    `)
    .eq('branch_id', branchId);

  if (!assignments) return [];

  const userIds = [...new Set(assignments.map((a: { user_id: string }) => a.user_id))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap = new Map<string, string | null>((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name]));

  const roleIds = [...new Set(assignments.map((a: { role_id: string | null }) => a.role_id).filter(Boolean))] as string[];

  const roleMap = new Map<string, string>();
  if (roleIds.length > 0) {
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('id', roleIds);
    for (const r of (roles ?? []) as Array<{ id: string; name: string }>) {
      roleMap.set(r.id, r.name);
    }
  }

  return assignments.map((a: { id: string; user_id: string; role_id: string | null; is_active: boolean }) => ({
    id: a.id,
    userId: a.user_id,
    roleId: a.role_id,
    isActive: a.is_active,
    userIdentifier: profileMap.get(a.user_id) ?? a.user_id,
    roleName: a.role_id ? roleMap.get(a.role_id) ?? null : null,
  }));
}

export async function getBranchesStaff(
  supabase: ReturnType<typeof createServerClient>,
  branchIds: string[],
): Promise<Record<string, Array<{
  id: string;
  userId: string;
  roleId: string | null;
  isActive: boolean;
  userIdentifier: string;
  roleName: string | null;
}>>> {
  if (branchIds.length === 0) return {};

  const { data: assignments } = await supabase
    .from('branch_staff')
    .select(`
      id,
      branch_id,
      user_id,
      role_id,
      is_active
    `)
    .in('branch_id', branchIds);

  if (!assignments) return {};

  const userIds = [...new Set(assignments.map((a: { user_id: string }) => a.user_id))];

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, display_name')
    .in('id', userIds);

  const profileMap = new Map<string, string | null>((profiles ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name]));

  const roleIds = [...new Set(assignments.map((a: { role_id: string | null }) => a.role_id).filter(Boolean))] as string[];

  const roleMap = new Map<string, string>();
  if (roleIds.length > 0) {
    const { data: roles } = await supabase
      .from('roles')
      .select('id, name')
      .in('id', roleIds);
    for (const r of (roles ?? []) as Array<{ id: string; name: string }>) {
      roleMap.set(r.id, r.name);
    }
  }

  const grouped: Record<string, Array<{
    id: string;
    userId: string;
    roleId: string | null;
    isActive: boolean;
    userIdentifier: string;
    roleName: string | null;
  }>> = {};

  for (const a of assignments as Array<{ id: string; branch_id: string; user_id: string; role_id: string | null; is_active: boolean }>) {
    if (!grouped[a.branch_id]) grouped[a.branch_id] = [];
    const staff = grouped[a.branch_id];
    if (staff) {
      const uid = a.user_id;
      staff.push({
        id: a.id,
        userId: uid,
        roleId: a.role_id,
        isActive: a.is_active,
        userIdentifier: profileMap.get(uid) ?? uid,
        roleName: a.role_id ? roleMap.get(a.role_id) ?? null : null,
      });
    }
  }

  return grouped;
}

export async function getAvailableStaffMembers(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
  branchId: string,
): Promise<
  Array<{
    id: string;
    email: string;
    displayName: string | null;
  }>
> {
  const { data: existingStaff } = await supabase
    .from('branch_staff')
    .select('user_id')
    .eq('branch_id', branchId);

  const existingIds = new Set((existingStaff ?? []).map((s: { user_id: string }) => s.user_id));

  const { data: members } = await supabase
    .from('organization_members')
    .select(`
      user_id,
      profile:user_id (
        display_name
      )
    `)
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const available = (members ?? [])
    .filter((m: { user_id: string }) => !existingIds.has(m.user_id))
    .map((m: { user_id: string; profile: unknown }) => {
      const profile = m.profile as { display_name: string | null } | null;
      return {
        id: m.user_id,
        email: m.user_id,
        displayName: profile?.display_name ?? null,
      };
    });

  return available;
}

export async function getOrganizationRoles(
  supabase: ReturnType<typeof createServerClient>,
  orgId: string,
): Promise<Array<{ id: string; name: string }>> {
  const { data } = await supabase
    .from('roles')
    .select('id, name')
    .or(`organization_id.eq.${orgId},organization_id.is.null`)
    .order('name');

  return data ?? [];
}
