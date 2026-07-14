import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

interface CompactListItem {
  id: string;
  primary: string;
  secondary?: string;
  tertiary?: string;
  href?: string;
  badge?: { label: string; variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' };
}

interface CompactListProps {
  items: CompactListItem[];
  className?: string;
  emptyMessage?: string;
}

const badgeVariants: Record<string, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-info/10 text-info',
  neutral: 'bg-muted text-muted-foreground',
};

export function CompactList({ items, className, emptyMessage }: CompactListProps) {
  if (items.length === 0) {
    return (
      <div className={cn('flex items-center justify-center py-12', className)}>
        <p className="text-sm text-muted-foreground">
          {emptyMessage ?? 'No items to display'}
        </p>
      </div>
    );
  }

  return (
    <div className={cn('divide-y', className)}>
      {items.map((item) => {
        const content = (
          <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.primary}</p>
              {item.secondary && (
                <p className="truncate text-xs text-muted-foreground">{item.secondary}</p>
              )}
            </div>
            <div className="flex items-center gap-3 ml-4 shrink-0">
              {item.tertiary && (
                <span className="text-sm font-medium tabular-nums">{item.tertiary}</span>
              )}
              {item.badge && (
                <span
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                    badgeVariants[item.badge.variant ?? 'neutral'],
                  )}
                >
                  {item.badge.label}
                </span>
              )}
            </div>
          </div>
        );
        if (item.href) {
          return (
            <Link key={item.id} href={item.href} className="block hover:bg-muted/30 rounded-sm">
              {content}
            </Link>
          );
        }
        return <div key={item.id}>{content}</div>;
      })}
    </div>
  );
}
