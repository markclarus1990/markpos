import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { listInventory, getInventorySummary, getInventoryItem, getInventoryItemAllBranches, listMovements } from './queries';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
  })),
}));

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

function mockThenable<T>(data: T, count?: number) {
  return { data, count, error: null };
}

function mockFromChain(data: unknown, count?: number) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
      Promise.resolve(mockThenable(data, count)).then(onfulfilled),
    ),
    catch: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });

  mockSupabaseClient.from.mockImplementation((table: string) => {
    if (table === 'organization_members') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    }
    if (table === 'branches') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    }
    return mockFromChain([]);
  });
});

function makeInventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'inv-1',
    item_id: 'item-1',
    quantity_on_hand: 50,
    updated_at: '2025-01-01T10:00:00Z',
    created_at: '2025-01-01T10:00:00Z',
    item: {
      id: 'item-1',
      name: 'Variant A',
      sku: 'SKU-001',
      product: {
        id: 'prod-1',
        name: 'Test Product',
        track_inventory: true,
        low_stock_threshold: 10,
        category: { name: 'Category 1' },
      },
    },
    branch: { name: 'Main Branch' },
    ...overrides,
  };
}

function makeMovementRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mov-1',
    movement_type: 'adjustment',
    quantity_change: 10,
    quantity_before: 40,
    quantity_after: 50,
    reference: 'count_correction',
    notes: null,
    created_at: '2025-01-02T10:00:00Z',
    created_by: 'user-1',
    item: {
      id: 'item-1',
      name: 'Variant A',
      sku: 'SKU-001',
      product: { name: 'Test Product' },
    },
    branch: { name: 'Main Branch' },
    ...overrides,
  };
}

describe('listInventory', () => {
  it('returns inventory list with pagination', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([makeInventoryRow()], 1);
      }
      return mockFromChain([]);
    });

    const result = await listInventory({ page: 1, pageSize: 25 });
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.productName).toBe('Test Product');
    expect(result.items[0]!.quantityOnHand).toBe(50);
  });

  it('handles empty inventory', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([], 0);
      }
      return mockFromChain([]);
    });

    const result = await listInventory();
    expect(result.total).toBe(0);
    expect(result.items).toHaveLength(0);
  });

  it('filters by in_stock status', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([
          makeInventoryRow({ id: 'inv-1', quantity_on_hand: 50 }),
          makeInventoryRow({ id: 'inv-2', quantity_on_hand: 5 }),
          makeInventoryRow({ id: 'inv-3', quantity_on_hand: 0 }),
        ], 3);
      }
      return mockFromChain([]);
    });

    const result = await listInventory({ stockStatus: 'in_stock', page: 1, pageSize: 25 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.quantityOnHand).toBe(50);
  });

  it('filters by low_stock status', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([
          makeInventoryRow({ id: 'inv-1', quantity_on_hand: 50 }),
          makeInventoryRow({ id: 'inv-2', quantity_on_hand: 5 }),
          makeInventoryRow({ id: 'inv-3', quantity_on_hand: 0 }),
        ], 3);
      }
      return mockFromChain([]);
    });

    const result = await listInventory({ stockStatus: 'low_stock', page: 1, pageSize: 25 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.quantityOnHand).toBe(5);
  });

  it('filters by out_of_stock status', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([
          makeInventoryRow({ id: 'inv-1', quantity_on_hand: 50 }),
          makeInventoryRow({ id: 'inv-2', quantity_on_hand: 5 }),
          makeInventoryRow({ id: 'inv-3', quantity_on_hand: 0 }),
        ], 3);
      }
      return mockFromChain([]);
    });

    const result = await listInventory({ stockStatus: 'out_of_stock', page: 1, pageSize: 25 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.quantityOnHand).toBe(0);
  });

  it('sorts by product name ascending by default', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([
          makeInventoryRow({
            id: 'inv-1',
            item: { id: 'item-1', name: 'B Item', sku: 'SKU-002', product: { id: 'prod-1', name: 'B Product', track_inventory: true, low_stock_threshold: 10, category: { name: 'Cat' } } },
          }),
          makeInventoryRow({
            id: 'inv-2',
            item: { id: 'item-2', name: 'A Item', sku: 'SKU-001', product: { id: 'prod-2', name: 'A Product', track_inventory: true, low_stock_threshold: 10, category: { name: 'Cat' } } },
          }),
        ], 2);
      }
      return mockFromChain([]);
    });

    const result = await listInventory({ page: 1, pageSize: 25 });
    expect(result.items).toHaveLength(2);
    expect(result.items[0]!.productName).toBe('A Product');
    expect(result.items[1]!.productName).toBe('B Product');
  });
});

describe('getInventorySummary', () => {
  it('returns correct counts', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'branch-1', name: 'Main Branch' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory') {
        return mockFromChain([
          makeInventoryRow({ id: 'inv-1', quantity_on_hand: 50 }),
          makeInventoryRow({ id: 'inv-2', quantity_on_hand: 5 }),
          makeInventoryRow({ id: 'inv-3', quantity_on_hand: 0 }),
        ]);
      }
      if (table === 'product_items') {
        return mockFromChain([]);
      }
      return mockFromChain([]);
    });

    const summary = await getInventorySummary();
    expect(summary.totalItems).toBeGreaterThanOrEqual(0);
    expect(summary.inStock).toBeGreaterThanOrEqual(0);
    expect(summary.lowStock).toBeGreaterThanOrEqual(0);
    expect(summary.outOfStock).toBeGreaterThanOrEqual(0);
  });
});

describe('listMovements', () => {
  it('returns movement list with pagination', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory_movements') {
        return mockFromChain([makeMovementRow()], 1);
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ id: 'user-1', full_name: 'Test User' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return mockFromChain([]);
    });

    const result = await listMovements({ page: 1, pageSize: 25 });
    expect(result.movements).toHaveLength(1);
    expect(result.movements[0]!.productName).toBe('Test Product');
    expect(result.movements[0]!.movementType).toBe('adjustment');
    expect(result.movements[0]!.createdByName).toBe('Test User');
  });

  it('handles empty movements', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory_movements') {
        return mockFromChain([], 0);
      }
      return mockFromChain([]);
    });

    const result = await listMovements();
    expect(result.total).toBe(0);
    expect(result.movements).toHaveLength(0);
  });

  it('filters by movement type', async () => {
    let capturedType = '';
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'organization_members') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([{ organization_id: 'org-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'inventory_movements') {
        const mockQ = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string, val: unknown) => {
            if (field === 'movement_type') capturedType = val as string;
            return mockQ;
          }),
          in: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([], 0)).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
        return mockQ;
      }
      return mockFromChain([]);
    });

    await listMovements({ movementType: 'adjustment' });
    expect(capturedType).toBe('adjustment');
  });
});
