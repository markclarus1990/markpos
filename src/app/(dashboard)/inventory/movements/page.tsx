import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { listMovements } from '@/lib/inventory/queries';
import { MovementsTable } from './movements-table';

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

const MOVEMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'sale', label: 'Sale' },
  { value: 'purchase', label: 'Purchase' },
  { value: 'return', label: 'Return' },
  { value: 'transfer_in', label: 'Transfer In' },
  { value: 'transfer_out', label: 'Transfer Out' },
];

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function MovementsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const search = params.search ?? '';
  const movementType = params.type ?? '';
  const branchFilter = params.branch ?? '';
  const dateFrom = params.dateFrom ?? '';
  const dateTo = params.dateTo ?? '';
  const itemId = params.itemId ?? '';
  const sortOrder = params.sortOrder ?? 'desc';
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 25;

  const [result, branches] = await Promise.all([
    listMovements({ search, movementType, branchId: branchFilter, dateFrom, dateTo, itemId, sortOrder, page, pageSize }),
    getBranches(),
  ]);

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold">Movement History</h1>
      </div>
      <MovementsTable
        movements={result.movements}
        total={result.total}
        page={page}
        pageSize={pageSize}
        branches={branches}
        movementTypes={MOVEMENT_TYPES}
        initialItemId={itemId}
      />
    </div>
  );
}
