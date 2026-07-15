import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getActiveBranch } from '@/lib/branches/queries';

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

export async function ServerActiveBranch() {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only */ },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const orgId = members?.[0]?.organization_id;
  if (!orgId) return null;

  const activeBranch = await getActiveBranch(supabase, orgId);
  if (!activeBranch) return null;

  const { data: allBranches } = await supabase
    .from('branches')
    .select('id, name, code')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');

  const branchData = {
    activeBranchId: activeBranch.id,
    activeBranchName: activeBranch.name,
    activeBranchCode: activeBranch.code,
    branches: allBranches ?? [],
  };

  const safeJson = JSON.stringify(branchData).replace(/<\//g, '<\\/');

  return (
    <script
      id="server-active-branch"
      type="application/json"
      dangerouslySetInnerHTML={{ __html: safeJson }}
    />
  );
}
