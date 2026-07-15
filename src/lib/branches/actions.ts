'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  createBranchSchema,
  updateBranchStatusSchema,
  createStaffAssignmentSchema,
  updateStaffRoleSchema,
} from '@/lib/branches/schemas';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  return key;
}

async function createServerClientForAction() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch { /* ignore */ }
      },
    },
  });
}

async function checkAuthAndPermission(requiredPermission?: string) {
  const supabase = await createServerClientForAction();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const member = members?.[0];
  if (!member?.organization_id) throw new Error('No organization found');

  if (requiredPermission) {
    const { data: hasPermission } = await supabase.rpc('has_permission', {
      org_id: member.organization_id,
      permission_code: requiredPermission,
    });
    if (!hasPermission) throw new Error('Insufficient permissions');
  }

  return { supabase, user, orgId: member.organization_id };
}

const BRANCH_COOKIE = 'active_branch_id';

export async function setActiveBranch(
  _prevState: { error?: string; branchId?: string; branchName?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; branchId?: string; branchName?: string }> {
  try {
    const branchId = formData.get('branchId');
    if (!branchId || typeof branchId !== 'string') {
      return { error: 'Branch ID is required' };
    }

    const { supabase, user, orgId } = await checkAuthAndPermission();

    const { data: branch } = await supabase
      .from('branches')
      .select('id, name, organization_id, is_active')
      .eq('id', branchId)
      .single();

    if (!branch) return { error: 'Branch not found' };
    if (branch.organization_id !== orgId) return { error: 'Branch does not belong to your organization' };
    if (!branch.is_active) return { error: 'Branch is inactive' };

    const { data: isOwner } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle();

    if (!isOwner) {
      const { data: staff } = await supabase
        .from('branch_staff')
        .select('id')
        .eq('branch_id', branchId)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (!staff) return { error: 'No access to this branch' };
    }

    const cookieStore = await cookies();
    cookieStore.set(BRANCH_COOKIE, branchId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    });

    return { branchId, branchName: branch.name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to switch branch' };
  }
}

export async function createBranch(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      code: formData.get('code'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      timezone: formData.get('timezone'),
    };

    const parsed = createBranchSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('branches.manage');

    const { error } = await supabase.from('branches').insert({
      organization_id: orgId,
      name: parsed.data.name,
      code: parsed.data.code.toUpperCase(),
      email: parsed.data.email && parsed.data.email !== '' ? parsed.data.email : null,
      phone: parsed.data.phone && parsed.data.phone !== '' ? parsed.data.phone : null,
      address: parsed.data.address && parsed.data.address !== '' ? parsed.data.address : null,
      timezone: parsed.data.timezone ?? 'Asia/Manila',
    });

    if (error) {
      if (error.code === '23505') {
        return { error: 'A branch with this code already exists' };
      }
      return { error: 'Failed to create branch' };
    }

    revalidatePath('/settings');
    return { success: 'Branch created successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage branches' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function toggleBranchStatus(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      branchId: formData.get('branchId'),
      isActive: formData.get('isActive') === 'true',
      replacementBranchId: formData.get('replacementBranchId') || null,
    };

    const parsed = updateBranchStatusSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('branches.manage');

    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', parsed.data.branchId)
      .single();

    if (!branch) return { error: 'Branch not found' };
    if (branch.organization_id !== orgId) return { error: 'Branch does not belong to your organization' };

    if (!parsed.data.isActive) {
      const { count } = await supabase
        .from('branches')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('is_active', true);

      if (count === 1) {
        return { error: 'Cannot deactivate the last active branch' };
      }

      if (parsed.data.replacementBranchId) {
        const { data: replacement } = await supabase
          .from('branches')
          .select('id')
          .eq('id', parsed.data.replacementBranchId)
          .eq('organization_id', orgId)
          .eq('is_active', true)
          .single();

        if (!replacement) {
          return { error: 'Replacement branch is not available' };
        }

        const cookieStore = await cookies();
        const currentCookie = cookieStore.get(BRANCH_COOKIE)?.value;
        if (currentCookie === parsed.data.branchId) {
          cookieStore.set(BRANCH_COOKIE, parsed.data.replacementBranchId, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
          });
        }
      }
    }

    const { error } = await supabase
      .from('branches')
      .update({
        is_active: parsed.data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parsed.data.branchId)
      .eq('organization_id', orgId);

    if (error) return { error: 'Failed to update branch status' };

    revalidatePath('/settings');
    revalidatePath('/', 'layout');
    return { success: parsed.data.isActive ? 'Branch activated' : 'Branch deactivated' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage branches' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function assignStaff(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      branchId: formData.get('branchId'),
      userId: formData.get('userId'),
      roleId: formData.get('roleId'),
    };

    const parsed = createStaffAssignmentSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('employees.manage');

    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', parsed.data.branchId)
      .single();

    if (!branch || branch.organization_id !== orgId) {
      return { error: 'Branch not found' };
    }

    if (parsed.data.roleId) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, organization_id')
        .eq('id', parsed.data.roleId)
        .maybeSingle();

      if (!role) return { error: 'Role not found' };
      if (role.organization_id !== null && role.organization_id !== orgId) {
        return { error: 'Role does not belong to your organization' };
      }
    }

    const { data: existing } = await supabase
      .from('branch_staff')
      .select('id, is_active')
      .eq('branch_id', parsed.data.branchId)
      .eq('user_id', parsed.data.userId)
      .maybeSingle();

    if (existing) {
      if (existing.is_active) {
        return { error: 'User is already assigned to this branch' };
      }

      const { error: reactivateError } = await supabase
        .from('branch_staff')
        .update({ role_id: parsed.data.roleId, is_active: true })
        .eq('id', existing.id);

      if (reactivateError) return { error: 'Failed to assign staff' };
    } else {
      const { error: insertError } = await supabase
        .from('branch_staff')
        .insert({
          branch_id: parsed.data.branchId,
          user_id: parsed.data.userId,
          role_id: parsed.data.roleId,
        });

      if (insertError) return { error: 'Failed to assign staff' };
    }

    revalidatePath('/settings');
    return { success: 'Staff assigned successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage employees' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateStaffRole(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      assignmentId: formData.get('assignmentId'),
      roleId: formData.get('roleId'),
    };

    const parsed = updateStaffRoleSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('employees.manage');

    if (parsed.data.roleId) {
      const { data: role } = await supabase
        .from('roles')
        .select('id, organization_id')
        .eq('id', parsed.data.roleId)
        .maybeSingle();

      if (!role) return { error: 'Role not found' };
      if (role.organization_id !== null && role.organization_id !== orgId) {
        return { error: 'Role does not belong to your organization' };
      }
    }

    const { error } = await supabase
      .from('branch_staff')
      .update({ role_id: parsed.data.roleId })
      .eq('id', parsed.data.assignmentId);

    if (error) return { error: 'Failed to update role' };

    revalidatePath('/settings');
    return { success: 'Role updated successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage employees' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function deactivateStaff(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const assignmentId = formData.get('assignmentId');
    if (!assignmentId || typeof assignmentId !== 'string') {
      return { error: 'Assignment ID is required' };
    }

    const { supabase } = await checkAuthAndPermission('employees.manage');

    const { error } = await supabase
      .from('branch_staff')
      .update({ is_active: false })
      .eq('id', assignmentId);

    if (error) return { error: 'Failed to deactivate staff' };

    revalidatePath('/settings');
    return { success: 'Staff deactivated' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage employees' };
    }
    return { error: 'An unexpected error occurred' };
  }
}
