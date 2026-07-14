import { AlertTriangle, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { ChartWidget } from '@/components/dashboard/chart-widget';
import { CompactList } from '@/components/dashboard/compact-list';
import { BarChart } from '@/components/dashboard/bar-chart';
import {
  getKpiSummary,
  getSalesOverview,
  getTransactionOverview,
  getRecentSales,
  getTopProducts,
  getLowStockItems,
} from '@/lib/dashboard/queries';
import { KpiGrid } from './kpi-grid';

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default async function DashboardPage() {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dateFormatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const [kpiData, salesOverview, transactionOverview, recentSales, topProducts, lowStockItems] =
    await Promise.all([
      getKpiSummary(),
      getSalesOverview(),
      getTransactionOverview(),
      getRecentSales(5),
      getTopProducts(30, 5),
      getLowStockItems(),
    ]);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <DashboardHeader greeting={greeting} date={dateFormatter.format(now)} />

      <KpiGrid data={kpiData} />

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartWidget
          title="Sales Overview"
          description="Last 7 days"
          className="lg:col-span-2"
        >
          {salesOverview.length > 0 ? (
            <BarChart
              data={salesOverview.map((d) => ({ label: d.label, value: d.revenue }))}
              formatter={(v) => `$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              height={56}
              emptyMessage="No sales data yet"
            />
          ) : (
            <div className="flex h-56 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <TrendingUp className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No sales data yet</p>
              </div>
            </div>
          )}
        </ChartWidget>

        <ChartWidget
          title="Sales Today"
          description="Completed transactions"
        >
          <div className="flex h-56 flex-col items-center justify-center">
            {(() => {
              const todayRevenue = kpiData.dailySales.value ?? 0;
              const todayCount = kpiData.transactions.value ?? 0;
              const avgValue = kpiData.avgOrderValue.value ?? 0;
              return (
                <div className="space-y-4 text-center">
                  <div>
                    <p className="text-3xl font-bold tabular-nums">
                      ${Number(todayRevenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-muted-foreground">Revenue</p>
                  </div>
                  <div className="flex gap-6">
                    <div>
                      <p className="text-xl font-bold tabular-nums">{todayCount}</p>
                      <p className="text-xs text-muted-foreground">Transactions</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold tabular-nums">
                        ${Number(avgValue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg. Value</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </ChartWidget>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <ChartWidget
          title="Transactions"
          description="Last 7 days"
          className="lg:col-span-2"
        >
          {transactionOverview.length > 0 ? (
            <BarChart
              data={transactionOverview.map((d) => ({ label: d.label, value: d.transactions }))}
              height={56}
              emptyMessage="No transactions yet"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <ShoppingCart className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No transactions yet</p>
              </div>
            </div>
          )}
        </ChartWidget>

        <ChartWidget title="Recent Sales">
          {recentSales.length > 0 ? (
            <CompactList
              items={recentSales.map((sale) => ({
                id: sale.id,
                primary: sale.receiptNumber,
                secondary: `${formatTime(sale.createdAt)} \u2022 ${sale.itemCount} item${sale.itemCount !== 1 ? 's' : ''} \u2022 ${sale.paymentMethod}`,
                tertiary: `$${Number(sale.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
              }))}
              emptyMessage="No sales yet"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <Package className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">No sales yet</p>
              </div>
            </div>
          )}
        </ChartWidget>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ChartWidget title="Best Selling Products" description="Last 30 days">
          {topProducts.length > 0 ? (
            <CompactList
              items={topProducts.map((p) => ({
                id: p.id,
                primary: p.name,
                ...(p.sku ? { secondary: `SKU: ${p.sku}` } : {}),
                tertiary: `${p.quantitySold} sold`,
                badge: { label: `$${Number(p.revenue).toLocaleString('en-US', { minimumFractionDigits: 0 })}`, variant: 'success' },
              }))}
              emptyMessage="No product sales data yet"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <TrendingUp className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">Product sales data pending</p>
              </div>
            </div>
          )}
        </ChartWidget>

        <ChartWidget title="Low Stock Alerts">
          {lowStockItems.length > 0 ? (
            <CompactList
              items={lowStockItems.map((item) => ({
                id: item.id,
                primary: item.productName,
                ...(item.itemName ? { secondary: item.itemName } : {}),
                tertiary: `${item.currentStock} / ${item.threshold}`,
                badge: {
                  label: item.currentStock <= 0 ? 'Out of stock' : 'Low stock',
                  variant: item.currentStock <= 0 ? 'danger' : 'warning',
                },
              }))}
              emptyMessage="All products are well-stocked"
            />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <Package className="mx-auto size-8 text-muted-foreground/50" />
                <p className="mt-2 text-sm text-muted-foreground">All products are well-stocked</p>
              </div>
            </div>
          )}
        </ChartWidget>

        <ChartWidget title="Branch Comparison">
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed">
            <div className="text-center">
              <AlertTriangle className="mx-auto size-8 text-muted-foreground/50" />
              <p className="mt-2 text-sm text-muted-foreground">
                Branch comparison will be available with multi-branch setup
              </p>
            </div>
          </div>
        </ChartWidget>
      </div>
    </div>
  );
}
