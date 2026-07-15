'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ProductPerformanceItem } from '@/lib/reports/queries';

interface ProductsTabProps {
  data: ProductPerformanceItem[];
  currencyCode: string;
}

export function ProductsTab({ data, currencyCode }: ProductsTabProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const byRevenue = [...data].sort((a, b) => b.revenue - a.revenue);
  const byQuantity = [...data].sort((a, b) => b.quantitySold - a.quantitySold);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Products by Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {byRevenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No product data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium text-right">Qty Sold</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byRevenue.slice(0, 10).map((product) => (
                    <tr key={product.name} className="border-b last:border-0">
                      <td className="py-2 font-medium">{product.name}</td>
                      <td className="py-2 text-muted-foreground">{product.sku ?? '-'}</td>
                      <td className="py-2 text-right">{product.quantitySold}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Top Products by Quantity</CardTitle>
        </CardHeader>
        <CardContent>
          {byQuantity.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No product data for this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Product</th>
                    <th className="pb-2 font-medium">SKU</th>
                    <th className="pb-2 font-medium text-right">Qty Sold</th>
                    <th className="pb-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {byQuantity.slice(0, 10).map((product) => (
                    <tr key={product.name} className="border-b last:border-0">
                      <td className="py-2 font-medium">{product.name}</td>
                      <td className="py-2 text-muted-foreground">{product.sku ?? '-'}</td>
                      <td className="py-2 text-right">{product.quantitySold}</td>
                      <td className="py-2 text-right font-medium">{formatCurrency(product.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
