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

async function getActiveBranchId(supabase: ReturnType<typeof createServerClient>, orgId: string): Promise<string | null> {
  const { data } = await supabase
    .from('branches')
    .select('id')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1);
  return data?.[0]?.id ?? null;
}

export interface InventoryItem {
  id: string;
  itemId: string;
  productName: string;
  itemName: string;
  sku: string | null;
  categoryName: string | null;
  branchName: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  updatedAt: string;
  createdAt: string;
}

export interface InventorySummary {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface MovementItem {
  id: string;
  createdAt: string;
  productName: string;
  itemName: string;
  sku: string | null;
  branchName: string;
  movementType: string;
  quantityChange: number;
  quantityBefore: number;
  quantityAfter: number;
  reference: string | null;
  notes: string | null;
  createdByName: string | null;
}

export interface InventoryListResult {
  items: InventoryItem[];
  total: number;
}

export interface MovementListResult {
  movements: MovementItem[];
  total: number;
}

const VALID_SORT_FIELDS = ['product_name', 'quantity_on_hand', 'updated_at'] as const;
type SortField = (typeof VALID_SORT_FIELDS)[number];

const VALID_SORT_ORDERS = ['asc', 'desc'] as const;

interface ListInventoryOptions {
  search?: string;
  categoryId?: string;
  stockStatus?: string;
  branchId?: string;
  sortField?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

interface ListMovementsOptions {
  search?: string;
  movementType?: string;
  branchId?: string;
  dateFrom?: string;
  dateTo?: string;
  itemId?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export async function getBranches(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data } = await supabase
    .from('branches')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}

export async function getCategories(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data } = await supabase
    .from('categories')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  return data ?? [];
}

export async function listInventory(options: ListInventoryOptions = {}): Promise<InventoryListResult> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const activeBranchId = await getActiveBranchId(supabase, orgId);

  const {
    search,
    categoryId,
    stockStatus,
    branchId,
    sortField: rawSortField,
    sortOrder: rawSortOrder,
    page = 1,
    pageSize = 25,
  } = options;

  const branch = branchId ?? activeBranchId;

  const VALID_STOCK_STATUSES = ['in_stock', 'low_stock', 'out_of_stock'] as const;

