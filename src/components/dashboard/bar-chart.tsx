import { cn } from '@/lib/utils/cn';

interface BarChartDataPoint {
  label: string;
  value: number;
}

interface BarChartProps {
  data: BarChartDataPoint[];
  formatter?: (value: number) => string;
  height?: number;
  className?: string;
  emptyMessage?: string;
}

export function BarChart({ data, formatter, height = 56, className, emptyMessage }: BarChartProps) {
  if (data.length === 0 || data.every((d) => d.value === 0)) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-sm text-muted-foreground">{emptyMessage ?? 'No data available'}</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-end gap-1" style={{ height }} role="img" aria-label="Bar chart">
        {data.map((point) => {
          const barHeight = Math.max((point.value / maxValue) * 100, point.value > 0 ? 4 : 0);
          return (
            <div
              key={point.label}
              className="group relative flex flex-1 items-end justify-center"
            >
              <div
                className="w-full rounded-sm bg-primary/40 transition-colors hover:bg-primary/60"
                style={{ height: `${barHeight}%`, minHeight: point.value > 0 ? '4px' : '0px' }}
              >
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-popover px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                  {formatter ? formatter(point.value) : point.value}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1">
        {data.map((point) => (
          <span
            key={point.label}
            className="flex-1 truncate text-center text-[10px] text-muted-foreground"
            title={point.label}
          >
            {point.label.length > 6 ? point.label.slice(0, 6) : point.label}
          </span>
        ))}
      </div>
    </div>
  );
}
