import { PageHeader } from '@/components/shared/page-header';
import { listBrands } from '@/lib/products/queries';
import { BrandList } from '@/components/products/brand-list';

export default async function BrandsPage() {
  const brands = await listBrands();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Brands"
        description="Manage product brands"
      />

      <BrandList brands={brands} />
    </div>
  );
}
