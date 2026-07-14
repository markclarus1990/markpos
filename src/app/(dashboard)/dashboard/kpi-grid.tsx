'use client';

import { DollarSign, ShoppingCart, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { DashboardData } from '@/lib/dashboard/queries';

interface KpiGridProps {
  data: DashboardData;
}

const kpis = [
  { key: 'dailySales' as const, icon: DollarSign, label: 'Daily Sales' },
  { key: 'transactions' as const, icon: ShoppingCart, label: 'Transactions' },
  { key: 'avgOrderValue' as const, icon: TrendingUp, label: 'Avg. Order Value' },
  { key: 'lowStockItems' as const, icon: AlertTriangle, label: 'Low Stock Items' },
];

export function KpiGrid({ data }: KpiGridProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {kpis.map(({ key, icon, label }) => {
        const kpi = data[key];
        const displayValue =
          key === 'dailySales' && kpi.value !== null
            ? `$${Number(kpi.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : key === 'avgOrderValue' && kpi.value !== null
              ? `$${Number(kpi.value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : kpi.value !== null
                ? Number(kpi.value).toLocaleString('en-US')
                : null;
        return (
          <KpiCard
            key={key}
            icon={icon}
            label={label}
            value={displayValue}
            trend={kpi.trend}
            period={kpi.period}
          />
        );
      })}
    </motion.div>
  );
}
