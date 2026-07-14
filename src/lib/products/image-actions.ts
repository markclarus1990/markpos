'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { randomUUID } from 'crypto';

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

interface UploadResult {
  error?: string;
  success?: string;
  imageId?: string;
  url?: string;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

function getExtension(mimeType: string): string {
  switch (mimeType) {
    case 'image/jpeg': return 'jpg';
    case 'image/png': return 'png';
    case 'image/webp': return 'webp';
    default: return 'jpg';
  }
}

export async function uploadProductImage(
  productId: string,
  formData: FormData,
): Promise<UploadResult> {
  try {
    const orgId = await getOrgId();
    const file = formData.get('file') as File | null;

    if (!file) {
      return { error: 'No file provided' };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return { error: 'File must be JPEG, PNG, or WebP' };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { error: 'File must be under 2MB after compression' };
    }

    const ext = getExtension(file.type);
    const fileName = `${randomUUID()}.${ext}`;
    const storagePath = `${orgId}/${productId}/${fileName}`;

    const supabase = await createServerClientForAction();

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` };
    }

    const { data: imageResult, error: rpcError } = await supabase.rpc('add_product_image', {
      p_org_id: orgId,
      p_product_id: productId,
      p_storage_bucket: 'product-images',
      p_storage_path: storagePath,
      p_alt_text: (formData.get('altText') as string) || null,
      p_sort_order: formData.get('sortOrder') ? Number(formData.get('sortOrder')) : 0,
    });

    if (rpcError || !imageResult?.success) {
      // Clean up storage on DB failure
      await supabase.storage.from('product-images').remove([storagePath]);
      return { error: imageResult?.error ?? rpcError?.message ?? 'Failed to save image metadata' };
    }

    const { data: signedUrl } = await supabase.storage
      .from('product-images')
      .createSignedUrl(storagePath, 3600);

    revalidatePath(`/products/${productId}`);
    const signedUrlValue = signedUrl?.signedUrl;
    return {
      success: 'Image uploaded',
      imageId: imageResult.image_id,
      ...(signedUrlValue ? { url: signedUrlValue } : {}),
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to upload image' };
  }
}

export async function deleteProductImage(
  imageId: string,
  productId: string,
): Promise<{ error?: string; success?: string }> {
  try {
    const orgId = await getOrgId();
    const supabase = await createServerClientForAction();

    const { data: result, error: rpcError } = await supabase.rpc('delete_product_image', {
      p_org_id: orgId,
      p_image_id: imageId,
    });

    if (rpcError || !result?.success) {
      return { error: result?.error ?? rpcError?.message ?? 'Failed to delete image' };
    }

    // Clean up storage
    if (result.storage_path) {
      await supabase.storage
        .from(result.storage_bucket ?? 'product-images')
        .remove([result.storage_path]);
    }

    revalidatePath(`/products/${productId}`);
    return { success: 'Image deleted' };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Failed to delete image' };
  }
}
