'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  generalSettingsSchema,
  regionalSettingsSchema,
  branchSettingsSchema,
} from '@/lib/settings/schemas';

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

function normalizeOptional(value: string | null | undefined): string | null {
  if (value === undefined || value === null || value === '') return null;
  return value;
}

const ALLOWED_GENERAL_FIELDS = ['name', 'email', 'phone', 'address'] as const;
const ALLOWED_BRANCH_FIELDS = ['name', 'code', 'email', 'phone', 'address'] as const;

export async function updateGeneralSettings(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    const parsed = generalSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('settings.manage');

    const updates: Record<string, string | null> = {};
    for (const field of ALLOWED_GENERAL_FIELDS) {
      if (field === 'name') {
        updates[field] = parsed.data.name;
      } else {
        updates[field] = normalizeOptional(parsed.data[field as keyof typeof parsed.data] as string | null | undefined);
      }
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId);

    if (error) return { error: 'Failed to update settings' };

    revalidatePath('/settings');
    return { success: 'General settings saved successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to update organization settings' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateRegionalSettings(
  _prevState: { error?: string; success?: string; currencyWarning?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string; currencyWarning?: string }> {
  try {
    const raw = {
      currencyCode: formData.get('currencyCode'),
      timezone: formData.get('timezone'),
    };

    const parsed = regionalSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('settings.manage');

    const updates: Record<string, string> = {
      currency_code: parsed.data.currencyCode,
      timezone: parsed.data.timezone,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', orgId);

    if (error) return { error: 'Failed to update regional settings' };

    const isCurrencyChanged = parsed.data.currencyCode !== formData.get('currentCurrency');

    revalidatePath('/settings');
    revalidatePath('/dashboard');
    revalidatePath('/sales');
    revalidatePath('/inventory/movements');
    revalidatePath('/reports');

    if (isCurrencyChanged) {
      return {
        success: 'Regional settings saved successfully',
        currencyWarning: 'Changing the currency changes how monetary values are displayed. It does not convert existing sales or historical amounts.',
      };
    }
    return { success: 'Regional settings saved successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to update regional settings' };
    }
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateBranch(
  _prevState: { error?: string; success?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      id: formData.get('id'),
      name: formData.get('name'),
      code: formData.get('code'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
    };

    const parsed = branchSettingsSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const { supabase, orgId } = await checkAuthAndPermission('branches.manage');

    const { data: branch } = await supabase
      .from('branches')
      .select('organization_id')
      .eq('id', parsed.data.id)
      .single();

    if (!branch) return { error: 'Branch not found' };
    if (branch.organization_id !== orgId) return { error: 'Branch does not belong to your organization' };

    const updates: Record<string, string | null> = {};
    for (const field of ALLOWED_BRANCH_FIELDS) {
      if (field === 'name' || field === 'code') {
        updates[field] = parsed.data[field];
      } else {
        updates[field] = normalizeOptional(parsed.data[field as keyof typeof parsed.data] as string | null | undefined);
      }
    }

    updates.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', parsed.data.id)
      .eq('organization_id', orgId);

    if (error) return { error: 'Failed to update branch' };

    revalidatePath('/settings');
    return { success: 'Branch updated successfully' };
  } catch (err) {
    if (err instanceof Error && err.message === 'Insufficient permissions') {
      return { error: 'You do not have permission to manage branches' };
    }
    return { error: 'An unexpected error occurred' };
  }
}
