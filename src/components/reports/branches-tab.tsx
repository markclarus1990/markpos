'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BranchPerformanceItem } from '@/lib/reports/queries';

interface BranchesTabProps {
  data: BranchPerformanceItem[];
  currencyCode: string;
}

export function BranchesTab({ data, currencyCode }: BranchesTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const totalRevenue = data.reduce((sum, b) => sum + b.revenue, 0);
  const totalTransactions = data.reduce((sum, b) => sum + b.transactions, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Branch Performance</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No branch data available</p>
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
                    <th className="pb-2 font-medium">Branch</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                    <th className="pb-2 font-medium text-right">Transactions</th>
                    <th className="pb-2 font-medium text-right">Avg Order Value</th>
                    <th className="pb-2 font-medium text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((branch) => (
                    <tr key={branch.branchId} className="border-b last:border-0">
                      <td className="py-2 font-medium">{branch.branchName}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(branch.revenue)}</td>
                      <td className="py-2 text-right">{branch.transactions}</td>
                      <td className="py-2 text-right">{formatCurrency(branch.avgOrderValue)}</td>
                      <td className="py-2 text-right text-muted-foreground">
                        {totalRevenue > 0
                          ? ((branch.revenue / totalRevenue) * 100).toFixed(1)
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
  );
}
