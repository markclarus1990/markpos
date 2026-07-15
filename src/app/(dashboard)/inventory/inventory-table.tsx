'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils/cn';
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog';

type SortField = 'product_name' | 'quantity_on_hand' | 'updated_at';
type SortOrder = 'asc' | 'desc';
type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

interface InventoryItem {
  id: string;
  itemId: string;
  productName: string;
  itemName: string;
  sku: string | null;
  categoryName: string | null;
  branchName: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  updatedAt: string;
  createdAt: string;
}

interface BranchOption {
  id: string;
  name: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface Props {
  items: InventoryItem[];
  total: number;
  page: number;
  pageSize: number;
  summary: { totalItems: number; inStock: number; lowStock: number; outOfStock: number };
  branches: BranchOption[];
  categories: CategoryOption[];
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

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

export function InventoryTable({ items, total, page, pageSize, summary, branches, categories }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const search = searchParams.get('search') ?? '';
  const categoryFilter = searchParams.get('category') ?? '';
  const statusFilter = searchParams.get('status') ?? '';
  const branchFilter = searchParams.get('branch') ?? '';
  const sortField = (searchParams.get('sortField') ?? 'product_name') as SortField;
  const sortOrder = (searchParams.get('sortOrder') ?? 'asc') as SortOrder;

  const [searchText, setSearchText] = useState(search);

  const [adjustItem, setAdjustItem] = useState<{
    itemId: string;
    branchId: string;
    productName: string;
    itemName: string;
    branchName: string;
    quantity: number;
    threshold: number;
    status: StockStatus;
    allowsDecimal: boolean;
  } | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function buildParams(overrides: Record<string, string>): string {
    const params = new URLSearchParams();
    const currentSearch = overrides.search ?? search;
    const currentPage = overrides.page ?? String(page);
    if (currentSearch) params.set('search', currentSearch);
    if (overrides.category ?? categoryFilter) params.set('category', overrides.category ?? categoryFilter);
    if (overrides.status ?? statusFilter) params.set('status', overrides.status ?? statusFilter);
    if (overrides.branch ?? branchFilter) params.set('branch', overrides.branch ?? branchFilter);
    if (overrides.sortField ?? sortField) params.set('sortField', overrides.sortField ?? sortField);
    if (overrides.sortOrder ?? sortOrder) params.set('sortOrder', overrides.sortOrder ?? sortOrder);
    if (currentPage !== '1') params.set('page', currentPage);
    return params.toString();
  }

  function handleSearch() {
    router.push(`/inventory?${buildParams({ search: searchText, page: '1' })}`);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      router.push(`/inventory?${buildParams({ search: searchText, page: '1' })}`);
    }
  }

  function setFilter(key: string, value: string) {
    router.push(`/inventory?${buildParams({ [key]: value, page: '1' })}`);
  }

  function goToPage(p: number) {
    router.push(`/inventory?${buildParams({ page: String(p) })}`);
  }

  function toggleSort(field: SortField) {
    const newOrder = field === sortField && sortOrder === 'asc' ? 'desc' : 'asc';
    router.push(`/inventory?${buildParams({ sortField: field, sortOrder: newOrder, page: '1' })}`);
  }

  const handleAdjustSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="inv-search" className="block text-sm font-medium mb-1">Search</label>
            <div className="flex gap-2">
              <input
                id="inv-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Product, item, or SKU..."
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
              <button onClick={handleSearch} className="h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">Search</button>
            </div>
          </div>

          <div>
            <label htmlFor="inv-category" className="block text-sm font-medium mb-1">Category</label>
            <select
              id="inv-category"
              value={categoryFilter}
              onChange={(e) => setFilter('category', e.target.value)}
              className="flex h-10 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="inv-status" className="block text-sm font-medium mb-1">Stock Status</label>
            <select
              id="inv-status"
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
            <label htmlFor="inv-branch" className="block text-sm font-medium mb-1">Branch</label>
            <select
              id="inv-branch"
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

          {(search || categoryFilter || statusFilter || branchFilter) && (
            <div>
              <button
                onClick={() => router.push('/inventory')}
                className="h-10 px-4 rounded-md border text-sm"
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total Tracked</p>
          <p className="text-2xl font-bold">{summary.totalItems}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">In Stock</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{summary.inStock}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{summary.lowStock}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{summary.outOfStock}</p>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50">
                <th
                  className="text-left p-3 text-sm font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('product_name')}
                >
                  Product <SortIcon field="product_name" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="text-left p-3 text-sm font-medium">SKU</th>
                <th className="text-left p-3 text-sm font-medium">Category</th>
                <th className="text-left p-3 text-sm font-medium">Branch</th>
                <th
                  className="text-right p-3 text-sm font-medium cursor-pointer select-none"
                  onClick={() => toggleSort('quantity_on_hand')}
                >
                  Qty <SortIcon field="quantity_on_hand" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="text-center p-3 text-sm font-medium">Status</th>
                <th
                  className="text-right p-3 text-sm font-medium cursor-pointer select-none hidden lg:table-cell"
                  onClick={() => toggleSort('updated_at')}
                >
                  Updated <SortIcon field="updated_at" sortField={sortField} sortOrder={sortOrder} />
                </th>
                <th className="p-3" />
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    {search || categoryFilter || statusFilter || branchFilter
                      ? 'No inventory items match your filters.'
                      : 'No inventory items found.'}
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const status = getStockStatus(item.quantityOnHand, item.lowStockThreshold);
                  return (
                    <tr key={item.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 text-sm">
                        <Link href={`/inventory/${item.itemId}`} className="text-primary hover:underline">
                          {item.productName}
                          {item.itemName && item.itemName !== item.productName ? ` (${item.itemName})` : ''}
                        </Link>
                      </td>
                      <td className="p-3 text-sm font-mono text-muted-foreground">{item.sku ?? '—'}</td>
                      <td className="p-3 text-sm">{item.categoryName ?? '—'}</td>
                      <td className="p-3 text-sm">{item.branchName}</td>
                      <td className="p-3 text-sm text-right font-medium tabular-nums">
                        {item.quantityOnHand}
                      </td>
                      <td className="p-3 text-center">
                        <span className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                          status.className,
                        )}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right text-muted-foreground hidden lg:table-cell">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => setAdjustItem({
                            itemId: item.itemId,
                            branchId: branches.find((b) => b.name === item.branchName)?.id ?? '',
                            productName: item.productName,
                            itemName: item.itemName,
                            branchName: item.branchName,
                            quantity: item.quantityOnHand,
                            threshold: item.lowStockThreshold,
                            status: item.quantityOnHand <= 0 ? 'out_of_stock' : item.quantityOnHand <= item.lowStockThreshold ? 'low_stock' : 'in_stock',
                            allowsDecimal: false,
                          })}
                          className="text-sm text-primary hover:underline"
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                })
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
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            {search || categoryFilter || statusFilter || branchFilter
              ? 'No inventory items match your filters.'
              : 'No inventory items found.'}
          </p>
        ) : (
          items.map((item) => {
            const status = getStockStatus(item.quantityOnHand, item.lowStockThreshold);
            return (
              <div key={item.id} className="rounded-lg border p-4">
                <Link href={`/inventory/${item.itemId}`} className="block">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium">
                      {item.productName}
                      {item.itemName && item.itemName !== item.productName ? ` (${item.itemName})` : ''}
                    </span>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                      status.className,
                    )}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <span>{item.sku ?? '—'}</span>
                    <span>{item.branchName}</span>
                    <span className="font-medium text-foreground">
                      Qty: {item.quantityOnHand}
                    </span>
                  </div>
                </Link>
                <div className="mt-2 pt-2 border-t flex gap-2">
                  <button
                    onClick={() => setAdjustItem({
                      itemId: item.itemId,
                      branchId: branches.find((b) => b.name === item.branchName)?.id ?? '',
                      productName: item.productName,
                      itemName: item.itemName,
                      branchName: item.branchName,
                      quantity: item.quantityOnHand,
                      threshold: item.lowStockThreshold,
                      status: item.quantityOnHand <= 0 ? 'out_of_stock' : item.quantityOnHand <= item.lowStockThreshold ? 'low_stock' : 'in_stock',
                      allowsDecimal: false,
                    })}
                    className="text-xs text-primary hover:underline"
                  >
                    Adjust Stock
                  </button>
                  <Link href={`/inventory/movements?itemId=${item.itemId}`} className="text-xs text-primary hover:underline">
                    History
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {adjustItem && (
        <AdjustStockDialog
          open={!!adjustItem}
          onClose={() => setAdjustItem(null)}
          productName={adjustItem.productName}
          itemName={adjustItem.itemName}
          branchName={adjustItem.branchName}
          currentQuantity={adjustItem.quantity}
          lowStockThreshold={adjustItem.threshold}
          stockStatus={adjustItem.status}
          itemId={adjustItem.itemId}
          branchId={adjustItem.branchId}
          allowsDecimal={adjustItem.allowsDecimal}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </div>
  );
}
