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

export interface CheckoutItem {
  item_id: string;
  quantity: number;
}

export interface CheckoutResult {
  success: boolean;
  error?: string;
  sale_id?: string;
  receipt_number?: string;
  subtotal?: number;
  total?: number;
  amount_tendered?: number;
  change?: number;
  has_zero_price?: boolean;
}

export async function checkout(
  branchId: string,
  items: CheckoutItem[],
  amountTendered: number,
  zeroPriceConfirmed: boolean = false,
): Promise<CheckoutResult> {
  try {
    if (!branchId) {
      return { success: false, error: 'No active branch selected' };
    }

    if (!items || items.length === 0) {
      return { success: false, error: 'Cart is empty' };
    }

    if (amountTendered == null || amountTendered < 0) {
      return { success: false, error: 'Invalid cash amount' };
    }

    const supabase = await createServerClientForAction();

    const { data, error } = await supabase.rpc('complete_sale', {
      p_branch_id: branchId,
      p_items: JSON.parse(JSON.stringify(items)),
      p_amount_tendered: amountTendered,
      p_zero_price_confirmed: zeroPriceConfirmed,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      if (data?.error === 'zero_price_confirmation_required') {
        return { success: false, error: data.error, has_zero_price: true };
      }
      return { success: false, error: data?.error ?? 'Checkout failed' };
    }

    revalidatePath('/dashboard');
    return {
      success: true,
      sale_id: data.sale_id,
      receipt_number: data.receipt_number,
      subtotal: Number(data.subtotal),
      total: Number(data.total),
      amount_tendered: Number(data.amount_tendered),
      change: Number(data.change),
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Checkout failed' };
  }
}
