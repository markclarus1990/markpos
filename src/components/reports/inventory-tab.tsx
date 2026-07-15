'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/shared/stat-card';
import { Package, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import type { InventoryStatusData, MovementTotals } from '@/lib/reports/queries';

interface InventoryTabProps {
  status: InventoryStatusData;
  movements: MovementTotals;
}

function movementTypeLabel(type: string): string {
  switch (type) {
    case 'sale': return 'Sales';
    case 'purchase': return 'Purchases';
    case 'adjustment': return 'Adjustments';
    case 'returned': return 'Returns';
    case 'transferIn': return 'Transfer In';
    case 'transferOut': return 'Transfer Out';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

export function InventoryTab({ status, movements }: InventoryTabProps) {
  const movementEntries = Object.entries(movements).filter(([_, qty]) => qty > 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={status.totalItems}
          icon={<Package className="size-4" />}
        />
        <StatCard
          title="In Stock"
          value={status.inStock}
          icon={<CheckCircle2 className="size-4" />}
        />
        <StatCard
          title="Low Stock"
          value={status.lowStock}
          icon={<AlertTriangle className="size-4" />}
        />
        <StatCard
          title="Out of Stock"
          value={status.outOfStock}
          icon={<XCircle className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Movement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {movementEntries.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No movements in this period</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Movement Type</th>
                    <th className="pb-2 font-medium text-right">Total Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {movementEntries.map(([type, qty]) => (
                    <tr key={type} className="border-b last:border-0">
                      <td className="py-2 font-medium">{movementTypeLabel(type)}</td>
                      <td className="py-2 text-right">{qty}</td>
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
