import { getDateRange } from '@/lib/reports/date-utils';
import { getReportsData } from '@/lib/reports/queries';
import {
  exportSalesCsv,
  exportProductsCsv,
  exportPaymentsCsv,
  exportInventoryCsv,
  exportMovementsCsv,
} from '@/lib/reports/actions';
import { ReportsContent } from './reports-content';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
  return key;
}

async function getOrgCurrency(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll() {},
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'USD';

  const { data: members } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', user.id)
    .limit(1);

  const member = members?.[0];
  if (!member?.organization_id) return 'USD';

  const { data: org } = await supabase
    .from('organizations')
    .select('currency_code')
    .eq('id', member.organization_id)
    .single();

  return org?.currency_code ?? 'USD';
}

export default async function ReportsPage() {
  const dateRange = getDateRange('UTC', 'last30');
  const [data, currencyCode] = await Promise.all([
    getReportsData(dateRange),
    getOrgCurrency(),
  ]);

  const exports = [
    {
      label: 'Sales Overview',
      description: 'Daily revenue and transaction counts for the selected period.',
      action: exportSalesCsv,
    },
    {
      label: 'Product Performance',
      description: 'Top products by quantity sold and revenue.',
      action: exportProductsCsv,
    },
    {
      label: 'Payment Methods',
      description: 'Revenue and transaction breakdown by payment method.',
      action: exportPaymentsCsv,
    },
    {
      label: 'Inventory Status',
      description: 'Current stock levels for all items.',
      action: exportInventoryCsv,
    },
    {
      label: 'Inventory Movements',
      description: 'Quantity totals by movement type for the selected period.',
      action: exportMovementsCsv,
    },
  ];

  return (
    <ReportsContent
      initialData={data}
      currencyCode={currencyCode}
      exports={exports}
    />
  );
}
