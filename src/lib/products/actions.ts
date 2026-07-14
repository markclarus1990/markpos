'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import {
  createProductSchema,
  updateProductSchema,
  categorySchema,
  brandSchema,
  validateBarcode,
} from '@/lib/validations/products';
import { generateSlug } from '@/lib/validations/slug';

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

async function getOrgId(): Promise<string> {
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
  return member.organization_id;
}

// ============ CATEGORIES ============

export async function createCategory(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      slug: formData.get('slug'),
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : 0,
    };

    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const orgId = await getOrgId();
    const slug = parsed.data.slug || generateSlug(parsed.data.name);

    const supabase = await createServerClientForAction();
    const { error } = await supabase
      .from('categories')
      .insert({
        organization_id: orgId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
        sort_order: parsed.data.sortOrder,
      });

    if (error) return { error: error.message };
    revalidatePath('/categories');
    return { success: 'Category created' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create category' };
  }
}

export async function updateCategory(
  id: string,
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      sortOrder: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : 0,
    };

    const parsed = categorySchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('categories')
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        sort_order: parsed.data.sortOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/categories');
    return { success: 'Category updated' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update category' };
  }
}

export async function archiveCategory(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('categories')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/categories');
    return { success: 'Category archived' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to archive category' };
  }
}

export async function restoreCategory(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('categories')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/categories');
    return { success: 'Category restored' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to restore category' };
  }
}

// ============ BRANDS ============

export async function createBrand(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
      slug: formData.get('slug'),
    };

    const parsed = brandSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const orgId = await getOrgId();
    const slug = parsed.data.slug || generateSlug(parsed.data.name);

    const supabase = await createServerClientForAction();
    const { error } = await supabase
      .from('brands')
      .insert({
        organization_id: orgId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description || null,
      });

    if (error) return { error: error.message };
    revalidatePath('/brands');
    return { success: 'Brand created' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create brand' };
  }
}

export async function updateBrand(
  id: string,
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const raw = {
      name: formData.get('name'),
      description: formData.get('description'),
    };

    const parsed = brandSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid input' };
    }

    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('brands')
      .update({
        name: parsed.data.name,
        description: parsed.data.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/brands');
    return { success: 'Brand updated' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update brand' };
  }
}

export async function archiveBrand(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('brands')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/brands');
    return { success: 'Brand archived' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to archive brand' };
  }
}

export async function restoreBrand(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { error } = await supabase
      .from('brands')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId);

    if (error) return { error: error.message };
    revalidatePath('/brands');
    return { success: 'Brand restored' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to restore brand' };
  }
}

// ============ PRODUCTS ============

export async function createProduct(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string; productId?: string }> {
  try {
    const productType = formData.get('productType') as string;
    const rawItems = formData.get('items') as string;

    const items = rawItems ? JSON.parse(rawItems) : [];

    const raw = {
      name: formData.get('name'),
      description: formData.get('description') || undefined,
      categoryId: formData.get('categoryId') || undefined,
      brandId: formData.get('brandId') || undefined,
      unitId: formData.get('unitId') || undefined,
      productType,
      trackInventory: formData.get('trackInventory') === 'true',
      lowStockThreshold: formData.get('lowStockThreshold')
        ? Number(formData.get('lowStockThreshold'))
        : 10,
      items,
    };

    const parsed = createProductSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid product input' };
    }

    for (const item of items) {
      if (item.barcode && item.barcodeType) {
        const barcodeErr = validateBarcode(item.barcode, item.barcodeType);
        if (barcodeErr) return { error: `${item.name || 'Item'}: ${barcodeErr}` };
      }
    }

    const orgId = await getOrgId();

    const supabase = await createServerClientForAction();
    const { data, error } = await supabase.rpc('create_product_catalog_entry', {
      p_org_id: orgId,
      p_product_type: parsed.data.productType,
      p_name: parsed.data.name,
      p_category_id: parsed.data.categoryId || null,
      p_brand_id: parsed.data.brandId || null,
      p_unit_id: parsed.data.unitId || null,
      p_description: parsed.data.description || null,
      p_track_inventory: parsed.data.trackInventory ?? true,
      p_low_stock_threshold: parsed.data.lowStockThreshold ?? 10,
      p_items: JSON.parse(JSON.stringify(parsed.data.items)),
      p_status: 'active',
    });

    if (error) return { error: error.message };
    if (!data?.success) return { error: data?.error ?? 'Failed to create product' };

    revalidatePath('/products');
    return { success: 'Product created', productId: data.product_id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to create product' };
  }
}

export async function updateProduct(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  try {
    const rawItems = formData.get('items') as string;
    const items = rawItems ? JSON.parse(rawItems) : null;

    const raw = {
      id: formData.get('id') as string,
      name: formData.get('name') as string || undefined,
      description: formData.get('description') as string || undefined,
      categoryId: formData.get('categoryId') as string || undefined,
      brandId: formData.get('brandId') as string || undefined,
      unitId: formData.get('unitId') as string || undefined,
      productType: formData.get('productType') as string || undefined,
      trackInventory: formData.get('trackInventory') === 'true' ? true : undefined,
      lowStockThreshold: formData.get('lowStockThreshold')
        ? Number(formData.get('lowStockThreshold'))
        : undefined,
    };

    const parsed = updateProductSchema.safeParse(raw);
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? 'Invalid product input' };
    }

    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { data, error } = await supabase.rpc('update_product_catalog_entry', {
      p_org_id: orgId,
      p_product_id: parsed.data.id,
      p_name: parsed.data.name || null,
      p_category_id: parsed.data.categoryId ?? null,
      p_brand_id: parsed.data.brandId ?? null,
      p_unit_id: parsed.data.unitId ?? null,
      p_description: parsed.data.description ?? null,
      p_track_inventory: parsed.data.trackInventory ?? null,
      p_low_stock_threshold: parsed.data.lowStockThreshold ?? null,
      p_items: items ? JSON.parse(JSON.stringify(items)) : null,
      p_status: null,
    });

    if (error) return { error: error.message };
    if (!data?.success) return { error: data?.error ?? 'Failed to update product' };

    revalidatePath('/products');
    return { success: 'Product updated' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to update product' };
  }
}

export async function archiveProduct(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { data, error } = await supabase.rpc('archive_product', {
      p_org_id: orgId,
      p_product_id: id,
    });

    if (error) return { error: error.message };
    if (!data?.success) return { error: data?.error ?? 'Failed to archive product' };

    revalidatePath('/products');
    return { success: 'Product archived' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to archive product' };
  }
}

export async function restoreProduct(
  id: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { data, error } = await supabase.rpc('restore_product', {
      p_org_id: orgId,
      p_product_id: id,
    });

    if (error) return { error: error.message };
    if (!data?.success) return { error: data?.error ?? 'Failed to restore product' };

    revalidatePath('/products');
    return { success: 'Product restored' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to restore product' };
  }
}
