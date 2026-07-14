import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface DashboardHeaderProps {
  greeting: string;
  date: string;
}

export function DashboardHeader({ greeting, date }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          {greeting}
        </h1>
        <p className="text-sm text-muted-foreground">{date}</p>
      </div>
      <Link href="/pos">
        <Button className="gap-2">
          <Plus className="size-4" />
          New Sale
        </Button>
      </Link>
    </div>
  );
}
