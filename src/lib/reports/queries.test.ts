import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  getSalesOverviewData,
  getProductPerformanceData,
  getPaymentMethodData,
  getInventoryStatusData,
  getMovementSummaryData,
  getBranchPerformanceData,
} from './queries';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({ getAll: vi.fn(() => []) })),
}));

const mockSupabaseClient = {
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

function makeResolvedQuery<T>(data: T) {
  const then = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(onfulfilled);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lt: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ then, catch: vi.fn() })),
    onfulfilled: undefined,
    then,
    catch: vi.fn(),
  };
}

const dateRange = {
  start: new Date('2025-01-01'),
  end: new Date('2025-02-01'),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Reports are organization-wide (no active-branch inheritance)', () => {
  describe('getSalesOverviewData', () => {
    it('queries by organization_id, not by branch_id', async () => {
      const eqCalls: Array<{ table: string; field: string }> = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        const q = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string) => {
            eqCalls.push({ table, field });
            return q;
          }),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
        return q;
      });

      await getSalesOverviewData('UTC', 'org-1', dateRange);

      const branchEqCalls = eqCalls.filter(
        (c) => c.field === 'branch_id',
      );
      expect(branchEqCalls).toHaveLength(0);

      const orgEqCalls = eqCalls.filter(
        (c) => c.field === 'organization_id',
      );
      expect(orgEqCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getProductPerformanceData', () => {
    it('queries by organization_id, not by branch_id', async () => {
      const eqCalls: Array<{ table: string; field: string }> = [];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        const q = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string) => {
            eqCalls.push({ table, field });
            return q;
          }),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          in: vi.fn().mockReturnThis(),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
        return q;
      });

      await getProductPerformanceData('UTC', 'org-1', dateRange);

      const branchEqCalls = eqCalls.filter(
        (c) => c.field === 'branch_id',
      );
      expect(branchEqCalls).toHaveLength(0);

      const orgEqCalls = eqCalls.filter(
        (c) => c.field === 'organization_id',
      );
      expect(orgEqCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getPaymentMethodData', () => {
    it('has no branch_id filter', async () => {
      const eqFields: string[] = [];

      mockSupabaseClient.from.mockImplementation((_table: string) => {
        const q = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string) => {
            eqFields.push(field);
            return q;
          }),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
        return q;
      });

      await getPaymentMethodData('org-1', dateRange);

      expect(eqFields).not.toContain('branch_id');
    });
  });

  describe('getInventoryStatusData', () => {
    it('has no branch_id filter', async () => {
      const eqFields: string[] = [];

      mockSupabaseClient.from.mockImplementation((_table: string) => {
        const q = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string) => {
            eqFields.push(field);
            return q;
          }),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
        return q;
      });

      await getInventoryStatusData('org-1');

      expect(eqFields).not.toContain('branch_id');
    });
  });

  describe('getMovementSummaryData', () => {
    it('has no branch_id filter', async () => {
      const eqFields: string[] = [];

      mockSupabaseClient.from.mockImplementation((_table: string) => {
        const q = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn((field: string) => {
            eqFields.push(field);
            return q;
          }),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
        return q;
      });

      await getMovementSummaryData('org-1', dateRange);

      expect(eqFields).not.toContain('branch_id');
    });
  });

  describe('getBranchPerformanceData', () => {
    it('returns data for ALL branches (branch comparison)', async () => {
      const branchesData = [
        { id: 'b1', name: 'Branch A' },
        { id: 'b2', name: 'Branch B' },
      ];

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'branches') {
          const then1 = (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: branchesData, error: null }).then(onfulfilled);
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            then: then1,
            catch: vi.fn(),
          };
        }
        const then2 = (onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve({
            data: [
              { branch_id: 'b1', total: 100 },
              { branch_id: 'b2', total: 200 },
            ],
            error: null,
          }).then(onfulfilled);
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          gte: vi.fn().mockReturnThis(),
          lt: vi.fn().mockReturnThis(),
          then: then2,
          catch: vi.fn(),
        };
      });

      const result = await getBranchPerformanceData('org-1', dateRange);
      expect(result).toHaveLength(2);
      expect(result[0]?.branchName).toBe('Branch B');
      expect(result[1]?.branchName).toBe('Branch A');
    });
  });
});
