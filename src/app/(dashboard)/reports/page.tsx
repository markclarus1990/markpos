import { PageHeader } from '@/components/shared/page-header';

export default function ReportsPage() {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reports"
        description="Analytics and business insights"
      />
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed text-sm text-muted-foreground">
        Reports will be implemented in a future build
      </div>
    </div>
  );
}
