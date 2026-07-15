'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { adjustInventory } from '@/lib/inventory/actions';
import { Loader2 } from 'lucide-react';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

interface AdjustStockDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  itemName: string;
  branchName: string;
  currentQuantity: number;
  lowStockThreshold: number;
  stockStatus: StockStatus;
  itemId: string;
  branchId: string;
  allowsDecimal: boolean;
  onSuccess: (result: { quantityBefore: number; quantityAfter: number }) => void;
}

const INCREASE_REASONS = [
  { value: 'opening_stock', label: 'Opening Stock' },
  { value: 'stock_received', label: 'Stock Received' },
  { value: 'customer_return', label: 'Customer Return' },
  { value: 'count_correction', label: 'Count Correction' },
  { value: 'other', label: 'Other' },
];

const DECREASE_REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost' },
  { value: 'count_correction', label: 'Count Correction' },
  { value: 'other', label: 'Other' },
];

function formatStockStatus(status: StockStatus): string {
  switch (status) {
    case 'in_stock': return 'In Stock';
    case 'low_stock': return 'Low Stock';
    case 'out_of_stock': return 'Out of Stock';
  }
}

function stockStatusClass(status: StockStatus): string {
  switch (status) {
    case 'in_stock': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'low_stock': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'out_of_stock': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  }
}

export function AdjustStockDialog({
  open,
  onClose,
  productName,
  itemName,
  branchName,
  currentQuantity,
  lowStockThreshold,
  stockStatus,
  itemId,
  branchId,
  allowsDecimal,
  onSuccess,
}: AdjustStockDialogProps) {
  const [operation, setOperation] = useState<'increase' | 'decrease'>('increase');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleClose() {
    if (pending) return;
    setOperation('increase');
    setQuantity('');
    setReason('');
    setNotes('');
    setError(null);
    setSuccess(false);
    onClose();
  }

  function handleOperationChange(op: 'increase' | 'decrease') {
    setOperation(op);
    setReason('');
    setError(null);
  }

  function validateQuantity(): string | null {
    const val = Number(quantity);
    if (!quantity.trim()) return 'Quantity is required';
    if (isNaN(val) || !isFinite(val)) return 'Invalid quantity';
    if (val <= 0) return 'Quantity must be greater than zero';

    if (!allowsDecimal && val !== Math.floor(val)) {
      return 'Decimal quantities not allowed for this item';
    }

    if (val > 999999.9999) return 'Quantity exceeds maximum allowed';

    if (operation === 'decrease' && val > currentQuantity) {
      return `Insufficient stock. Available: ${allowsDecimal ? currentQuantity.toFixed(2) : currentQuantity}`;
    }

    return null;
  }

  async function handleSubmit() {
    const qtyError = validateQuantity();
    if (qtyError) {
      setError(qtyError);
      return;
    }

    if (!reason) {
      setError('Please select a reason');
      return;
    }

    setPending(true);
    setError(null);

    const change = operation === 'increase' ? Number(quantity) : -Number(quantity);

    const result = await adjustInventory(
      branchId,
      itemId,
      change,
      reason,
      notes.trim() || undefined,
    );

    if (result.success) {
      setSuccess(true);
      onSuccess({
        quantityBefore: result.quantityBefore!,
        quantityAfter: result.quantityAfter!,
      });
      setTimeout(() => handleClose(), 1500);
    } else {
      setError(result.error ?? 'Adjustment failed');
    }

    setPending(false);
  }

  const reasons = operation === 'increase' ? INCREASE_REASONS : DECREASE_REASONS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !pending && handleClose()}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Adjust Stock</h3>

            <div className="space-y-3 mb-4 p-3 rounded-lg bg-muted/50">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Product</span>
                <span className="font-medium text-right">{productName}{itemName && itemName !== productName ? ` (${itemName})` : ''}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Branch</span>
                <span className="font-medium">{branchName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Current Stock</span>
                <span className="font-medium">{allowsDecimal ? currentQuantity.toFixed(2) : currentQuantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Threshold</span>
                <span className="font-medium">{lowStockThreshold}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${stockStatusClass(stockStatus)}`}>
                  {formatStockStatus(stockStatus)}
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                variant={operation === 'increase' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleOperationChange('increase')}
                className="flex-1"
                disabled={pending}
              >
                Increase
              </Button>
              <Button
                variant={operation === 'decrease' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleOperationChange('decrease')}
                className="flex-1"
                disabled={pending}
              >
                Decrease
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="adj-qty">Quantity</Label>
                <Input
                  id="adj-qty"
                  type="number"
                  step={allowsDecimal ? '0.01' : '1'}
                  min="0"
                  max="999999.9999"
                  placeholder={allowsDecimal ? '0.00' : '0'}
                  value={quantity}
                  onChange={(e) => { setQuantity(e.target.value); setError(null); }}
                  disabled={pending}
                  className="mt-1"
                  autoFocus
                />
              </div>

              <div>
                <Label htmlFor="adj-reason">Reason</Label>
                <select
                  id="adj-reason"
                  value={reason}
                  onChange={(e) => { setReason(e.target.value); setError(null); }}
                  disabled={pending}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm mt-1"
                >
                  <option value="">Select a reason</option>
                  {reasons.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="adj-notes">Notes (optional)</Label>
                <textarea
                  id="adj-notes"
                  value={notes}
                  onChange={(e) => {
                    if (e.target.value.length <= 500) setNotes(e.target.value);
                  }}
                  disabled={pending}
                  placeholder="Additional notes..."
                  className="flex h-20 w-full rounded-md border bg-background px-3 py-2 text-sm mt-1 resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">{notes.length}/500</p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950/50 dark:text-green-400">
                Stock adjusted successfully
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleClose}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={pending || success}
              >
                {pending ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Adjusting...
                  </>
                ) : (
                  `${operation === 'increase' ? 'Add' : 'Remove'} Stock`
                )}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
