'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

async function getOrgId(supabase: ReturnType<typeof createServerClient>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const member = members?.[0];
  if (!member?.organization_id) throw new Error('No organization found');
  return member.organization_id;
}

export interface AdjustInventoryResult {
  success: boolean;
  error?: string;
  quantityBefore?: number;
  quantityAfter?: number;
  quantityChange?: number;
}

export async function adjustInventory(
  branchId: string,
  itemId: string,
  quantityChange: number,
  reason: string,
  notes?: string,
): Promise<AdjustInventoryResult> {
  try {
    if (!branchId) {
      return { success: false, error: 'Branch is required' };
    }

    if (!itemId) {
      return { success: false, error: 'Item is required' };
    }

    if (quantityChange == null || quantityChange === 0) {
      return { success: false, error: 'Quantity change must be non-zero' };
    }

    if (Math.abs(quantityChange) > 999999.9999) {
      return { success: false, error: 'Quantity change exceeds maximum allowed' };
    }

    if (!reason || reason.trim().length === 0) {
      return { success: false, error: 'Reason is required' };
    }

    if (reason.length > 100) {
      return { success: false, error: 'Reason must be 100 characters or less' };
    }

    if (notes && notes.length > 500) {
      return { success: false, error: 'Notes must be 500 characters or less' };
    }

    const supabase = await createServerClientForAction();
    const orgId = await getOrgId(supabase);

    const { data, error } = await supabase.rpc('adjust_inventory', {
      p_org_id: orgId,
      p_branch_id: branchId,
      p_item_id: itemId,
      p_quantity_change: quantityChange,
      p_reason: reason.trim(),
      p_notes: notes?.trim() ?? null,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error ?? 'Adjustment failed' };
    }

    revalidatePath('/inventory');
    revalidatePath('/inventory/movements');
    revalidatePath('/dashboard');

    return {
      success: true,
      quantityBefore: Number(data.quantity_before),
      quantityAfter: Number(data.quantity_after),
      quantityChange: Number(data.quantity_change),
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Adjustment failed' };
  }
}
