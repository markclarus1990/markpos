import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { type DateRange, getDailyBuckets, formatShortDate, formatDateLabel } from './date-utils';

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

async function createClientForQuery() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
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

export interface SalesKpiData {
  totalRevenue: number;
  transactionCount: number;
  avgOrderValue: number;
  voidRevenue: number;
  voidCount: number;
  refundRevenue: number;
  refundCount: number;
}

export interface DailyRevenuePoint {
  date: string;
  label: string;
  revenue: number;
  transactions: number;
}

export interface SalesOverviewData {
  kpis: SalesKpiData;
  dailyTrend: DailyRevenuePoint[];
}

export interface ProductPerformanceItem {
  name: string;
  sku: string | null;
  quantitySold: number;
  revenue: number;
}

export interface PaymentMethodBreakdown {
  method: string;
  transactionCount: number;
  totalRevenue: number;
}

export interface InventoryStatusData {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface MovementTotals {
  sale: number;
  purchase: number;
  adjustment: number;
  returned: number;
  transferIn: number;
  transferOut: number;
  other: number;
}

export interface BranchPerformanceItem {
  branchId: string;
  branchName: string;
  revenue: number;
  transactions: number;
  avgOrderValue: number;
}

export interface ReportsData {
  salesOverview: SalesOverviewData;
  productPerformance: ProductPerformanceItem[];
  paymentMethods: PaymentMethodBreakdown[];
  inventoryStatus: InventoryStatusData;
  movementTotals: MovementTotals;
  branchPerformance: BranchPerformanceItem[];
}

export async function getSalesOverviewData(
  timezone: string,
  orgId: string,
  dateRange: DateRange,
): Promise<SalesOverviewData> {
  const supabase = await createClientForQuery();

  const completedQuery = supabase
    .from('sales')
    .select('total, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

  const voidQuery = supabase
    .from('sales')
    .select('total')
    .eq('organization_id', orgId)
    .eq('status', 'voided')
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

  const refundQuery = supabase
    .from('sales')
    .select('total')
    .eq('organization_id', orgId)
    .eq('status', 'refunded')
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

  const [completedRes, voidRes, refundRes] = await Promise.all([
    completedQuery,
    voidQuery,
    refundQuery,
  ]);

  const completedSales = completedRes.data ?? [];
  let totalRevenue = 0;
  for (const sale of completedSales) {
    totalRevenue += Number(sale.total);
  }

  const transactionCount = completedSales.length;
  const avgOrderValue = transactionCount > 0 ? totalRevenue / transactionCount : 0;

  let voidRevenue = 0;
  for (const sale of voidRes.data ?? []) {
    voidRevenue += Number(sale.total);
  }

  let refundRevenue = 0;
  for (const sale of refundRes.data ?? []) {
    refundRevenue += Number(sale.total);
  }

  const dailyMap = new Map<string, { revenue: number; transactions: number }>();
  for (const sale of completedSales) {
    const d = new Date(sale.created_at);
    const key = d.toLocaleDateString('en-CA', { timeZone: timezone });
    const entry = dailyMap.get(key) ?? { revenue: 0, transactions: 0 };
    entry.revenue += Number(sale.total);
    entry.transactions += 1;
    dailyMap.set(key, entry);
  }

  const buckets = getDailyBuckets(dateRange.start, dateRange.end);
  const dailyTrend: DailyRevenuePoint[] = buckets.map((date) => {
    const key = formatShortDate(date, timezone);
    const data = dailyMap.get(key) ?? { revenue: 0, transactions: 0 };
    return {
      date: key,
      label: formatDateLabel(date, timezone),
      revenue: data.revenue,
      transactions: data.transactions,
    };
  });

  return {
    kpis: {
      totalRevenue,
      transactionCount,
      avgOrderValue,
      voidRevenue,
      voidCount: voidRes.data?.length ?? 0,
      refundRevenue,
      refundCount: refundRes.data?.length ?? 0,
    },
    dailyTrend,
  };
}

export async function getProductPerformanceData(
  timezone: string,
  orgId: string,
  dateRange: DateRange,
  resultLimit: number = 20,
): Promise<ProductPerformanceItem[]> {
  const supabase = await createClientForQuery();

  const { data: sales } = await supabase
    .from('sales')
    .select('id')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

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
      productMap.set(key, {
        name: item.item_name,
        sku: item.sku,
        qty: Number(item.quantity),
        revenue: Number(item.subtotal),
      });
    }
  }

