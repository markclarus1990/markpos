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

async function checkAuth() {
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
  return { supabase, user, orgId: member.organization_id };
}

export async function getOrganizationSettings() {
  const { supabase, orgId } = await checkAuth();

  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, email, phone, address, timezone, currency_code')
    .eq('id', orgId)
    .single();

  if (error || !data) throw new Error('Failed to load organization settings');
  return data;
}

export async function getOrganizationBranches() {
  const { supabase, orgId } = await checkAuth();

  const { data, error } = await supabase
    .from('branches')
    .select('id, name, code, address, phone, email, is_active')
    .eq('organization_id', orgId)
    .order('name');

  if (error) throw new Error('Failed to load branches');
  return data ?? [];
}
