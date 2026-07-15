'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { downloadCsv } from '@/lib/reports/export-csv';
import type { DateRangeKey } from '@/lib/reports/date-utils';

interface ExportOption {
  label: string;
  description: string;
  action: (period: DateRangeKey) => Promise<{ csv: string; filename: string }>;
}

interface ExportSectionProps {
  exports: ExportOption[];
}

const PERIODS: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'last7', label: 'Last 7 Days' },
  { key: 'last30', label: 'Last 30 Days' },
  { key: 'thisMonth', label: 'This Month' },
  { key: 'lastMonth', label: 'Last Month' },
];

export function ExportSection({ exports }: ExportSectionProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExport(
    action: ExportOption['action'],
    period: DateRangeKey,
    exportKey: string,
  ) {
    setLoading(exportKey);
    try {
      const { csv, filename } = await action(period);
      downloadCsv(csv, filename);
    } catch {
      // Silently handle errors — in production this would show a toast
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Download CSV reports for your selected data. Each export captures a snapshot of the current data.
      </p>
      {exports.map((exp) => (
        <Card key={exp.label}>
          <CardHeader>
            <CardTitle className="text-base font-semibold">{exp.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">{exp.description}</p>
            <div className="flex flex-wrap gap-2">
              {PERIODS.map((period) => {
                const exportKey = `${exp.label}-${period.key}`;
                const isLoading = loading === exportKey;
                return (
                  <Button
                    key={period.key}
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                    onClick={() => handleExport(exp.action, period.key, exportKey)}
                  >
                    {isLoading ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 size-3.5" />
                    )}
                    {period.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
