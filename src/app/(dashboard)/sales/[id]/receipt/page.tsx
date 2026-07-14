import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getSaleReceipt } from '@/lib/sales/queries';
import { PrintButton } from './print-button';
import { ArrowLeft } from 'lucide-react';

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

export default async function ReceiptPage({ params }: PageProps) {
  const { id } = await params;
  const receipt = await getSaleReceipt(id);

  if (!receipt) notFound();

  return (
    <>
      <div className="no-print flex items-center gap-4 p-4 border-b">
        <Link href={`/sales/${id}`} className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-lg font-semibold">Receipt</h1>
        <PrintButton />
      </div>
      <div className="max-w-md mx-auto p-6 print:p-0">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold">{receipt.orgName}</h2>
          <p className="text-sm text-muted-foreground">{receipt.branchName}</p>
        </div>

        <div className="text-center mb-4">
          <p className="font-mono text-sm">{receipt.receiptNumber}</p>
          <p className="text-sm text-muted-foreground">{formatDate(receipt.createdAt)}</p>
        </div>

        <div className="border-t border-b py-2 mb-4">
          <div className="flex justify-between text-sm font-medium px-1 mb-1">
            <span>Item</span>
            <span>Qty × Price</span>
            <span>Total</span>
          </div>
          {receipt.items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No items.</p>
          ) : (
            receipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm px-1 py-1">
                <span className="flex-1">{item.itemName}</span>
                <span className="text-right whitespace-nowrap">
                  {item.quantity} × {formatCurrency(item.unitPrice)}
                </span>
                <span className="text-right w-20">{formatCurrency(item.subtotal)}</span>
              </div>
            ))
          )}
        </div>

        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between px-1">
            <span>Subtotal</span>
            <span>{formatCurrency(receipt.subtotal)}</span>
          </div>
          <div className="flex justify-between px-1 font-bold text-base">
            <span>Total</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
          <div className="border-t pt-1 mt-1">
            <div className="flex justify-between px-1">
              <span>Amount Tendered</span>
              <span>{formatCurrency(receipt.amountTendered)}</span>
            </div>
            <div className="flex justify-between px-1">
              <span>Change</span>
              <span>{formatCurrency(receipt.change)}</span>
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p className="capitalize">Payment: {receipt.paymentMethod}</p>
        </div>
      </div>
    </>
  );
}
