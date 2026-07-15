'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { DollarSign, Receipt, TrendingUp, Ban, RotateCcw } from 'lucide-react';
import type { SalesOverviewData } from '@/lib/reports/queries';

interface SalesOverviewTabProps {
  data: SalesOverviewData;
  currencyCode: string;
}

export function SalesOverviewTab({ data, currencyCode }: SalesOverviewTabProps) {
  const { kpis, dailyTrend } = data;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const chartData = dailyTrend.map((d) => ({
    label: d.label,
    revenue: d.revenue,
  }));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(kpis.totalRevenue)}
          icon={<DollarSign className="size-4" />}
        />
        <StatCard
          title="Transactions"
          value={kpis.transactionCount}
          icon={<Receipt className="size-4" />}
        />
        <StatCard
          title="Avg Order Value"
          value={formatCurrency(kpis.avgOrderValue)}
          icon={<TrendingUp className="size-4" />}
        />
        <StatCard
          title="Voided"
          value={`${kpis.voidCount} (${formatCurrency(kpis.voidRevenue)})`}
          icon={<Ban className="size-4" />}
        />
        <StatCard
          title="Refunded"
          value={`${kpis.refundCount} (${formatCurrency(kpis.refundRevenue)})`}
          icon={<RotateCcw className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Daily Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) =>
                    new Intl.NumberFormat('en-US', {
                      notation: 'compact',
                      compactDisplay: 'short',
                    }).format(v)
                  }
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    background: 'hsl(var(--popover))',
                  }}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
