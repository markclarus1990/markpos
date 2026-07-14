import { PageHeader } from '@/components/shared/page-header';
import { listCategories } from '@/lib/products/queries';
import { CategoryList } from '@/components/products/category-list';

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Categories"
          description="Organize your products into categories"
        />
      </div>

      <CategoryList categories={categories} />
    </div>
  );
}
