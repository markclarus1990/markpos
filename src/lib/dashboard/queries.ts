import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getActiveBranchId } from '@/lib/branches/queries';

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

async function createServerClientForQuery() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only */ },
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

async function getOrgTimezone(supabase: ReturnType<typeof createServerClient>, orgId: string): Promise<string> {
  const { data } = await supabase
    .from('organizations')
    .select('timezone')
    .eq('id', orgId)
    .single();
  return data?.timezone ?? 'UTC';
}

function getDateRangeDays(timezone: string, days: number): { dates: Date[]; todayStartUTC: Date } {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
  const todayStart = new Date(dateStr + 'T00:00:00Z');
  const dates: Date[] = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(new Date(todayStart.getTime() - i * 86_400_000));
  }
  return { dates, todayStartUTC: todayStart };
}

function formatDateLabel(date: Date, timezone: string): string {
  return date.toLocaleDateString('en-US', { timeZone: timezone, weekday: 'short', month: 'short', day: 'numeric' });
}

export interface DashboardKpi {
  value: number | null;
  trend?: { direction: 'up' | 'down'; label: string } | null;
  period?: string;
}

export interface DashboardData {
  dailySales: DashboardKpi;
  transactions: DashboardKpi;
  avgOrderValue: DashboardKpi;
  lowStockItems: DashboardKpi;
}

export interface DailySummary {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
}

export interface RecentSale {
  id: string;
  receiptNumber: string;
  createdAt: string;
  itemCount: number;
  paymentMethod: string;
  total: number;
}

export interface TopProduct {
  id: string;
  name: string;
  sku: string | null;
  quantitySold: number;
  revenue: number;
}

export interface LowStockItem {
  id: string;
  productName: string;
  itemName: string | null;
  currentStock: number;
  threshold: number;
}

export async function getKpiSummary(): Promise<DashboardData> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const timezone = await getOrgTimezone(supabase, orgId);
  const branchId = await getActiveBranchId(supabase, orgId);

  const { todayStartUTC } = getDateRangeDays(timezone, 1);
  const todayEnd = new Date(todayStartUTC.getTime() + 86_400_000);

  const todayRange = {
    gte: todayStartUTC.toISOString(),
    lt: todayEnd.toISOString(),
  };

  const baseQuery = supabase
    .from('sales')
    .select('total')
    .eq('status', 'completed')
    .gte('created_at', todayRange.gte)
    .lt('created_at', todayRange.lt);

  const salesPromise = branchId
    ? baseQuery.eq('branch_id', branchId)
    : baseQuery;

  const { data: todaySales } = await salesPromise;

  let totalRevenue = 0;
  let transactionCount = 0;
  for (const sale of todaySales ?? []) {
    totalRevenue += Number(sale.total);
    transactionCount++;
  }

  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  const { count: lowStockCount } = await supabase
    .from('inventory')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('branch_id', branchId ?? '__none__')
    .lt('quantity_on_hand', 10);

  const now = new Date();
  const todayLabel = now.toLocaleDateString('en-US', { timeZone: timezone, month: 'short', day: 'numeric' });

  return {
    dailySales: {
      value: totalRevenue,
      period: todayLabel,
      trend: null,
    },
    transactions: {
      value: transactionCount,
      period: todayLabel,
      trend: null,
    },
    avgOrderValue: {
      value: avgOrderValue,
      period: todayLabel,
      trend: null,
    },
    lowStockItems: {
      value: lowStockCount ?? 0,
      period: todayLabel,
      trend: null,
    },
  };
}

export async function getSalesOverview(): Promise<DailySummary[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const timezone = await getOrgTimezone(supabase, orgId);
  const branchId = await getActiveBranchId(supabase, orgId);
  const { dates, todayStartUTC } = getDateRangeDays(timezone, 7);
  const startDate = dates[0]!;
  const endDate = new Date(todayStartUTC.getTime() + 86_400_000);

  let query = supabase
    .from('sales')
    .select('total, created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data: sales } = await query;

  const dailyMap = new Map<string, number>();
  for (const sale of sales ?? []) {
    const d = new Date(sale.created_at);
    const key = d.toLocaleDateString('en-CA', { timeZone: timezone });
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + Number(sale.total));
  }

  return dates.map((date) => {
    const key = date.toLocaleDateString('en-CA', { timeZone: timezone });
    return {
      date: key,
      label: formatDateLabel(date, timezone),
      revenue: dailyMap.get(key) ?? 0,
      transactions: 0,
    };
  });
}

