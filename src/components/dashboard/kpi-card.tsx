'use client';

import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fadeIn } from '@/lib/motion';

interface KpiCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number | null;
  trend: { direction: 'up' | 'down'; label: string } | null | undefined;
  period?: string | undefined;
  loading?: boolean | undefined;
  className?: string | undefined;
}

export function KpiCard({
  icon: Icon,
  label,
  value,
  trend,
  period,
  loading,
  className,
}: KpiCardProps) {
  return (
    <motion.div variants={fadeIn}>
      <Card
        className={cn(
          'transition-shadow duration-200 hover:shadow-md',
          className,
        )}
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex size-10 items-center justify-center rounded-lg bg-accent shrink-0">
              <Icon className="size-5 text-accent-foreground" />
            </div>
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
                  trend.direction === 'up'
                    ? 'bg-success/10 text-success'
                    : 'bg-destructive/10 text-destructive',
                )}
              >
                <span
                  className={cn(
                    'text-xs',
                    trend.direction === 'up' ? 'text-success' : 'text-destructive',
                  )}
                >
                  {trend.direction === 'up' ? '\u2191' : '\u2193'}
                </span>
                {trend.label}
              </span>
            )}
          </div>
          <div className="mt-4 space-y-1">
            {loading ? (
              <>
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-20" />
              </>
            ) : (
              <>
                <p className="text-3xl font-bold tabular-nums tracking-tight">
                  {value ?? '\u2014'}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  {period && (
                    <span className="text-xs text-muted-foreground/60">
                      {period}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
