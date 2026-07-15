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

export interface SaleListItem {
  id: string;
  receiptNumber: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  branchName: string | null;
  itemCount: number;
}

export interface SalesListResult {
  sales: SaleListItem[];
  total: number;
}

export interface SalesSummary {
  totalRevenue: number;
  transactionCount: number;
  avgTransactionValue: number;
}

export interface SaleDetail {
  id: string;
  receiptNumber: string;
  status: string;
  createdAt: string;
  branchName: string | null;
  orgName: string | null;
  subtotal: number;
  total: number;
  paymentMethod: string;
  amountTendered: number;
  changeAmount: number;
  items: Array<{
    itemName: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
}

export interface ReceiptData {
  receiptNumber: string;
  orgName: string;
  branchName: string;
  createdAt: string;
  items: Array<{
    itemName: string;
    sku: string | null;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
  amountTendered: number;
  change: number;
  paymentMethod: string;
}

const VALID_SORT_FIELDS = ['created_at', 'total'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

interface ListSalesOptions {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  paymentMethod?: string;
  branchId?: string;
  sortField?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export async function listSales(options: ListSalesOptions = {}): Promise<SalesListResult> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const activeBranchId = await getActiveBranchId(supabase, orgId);

  const {
    search,
    dateFrom,
    dateTo,
    status,
    paymentMethod,
    branchId,
    sortField: rawSortField,
    sortOrder: rawSortOrder,
    page = 1,
    pageSize = 25,
  } = options;

  const sortField: SortField = VALID_SORT_FIELDS.includes(rawSortField as SortField)
    ? (rawSortField as SortField)
    : 'created_at';

  const sortOrder = VALID_SORT_ORDERS.includes(rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    ? (rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    : 'desc';

  const branch = branchId ?? activeBranchId;

  let baseQuery = supabase
    .from('sales')
    .select(`
      id,
      receipt_number,
      created_at,
      total,
      status,
      payment_method,
      branch: branch_id ( name )
    `, { count: 'exact' })
    .order(sortField, { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (branch) {
    baseQuery = baseQuery.eq('branch_id', branch);
  }

  if (search && search.trim().length >= 1) {
    baseQuery = baseQuery.ilike('receipt_number', `%${search.trim()}%`);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (!isNaN(fromDate.getTime())) {
      baseQuery = baseQuery.gte('created_at', fromDate.toISOString());
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (!isNaN(toDate.getTime())) {
      const endOfDay = new Date(toDate.getTime() + 86_400_000);
      baseQuery = baseQuery.lt('created_at', endOfDay.toISOString());
    }
  }

  if (status) {
    baseQuery = baseQuery.eq('status', status);
  }

  if (paymentMethod) {
    baseQuery = baseQuery.eq('payment_method', paymentMethod);
  }

  const { data: sales, error, count } = await baseQuery;

  if (error) throw error;

  const saleIds = (sales ?? []).map((s) => s.id);

  const itemCountMap = new Map<string, number>();
  if (saleIds.length > 0) {
    const { data: items } = await supabase
      .from('sale_items')
      .select('sale_id')
      .in('sale_id', saleIds);

    for (const item of items ?? []) {
      itemCountMap.set(item.sale_id, (itemCountMap.get(item.sale_id) ?? 0) + 1);
    }
  }

  return {
    total: count ?? 0,
    sales: (sales ?? []).map((sale) => ({
      id: sale.id,
      receiptNumber: sale.receipt_number,
      createdAt: sale.created_at,
      total: Number(sale.total),
      status: sale.status,
      paymentMethod: sale.payment_method,
      branchName: (sale as unknown as { branch: { name: string } | null })?.branch?.name ?? null,
      itemCount: itemCountMap.get(sale.id) ?? 0,
    })),
  };
}

export async function getSalesSummary(options: ListSalesOptions = {}): Promise<SalesSummary> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const activeBranchId = await getActiveBranchId(supabase, orgId);

  const {
    search,
    dateFrom,
    dateTo,
    status,
    paymentMethod,
    branchId,
  } = options;

  const branch = branchId ?? activeBranchId;

  let query = supabase
    .from('sales')
    .select('total');

  if (branch) {
    query = query.eq('branch_id', branch);
  }

  if (search && search.trim().length >= 1) {
    query = query.ilike('receipt_number', `%${search.trim()}%`);
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (!isNaN(fromDate.getTime())) {
      query = query.gte('created_at', fromDate.toISOString());
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (!isNaN(toDate.getTime())) {
      const endOfDay = new Date(toDate.getTime() + 86_400_000);
      query = query.lt('created_at', endOfDay.toISOString());
    }
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (paymentMethod) {
    query = query.eq('payment_method', paymentMethod);
  }

  const { data: sales } = await query;

  let totalRevenue = 0;
  let transactionCount = 0;
  for (const sale of sales ?? []) {
    totalRevenue += Number(sale.total);
    transactionCount++;
  }

  return {
    totalRevenue,
    transactionCount,
    avgTransactionValue: transactionCount > 0 ? totalRevenue / transactionCount : 0,
  };
}

export async function getSale(saleId: string): Promise<SaleDetail | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      id,
      receipt_number,
      status,
      created_at,
      subtotal,
      total,
      payment_method,
      branch: branch_id ( name ),
      organization: organization_id ( name )
    `)
    .eq('id', saleId)
    .eq('organization_id', orgId)
    .single();

  if (!sale) return null;

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('item_name, sku, quantity, unit_price, subtotal')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true });

  const { data: payment } = await supabase
    .from('payments')
    .select('payment_method, amount_tendered, change_amount')
    .eq('sale_id', saleId)
    .single();

  return {
    id: sale.id,
    receiptNumber: sale.receipt_number,
    status: sale.status,
    createdAt: sale.created_at,
    branchName: (sale as unknown as { branch: { name: string } | null })?.branch?.name ?? null,
    orgName: (sale as unknown as { organization: { name: string } | null })?.organization?.name ?? null,
    subtotal: Number(sale.subtotal),
    total: Number(sale.total),
    paymentMethod: payment?.payment_method ?? sale.payment_method,
    amountTendered: Number(payment?.amount_tendered ?? 0),
    changeAmount: Number(payment?.change_amount ?? 0),
    items: (saleItems ?? []).map((i) => ({
      itemName: i.item_name,
      sku: i.sku,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
  };
}

export async function getSaleReceipt(saleId: string): Promise<ReceiptData | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      receipt_number,
      subtotal,
      total,
      created_at,
      payment_method,
      branch: branch_id ( name ),
      organization: organization_id ( name )
    `)
    .eq('id', saleId)
    .eq('organization_id', orgId)
    .single();

  if (!sale) return null;

  const { data: saleItems } = await supabase
    .from('sale_items')
    .select('item_name, sku, quantity, unit_price, subtotal')
    .eq('sale_id', saleId)
    .order('created_at', { ascending: true });

  const { data: payment } = await supabase
    .from('payments')
    .select('payment_method, amount_tendered, change_amount')
    .eq('sale_id', saleId)
    .single();

  return {
    receiptNumber: sale.receipt_number,
    orgName: (sale as unknown as { organization: { name: string } }).organization?.name ?? '',
    branchName: (sale as unknown as { branch: { name: string } }).branch?.name ?? '',
    createdAt: sale.created_at,
    items: (saleItems ?? []).map((i) => ({
      itemName: i.item_name,
      sku: i.sku,
      quantity: Number(i.quantity),
      unitPrice: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
    subtotal: Number(sale.subtotal),
    total: Number(sale.total),
    amountTendered: Number(payment?.amount_tendered ?? 0),
    change: Number(payment?.change_amount ?? 0),
    paymentMethod: payment?.payment_method ?? sale.payment_method,
  };
}