export async function getTransactionOverview(): Promise<DailySummary[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const timezone = await getOrgTimezone(supabase, orgId);
  const branchId = await getActiveBranchId(supabase, orgId);
  const { dates, todayStartUTC } = getDateRangeDays(timezone, 7);
  const startDate = dates[0]!;
  const endDate = new Date(todayStartUTC.getTime() + 86_400_000);

  let query = supabase
    .from('sales')
    .select('created_at')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', endDate.toISOString());

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  const { data: sales } = await query;

  const dailyMap = new Map<string, number>();
  for (const sale of sales ?? []) {
    const d = new Date(sale.created_at);
    const key = d.toLocaleDateString('en-CA', { timeZone: timezone });
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
  }

  return dates.map((date) => {
    const key = date.toLocaleDateString('en-CA', { timeZone: timezone });
    return {
      date: key,
      label: formatDateLabel(date, timezone),
      revenue: 0,
      transactions: dailyMap.get(key) ?? 0,
    };
  });
}

export async function getRecentSales(limit: number = 5): Promise<RecentSale[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const branchId = await getActiveBranchId(supabase, orgId);

  if (!branchId) return [];

  const { data: sales } = await supabase
    .from('sales')
    .select(`
      id,
      receipt_number,
      created_at,
      total,
      payment_method,
      sale_items: sale_items(count)
    `)
    .eq('status', 'completed')
    .eq('branch_id', branchId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return (sales ?? []).map((sale) => {
    const items = sale.sale_items as unknown as Array<Record<string, unknown>> | { count: number } | null;
    const itemCount = Array.isArray(items) ? items.length : (typeof items === 'object' && items !== null ? Number((items as { count: number }).count) : 0);
    return {
      id: sale.id,
      receiptNumber: sale.receipt_number,
      createdAt: sale.created_at,
      itemCount,
      paymentMethod: sale.payment_method,
      total: Number(sale.total),
    };
  });
}

export async function getTopProducts(days: number = 30, resultLimit: number = 5): Promise<TopProduct[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const timezone = await getOrgTimezone(supabase, orgId);
  const branchId = await getActiveBranchId(supabase, orgId);

  const { todayStartUTC } = getDateRangeDays(timezone, 1);
  const startDate = new Date(todayStartUTC.getTime() - days * 86_400_000);

  let saleIdsQuery = supabase
    .from('sales')
    .select('id')
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())
    .lt('created_at', todayStartUTC.toISOString());

  if (branchId) {
    saleIdsQuery = saleIdsQuery.eq('branch_id', branchId);
  }

  const { data: sales } = await saleIdsQuery;
  const saleIds = (sales ?? []).map((s) => s.id);

  if (saleIds.length === 0) return [];

  const { data: items } = await supabase
    .from('sale_items')
    .select('item_name, sku, quantity, subtotal')
    .in('sale_id', saleIds);

  const productMap = new Map<string, { name: string; sku: string | null; qty: number; revenue: number }>();
  for (const item of items ?? []) {
    const key = item.item_name;
    const existing = productMap.get(key);
    if (existing) {
      existing.qty += Number(item.quantity);
      existing.revenue += Number(item.subtotal);
    } else {
      productMap.set(key, { name: item.item_name, sku: item.sku, qty: Number(item.quantity), revenue: Number(item.subtotal) });
    }
  }

  return Array.from(productMap.entries())
    .map(([name, data]) => ({
      id: name,
      name: data.name,
      sku: data.sku,
      quantitySold: data.qty,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, resultLimit);
}

export async function getLowStockItems(): Promise<LowStockItem[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const branchId = await getActiveBranchId(supabase, orgId);

  if (!branchId) return [];

  const { data: inventoryItems } = await supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      item: item_id (
        id,
        name,
        sku,
        product: product_id ( id, name, low_stock_threshold )
      )
    `)
    .eq('organization_id', orgId)
    .eq('branch_id', branchId)
    .lt('quantity_on_hand', 10);

  const results: LowStockItem[] = [];
  for (const inv of inventoryItems ?? []) {
    const item = inv.item as unknown as { id: string; name: string; sku: string | null; product: { id: string; name: string; low_stock_threshold: number } };
    if (!item) continue;

    const threshold = item.product.low_stock_threshold ?? 10;
    const qty = Number(inv.quantity_on_hand);

    if (qty < threshold) {
      results.push({
        id: inv.id,
        productName: item.product.name,
        itemName: item.name !== item.product.name ? item.name : null,
        currentStock: qty,
        threshold,
      });
    }
  }

  results.sort((a, b) => a.currentStock - b.currentStock);
  return results.slice(0, 10);
}