  let query = supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      updated_at,
      created_at,
      item: item_id (
        id,
        name,
        sku,
        product: product_id (
          id,
          name,
          track_inventory,
          low_stock_threshold,
          category: category_id ( name )
        )
      ),
      branch: branch_id ( name )
    `, { count: 'exact' })
    .eq('organization_id', orgId);

  if (branch) {
    query = query.eq('branch_id', branch);
  }

  const { data, error } = await query;

  if (error) throw error;

  let items: InventoryItem[] = (data ?? []).map((row) => {
    const item = row.item as unknown as {
      id: string;
      name: string;
      sku: string | null;
      product: {
        id: string;
        name: string;
        track_inventory: boolean;
        low_stock_threshold: number;
        category: { name: string } | null;
      };
    } | null;

    const branchObj = row.branch as unknown as { name: string } | null;

    return {
      id: row.id,
      itemId: row.item_id,
      productName: item?.product?.name ?? 'Unknown',
      itemName: item?.name ?? '',
      sku: item?.sku ?? null,
      categoryName: item?.product?.category?.name ?? null,
      branchName: branchObj?.name ?? 'Unknown',
      quantityOnHand: Number(row.quantity_on_hand),
      lowStockThreshold: item?.product?.low_stock_threshold ?? 10,
      trackInventory: item?.product?.track_inventory ?? true,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  });

  if (search && search.trim().length >= 1) {
    const q = search.trim().toLowerCase();
    items = items.filter((i) =>
      i.productName.toLowerCase().includes(q) ||
      i.itemName.toLowerCase().includes(q) ||
      (i.sku && i.sku.toLowerCase().includes(q)),
    );
  }

  if (categoryId) {
    items = items.filter((i) => {
      const row = (data ?? []).find((r) => r.id === i.id);
      if (!row) return false;
      const item = row.item as unknown as {
        product: { category_id: string | null };
      } | null;
      return item?.product && 'category_id' in item.product
        ? (item.product as unknown as { category_id: string | null }).category_id === categoryId
        : false;
    });
  }

  if (stockStatus && VALID_STOCK_STATUSES.includes(stockStatus as typeof VALID_STOCK_STATUSES[number])) {
    items = items.filter((i) => {
      if (i.quantityOnHand <= 0) return stockStatus === 'out_of_stock';
      if (i.quantityOnHand <= i.lowStockThreshold) return stockStatus === 'low_stock';
      return stockStatus === 'in_stock';
    });
  }

  const sortField: SortField = VALID_SORT_FIELDS.includes(rawSortField as SortField)
    ? (rawSortField as SortField)
    : 'product_name';

  const sortOrder = VALID_SORT_ORDERS.includes(rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    ? (rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    : 'asc';

  items.sort((a, b) => {
    let cmp = 0;
    if (sortField === 'product_name') {
      cmp = a.productName.localeCompare(b.productName);
    } else if (sortField === 'quantity_on_hand') {
      cmp = a.quantityOnHand - b.quantityOnHand;
    } else if (sortField === 'updated_at') {
      cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return { items: paged, total };
}

export async function getInventorySummary(options: Omit<ListInventoryOptions, 'sortField' | 'sortOrder' | 'page' | 'pageSize'> = {}): Promise<InventorySummary> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const activeBranchId = await getActiveBranchId(supabase, orgId);

  const { search, categoryId, stockStatus, branchId } = options;
  const branch = branchId ?? activeBranchId;

  let query = supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      item: item_id (
        product: product_id (
          id,
          low_stock_threshold,
          track_inventory
        )
      )
    `)
    .eq('organization_id', orgId);

  if (branch) {
    query = query.eq('branch_id', branch);
  }

  const { data } = await query;

  if (!data) {
    return { totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0 };
  }

  let filtered = data;

  if (search && search.trim().length >= 1) {
    const { data: searchData } = await supabase
      .from('product_items')
      .select('id, name, sku, product: product_id(name)')
      .eq('organization_id', orgId)
      .ilike('product.name', `%${search.trim()}%`);

    const matchingItemIds = new Set((searchData ?? []).map((r) => r.id));
    filtered = filtered.filter((r) => matchingItemIds.has(r.item_id));
  }

  if (categoryId) {
    const { data: catData } = await supabase
      .from('product_items')
      .select('id, product_id')
      .eq('organization_id', orgId);

    const catProductIds = new Set(
      (catData ?? [])
        .filter((r) => {
          const prod = r as unknown as { product: { category_id: string } };
          return prod.product?.category_id === categoryId;
        })
        .map((r) => r.product_id),
    );

    filtered = filtered.filter((r) => {
      const item = r.item as unknown as { product: { id: string } };
      return item?.product && catProductIds.has(item.product.id);
    });
  }

  let totalItems = 0;
  let inStock = 0;
  let lowStock = 0;
  let outOfStock = 0;

  for (const row of filtered) {
    const item = row.item as unknown as {
      product: { low_stock_threshold: number; track_inventory: boolean };
    } | null;
    if (!item?.product) continue;
    if (!item.product.track_inventory) continue;

    const qty = Number(row.quantity_on_hand);
    const threshold = item.product.low_stock_threshold ?? 10;

    totalItems++;
    if (qty <= 0) {
      outOfStock++;
    } else if (qty <= threshold) {
      lowStock++;
    } else {
      inStock++;
    }
  }

  if (stockStatus === 'out_of_stock') totalItems = outOfStock;
  else if (stockStatus === 'low_stock') totalItems = lowStock;
  else if (stockStatus === 'in_stock') totalItems = inStock;

  return { totalItems, inStock, lowStock, outOfStock };
}

