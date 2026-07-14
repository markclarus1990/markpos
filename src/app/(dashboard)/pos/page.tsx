import { PageHeader } from '@/components/shared/page-header';

export default function POSPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Point of Sale"
        description="Process sales and manage transactions"
      />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        POS terminal will be implemented in a future build
      </div>
    </div>
  );
}
