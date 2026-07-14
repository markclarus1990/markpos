import { PageHeader } from '@/components/shared/page-header';
import { listCategories, listBrands, listUnits } from '@/lib/products/queries';
import { ProductForm } from '@/components/products/product-form';

export default async function NewProductPage() {
  const [categories, brands, units] = await Promise.all([
    listCategories(),
    listBrands(),
    listUnits(),
  ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="New Product"
        description="Add a new product to your catalog"
      />
      <ProductForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        brands={brands.map((b) => ({ id: b.id, name: b.name }))}
        units={units.map((u) => ({ id: u.id, name: `${u.name} (${u.abbreviation})` }))}
      />
    </div>
  );
}
