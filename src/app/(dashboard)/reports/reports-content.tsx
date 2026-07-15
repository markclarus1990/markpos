'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { PageHeader } from '@/components/shared/page-header';
import { SalesOverviewTab } from '@/components/reports/sales-overview-tab';
import { ProductsTab } from '@/components/reports/products-tab';
import { PaymentsTab } from '@/components/reports/payments-tab';
import { InventoryTab } from '@/components/reports/inventory-tab';
import { BranchesTab } from '@/components/reports/branches-tab';
import { ExportSection } from '@/components/reports/export-section';
import type { ReportsData } from '@/lib/reports/queries';
import type { DateRangeKey } from '@/lib/reports/date-utils';

const TABS = [
  { id: 'sales', label: 'Sales Overview' },
  { id: 'products', label: 'Products' },
  { id: 'payments', label: 'Payments' },
  { id: 'inventory', label: 'Inventory' },
  { id: 'branches', label: 'Branches' },
  { id: 'export', label: 'Export' },
] as const;

type TabId = (typeof TABS)[number]['id'];

interface ReportsContentProps {
  initialData: ReportsData;
  currencyCode: string;
  exports: Array<{
    label: string;
    description: string;
    action: (period: DateRangeKey) => Promise<{ csv: string; filename: string }>;
  }>;
}

export function ReportsContent({ initialData, currencyCode, exports }: ReportsContentProps) {
  const [activeTab, setActiveTab] = useState<TabId>('sales');
  const [data] = useState(initialData);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Reports"
        description="Analytics and business insights"
      />

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors min-h-[44px]',
              activeTab === tab.id
                ? 'border-b-2 border-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sales' && (
        <SalesOverviewTab data={data.salesOverview} currencyCode={currencyCode} />
      )}
      {activeTab === 'products' && (
        <ProductsTab data={data.productPerformance} currencyCode={currencyCode} />
      )}
      {activeTab === 'payments' && (
        <PaymentsTab data={data.paymentMethods} currencyCode={currencyCode} />
      )}
      {activeTab === 'inventory' && (
        <InventoryTab status={data.inventoryStatus} movements={data.movementTotals} />
      )}
      {activeTab === 'branches' && (
        <BranchesTab data={data.branchPerformance} currencyCode={currencyCode} />
      )}
      {activeTab === 'export' && (
        <ExportSection exports={exports} />
      )}
    </div>
  );
}
