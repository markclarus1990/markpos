export const PRODUCT_TYPES = ['simple', 'variant', 'service'] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ['active', 'inactive', 'archived'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export interface Product {
  id: string;
  organizationId: string;
  categoryId: string | null;
  brandId: string | null;
  unitId: string | null;
  productType: ProductType;
  name: string;
  description: string | null;
  trackInventory: boolean;
  lowStockThreshold: number;
  status: ProductStatus;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  productId: string;
  organizationId: string;
  name: string;
  sku: string | null;
  costPrice: number | null;
  sellingPrice: number | null;
  sortOrder: number;
  status: ProductStatus;
  archivedAt: string | null;
  archivedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductBarcode {
  id: string;
  organizationId: string;
  itemId: string;
  barcode: string;
  barcodeType: string;
  isPrimary: boolean;
  createdAt: string;
}

export interface ProductImage {
  id: string;
  organizationId: string;
  productId: string;
  storageBucket: string;
  storagePath: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'code128', 'qr', 'internal'] as const;
export type BarcodeType = (typeof BARCODE_TYPES)[number];
