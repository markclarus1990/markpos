'use client';

import { DollarSign, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/motion';
import { KpiCard } from '@/components/dashboard/kpi-card';
import type { DashboardData } from '@/lib/dashboard/queries';

interface KpiGridProps {
  data: DashboardData;
}

const kpis = [
  { key: 'dailySales' as const, icon: DollarSign, label: 'Daily Sales' },
  { key: 'grossProfit' as const, icon: TrendingUp, label: 'Gross Profit' },
  { key: 'netProfit' as const, icon: TrendingDown, label: 'Net Profit' },
  { key: 'expenses' as const, icon: CreditCard, label: 'Expenses' },
];

export function KpiGrid({ data }: KpiGridProps) {
  return (
    <motion.div
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {kpis.map(({ key, icon, label }) => (
        <KpiCard
          key={key}
          icon={icon}
          label={label}
          value={data[key].value}
          trend={data[key].trend}
          period={data[key].period}
        />
      ))}
    </motion.div>
  );
}
