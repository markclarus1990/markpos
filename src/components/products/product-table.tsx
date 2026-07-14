'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCallback, useState } from 'react';
import { ProductStatusBadge } from '@/components/products/product-status-badge';

interface ProductItem {
  id: string;
  name: string;
  product_type: string;
  status: string;
  item_id: string | null;
  sku: string | null;
  selling_price: number | null;
  category_name: string | null;
  image_url: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface ProductTableProps {
  products: ProductItem[];
  total: number;
  currentPage: number;
  categories: Category[];
  search?: string;
  categoryId?: string;
  status?: string;
  productType?: string;
}

const PAGE_SIZE = 25;

export function ProductTable({
  products,
  total,
  currentPage,
  categories,
  search: initialSearch,
  categoryId: initialCategoryId,
  status: initialStatus,
  productType: initialProductType,
}: ProductTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(initialSearch ?? '');

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const buildUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value) sp.set(key, value);
        else sp.delete(key);
      });
      const qs = sp.toString();
      return `/products${qs ? `?${qs}` : ''}`;
    },
    [searchParams],
  );

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = searchValue.trim();
      if (trimmed && trimmed.length < 3) return;
      router.push(buildUrl({ search: trimmed || undefined, page: undefined }));
    },
    [searchValue, router, buildUrl],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | undefined) => {
      router.push(buildUrl({ [key]: value, page: undefined }));
    },
    [router, buildUrl],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      router.push(buildUrl({ page: page > 1 ? String(page) : undefined }));
    },
    [router, buildUrl],
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex gap-2 sm:max-w-sm">
          <Input
            placeholder="Search name or SKU (min 3 chars)..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>

        <select
          value={initialCategoryId ?? ''}
          onChange={(e) => handleFilterChange('categoryId', e.target.value || undefined)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={initialStatus ?? ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Active/Inactive</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={initialProductType ?? ''}
          onChange={(e) => handleFilterChange('productType', e.target.value || undefined)}
          className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">All Types</option>
          <option value="simple">Simple</option>
          <option value="variant">Variant</option>
          <option value="service">Service</option>
        </select>
      </div>

      {/* Desktop Table */}
      <div className="hidden overflow-x-auto rounded-lg border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">SKU</th>
              <th className="px-4 py-3 text-left font-medium">Type</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Price</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No products found
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <Link href={`/products/${p.id}`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sku ?? '—'}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{p.product_type}</td>
                  <td className="px-4 py-3">
                    <ProductStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.selling_price != null
                      ? `$${Number(p.selling_price).toFixed(2)}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/products/${p.id}`}>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="space-y-3 md:hidden">
        {products.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No products found
          </div>
        ) : (
          products.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="flex items-center gap-4 rounded-lg border p-4 hover:bg-muted/30"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  {p.sku ?? 'No SKU'} · {p.product_type}
                </p>
              </div>
              <div className="text-right">
                <ProductStatusBadge status={p.status} />
                {p.selling_price != null && (
                  <p className="mt-1 text-sm font-medium">
                    ${Number(p.selling_price).toFixed(2)}
                  </p>
                )}
              </div>
            </Link>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
