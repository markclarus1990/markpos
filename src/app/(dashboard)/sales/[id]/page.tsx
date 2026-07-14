import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSale } from '@/lib/sales/queries';
import { ArrowLeft, Printer } from 'lucide-react';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SaleDetailPage({ params }: PageProps) {
  const { id } = await params;
  const sale = await getSale(id);

  if (!sale) notFound();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/sales" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Sale {sale.receiptNumber}</h1>
            <p className="text-sm text-muted-foreground">{formatDate(sale.createdAt)}</p>
          </div>
        </div>
        <Link
          href={`/sales/${id}/receipt`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
        >
          <Printer className="h-4 w-4" />
          View Receipt
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Details</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd className="text-sm font-medium capitalize">{sale.status}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Branch</dt>
              <dd className="text-sm">{sale.branchName ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Payment</dt>
              <dd className="text-sm capitalize">{sale.paymentMethod}</dd>
            </div>
          </dl>
        </div>
        <div className="rounded-lg border p-4">
          <h2 className="text-sm font-medium text-muted-foreground mb-2">Totals</h2>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Subtotal</dt>
              <dd className="text-sm">{formatCurrency(sale.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Total</dt>
              <dd className="text-sm font-bold">{formatCurrency(sale.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Amount Tendered</dt>
              <dd className="text-sm">{formatCurrency(sale.amountTendered)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-muted-foreground">Change</dt>
              <dd className="text-sm">{formatCurrency(sale.changeAmount)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-3 text-sm font-medium">Item</th>
              <th className="text-left p-3 text-sm font-medium">SKU</th>
              <th className="text-right p-3 text-sm font-medium">Qty</th>
              <th className="text-right p-3 text-sm font-medium">Price</th>
              <th className="text-right p-3 text-sm font-medium">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-muted-foreground">No items in this sale.</td>
              </tr>
            ) : (
              sale.items.map((item, i) => (
                <tr key={i} className="border-t">
                  <td className="p-3 text-sm">{item.itemName}</td>
                  <td className="p-3 text-sm font-mono text-muted-foreground">{item.sku ?? '—'}</td>
                  <td className="p-3 text-sm text-right">{item.quantity}</td>
                  <td className="p-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                  <td className="p-3 text-sm text-right">{formatCurrency(item.subtotal)}</td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr className="border-t font-medium">
              <td colSpan={4} className="p-3 text-sm text-right">Total</td>
              <td className="p-3 text-sm text-right">{formatCurrency(sale.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
