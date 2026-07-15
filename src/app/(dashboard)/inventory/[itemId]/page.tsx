import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, History } from 'lucide-react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getInventoryItemAllBranches, listMovements } from '@/lib/inventory/queries';
import { ItemDetail } from './item-detail';

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

async function getBranchIdMap(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() { /* read-only */ },
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);
  const orgId = members?.[0]?.organization_id;
  if (!orgId) return {};

  const { data } = await supabase
    .from('branches')
    .select('id, name')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const map: Record<string, string> = {};
  for (const b of data ?? []) {
    map[b.name] = b.id;
  }
  return map;
}

function getStockStatus(qty: number, threshold: number): { label: string; className: string } {
  if (qty <= 0) {
    return { label: 'Out of Stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  }
  if (qty <= threshold) {
    return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  }
  return { label: 'In Stock', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PageProps {
  params: Promise<{ itemId: string }>;
}

export default async function InventoryItemPage({ params }: PageProps) {
  const { itemId } = await params;
  const branches = await getInventoryItemAllBranches(itemId);

  if (branches.length === 0) notFound();

  const first = branches[0]!;
  const branchIds = await getBranchIdMap();

  const { movements } = await listMovements({ itemId, page: 1, pageSize: 10 });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{first.productName}</h1>
          {first.itemName && first.itemName !== first.productName && (
            <p className="text-sm text-muted-foreground">{first.itemName}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {branches.map((branch) => {
          const status = getStockStatus(branch.quantityOnHand, branch.lowStockThreshold);
          return (
            <div key={branch.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-medium text-muted-foreground">{branch.branchName}</h2>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">SKU</span>
                  <span className="text-sm font-mono">{branch.sku ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="text-sm">{branch.categoryName ?? '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Quantity on Hand</span>
                  <span className="text-sm font-bold">{branch.quantityOnHand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Low Stock Threshold</span>
                  <span className="text-sm">{branch.lowStockThreshold}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Updated</span>
                  <span className="text-sm text-muted-foreground">{formatDate(branch.updatedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 mb-6">
        <ItemDetail
          branches={branches}
          branchIds={branchIds}
        />
        <Link
          href={`/inventory/movements?itemId=${itemId}`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md border text-sm font-medium hover:bg-muted/50"
        >
          <History className="h-4 w-4" />
          Full History
        </Link>
      </div>

      {movements.length > 0 && (
        <div className="rounded-lg border overflow-hidden">
          <div className="bg-muted/50 px-4 py-3 border-b">
            <h2 className="text-sm font-medium">Recent Movements</h2>
          </div>
          <div className="divide-y">
            {movements.slice(0, 10).map((mov) => {
              return (
                <div key={mov.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{mov.branchName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(mov.createdAt)}
                      {mov.reference ? ` · ${mov.reference.replace(/_/g, ' ')}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium tabular-nums ${mov.quantityChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {mov.quantityChange > 0 ? '+' : ''}{mov.quantityChange}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {mov.quantityBefore} → {mov.quantityAfter}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {movements.length === 0 && (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No movements recorded for this item yet.
        </div>
      )}
    </div>
  );
}
