import { getPosCatalog, getPosCategories } from '@/lib/pos/queries';
import { PosTerminal } from './pos-terminal';

export default async function POSPage() {
  const [catalog, categories] = await Promise.all([
    getPosCatalog({ pageSize: 200 }),
    getPosCategories(),
  ]);

  return (
    <PosTerminal
      initialItems={catalog.items}
      initialTotal={catalog.total}
      categories={categories}
    />
  );
}
