import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { PageHeader } from '@/components/shared/page-header';
import { SettingsTabs } from './settings-tabs';
import { getActiveBranch, getBranchesStaff, getOrganizationRoles } from '@/lib/branches/queries';

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

async function getSettingsData() {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const member = members?.[0];
  if (!member?.organization_id) {
    redirect('/onboarding');
  }

  const orgId = member.organization_id;

  const [orgResult, branchesResult] = await Promise.all([
    supabase
      .from('organizations')
      .select('id, name, email, phone, address, timezone, currency_code')
      .eq('id', orgId)
      .single(),
    supabase
      .from('branches')
      .select('id, name, code, address, phone, email, is_active')
      .eq('organization_id', orgId)
      .order('name'),
  ]);

  if (orgResult.error || !orgResult.data) {
    throw new Error('Failed to load settings');
  }

  const activeBranch = await getActiveBranch(supabase, orgId);
  const roles = await getOrganizationRoles(supabase, orgId);

  const branchIds = (branchesResult.data ?? []).map((b) => b.id);
  const staffMap = await getBranchesStaff(supabase, branchIds);

  return {
    organization: orgResult.data,
    branches: branchesResult.data ?? [],
    activeBranchId: activeBranch?.id ?? null,
    roles,
    staffMap,
    orgId,
  };
}

export default async function SettingsPage() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Settings"
        description="Configure your organization preferences"
      />
      <Suspense fallback={<div className="text-sm text-muted-foreground">Loading settings...</div>}>
        <SettingsTabs
          organization={data.organization}
          branches={data.branches}
          orgId={data.orgId}
          activeBranchId={data.activeBranchId}
          roles={data.roles}
          staffMap={data.staffMap}
        />
      </Suspense>
    </div>
  );
}
