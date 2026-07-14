import { BarChart3, Package, TrendingUp, AlertTriangle, Store } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ChartWidget } from '@/components/dashboard/chart-widget';
import { getKpiSummary } from '@/lib/dashboard/queries';
import { KpiGrid } from './kpi-grid';

export default async function DashboardPage() {
  const kpiData = await getKpiSummary();

  const now = new Date();
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHeader
        greeting="Good morning"
        date={dateFormatter.format(now)}
      />

      <KpiGrid data={kpiData} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartWidget
          title="Sales Overview"
          description="Daily sales trend"
          className="lg:col-span-2"
        >
          <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <BarChart3 className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Sales data will appear once orders are recorded
              </p>
            </div>
          </div>
        </ChartWidget>

        <ChartWidget
          title="Recent Orders"
          viewAllHref="/orders"
        >
          <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <Package className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                No orders yet
              </p>
            </div>
          </div>
        </ChartWidget>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChartWidget title="Best Selling Products">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <TrendingUp className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Product sales data pending
              </p>
            </div>
          </div>
        </ChartWidget>

        <ChartWidget title="Low Stock Alerts">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <AlertTriangle className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Inventory tracking not yet active
              </p>
            </div>
          </div>
        </ChartWidget>

        <ChartWidget title="Branch Comparison">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <Store className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Branch data will appear here
              </p>
            </div>
          </div>
        </ChartWidget>
      </div>
    </div>
  );
}
