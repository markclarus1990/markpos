import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SalesTable } from './sales-table';
import { listSales, getSalesSummary } from '@/lib/sales/queries';

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

async function getBranches() {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only */ },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);
  const orgId = members?.[0]?.organization_id;
  if (!orgId) return [];

  const { data } = await supabase
    .from('branches')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('name');
  return data ?? [];
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function SalesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? '';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const statusFilter = params.status ?? '';
  const paymentFilter = params.payment ?? '';
  const branchFilter = params.branch ?? '';
  const sortField = params.sortField ?? 'created_at';
  const sortOrder = params.sortOrder ?? 'desc';
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;

  const [result, summary, branches] = await Promise.all([
    listSales({ search, dateFrom, dateTo, status: statusFilter, paymentMethod: paymentFilter, branchId: branchFilter, sortField, sortOrder, page, pageSize }),
    getSalesSummary({ search, dateFrom, dateTo, status: statusFilter, paymentMethod: paymentFilter, branchId: branchFilter }),
    getBranches(),
  ]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Sales History</h1>
      <SalesTable
        sales={result.sales}
        total={result.total}
        page={page}
        pageSize={pageSize}
        summary={summary}
        branches={branches}
      />
    </div>
  );
}
