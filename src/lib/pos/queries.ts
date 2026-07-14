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

async function createServerClientForQuery() {
  const cookieStore = await cookies();
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only */ },
    },
  });
}

async function getOrgId(): Promise<string> {
  const supabase = await createServerClientForQuery();
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

export interface PosProductItem {
  id: string;
  product_id: string;
  product_name: string;
  product_type: string;
  name: string;
  sku: string | null;
  selling_price: number;
  allows_decimal: boolean;
  barcode: string | null;
  category_id: string | null;
  category_name: string | null;
  brand_name: string | null;
  quantity_on_hand: number | null;
  image_url: string | null;
  track_inventory: boolean;
}

export interface PosCatalogResult {
  items: PosProductItem[];
  total: number;
}

export async function getPosCatalog(options: {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<PosCatalogResult> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { search, categoryId, page = 1, pageSize = 50 } = options;

  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      product_type,
      track_inventory,
      category_id,
      category:categories(name),
      brand:brands(name),
      unit:units(allows_decimal),
      items:product_items(
        id,
        name,
        sku,
        selling_price,
        status
      )
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .order('name', { ascending: true })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search && search.length >= 1) {
    query = query.or(`name.ilike.%${search}%`);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const items: PosProductItem[] = [];

  for (const p of (data || [])) {
    const unitAllowsDecimal = (p as unknown as { unit: { allows_decimal: boolean } | null })?.unit?.allows_decimal ?? false;
    for (const item of (p.items || [])) {
      if (item.status !== 'active') continue;
      if (item.selling_price == null) continue;
      items.push({
        id: item.id,
        product_id: p.id,
        product_name: p.name,
        product_type: p.product_type,
        name: item.name || p.name,
        sku: item.sku,
        selling_price: Number(item.selling_price),
        allows_decimal: unitAllowsDecimal,
        barcode: null,
        category_id: p.category_id,
        category_name: (p as unknown as { category: { name: string } | null })?.category?.name ?? null,
        brand_name: (p as unknown as { brand: { name: string } | null })?.brand?.name ?? null,
        quantity_on_hand: null,
        image_url: null,
        track_inventory: p.track_inventory,
      });
    }
  }

  return { items, total: count ?? 0 };
}

export async function getPosBranchStock(
  branchId: string,
  itemIds: string[],
): Promise<Record<string, number>> {
  if (itemIds.length === 0) return {};

  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('inventory')
    .select('item_id, quantity_on_hand')
    .eq('organization_id', orgId)
    .eq('branch_id', branchId)
    .in('item_id', itemIds);

  const stock: Record<string, number> = {};
  for (const row of (data || [])) {
    stock[row.item_id] = Number(row.quantity_on_hand);
  }
  return stock;
}

export async function lookupBarcode(barcode: string): Promise<string | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('product_barcodes')
    .select('item_id')
    .eq('organization_id', orgId)
    .eq('barcode', barcode)
    .limit(1);

  return data?.[0]?.item_id ?? null;
}

export async function getPosCategories(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name', { ascending: true });

  return data ?? [];
}

export interface PosReceiptData {
  receipt_number: string;
  org_name: string;
  branch_name: string;
  created_at: string;
  user_name: string | null;
  items: Array<{
    item_name: string;
    sku: string | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
  amount_tendered: number;
  change: number;
}

export async function getReceipt(saleId: string): Promise<PosReceiptData | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data: sale } = await supabase
    .from('sales')
    .select(`
      receipt_number,
      subtotal,
      total,
      created_at,
      user_id,
      branch:branch_id(name),
      organization:organization_id(name)
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
    .select('amount_tendered, change_amount')
    .eq('sale_id', saleId)
    .single();

  return {
    receipt_number: sale.receipt_number,
    org_name: (sale as unknown as { organization: { name: string } }).organization?.name ?? '',
    branch_name: (sale as unknown as { branch: { name: string } }).branch?.name ?? '',
    created_at: sale.created_at,
    user_name: null,
    items: (saleItems || []).map((i) => ({
      item_name: i.item_name,
      sku: i.sku,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      subtotal: Number(i.subtotal),
    })),
    subtotal: Number(sale.subtotal),
    total: Number(sale.total),
    amount_tendered: Number(payment?.amount_tendered ?? 0),
    change: Number(payment?.change_amount ?? 0),
  };
}
