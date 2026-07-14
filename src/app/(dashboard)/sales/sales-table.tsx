'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type SortField = 'created_at' | 'total';
type SortOrder = 'asc' | 'desc';

interface Sale {
  id: string;
  receiptNumber: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  branchName: string | null;
  itemCount: number;
}

interface BranchOption {
  id: string;
  name: string;
}

interface Props {
  sales: Sale[];
  total: number;
  page: number;
  pageSize: number;
  summary: { totalRevenue: number; transactionCount: number; avgTransactionValue: number };
  branches: BranchOption[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'voided', label: 'Voided' },
];

const PAYMENT_OPTIONS = [
  { value: '', label: 'All Methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
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

function SortIcon({ field, sortField, sortOrder }: { field: SortField; sortField: SortField; sortOrder: SortOrder }) {
  if (field !== sortField) return <span className="ml-1 text-muted-foreground/30">↑↓</span>;
  return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
}

export function SalesTable({ sales, total, page, pageSize, summary, branches }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const dateFrom = searchParams.get('dateFrom') ?? '';
  const dateTo = searchParams.get('dateTo') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const paymentFilter = searchParams.get('payment') ?? '';
  const branchFilter = searchParams.get('branch') ?? '';
  const sortField = (searchParams.get('sortField') ?? 'created_at') as SortField;
  const sortOrder = (searchParams.get('sortOrder') ?? 'desc') as SortOrder;

  const [searchText, setSearchText] = useState(search);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildParams(overrides: Record<string, string>): string {
    const params = new URLSearchParams();
    const currentSearch = overrides.search ?? search;
    const currentPage = overrides.page ?? String(page);
    if (currentSearch) params.set('search', currentSearch);
    if (overrides.dateFrom ?? dateFrom) params.set('dateFrom', overrides.dateFrom ?? dateFrom);
    if (overrides.dateTo ?? dateTo) params.set('dateTo', overrides.dateTo ?? dateTo);
    if (overrides.status ?? statusFilter) params.set('status', overrides.status ?? statusFilter);
    if (overrides.payment ?? paymentFilter) params.set('payment', overrides.payment ?? paymentFilter);
    if (overrides.branch ?? branchFilter) params.set('branch', overrides.branch ?? branchFilter);
    if (overrides.sortField ?? sortField) params.set('sortField', overrides.sortField ?? sortField);
    if (overrides.sortOrder ?? sortOrder) params.set('sortOrder', overrides.sortOrder ?? sortOrder);
    if (currentPage !== '1') params.set('page', currentPage);
    return params.toString();
  }

  function handleSearch() {
    router.push(`/sales?${buildParams({ search: searchText, page: '1' })}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      router.push(`/sales?${buildParams({ search: searchText, page: '1' })}`);
    }
  }

  function setFilter(key: string, value: string) {
    router.push(`/sales?${buildParams({ [key]: value, page: '1' })}`);
  }

  function goToPage(p: number) {
    router.push(`/sales?${buildParams({ page: String(p) })}`);
  }

  function toggleSort(field: SortField) {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    router.push(`/sales?${buildParams({ sortField: field, sortOrder: newOrder, page: '1' })}`);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="search" className="block text-sm font-medium mb-1">Search Receipt</label>
            <div className="flex gap-2">
              <input
                id="search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Receipt number..."
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button onClick={handleSearch} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Search</button>
            </div>
          </div>

          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium mb-1">From</label>
            <input
              id="dateFrom"
              type="date"
              value={dateFrom}
              onChange={(e) => setFilter('dateFrom', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium mb-1">To</label>
            <input
              id="dateTo"
              type="date"
              value={dateTo}
              onChange={(e) => setFilter('dateTo', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium mb-1">Status</label>
            <select
              id="status"
              value={statusFilter}
              onChange={(e) => setFilter('status', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="payment" className="block text-sm font-medium mb-1">Payment</label>
            <select
              id="payment"
              value={paymentFilter}
              onChange={(e) => setFilter('payment', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            >
              {PAYMENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium mb-1">Branch</label>
            <select
              id="branch"
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
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Revenue</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Transactions</p>
          <p className="text-2xl font-bold">{summary.transactionCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Avg Transaction</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.avgTransactionValue)}</p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th
                  className="text-left p-3 text-sm font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('created_at')}
                >
                  Date <SortIcon field="created_at" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="text-left p-3 text-sm font-medium">Receipt</th>
                <th className="text-left p-3 text-sm font-medium">Branch</th>
                <th className="text-left p-3 text-sm font-medium">Items</th>
                <th className="text-left p-3 text-sm font-medium">Status</th>
                <th className="text-left p-3 text-sm font-medium">Payment</th>
                <th
                  className="text-right p-3 text-sm font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('total')}
                >
                  Total <SortIcon field="total" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">No sales found.</td>
                </tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id} className="border-t hover:bg-muted/30">
                    <td className="p-3 text-sm whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                    <td className="p-3 text-sm font-mono">{sale.receiptNumber}</td>
                    <td className="p-3 text-sm">{sale.branchName ?? '—'}</td>
                    <td className="p-3 text-sm">{sale.itemCount}</td>
                    <td className="p-3 text-sm">
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                        sale.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        sale.status === 'refunded' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        sale.status === 'voided' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      )}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-3 text-sm capitalize">{sale.paymentMethod}</td>
                    <td className="p-3 text-sm text-right font-medium">{formatCurrency(sale.total)}</td>
                    <td className="p-3 text-right">
                      <Link
                        href={`/sales/${sale.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
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

      <div className="block sm:hidden space-y-3">
        {sales.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No sales found.</p>
        ) : (
          sales.map((sale) => (
            <Link key={sale.id} href={`/sales/${sale.id}`} className="block rounded-lg border p-4 hover:bg-muted/30">
              <div className="flex justify-between items-start mb-2">
                <span className="font-mono text-sm">{sale.receiptNumber}</span>
                <span className="text-sm font-medium">{formatCurrency(sale.total)}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatDate(sale.createdAt)}</span>
                <span className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  sale.status === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                  sale.status === 'refunded' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                  sale.status === 'voided' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                )}>
                  {sale.status}
                </span>
              </div>
              <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                <span>{sale.branchName ?? '—'}</span>
                <span>{sale.itemCount} items</span>
                <span className="capitalize">{sale.paymentMethod}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
