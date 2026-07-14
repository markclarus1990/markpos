import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getProduct, listCategories, listBrands, listUnits } from '@/lib/products/queries';
import { ProductForm } from '@/components/products/product-form';
import Link from 'next/link';
import { archiveProduct, restoreProduct } from '@/lib/products/actions';
import { ProductStatusBadge } from '@/components/products/product-status-badge';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProduct(id);

  if (!product) notFound();

  const [categories, brands, units] = await Promise.all([
    listCategories(),
    listBrands(),
    listUnits(),
  ]);

  const isArchived = product.status === 'archived';

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <PageHeader title={product.name} description="Product details" />
          <ProductStatusBadge status={product.status} />
        </div>
        <div className="flex gap-2">
          {!isArchived ? (
            <form
              action={async () => {
                'use server';
                await archiveProduct(id);
              }}
            >
              <Button type="submit" variant="outline">Archive</Button>
            </form>
          ) : (
            <form
              action={async () => {
                'use server';
                await restoreProduct(id);
              }}
            >
              <Button type="submit" variant="outline">Restore</Button>
            </form>
          )}
          <Link href="/products">
            <Button variant="ghost">Back</Button>
          </Link>
        </div>
      </div>

      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        units={units.map((u) => ({ id: u.id, name: `${u.name} (${u.abbreviation})` }))}
        initialData={{
          id: product.id,
          name: product.name,
          description: product.description,
          categoryId: product.category_id,
          brandId: product.brand_id,
          unitId: product.unit_id,
          productType: product.product_type,
          trackInventory: product.track_inventory,
          lowStockThreshold: product.low_stock_threshold,
          items: (product.items || []).map((item: { id: string; name: string | null; sku: string | null; cost_price: number | null; selling_price: number | null; sort_order: number }) => ({
            id: item.id,
            name: item.name ?? '',
            sku: item.sku ?? '',
            costPrice: item.cost_price,
            sellingPrice: item.selling_price,
            sortOrder: item.sort_order,
            barcode: '',
            barcodeType: 'ean13',
          })),
        }}
      />
    </div>
  );
}
