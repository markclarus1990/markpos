import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { listSales, getSalesSummary, getSale, getSaleReceipt } from './queries';

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
          Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    }
    return mockFromChain([]);
  });
});

function mockSalesQuery(data: unknown[], count?: number) {
  const q = mockFromChain(data, count);
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
          Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    }
    if (table === 'sale_items') {
      return {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    }
    return q;
  });
  return q;
}

describe('listSales', () => {
  it('returns sales list with pagination', async () => {
    mockSalesQuery(
      [
        {
          id: 'sale-1',
          receipt_number: 'RCP-001',
          created_at: '2025-01-01T10:00:00Z',
          total: 150.0,
          status: 'completed',
          payment_method: 'cash',
          branch: { name: 'Main Branch' },
        },
      ],
      1,
    );

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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sale_items') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([
              { sale_id: 'sale-1' },
              { sale_id: 'sale-1' },
              { sale_id: 'sale-1' },
            ])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return mockFromChain(
        [
          {
            id: 'sale-1',
            receipt_number: 'RCP-001',
            created_at: '2025-01-01T10:00:00Z',
            total: 150.0,
            status: 'completed',
            payment_method: 'cash',
            branch: { name: 'Main Branch' },
          },
        ],
        1,
      );
    });

    const result = await listSales({ page: 1, pageSize: 25 });
    expect(result.total).toBe(1);
    expect(result.sales).toHaveLength(1);
    const sale = result.sales[0]!;
    expect(sale.receiptNumber).toBe('RCP-001');
    expect(sale.itemCount).toBe(3);
  });

  it('handles empty sales list', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sale_items') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return mockFromChain([], 0);
    });

    const result = await listSales();
    expect(result.total).toBe(0);
    expect(result.sales).toHaveLength(0);
  });

  it('applies search filter', async () => {
    let capturedPattern = '';
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sale_items') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve(mockThenable([])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      const mockQ = mockFromChain([], 0);
      mockQ.ilike = vi.fn((_field: string, pattern: string) => {
        capturedPattern = pattern;
        return mockQ;
      });
      return mockQ;
    });

    await listSales({ search: 'RCP-001' });
    expect(capturedPattern).toBe('%RCP-001%');
  });
});

describe('getSalesSummary', () => {
  it('calculates totals from filtered sales', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sales') {
        return mockFromChain([
          { total: 100 },
          { total: 200 },
          { total: 300 },
        ]);
      }
      return mockFromChain([]);
    });

    const summary = await getSalesSummary({ status: 'completed' });
    expect(summary.totalRevenue).toBe(600);
    expect(summary.transactionCount).toBe(3);
    expect(summary.avgTransactionValue).toBe(200);
  });

  it('handles zero transactions', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sales') {
        return mockFromChain([]);
      }
      return mockFromChain([]);
    });

    const summary = await getSalesSummary();
    expect(summary.totalRevenue).toBe(0);
    expect(summary.transactionCount).toBe(0);
    expect(summary.avgTransactionValue).toBe(0);
  });
});

describe('getSale', () => {
  it('returns null for non-existent sale', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sales') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: null, error: { code: 'PGRST116' } }).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    });

    const result = await getSale('nonexistent-id');
    expect(result).toBeNull();
  });
});

describe('getSaleReceipt', () => {
  it('returns null for non-existent sale', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      if (table === 'sales') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockReturnThis(),
          then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: null, error: { code: 'PGRST116' } }).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve({ data: null, error: null }).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    });

    const result = await getSaleReceipt('nonexistent-id');
    expect(result).toBeNull();
  });
});

describe('getSale org-scoping regression', () => {
  it('queries by organization_id not by branch_id', async () => {
    const eqCalls: Array<{ table: string; field: string; value: unknown }> = [];

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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      const q = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((field: string, value: unknown) => {
          eqCalls.push({ table, field, value });
          return q;
        }),
        single: vi.fn(() => ({
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({
              data: table === 'sales' ? {
                id: 'sale-1',
                receipt_number: 'RCP-001',
                created_at: '2025-01-01T10:00:00Z',
                status: 'completed',
                subtotal: 100,
                total: 150,
                payment_method: 'cash',
                branch: { name: 'Main Branch' },
                organization: { name: 'Org' },
              } : null,
              error: null,
            }).then(onfulfilled),
          catch: vi.fn(),
        })),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
      return q;
    });

    const result = await getSale('sale-1');
    expect(result).not.toBeNull();

    const branchEqCalls = eqCalls.filter(
      (c) => c.table === 'sales' && c.field === 'branch_id',
    );
    expect(branchEqCalls).toHaveLength(0);

    const orgEqCalls = eqCalls.filter(
      (c) => c.table === 'sales' && c.field === 'organization_id',
    );
    expect(orgEqCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('getSaleReceipt org-scoping regression', () => {
  it('queries by organization_id not by branch_id', async () => {
    const eqCalls: Array<{ table: string; field: string; value: unknown }> = [];

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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      const q = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((field: string, value: unknown) => {
          eqCalls.push({ table, field, value });
          return q;
        }),
        single: vi.fn(() => ({
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({
              data: table === 'sales' ? {
                id: 'sale-1',
                receipt_number: 'RCP-001',
                created_at: '2025-01-01T10:00:00Z',
                subtotal: 100,
                total: 150,
                payment_method: 'cash',
                branch: { name: 'Main Branch' },
                organization: { name: 'Org' },
              } : null,
              error: null,
            }).then(onfulfilled),
          catch: vi.fn(),
        })),
        order: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
      return q;
    });

    const result = await getSaleReceipt('sale-1');
    expect(result).not.toBeNull();

    const branchEqCalls = eqCalls.filter(
      (c) => c.table === 'sales' && c.field === 'branch_id',
    );
    expect(branchEqCalls).toHaveLength(0);

    const orgEqCalls = eqCalls.filter(
      (c) => c.table === 'sales' && c.field === 'organization_id',
    );
    expect(orgEqCalls.length).toBeGreaterThanOrEqual(1);
  });
});

describe('listSales branch-default regression', () => {
  it('defaults to active branch when no explicit branchId', async () => {
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
    });

    const result = await listSales();
    expect(result.total).toBe(0);
  });

  it('accepts explicit branchId override', async () => {
    const captured = { branchId: '' };
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
            Promise.resolve(mockThenable([{ id: 'branch-1' }])).then(onfulfilled),
          ),
          catch: vi.fn(),
        };
      }
      const q = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn((field: string, value: unknown) => {
          if (field === 'branch_id') captured.branchId = value as string;
          return q;
        }),
        in: vi.fn().mockReturnThis(),
        ilike: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        lt: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        then: vi.fn((onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve(mockThenable([])).then(onfulfilled),
        ),
        catch: vi.fn(),
      };
      return q;
    });

    await listSales({ branchId: 'explicit-branch' });
    expect(captured.branchId).toBe('explicit-branch');
  });
});
