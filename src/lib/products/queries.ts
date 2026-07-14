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

export async function getOrgId(): Promise<string> {
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

export interface ProductListItem {
  id: string;
  name: string;
  product_type: string;
  status: string;
  item_id: string | null;
  sku: string | null;
  selling_price: number | null;
  category_name: string | null;
  image_url: string | null;
  created_at: string;
}

export interface ProductListResult {
  products: ProductListItem[];
  total: number;
}

export async function listProducts(options: {
  search?: string;
  categoryId?: string;
  brandId?: string;
  status?: string;
  productType?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<ProductListResult> {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const {
    search,
    categoryId,
    brandId,
    status,
    productType,
    page = 1,
    pageSize = 25,
  } = options;

  let query = supabase
    .from('products')
    .select(`
      id,
      name,
      product_type,
      status,
      created_at,
      product_items!inner (
        id,
        sku,
        selling_price
      )
    `, { count: 'exact' })
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search && search.length >= 3) {
    query = query.or(`name.ilike.%${search}%,product_items.sku.ilike.%${search}%`);
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  if (brandId) {
    query = query.eq('brand_id', brandId);
  }
  if (status) {
    query = query.eq('status', status);
  } else {
    query = query.in('status', ['active', 'inactive']);
  }
  if (productType) {
    query = query.eq('product_type', productType);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const products: ProductListItem[] = (data || []).map((p) => ({
    id: p.id,
    name: p.name,
    product_type: p.product_type,
    status: p.status,
    item_id: p.product_items?.[0]?.id ?? null,
    sku: p.product_items?.[0]?.sku ?? null,
    selling_price: p.product_items?.[0]?.selling_price ?? null,
    category_name: null,
    image_url: null,
    created_at: p.created_at,
  }));

  return { products, total: count ?? 0 };
}

export async function getProduct(id: string) {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      category:categories(name),
      brand:brands(name),
      unit:units(name, abbreviation),
      items:product_items(*),
      images:product_images(*),
      barcodes:product_barcodes(*)
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  return product;
}

export async function listCategories() {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  return data ?? [];
}

export async function listBrands() {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('brands')
    .select('*')
    .eq('organization_id', orgId)
    .order('name', { ascending: true });

  return data ?? [];
}

export async function listUnits() {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('units')
    .select('*')
    .or(`is_system.eq.true,organization_id.eq.${orgId}`)
    .order('name', { ascending: true });

  return data ?? [];
}

export async function getProductImages(productId: string) {
  const supabase = await createServerClientForQuery();
  const orgId = await getOrgId();

  const { data } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .eq('organization_id', orgId)
    .order('sort_order', { ascending: true });

  if (!data) return [];

  const supabaseClient = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return []; },
      setAll() {},
    },
  });

  const images = await Promise.all(
    data.map(async (img) => {
      const { data: signedUrl } = await supabaseClient.storage
        .from(img.storage_bucket)
        .createSignedUrl(img.storage_path, 3600);

      return {
        ...img,
        signed_url: signedUrl?.signedUrl ?? null,
      };
    }),
  );

  return images;
}
