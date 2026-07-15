'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from 'lucide-react';
import { AdjustStockDialog } from '@/components/inventory/adjust-stock-dialog';

interface InventoryItem {
  id: string;
  itemId: string;
  productName: string;
  itemName: string;
  sku: string | null;
  categoryName: string | null;
  branchName: string;
  quantityOnHand: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  updatedAt: string;
  createdAt: string;
}

interface ItemDetailProps {
  branches: InventoryItem[];
  branchIds: Record<string, string>;
}

export function ItemDetail({ branches, branchIds }: ItemDetailProps) {
  const router = useRouter();
  const [adjustBranch, setAdjustBranch] = useState<InventoryItem | null>(null);

  const handleAdjustSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  function getStockStatus(qty: number, threshold: number): 'in_stock' | 'low_stock' | 'out_of_stock' {
    if (qty <= 0) return 'out_of_stock';
    if (qty <= threshold) return 'low_stock';
    return 'in_stock';
  }

  return (
    <>
      <button
        onClick={() => setAdjustBranch(branches[0] ?? null)}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium"
      >
        <Package className="h-4 w-4" />
        Adjust Stock
      </button>

      {adjustBranch && (
        <AdjustStockDialog
          open={!!adjustBranch}
          onClose={() => setAdjustBranch(null)}
          productName={adjustBranch.productName}
          itemName={adjustBranch.itemName}
          branchName={adjustBranch.branchName}
          currentQuantity={adjustBranch.quantityOnHand}
          lowStockThreshold={adjustBranch.lowStockThreshold}
          stockStatus={getStockStatus(adjustBranch.quantityOnHand, adjustBranch.lowStockThreshold)}
          itemId={adjustBranch.itemId}
          branchId={branchIds[adjustBranch.branchName] ?? ''}
          allowsDecimal={false}
          onSuccess={handleAdjustSuccess}
        />
      )}
    </>
  );
}
