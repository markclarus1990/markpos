'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createProduct, updateProduct } from '@/lib/products/actions';

interface Option {
  id: string;
  name: string;
}

interface ProductFormProps {
  categories: Option[];
  brands: Option[];
  units: Option[];
  initialData?: {
    id?: string;
    name: string;
    description?: string;
    categoryId?: string;
    brandId?: string;
    unitId?: string;
    productType: string;
    trackInventory: boolean;
    lowStockThreshold: number;
    items: ItemData[];
  };
}

interface ItemData {
  id?: string;
  name: string;
  sku?: string;
  costPrice?: number | null;
  sellingPrice?: number;
  sortOrder: number;
  barcode?: string;
  barcodeType: string;
}

function emptyItem(): ItemData {
  return {
    name: '',
    sku: '',
    costPrice: null,
    sellingPrice: 0,
    sortOrder: 0,
    barcode: '',
    barcodeType: 'ean13',
  };
}

export function ProductForm({ categories, brands, units, initialData }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialData?.id;

  const [productType, setProductType] = useState(initialData?.productType ?? 'simple');
  const [trackInventory, setTrackInventory] = useState(
    initialData?.trackInventory ?? productType !== 'service',
  );
  const [items, setItems] = useState<ItemData[]>(
    initialData?.items ?? [emptyItem()],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isService = productType === 'service';
  const isVariant = productType === 'variant';

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, emptyItem()]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateItem = useCallback((index: number, field: keyof ItemData, value: unknown) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }, []);

  async function handleSubmit(formData: FormData) {
    setPending(true);
    setError(null);

    formData.set('productType', productType);
    formData.set('trackInventory', String(trackInventory));
    formData.set('items', JSON.stringify(items));

    if (isEditing) {
      formData.set('id', initialData!.id!);
    }

    const action = isEditing ? updateProduct : createProduct;
    const result = await action(null, formData);

    if (result.error) {
      setError(result.error);
      setPending(false);
      return;
    }

    router.push('/products');
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="text-sm font-semibold">Basic Information</legend>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input id="name" name="name" defaultValue={initialData?.name} required maxLength={200} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={initialData?.description} rows={3} />
          </div>

          <div>
            <Label htmlFor="productType">Product Type *</Label>
            <select
              id="productType"
              value={productType}
              onChange={(e) => {
                setProductType(e.target.value);
                if (e.target.value === 'service') setTrackInventory(false);
                if (e.target.value === 'simple') setItems([emptyItem()]);
              }}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="simple">Simple Product</option>
              <option value="variant">Variant Product</option>
              <option value="service">Service</option>
            </select>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={initialData?.id ? undefined : 'active'}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Classification */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="text-sm font-semibold">Classification</legend>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="categoryId">Category</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={initialData?.categoryId ?? ''}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="brandId">Brand</Label>
            <select
              id="brandId"
              name="brandId"
              defaultValue={initialData?.brandId ?? ''}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">No brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="unitId">Unit *</Label>
            <select
              id="unitId"
              name="unitId"
              defaultValue={initialData?.unitId ?? ''}
              className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        </div>
      </fieldset>

      {/* Items / Variants */}
      <fieldset className="space-y-4 rounded-lg border p-4">
        <legend className="text-sm font-semibold">
          {isVariant ? 'Variants' : 'Pricing & Identity'}
        </legend>

        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="space-y-3 rounded-lg bg-muted/30 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                  {isVariant ? `Variant ${i + 1}` : `Item ${i + 1}`}
                </span>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs text-destructive hover:underline min-h-[44px] min-w-[44px]"
                  >
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {isVariant && (
                  <div className="sm:col-span-2 lg:col-span-1">
                    <Label>Variant Name *</Label>
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(i, 'name', e.target.value)}
                      placeholder="e.g. Small, Large, Red"
                      required={isVariant}
                    />
                  </div>
                )}

                <div>
                  <Label>SKU</Label>
                  <Input
                    value={item.sku ?? ''}
                    onChange={(e) => updateItem(i, 'sku', e.target.value)}
                    placeholder="e.g. PROD-001"
                  />
                </div>

                <div>
                  <Label>Barcode</Label>
                  <Input
                    value={item.barcode ?? ''}
                    onChange={(e) => updateItem(i, 'barcode', e.target.value)}
                    placeholder="e.g. 1234567890123"
                  />
                </div>

                <div>
                  <Label>Barcode Type</Label>
                  <select
                    value={item.barcodeType}
                    onChange={(e) => updateItem(i, 'barcodeType', e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="ean13">EAN-13</option>
                    <option value="ean8">EAN-8</option>
                    <option value="upc_a">UPC-A</option>
                    <option value="code128">Code 128</option>
                    <option value="internal">Internal</option>
                    <option value="qr">QR Code</option>
                  </select>
                </div>

                <div>
                  <Label>Selling Price *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.sellingPrice}
                    onChange={(e) => updateItem(i, 'sellingPrice', Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <Label>Cost Price</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.costPrice ?? ''}
                    onChange={(e) => updateItem(i, 'costPrice', e.target.value ? Number(e.target.value) : null)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <Label>Sort Order</Label>
                  <Input
                    type="number"
                    min="0"
                    value={item.sortOrder}
                    onChange={(e) => updateItem(i, 'sortOrder', Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {isVariant && (
          <Button type="button" variant="outline" onClick={addItem} className="w-full">
            Add Variant
          </Button>
        )}
      </fieldset>

      {/* Inventory Settings */}
      {!isService && (
        <fieldset className="space-y-4 rounded-lg border p-4">
          <legend className="text-sm font-semibold">Inventory</legend>

          <div className="flex items-center gap-4">
            <Switch
              id="trackInventory"
              checked={trackInventory}
              onCheckedChange={setTrackInventory}
            />
            <Label htmlFor="trackInventory">Track Inventory</Label>
          </div>

          {trackInventory && (
            <div className="grid max-w-xs gap-2">
              <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                defaultValue={initialData?.lowStockThreshold ?? 10}
              />
            </div>
          )}
        </fieldset>
      )}

      <input type="hidden" name="productType" value={productType} />
      <input type="hidden" name="trackInventory" value={String(trackInventory)} />
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="flex gap-4">
        <Button type="submit" isLoading={pending}>
          {isEditing ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
