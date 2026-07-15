'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PaymentMethodBreakdown } from '@/lib/reports/queries';

interface PaymentsTabProps {
  data: PaymentMethodBreakdown[];
  currencyCode: string;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--info))', 'hsl(var(--warning))', 'hsl(var(--success))'];

export function PaymentsTab({ data, currencyCode }: PaymentsTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const pieData = data.map((d) => ({
    name: d.method.charAt(0).toUpperCase() + d.method.slice(1),
    value: d.totalRevenue,
  }));

  const totalRevenue = data.reduce((sum, d) => sum + d.totalRevenue, 0);
  const totalTransactions = data.reduce((sum, d) => sum + d.transactionCount, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revenue by Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          {pieData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payment data for this period</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length] ?? 'hsl(var(--primary))'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--popover))',
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Payment Method Details</CardTitle>
        </CardHeader>
        <CardContent>
          {data.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No payment data for this period</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Total Revenue: {formatCurrency(totalRevenue)}</span>
                <span>Total Transactions: {totalTransactions}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">Method</th>
                      <th className="pb-2 font-medium text-right">Transactions</th>
                      <th className="pb-2 font-medium text-right">Revenue</th>
                      <th className="pb-2 font-medium text-right">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((pm) => (
                      <tr key={pm.method} className="border-b last:border-0">
                        <td className="py-2 font-medium capitalize">{pm.method}</td>
                        <td className="py-2 text-right">{pm.transactionCount}</td>
                        <td className="py-2 text-right">{formatCurrency(pm.totalRevenue)}</td>
                        <td className="py-2 text-right text-muted-foreground">
                          {totalRevenue > 0
                            ? ((pm.totalRevenue / totalRevenue) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
