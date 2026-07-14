import { describe, it, expect } from 'vitest';
import {
  createProductSchema,
  createSimpleSchema,
  createVariantSchema,
  createServiceSchema,
  updateProductSchema,
  categorySchema,
  brandSchema,
  validateBarcode,
  barcodeTypeEnum,
  productTypeEnum,
  productStatusEnum,
} from './products';

describe('productTypeEnum', () => {
  it('accepts simple', () => {
    expect(productTypeEnum.parse('simple')).toBe('simple');
  });

  it('accepts variant', () => {
    expect(productTypeEnum.parse('variant')).toBe('variant');
  });

  it('accepts service', () => {
    expect(productTypeEnum.parse('service')).toBe('service');
  });

  it('rejects invalid type', () => {
    expect(() => productTypeEnum.parse('bundle')).toThrow();
  });
});

describe('productStatusEnum', () => {
  it('accepts active, inactive, archived', () => {
    expect(productStatusEnum.parse('active')).toBe('active');
    expect(productStatusEnum.parse('inactive')).toBe('inactive');
    expect(productStatusEnum.parse('archived')).toBe('archived');
  });
});

describe('categorySchema', () => {
  it('accepts valid category', () => {
    const result = categorySchema.safeParse({ name: 'Beverages' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categorySchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts slug override', () => {
    const result = categorySchema.safeParse({ name: 'Beverages', slug: 'drinks' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug', () => {
    const result = categorySchema.safeParse({ name: 'Test', slug: 'INVALID SLUG!' });
    expect(result.success).toBe(false);
  });
});

describe('brandSchema', () => {
  it('accepts valid brand', () => {
    const result = brandSchema.safeParse({ name: 'Nike' });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = brandSchema.safeParse({ name: '' });
    expect(result.success).toBe(false);
  });
});

describe('createSimpleSchema', () => {
  const validItem = {
    name: '',
    sku: 'SIMPLE-001',
    sellingPrice: 9.99,
    costPrice: 5.0,
    barcode: '1234567890123',
    barcodeType: 'ean13' as const,
  };

  it('accepts valid simple product with one item', () => {
    const result = createSimpleSchema.safeParse({
      name: 'Test Product',
      productType: 'simple',
      items: [validItem],
    });
    expect(result.success).toBe(true);
  });

  it('rejects simple product with zero items', () => {
    const result = createSimpleSchema.safeParse({
      name: 'Test Product',
      productType: 'simple',
      items: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects simple product with multiple items', () => {
    const result = createSimpleSchema.safeParse({
      name: 'Test Product',
      productType: 'simple',
      items: [validItem, { ...validItem, sku: 'SIMPLE-002' }],
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional cost price', () => {
    const result = createSimpleSchema.safeParse({
      name: 'Test Product',
      productType: 'simple',
      items: [{ ...validItem, costPrice: null }],
    });
    expect(result.success).toBe(true);
  });
});

describe('createVariantSchema', () => {
  it('accepts valid variant product with 2+ items', () => {
    const result = createVariantSchema.safeParse({
      name: 'Variant Product',
      productType: 'variant',
      items: [
        { name: 'Small', sku: 'VAR-001', sellingPrice: 9.99 },
        { name: 'Large', sku: 'VAR-002', sellingPrice: 14.99 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects variant product with 1 item', () => {
    const result = createVariantSchema.safeParse({
      name: 'Variant Product',
      productType: 'variant',
      items: [
        { name: 'Only', sku: 'VAR-001', sellingPrice: 9.99 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('forces trackInventory to true', () => {
    const result = createVariantSchema.safeParse({
      name: 'Variant Product',
      productType: 'variant',
      items: [
        { name: 'Small', sellingPrice: 9.99 },
        { name: 'Large', sellingPrice: 14.99 },
      ],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.trackInventory).toBe(true);
    }
  });
});

describe('createServiceSchema', () => {
  it('accepts valid service product', () => {
    const result = createServiceSchema.safeParse({
      name: 'Consultation',
      productType: 'service',
      trackInventory: false,
      items: [
        { name: '', sku: 'SVC-001', sellingPrice: 99.99 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects trackInventory=true for service', () => {
    const result = createServiceSchema.safeParse({
      name: 'Consultation',
      productType: 'service',
      trackInventory: true,
      items: [
        { name: '', sellingPrice: 99.99 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('defaults trackInventory to false for service when omitted', () => {
    const result = createServiceSchema.safeParse({
      name: 'Consultation',
      productType: 'service',
      items: [
        { name: '', sellingPrice: 99.99 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects service with no price', () => {
    const result = createServiceSchema.safeParse({
      name: 'Consultation',
      productType: 'service',
      items: [
        { name: '' },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe('createProductSchema (discriminated union)', () => {
  it('accepts simple type', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      productType: 'simple',
      items: [{ sellingPrice: 10 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts variant type', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      productType: 'variant',
      items: [{ name: 'A', sellingPrice: 10 }, { name: 'B', sellingPrice: 15 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts service type', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      productType: 'service',
      trackInventory: false,
      items: [{ sellingPrice: 50 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown type', () => {
    const result = createProductSchema.safeParse({
      name: 'Test',
      productType: 'unknown',
      items: [{ sellingPrice: 10 }],
    });
    expect(result.success).toBe(false);
  });
});

describe('updateProductSchema', () => {
  it('accepts partial update', () => {
    const result = updateProductSchema.safeParse({
      id: '00000000-0000-0000-0000-000000000000',
      name: 'Updated Name',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid id', () => {
    const result = updateProductSchema.safeParse({
      id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('validateBarcode', () => {
  it('accepts valid EAN-13', () => {
    expect(validateBarcode('1234567890123', 'ean13')).toBeNull();
  });

  it('rejects EAN-13 with wrong length', () => {
    expect(validateBarcode('123456789012', 'ean13')).toBe('EAN-13 must be exactly 13 digits');
  });

  it('rejects EAN-13 with letters', () => {
    expect(validateBarcode('123456789012a', 'ean13')).toBe('EAN-13 must be exactly 13 digits');
  });

  it('accepts valid EAN-8', () => {
    expect(validateBarcode('12345678', 'ean8')).toBeNull();
  });

  it('accepts valid UPC-A', () => {
    expect(validateBarcode('123456789012', 'upc_a')).toBeNull();
  });

  it('accepts valid Code 128', () => {
    expect(validateBarcode('ABC-123', 'code128')).toBeNull();
  });

  it('rejects Code 128 with control chars via generic check', () => {
    expect(validateBarcode('ABC\u0001', 'code128')).toBe('Barcode contains control characters');
  });

  it('accepts valid internal barcode', () => {
    expect(validateBarcode('INT-001', 'internal')).toBeNull();
  });

  it('accepts valid QR identifier', () => {
    expect(validateBarcode('QR-IDENTIFIER-001', 'qr')).toBeNull();
  });

  it('rejects empty barcode', () => {
    expect(validateBarcode('', 'internal')).toBe('Barcode must be between 1 and 100 characters');
  });

  it('rejects barcode longer than 100 chars', () => {
    expect(validateBarcode('a'.repeat(101), 'internal')).toBe('Barcode must be between 1 and 100 characters');
  });

  it('rejects barcode with control characters', () => {
    expect(validateBarcode('abc\x00', 'internal')).toBe('Barcode contains control characters');
  });
});

describe('barcodeTypeEnum', () => {
  it('accepts all standard types', () => {
    expect(barcodeTypeEnum.parse('ean13')).toBe('ean13');
    expect(barcodeTypeEnum.parse('ean8')).toBe('ean8');
    expect(barcodeTypeEnum.parse('upc_a')).toBe('upc_a');
    expect(barcodeTypeEnum.parse('code128')).toBe('code128');
    expect(barcodeTypeEnum.parse('qr')).toBe('qr');
    expect(barcodeTypeEnum.parse('internal')).toBe('internal');
  });

  it('rejects unknown type', () => {
    expect(() => barcodeTypeEnum.parse('pdf417')).toThrow();
  });
});
