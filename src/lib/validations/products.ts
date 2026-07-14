import { z } from 'zod';

export const productTypeEnum = z.enum(['simple', 'variant', 'service']);
export const productStatusEnum = z.enum(['active', 'inactive', 'archived']);
export const barcodeTypeEnum = z.enum(['ean13', 'ean8', 'upc_a', 'code128', 'qr', 'internal']);

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().max(2000).optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  productType: productTypeEnum,
  trackInventory: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).max(999999).optional(),
});

export const itemSchema = z.object({
  name: z.string().max(200).optional().default(''),
  sku: z
    .string()
    .min(1)
    .max(100)
    .transform((s) => s.trim().toUpperCase())
    .optional(),
  costPrice: z
    .number()
    .min(0, 'Cost price must be >= 0')
    .max(99999999.9999)
    .nullable()
    .optional(),
  sellingPrice: z
    .number()
    .min(0, 'Selling price must be >= 0')
    .max(99999999.9999),
  sortOrder: z.number().int().min(0).optional().default(0),
  barcode: z
    .string()
    .min(1)
    .max(100)
    .refine(
      (v) => !v || !/[\x00-\x1f\x7f]/.test(v),
      'Barcode must not contain control characters',
    )
    .optional(),
  barcodeType: barcodeTypeEnum.optional().default('ean13'),
});

export const createSimpleSchema = productSchema.extend({
  productType: z.literal('simple'),
  items: z.array(itemSchema).length(1, 'Simple product must have exactly one item'),
});

export const createVariantSchema = productSchema.extend({
  productType: z.literal('variant'),
  items: z
    .array(itemSchema)
    .min(2, 'Variant product must have at least 2 items'),
  trackInventory: z.literal(true).optional().default(true),
});

export const createServiceSchema = productSchema.extend({
  productType: z.literal('service'),
  items: z.array(itemSchema).length(1, 'Service product must have exactly one item'),
  trackInventory: z.literal(false).default(false),
});

export const createProductSchema = z.discriminatedUnion('productType', [
  createSimpleSchema,
  createVariantSchema,
  createServiceSchema,
]);

export const updateProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Product name is required').max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  categoryId: z.string().uuid().nullable().optional(),
  brandId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  productType: productTypeEnum.optional(),
  trackInventory: z.boolean().optional(),
  lowStockThreshold: z.number().int().min(0).max(999999).optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).optional().default(0),
});

export const brandSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug may only contain lowercase letters, numbers, and hyphens')
    .optional(),
  description: z.string().max(500).optional(),
});

export function validateBarcode(barcode: string, type: string): string | null {
  const clean = barcode.trim();
  if (clean.length < 1 || clean.length > 100) {
    return 'Barcode must be between 1 and 100 characters';
  }
  if (/[\x00-\x1f\x7f]/.test(clean)) {
    return 'Barcode contains control characters';
  }
  switch (type) {
    case 'ean13':
      return /^\d{13}$/.test(clean) ? null : 'EAN-13 must be exactly 13 digits';
    case 'ean8':
      return /^\d{8}$/.test(clean) ? null : 'EAN-8 must be exactly 8 digits';
    case 'upc_a':
      return /^\d{12}$/.test(clean) ? null : 'UPC-A must be exactly 12 digits';
    case 'code128':
      return /^[\x20-\x7e]+$/.test(clean) ? null : 'Code 128 contains invalid characters';
    case 'internal':
    case 'qr':
      return clean.length >= 1 && clean.length <= 100 ? null : 'Must be 1-100 characters';
    default:
      return 'Unknown barcode type';
  }
}

export type CreateProductInput = z.infer<typeof createSimpleSchema> &
  z.infer<typeof createVariantSchema> &
  z.infer<typeof createServiceSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type BrandInput = z.infer<typeof brandSchema>;