export async function getInventoryItem(itemId: string): Promise<InventoryItem | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);
  const activeBranchId = await getActiveBranchId(supabase, orgId);

  const { data } = await supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      updated_at,
      created_at,
      item: item_id (
        id,
        name,
        sku,
        product: product_id (
          id,
          name,
          track_inventory,
          low_stock_threshold,
          category: category_id ( name )
        )
      ),
      branch: branch_id ( name )
    `)
    .eq('organization_id', orgId)
    .eq('item_id', itemId);

  if (!data || data.length === 0) return null;

  const branchRows = data.map((row) => {
    const item = row.item as unknown as {
      id: string;
      name: string;
      sku: string | null;
      product: {
        id: string;
        name: string;
        track_inventory: boolean;
        low_stock_threshold: number;
        category: { name: string } | null;
      };
    } | null;

    const branchObj = row.branch as unknown as { name: string } | null;

    return {
      id: row.id,
      itemId: row.item_id,
      productName: item?.product?.name ?? 'Unknown',
      itemName: item?.name ?? '',
      sku: item?.sku ?? null,
      categoryName: item?.product?.category?.name ?? null,
      branchName: branchObj?.name ?? 'Unknown',
      quantityOnHand: Number(row.quantity_on_hand),
      lowStockThreshold: item?.product?.low_stock_threshold ?? 10,
      trackInventory: item?.product?.track_inventory ?? true,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  });

  if (activeBranchId) {
    return branchRows.find((r) => r.branchName === (data.find((d) => d.id === r.id)?.branch as unknown as { name: string })?.name) ?? branchRows[0] ?? null;
  }

  return branchRows[0] ?? null;
}

export async function getInventoryItemByBranch(itemId: string, branchId: string): Promise<InventoryItem | null> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data } = await supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      updated_at,
      created_at,
      item: item_id (
        id,
        name,
        sku,
        product: product_id (
          id,
          name,
          track_inventory,
          low_stock_threshold,
          category: category_id ( name )
        )
      ),
      branch: branch_id ( name )
    `)
    .eq('organization_id', orgId)
    .eq('item_id', itemId)
    .eq('branch_id', branchId);

  const row = data?.[0];
  if (!row) return null;

  const item = row.item as unknown as {
    id: string;
    name: string;
    sku: string | null;
    product: {
      id: string;
      name: string;
      track_inventory: boolean;
      low_stock_threshold: number;
      category: { name: string } | null;
    };
  } | null;

  const branchObj = row.branch as unknown as { name: string } | null;

  return {
    id: row.id,
    itemId: row.item_id,
    productName: item?.product?.name ?? 'Unknown',
    itemName: item?.name ?? '',
    sku: item?.sku ?? null,
    categoryName: item?.product?.category?.name ?? null,
    branchName: branchObj?.name ?? 'Unknown',
    quantityOnHand: Number(row.quantity_on_hand),
    lowStockThreshold: item?.product?.low_stock_threshold ?? 10,
    trackInventory: item?.product?.track_inventory ?? true,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

export async function getInventoryItemAllBranches(itemId: string): Promise<InventoryItem[]> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const { data } = await supabase
    .from('inventory')
    .select(`
      id,
      item_id,
      quantity_on_hand,
      updated_at,
      created_at,
      item: item_id (
        id,
        name,
        sku,
        product: product_id (
          id,
          name,
          track_inventory,
          low_stock_threshold,
          category: category_id ( name )
        )
      ),
      branch: branch_id ( name )
    `)
    .eq('organization_id', orgId)
    .eq('item_id', itemId);

  return (data ?? []).map((row) => {
    const item = row.item as unknown as {
      id: string;
      name: string;
      sku: string | null;
      product: {
        id: string;
        name: string;
        track_inventory: boolean;
        low_stock_threshold: number;
        category: { name: string } | null;
      };
    } | null;

    const branchObj = row.branch as unknown as { name: string } | null;

    return {
      id: row.id,
      itemId: row.item_id,
      productName: item?.product?.name ?? 'Unknown',
      itemName: item?.name ?? '',
      sku: item?.sku ?? null,
      categoryName: item?.product?.category?.name ?? null,
      branchName: branchObj?.name ?? 'Unknown',
      quantityOnHand: Number(row.quantity_on_hand),
      lowStockThreshold: item?.product?.low_stock_threshold ?? 10,
      trackInventory: item?.product?.track_inventory ?? true,
      updatedAt: row.updated_at,
      createdAt: row.created_at,
    };
  });
}

export async function listMovements(options: ListMovementsOptions = {}): Promise<MovementListResult> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId(supabase);

  const {
    search,
    movementType,
    branchId,
    dateFrom,
    dateTo,
    itemId,
    sortOrder: rawSortOrder,
    page = 1,
    pageSize = 25,
  } = options;

  const sortOrder = VALID_SORT_ORDERS.includes(rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    ? (rawSortOrder as (typeof VALID_SORT_ORDERS)[number])
    : 'desc';

  let query = supabase
    .from('inventory_movements')
    .select(`
      id,
      movement_type,
      quantity_change,
      quantity_before,
      quantity_after,
      reference,
      notes,
      created_at,
      created_by,
      item: item_id (
        id,
        name,
        sku,
        product: product_id ( name )
      ),
      branch: branch_id ( name )
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: sortOrder === 'asc' })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (branchId) {
    query = query.eq('branch_id', branchId);
  }

  if (movementType) {
    query = query.eq('movement_type', movementType);
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

  if (itemId) {
    query = query.eq('item_id', itemId);
  }

  if (search && search.trim().length >= 1) {
    const q = search.trim().toLowerCase();
    const { data: matchedItems } = await supabase
      .from('product_items')
      .select('id')
      .eq('organization_id', orgId)
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`);

    const matchedIds = (matchedItems ?? []).map((r) => r.id);
    if (matchedIds.length > 0) {
      query = query.in('item_id', matchedIds);
    } else {
      query = query.eq('item_id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const userIds = [...new Set((data ?? []).map((r) => r.created_by).filter(Boolean))];
  const userMap = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);

    for (const p of profiles ?? []) {
      userMap.set(p.id, p.full_name ?? 'Unknown');
    }
  }

  return {
    total: count ?? 0,
    movements: (data ?? []).map((row) => {
      const item = row.item as unknown as {
        id: string;
        name: string;
        sku: string | null;
        product: { name: string };
      } | null;

      const branchObj = row.branch as unknown as { name: string } | null;

      return {
        id: row.id,
        createdAt: row.created_at,
        productName: item?.product?.name ?? 'Unknown',
        itemName: item?.name ?? '',
        sku: item?.sku ?? null,
        branchName: branchObj?.name ?? 'Unknown',
        movementType: row.movement_type,
        quantityChange: Number(row.quantity_change),
        quantityBefore: Number(row.quantity_before),
        quantityAfter: Number(row.quantity_after),
        reference: row.reference,
        notes: row.notes,
        createdByName: userMap.get(row.created_by) ?? null,
      };
    }),
  };
}
