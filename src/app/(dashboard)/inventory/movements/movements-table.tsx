'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { cn } from '@/lib/utils/cn';

interface Movement {
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

interface BranchOption {
  id: string;
  name: string;
}

interface MovementTypeOption {
  value: string;
  label: string;
}

interface Props {
  movements: Movement[];
  total: number;
  page: number;
  pageSize: number;
  branches: BranchOption[];
  movementTypes: MovementTypeOption[];
  initialItemId?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function movementTypeClass(type: string): string {
  switch (type) {
    case 'sale': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    case 'adjustment': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'purchase': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'return': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
    case 'transfer_in': return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    case 'transfer_out': return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

export function MovementsTable({ movements, total, page, pageSize, branches, movementTypes, initialItemId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const typeFilter = searchParams.get('type') ?? '';
  const branchFilter = searchParams.get('branch') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const itemId = searchParams.get('itemId') ?? initialItemId ?? '';
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc');
  const [searchText, setSearchText] = useState(search);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildParams(overrides: Record<string, string>): string {
    const params = new URLSearchParams();
    const currentSearch = overrides.search ?? search;
    const currentPage = overrides.page ?? String(page);
    if (currentSearch) params.set('search', currentSearch);
    if (overrides.type ?? typeFilter) params.set('type', overrides.type ?? typeFilter);
    if (overrides.branch ?? branchFilter) params.set('branch', overrides.branch ?? branchFilter);
    if (overrides.dateFrom ?? dateFrom) params.set('dateFrom', overrides.dateFrom ?? dateFrom);
    if (overrides.dateTo ?? dateTo) params.set('dateTo', overrides.dateTo ?? dateTo);
    if (overrides.itemId ?? itemId) params.set('itemId', overrides.itemId ?? itemId);
    if (overrides.sortOrder ?? sortOrder) params.set('sortOrder', overrides.sortOrder ?? sortOrder);
    if (currentPage !== '1') params.set('page', currentPage);
    return params.toString();
  }

  function handleSearch() {
    router.push(`/inventory/movements?${buildParams({ search: searchText, page: '1' })}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      router.push(`/inventory/movements?${buildParams({ search: searchText, page: '1' })}`);
    }
  }

  function setFilter(key: string, value: string) {
    router.push(`/inventory/movements?${buildParams({ [key]: value, page: '1' })}`);
  }

  function goToPage(p: number) {
    router.push(`/inventory/movements?${buildParams({ page: String(p) })}`);
  }

  function toggleSortOrder() {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    router.push(`/inventory/movements?${buildParams({ sortOrder: newOrder, page: '1' })}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="mov-search" className="block text-sm font-medium mb-1">Search Product</label>
            <div className="flex gap-2">
              <input
                id="mov-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Product name or SKU..."
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button onClick={handleSearch} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Search</button>
            </div>
          </div>

          <div>
            <label htmlFor="mov-type" className="block text-sm font-medium mb-1">Type</label>
            <select
              id="mov-type"
              value={typeFilter}
              onChange={(e) => setFilter('type', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            >
              {movementTypes.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mov-branch" className="block text-sm font-medium mb-1">Branch</label>
            <select
              id="mov-branch"
              value={branchFilter}
              onChange={(e) => setFilter('branch', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="mov-dateFrom" className="block text-sm font-medium mb-1">From</label>
            <input
              id="mov-dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="mov-dateTo" className="block text-sm font-medium mb-1">To</label>
            <input
              id="mov-dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          {(search || typeFilter || branchFilter || dateFrom || dateTo) && (
            <div>
              <button
                onClick={() => router.push('/inventory/movements')}
                className="h-10 px-4 rounded-md border text-sm"
              >
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th
                  className="text-left p-3 text-sm font-medium cursor-pointer select-none"
                  onClick={toggleSortOrder}
                >
                  Date {sortOrder === 'desc' ? '↓' : '↑'}
                </th>
                <th className="text-left p-3 text-sm font-medium">Product</th>
                <th className="text-left p-3 text-sm font-medium">Branch</th>
                <th className="text-left p-3 text-sm font-medium">Type</th>
                <th className="text-right p-3 text-sm font-medium">Change</th>
                <th className="text-right p-3 text-sm font-medium hidden md:table-cell">Before</th>
                <th className="text-right p-3 text-sm font-medium hidden md:table-cell">After</th>
                <th className="text-left p-3 text-sm font-medium hidden lg:table-cell">Reason</th>
                <th className="text-left p-3 text-sm font-medium hidden xl:table-cell">By</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-muted-foreground">
                    {search || typeFilter || branchFilter || dateFrom || dateTo
                      ? 'No movements match your filters.'
                      : 'No inventory movements recorded yet.'}
                  </td>
                </tr>
              ) : (
                movements.map((mov) => (
                  <tr key={mov.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 text-sm whitespace-nowrap">{formatDate(mov.createdAt)}</td>
                    <td className="p-3 text-sm">
                      {mov.productName}
                      {mov.itemName && mov.itemName !== mov.productName ? ` (${mov.itemName})` : ''}
                      {mov.sku && <span className="ml-1 text-xs text-muted-foreground font-mono">{mov.sku}</span>}
                    </td>
                    <td className="p-3 text-sm">{mov.branchName}</td>
                    <td className="p-3 text-sm">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                        movementTypeClass(mov.movementType),
                      )}>
                        {mov.movementType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={cn(
                      'p-3 text-sm text-right font-medium tabular-nums',
                      mov.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                    )}>
                      {mov.quantityChange > 0 ? '+' : ''}{mov.quantityChange}
                    </td>
                    <td className="p-3 text-sm text-right tabular-nums hidden md:table-cell">{mov.quantityBefore}</td>
                    <td className="p-3 text-sm text-right tabular-nums hidden md:table-cell">{mov.quantityAfter}</td>
                    <td className="p-3 text-sm text-muted-foreground hidden lg:table-cell">
                      {mov.reference ? mov.reference.replace(/_/g, ' ') : '—'}
                    </td>
                    <td className="p-3 text-sm text-muted-foreground hidden xl:table-cell">{mov.createdByName ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="block sm:hidden space-y-3">
        {movements.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search || typeFilter || branchFilter || dateFrom || dateTo
              ? 'No movements match your filters.'
              : 'No inventory movements recorded yet.'}
          </p>
        ) : (
          movements.map((mov) => (
            <div key={mov.id} className="rounded-lg border p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium">{mov.productName}</span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                  movementTypeClass(mov.movementType),
                )}>
                  {mov.movementType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{mov.branchName}</span>
                <span className={cn(
                  'font-medium tabular-nums',
                  mov.quantityChange > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400',
                )}>
                  {mov.quantityChange > 0 ? '+' : ''}{mov.quantityChange}
                </span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatDate(mov.createdAt)}</span>
                <span>{mov.quantityBefore} → {mov.quantityAfter}</span>
              </div>
              {mov.reference && (
                <p className="text-xs text-muted-foreground mt-1">{mov.reference.replace(/_/g, ' ')}</p>
              )}
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(page - 1)}
              disabled={page <= 1}
              className="h-9 px-3 rounded-md border text-sm disabled:opacity-40"
            >
              Previous
            </button>
            <button
              onClick={() => goToPage(page + 1)}
              disabled={page >= totalPages}
              className="h-9 px-3 rounded-md border text-sm disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
