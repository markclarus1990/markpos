import { type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    direction: 'up' | 'down';
    label: string;
  };
  className?: string;
}

export function StatCard({ title, value, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn('', className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold sm:text-3xl">{value}</p>
            {trend && (
              <div className="flex items-center gap-1 text-sm">
                <span
                  className={cn(
                    'inline-flex items-center font-medium',
                    trend.direction === 'up'
                      ? 'text-success'
                      : 'text-destructive',
                  )}
                >
                  {trend.direction === 'up' ? '\u2191' : '\u2193'} {trend.label}
                </span>
              </div>
            )}
          </div>
          {icon && (
            <div className="rounded-lg bg-muted p-2 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
