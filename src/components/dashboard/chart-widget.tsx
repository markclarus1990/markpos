import { cn } from '@/lib/utils/cn';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface ChartWidgetProps {
  title: string;
  description?: string;
  viewAllHref?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ChartWidget({
  title,
  description,
  viewAllHref,
  children,
  className,
}: ChartWidgetProps) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref}>
            <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
              View all
              <ArrowRight className="size-3.5" />
            </Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className={cn('flex-1', children ? '' : '')}>
        {children}
      </CardContent>
    </Card>
  );
}
