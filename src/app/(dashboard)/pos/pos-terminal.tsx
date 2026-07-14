'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { Search, ShoppingCart, X, Minus, Plus, Trash2, Printer } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { fadeIn } from '@/lib/motion';
import { useAppContext } from '@/providers/auth-provider';
import { checkout, type CheckoutItem } from '@/lib/pos/actions';
import type { PosProductItem } from '@/lib/pos/queries';

interface CartItem {
  itemId: string;
  productName: string;
  variantName: string;
  sku: string | null;
  sellingPrice: number;
  quantity: number;
  allowsDecimal: boolean;
  trackInventory: boolean;
}

interface ReceiptSnapshot {
  saleId: string;
  receiptNumber: string;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
  total: number;
  amountTendered: number;
  change: number;
}

interface PosTerminalProps {
  initialItems: PosProductItem[];
  initialTotal: number;
  categories: Array<{ id: string; name: string }>;
}

const QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

export function PosTerminal({ initialItems, categories }: PosTerminalProps) {
  const { branch } = useAppContext();
  const [items] = useState(initialItems);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [amountTendered, setAmountTendered] = useState('');
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zeroPriceConfirm, setZeroPriceConfirm] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptSnapshot | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    let result = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.product_name.toLowerCase().includes(q) ||
          i.name.toLowerCase().includes(q) ||
          (i.sku && i.sku.toLowerCase().includes(q)),
      );
    }
    if (categoryFilter) {
      result = result.filter((i) => i.category_id === categoryFilter);
    }
    return result;
  }, [items, search, categoryFilter]);

  const total = useMemo(
    () => cart.reduce((sum, c) => sum + c.sellingPrice * c.quantity, 0),
    [cart],
  );

  const totalItems = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart],
  );

  const branchId = branch?.id ?? null;

  const addToCart = useCallback(
    (item: PosProductItem) => {
      setError(null);
      setCart((prev) => {
        const existing = prev.find((c) => c.itemId === item.id);
        if (existing) {
          if (existing.quantity >= 99999) {
            setError('Maximum quantity per item is 99,999');
            return prev;
          }
          return prev.map((c) =>
            c.itemId === item.id ? { ...c, quantity: c.quantity + 1 } : c,
          );
        }
        return [
          ...prev,
          {
            itemId: item.id,
            productName: item.product_name,
            variantName: item.name,
            sku: item.sku,
            sellingPrice: item.selling_price,
            quantity: 1,
            allowsDecimal: item.allows_decimal,
            trackInventory: item.track_inventory,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback(
    (itemId: string, delta: number) => {
      setError(null);
      setCart((prev) =>
        prev
          .map((c) => {
            if (c.itemId !== itemId) return c;
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > 99999) {
              setError('Maximum quantity is 99,999');
              return c;
            }
            if (!c.allowsDecimal) {
              return { ...c, quantity: Math.floor(newQty) };
            }
            return { ...c, quantity: Math.round(newQty * 10000) / 10000 };
          })
          .filter(Boolean) as CartItem[],
      );
    },
    [],
  );

  const removeItem = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setShowClearConfirm(false);
    setError(null);
  }, []);

  const hasZeroPrice = useMemo(
    () => cart.some((c) => c.sellingPrice === 0),
    [cart],
  );

  const change = useMemo(
    () => Math.max(0, Number(amountTendered || 0) - total),
    [amountTendered, total],
  );

  const insufficientCash = useMemo(
    () => Number(amountTendered || 0) < total,
    [amountTendered, total],
  );

  const handleCheckout = useCallback(async () => {
    if (!branchId) {
      setError('No branch selected. Please configure your branch first.');
      return;
    }

    if (hasZeroPrice && !zeroPriceConfirm) {
      setZeroPriceConfirm(true);
      return;
    }

    if (total === 0 && !zeroPriceConfirm) {
      setError('Cannot checkout with a zero total');
      return;
    }

    setProcessing(true);
    setError(null);

    const checkoutItems: CheckoutItem[] = cart.map((c) => ({
      item_id: c.itemId,
      quantity: c.quantity,
    }));

    // Snapshot items before clearing
    const snapshotItems = cart.map((c) => ({
      productName: c.productName,
      variantName: c.variantName,
      quantity: c.quantity,
      unitPrice: c.sellingPrice,
      subtotal: c.sellingPrice * c.quantity,
    }));

    const result = await checkout(
      branchId,
      checkoutItems,
      Number(amountTendered),
      zeroPriceConfirm,
    );

    if (result.success && result.sale_id) {
      setReceiptData({
        saleId: result.sale_id,
        receiptNumber: result.receipt_number ?? '',
        items: snapshotItems,
        subtotal: result.subtotal ?? total,
        total: result.total ?? total,
        amountTendered: result.amount_tendered ?? Number(amountTendered),
        change: result.change ?? 0,
      });
      setCart([]);
      setAmountTendered('');
      setShowPayment(false);
      setZeroPriceConfirm(false);
    } else {
      setError(result.error ?? 'Checkout failed');
    }

    setProcessing(false);
  }, [branchId, cart, total, amountTendered, zeroPriceConfirm, hasZeroPrice]);

  const handleNewSale = useCallback(() => {
    setReceiptData(null);
    setCart([]);
    setSearch('');
    setCategoryFilter('');
    setError(null);
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // ----- Receipt View -----
  if (receiptData) {
    return (
      <div className="mx-auto max-w-md space-y-6 p-4 sm:p-6" ref={printRef}>
        <div className="text-center">
          <h2 className="text-lg font-semibold">Sale Complete</h2>
          <p className="text-sm text-muted-foreground">{receiptData.receiptNumber}</p>
        </div>

        <div className="space-y-2 rounded-lg border p-4 print:border-0">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Receipt #</span>
            <span className="font-medium">{receiptData.receiptNumber}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Date</span>
            <span>{new Date().toLocaleString()}</span>
          </div>
          <div className="border-t pt-2 mt-2">
            {receiptData.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm py-1">
                <span>
                  {item.productName}
                  {item.variantName !== item.productName ? ` (${item.variantName})` : ''}
                  {' '}x{item.quantity}
                </span>
                <span>${item.subtotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t pt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>${receiptData.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total</span>
              <span className="font-bold">${receiptData.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Cash</span>
              <span>${receiptData.amountTendered.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Change</span>
              <span>${receiptData.change.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 print:hidden">
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="mr-2 size-4" /> Print Receipt
          </Button>
          <Button onClick={handleNewSale} variant="outline" className="flex-1">
            New Sale
          </Button>
        </div>
        <div className="flex gap-3 text-sm print:hidden justify-center">
          <Link href={`/sales/${receiptData.saleId}`} className="text-primary hover:underline">
            View Sale Details
          </Link>
          <span className="text-muted-foreground">&middot;</span>
          <Link href={`/sales/${receiptData.saleId}/receipt`} className="text-primary hover:underline">
            Persistent Receipt
          </Link>
        </div>
      </div>
    );
  }

  // ----- No Branch -----
  if (!branchId) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center p-4">
        <div className="max-w-md text-center">
          <ShoppingCart className="mx-auto size-12 text-muted-foreground/50" />
          <h2 className="mt-4 text-lg font-semibold">No Branch Selected</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please select or configure a branch before using the POS terminal.
          </p>
        </div>
      </div>
    );
  }

  // ----- Main POS -----
  return (
    <div className="flex h-[calc(100vh-64px)] flex-col lg:flex-row">
      {/* Product Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Search & Filters */}
        <div className="flex items-center gap-2 border-b p-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <div className="hidden text-right text-xs text-muted-foreground sm:block">
            <p className="font-medium text-foreground">{branch?.name}</p>
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {filteredItems.map((item) => (
              <motion.button
                key={item.id}
                variants={fadeIn}
                initial="initial"
                animate="animate"
                onClick={() => addToCart(item)}
                className="flex flex-col items-center justify-center rounded-xl border p-4 text-center transition-colors hover:border-primary hover:bg-accent/30 min-h-[100px] min-w-[44px]"
              >
                <span className="line-clamp-2 text-sm font-medium leading-tight">
                  {item.product_name}
                  {item.name !== item.product_name && (
                    <span className="text-muted-foreground"> ({item.name})</span>
                  )}
                </span>
                <span className="mt-1 text-lg font-bold text-primary">
                  ${Number(item.selling_price).toFixed(2)}
                </span>
                {item.sku && (
                  <span className="mt-0.5 text-[10px] text-muted-foreground">{item.sku}</span>
                )}
              </motion.button>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full flex items-center justify-center py-12 text-sm text-muted-foreground">
                No products found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="flex w-full flex-col border-t bg-background lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <ShoppingCart className="size-4" />
            <span className="font-medium">Cart</span>
            <span className="text-sm text-muted-foreground">({totalItems} items)</span>
          </div>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-1 size-3" /> Clear
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Tap a product to add it
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((c) => (
                  <motion.div
                    key={c.itemId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="rounded-lg border p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.productName}</p>
                        {c.variantName !== c.productName && (
                          <p className="truncate text-xs text-muted-foreground">{c.variantName}</p>
                        )}
                        {c.sellingPrice === 0 && (
                          <span className="mt-0.5 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                            Free
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(c.itemId)}
                        className="size-6 shrink-0"
                      >
                        <X className="size-3" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(c.itemId, -1)}
                          className="size-7"
                          disabled={c.quantity <= 1}
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-10 text-center text-sm tabular-nums">
                          {c.allowsDecimal ? c.quantity.toFixed(2) : c.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateQuantity(c.itemId, 1)}
                          className="size-7"
                          disabled={c.quantity >= 99999}
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <span className="text-sm font-medium">
                        ${(c.sellingPrice * c.quantity).toFixed(2)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Cart Footer */}
        <div className="border-t p-3 space-y-3">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {zeroPriceConfirm && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs dark:border-blue-800 dark:bg-blue-950/50">
              <p className="mb-2 font-medium">Zero-price item in cart</p>
              <p className="text-muted-foreground">
                This cart contains items with a price of $0.00. Proceed?
              </p>
              <div className="mt-2 flex gap-2">
                <Button size="sm" onClick={handleCheckout}>Yes, proceed</Button>
                <Button size="sm" variant="outline" onClick={() => setZeroPriceConfirm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {showClearConfirm && (
            <div className="rounded-lg border p-3 text-xs">
              <p className="mb-2">Clear all items?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" onClick={clearCart}>Yes, clear</Button>
                <Button size="sm" variant="outline" onClick={() => setShowClearConfirm(false)}>
                  Keep
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <Button
            className="w-full"
            size="lg"
            disabled={cart.length === 0 || total === 0}
            onClick={() => setShowPayment(true)}
          >
            Charge ${total.toFixed(2)}
          </Button>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {showPayment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !processing && setShowPayment(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-background p-6 shadow-xl"
            >
              <h3 className="mb-4 text-lg font-semibold">Cash Payment</h3>

              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">Total Due</p>
                <p className="text-3xl font-bold">${total.toFixed(2)}</p>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium">Amount Received</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    className="pl-8 text-2xl font-bold tabular-nums"
                    autoFocus
                    disabled={processing}
                  />
                </div>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((amt) => (
                  <Button
                    key={amt}
                    variant="outline"
                    size="sm"
                    onClick={() => setAmountTendered(String(amt))}
                    disabled={processing}
                  >
                    ${amt}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAmountTendered(String(total))}
                  disabled={processing}
                  className="col-span-3"
                >
                  Exact Amount (${total.toFixed(2)})
                </Button>
              </div>

              {Number(amountTendered) > 0 && (
                <div className="mb-4 rounded-lg bg-muted p-3">
                  <div className="flex justify-between text-sm">
                    <span>Change</span>
                    <span className={cn(
                      'font-bold text-lg',
                      insufficientCash ? 'text-destructive' : 'text-green-600 dark:text-green-400',
                    )}>
                      ${change.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowPayment(false);
                    setAmountTendered('');
                    setError(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  disabled={
                    processing ||
                    !amountTendered ||
                    Number(amountTendered) <= 0 ||
                    insufficientCash ||
                    total === 0
                  }
                  isLoading={processing}
                  onClick={handleCheckout}
                >
                  {processing ? 'Processing...' : `Pay $${total.toFixed(2)}`}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
