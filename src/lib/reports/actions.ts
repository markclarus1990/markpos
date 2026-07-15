'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getDateRange } from './date-utils';
import { generateCsv } from './export-csv';
import {
  getSalesOverviewData,
  getProductPerformanceData,
  getPaymentMethodData,
  getMovementSummaryData,
} from './queries';
import type { DateRangeKey } from './date-utils';

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

async function getAuthContext() {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const member = members?.[0];
  if (!member?.organization_id) throw new Error('No organization found');

  const { data: org } = await supabase
    .from('organizations')
    .select('timezone, currency_code')
    .eq('id', member.organization_id)
    .single();

  return {
    supabase,
    orgId: member.organization_id,
    timezone: org?.timezone ?? 'UTC',
    currencyCode: org?.currency_code ?? 'USD',
  };
}

export async function exportSalesCsv(period: DateRangeKey): Promise<{ csv: string; filename: string }> {
  const { timezone, orgId } = await getAuthContext();
  const dateRange = getDateRange(timezone, period);
  const data = await getSalesOverviewData(timezone, orgId, dateRange);

  const headers = ['Date', 'Revenue', 'Transactions'];
  const rows = data.dailyTrend.map((d) => [
    d.label,
    d.revenue.toFixed(2),
    String(d.transactions),
  ]);

  const csv = generateCsv(headers, rows);
  const filename = `sales-overview-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportProductsCsv(period: DateRangeKey): Promise<{ csv: string; filename: string }> {
  const { timezone, orgId } = await getAuthContext();
  const dateRange = getDateRange(timezone, period);
  const data = await getProductPerformanceData(timezone, orgId, dateRange, 1000);

  const headers = ['Product', 'SKU', 'Quantity Sold', 'Revenue'];
  const rows = data.map((p) => [
    p.name,
    p.sku ?? '',
    String(p.quantitySold),
    p.revenue.toFixed(2),
  ]);

  const csv = generateCsv(headers, rows);
  const filename = `product-performance-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportPaymentsCsv(period: DateRangeKey): Promise<{ csv: string; filename: string }> {
  const { timezone, orgId } = await getAuthContext();
  const dateRange = getDateRange(timezone, period);
  const data = await getPaymentMethodData(orgId, dateRange);

  const headers = ['Payment Method', 'Transactions', 'Total Revenue'];
  const rows = data.map((p) => [
    p.method,
    String(p.transactionCount),
    p.totalRevenue.toFixed(2),
  ]);

  const csv = generateCsv(headers, rows);
  const filename = `payment-methods-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportInventoryCsv(): Promise<{ csv: string; filename: string }> {
  const { supabase, orgId } = await getAuthContext();

  const { data: items } = await supabase
    .from('inventory')
    .select(`
      quantity_on_hand,
      item: item_id ( name, sku )
    `)
    .eq('organization_id', orgId);

  const headers = ['Item', 'SKU', 'Quantity on Hand', 'Status'];
  const rows = (items ?? []).map((inv) => {
    const item = inv.item as unknown as { name: string; sku: string | null } | null;
    const qty = Number(inv.quantity_on_hand);
    let status = 'In Stock';
    if (qty <= 0) status = 'Out of Stock';
    else if (qty < 10) status = 'Low Stock';
    return [
      item?.name ?? 'Unknown',
      item?.sku ?? '',
      String(qty),
      status,
    ];
  });

  const csv = generateCsv(headers, rows);
  const filename = `inventory-status-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}

export async function exportMovementsCsv(period: DateRangeKey): Promise<{ csv: string; filename: string }> {
  const { timezone, orgId } = await getAuthContext();
  const dateRange = getDateRange(timezone, period);
  const data = await getMovementSummaryData(orgId, dateRange);

  const headers = ['Movement Type', 'Total Quantity'];
  const rows = Object.entries(data).map(([type, qty]) => [
    type.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()),
    String(qty),
  ]);

  const csv = generateCsv(headers, rows);
  const filename = `inventory-movements-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { csv, filename };
}