  return Array.from(productMap.entries())
    .map(([_, data]) => ({
      name: data.name,
      sku: data.sku,
      quantitySold: data.qty,
      revenue: data.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, resultLimit);
}

export async function getPaymentMethodData(
  orgId: string,
  dateRange: DateRange,
): Promise<PaymentMethodBreakdown[]> {
  const supabase = await createClientForQuery();

  const { data: sales } = await supabase
    .from('sales')
    .select('payment_method, total')
    .eq('organization_id', orgId)
    .eq('status', 'completed')
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

  const methodMap = new Map<string, { count: number; revenue: number }>();
  for (const sale of sales ?? []) {
    const method = sale.payment_method ?? 'Unknown';
    const entry = methodMap.get(method) ?? { count: 0, revenue: 0 };
    entry.count += 1;
    entry.revenue += Number(sale.total);
    methodMap.set(method, entry);
  }

  return Array.from(methodMap.entries())
    .map(([method, data]) => ({
      method,
      transactionCount: data.count,
      totalRevenue: data.revenue,
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export async function getInventoryStatusData(orgId: string): Promise<InventoryStatusData> {
  const supabase = await createClientForQuery();

  const { data: items } = await supabase
    .from('inventory')
    .select('quantity_on_hand')
    .eq('organization_id', orgId);

  const totalItems = items?.length ?? 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const inv of items ?? []) {
    const qty = Number(inv.quantity_on_hand);
    if (qty <= 0) {
      outOfStock++;
    } else if (qty < 10) {
      lowStock++;
    } else {
      inStock++;
    }
  }

  return { totalItems, inStock, lowStock, outOfStock };
}

export async function getMovementSummaryData(
  orgId: string,
  dateRange: DateRange,
): Promise<MovementTotals> {
  const supabase = await createClientForQuery();

  const { data: movements } = await supabase
    .from('inventory_movements')
    .select('movement_type, quantity_change')
    .eq('organization_id', orgId)
    .gte('created_at', dateRange.start.toISOString())
    .lt('created_at', dateRange.end.toISOString());

  const totals: MovementTotals = {
    sale: 0,
    purchase: 0,
    adjustment: 0,
    returned: 0,
    transferIn: 0,
    transferOut: 0,
    other: 0,
  };

  for (const m of movements ?? []) {
    const type = m.movement_type as keyof MovementTotals;
    const change = Math.abs(Number(m.quantity_change));
    if (type in totals) {
      totals[type] += change;
    } else {
      totals.other += change;
    }
  }

  return totals;
}

export async function getBranchPerformanceData(
  orgId: string,
  dateRange: DateRange,
): Promise<BranchPerformanceItem[]> {
  const supabase = await createClientForQuery();

  const [branchesRes, salesRes] = await Promise.all([
    supabase.from('branches').select('id, name').eq('organization_id', orgId),
    supabase
      .from('sales')
      .select('branch_id, total')
      .eq('organization_id', orgId)
      .eq('status', 'completed')
      .gte('created_at', dateRange.start.toISOString())
      .lt('created_at', dateRange.end.toISOString()),
  ]);

  const branchMap = new Map<string, { name: string; revenue: number; count: number }>();
  for (const branch of branchesRes.data ?? []) {
    branchMap.set(branch.id, { name: branch.name, revenue: 0, count: 0 });
  }

  for (const sale of salesRes.data ?? []) {
    const entry = branchMap.get(sale.branch_id);
    if (entry) {
      entry.revenue += Number(sale.total);
      entry.count += 1;
    }
  }

  return Array.from(branchMap.entries())
    .map(([branchId, data]) => ({
      branchId,
      branchName: data.name,
      revenue: data.revenue,
      transactions: data.count,
      avgOrderValue: data.count > 0 ? data.revenue / data.count : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getReportsData(dateRange: DateRange): Promise<ReportsData> {
  const supabase = await createClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data: org } = await supabase
    .from('organizations')
    .select('timezone')
    .eq('id', orgId)
    .single();
  const timezone = org?.timezone ?? 'UTC';

  const [salesOverview, productPerformance, paymentMethods, inventoryStatus, movementTotals, branchPerformance] =
    await Promise.all([
      getSalesOverviewData(timezone, orgId, dateRange),
      getProductPerformanceData(timezone, orgId, dateRange),
      getPaymentMethodData(orgId, dateRange),
      getInventoryStatusData(orgId),
      getMovementSummaryData(orgId, dateRange),
      getBranchPerformanceData(orgId, dateRange),
    ]);

  return {
    salesOverview,
    productPerformance,
    paymentMethods,
    inventoryStatus,
    movementTotals,
    branchPerformance,
  };
}
