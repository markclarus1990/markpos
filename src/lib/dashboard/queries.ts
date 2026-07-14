export interface DashboardKpi {
  value: number | null;
  trend?: { direction: 'up' | 'down'; label: string } | null;
  period?: string;
}

export interface DashboardData {
  dailySales: DashboardKpi;
  grossProfit: DashboardKpi;
  netProfit: DashboardKpi;
  expenses: DashboardKpi;
}

/**
 * Returns KPI summary data.
 * Currently returns empty state — sales/orders schema not yet implemented.
 * When the orders/transactions tables are added, wire up real queries here.
 */
export async function getKpiSummary(): Promise<DashboardData> {
  return {
    dailySales: { value: null, trend: null },
    grossProfit: { value: null, trend: null },
    netProfit: { value: null, trend: null },
    expenses: { value: null, trend: null },
  };
}
