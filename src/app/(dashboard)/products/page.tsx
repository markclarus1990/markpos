import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { listProducts, listCategories } from '@/lib/products/queries';
import { ProductTable } from '@/components/products/product-table';

interface PageProps {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    status?: string;
    productType?: string;
    page?: string;
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;

  const [result, categories] = await Promise.all([
    listProducts({
      ...(params.search ? { search: params.search } : {}),
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.productType ? { productType: params.productType } : {}),
      page,
    }),
    listCategories(),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Products"
          description="Manage your product catalog"
        />
        <Link href="/products/new">
          <Button>Add Product</Button>
        </Link>
      </div>

      <ProductTable
        products={result.products}
        total={result.total}
        currentPage={page}
        categories={categories}
        {...(params.search ? { search: params.search } : {})}
        {...(params.categoryId ? { categoryId: params.categoryId } : {})}
        {...(params.status ? { status: params.status } : {})}
        {...(params.productType ? { productType: params.productType } : {})}
      />
    </div>
  );
}
