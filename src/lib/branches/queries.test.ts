import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import {
  getActiveBranchId,
  getActiveBranch,
  getUserAccessibleBranches,
  getBranchStaff,
  getBranchesStaff,
  getOrganizationRoles,
} from './queries';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
});

const mockCookies = {
  get: vi.fn().mockReturnValue(undefined),
  getAll: vi.fn(() => []),
};

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => mockCookies),
}));

const mockSupabaseClient = {
  auth: { getUser: vi.fn() },
  from: vi.fn(),
};

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => mockSupabaseClient),
}));

function queryResolved<T>(data: T) {
  const thenFn = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(onfulfilled);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
    maybeSingle: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
    then: thenFn,
    catch: vi.fn(),
  };
}

function queryResolvedSingle<T>(data: T) {
  const thenFn = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(onfulfilled);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
    then: thenFn,
    catch: vi.fn(),
  };
}

function queryResolvedArray<T>(data: T[]) {
  const thenFn = (onfulfilled: (v: unknown) => unknown) =>
    Promise.resolve({ data, error: null }).then(onfulfilled);
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
    maybeSingle: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
    then: thenFn,
    catch: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSupabaseClient.auth.getUser.mockResolvedValue({
    data: { user: { id: 'user-1' } },
    error: null,
  });
  mockCookies.get.mockReturnValue(undefined);
  mockCookies.getAll.mockReturnValue([]);
});

describe('getActiveBranchId', () => {
  it('returns cookie branch id when valid and active', async () => {
    mockCookies.get.mockReturnValue({ value: 'branch-cookie-1' });

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branches') {
        return queryResolvedSingle({ id: 'branch-cookie-1' });
      }
      return queryResolvedArray([]);
    });

    const result = await getActiveBranchId(mockSupabaseClient as never, 'org-1');
    expect(result).toBe('branch-cookie-1');
  });

  it('falls back to first active branch when cookie is invalid', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branches') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          then: (onfulfilled: (v: unknown) => unknown) =>
            Promise.resolve({ data: [{ id: 'fallback-branch' }], error: null }).then(onfulfilled),
          catch: vi.fn(),
        };
      }
      return queryResolvedArray([]);
    });

    const result = await getActiveBranchId(mockSupabaseClient as never, 'org-1');
    expect(result).toBe('fallback-branch');
  });

  it('returns null when no active branches exist', async () => {
    mockSupabaseClient.from.mockReturnValue(queryResolvedArray([]));

    const result = await getActiveBranchId(mockSupabaseClient as never, 'org-1');
    expect(result).toBeNull();
  });
});

describe('getActiveBranch', () => {
  it('returns branch data from active id', async () => {
    const branch = { id: 'branch-1', name: 'Main', code: 'MAIN', is_active: true };
    let callCount = 0;
    mockSupabaseClient.from.mockImplementation((_table: string) => {
      callCount++;
      const thenFn = (onfulfilled: (v: unknown) => unknown) =>
        Promise.resolve({ data: callCount === 2 ? branch : [{ id: 'branch-1' }], error: null }).then(onfulfilled);
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
        maybeSingle: vi.fn(() => ({ then: thenFn, catch: vi.fn() })),
        then: thenFn,
        catch: vi.fn(),
      };
    });

    const result = await getActiveBranch(mockSupabaseClient as never, 'org-1');
    expect(result).toEqual(branch);
  });

  it('returns null when no active branch', async () => {
    mockSupabaseClient.from.mockReturnValue(queryResolvedArray([]));
    const result = await getActiveBranch(mockSupabaseClient as never, 'org-1');
    expect(result).toBeNull();
  });
});

describe('getUserAccessibleBranches', () => {
  it('returns all branches for owner', async () => {
    const branches = [
      { id: 'b1', name: 'A', code: 'A-1', is_active: true },
      { id: 'b2', name: 'B', code: 'B-1', is_active: true },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branches') return { ...queryResolvedArray(branches), order: vi.fn().mockReturnThis() };
      if (table === 'organization_members') return queryResolvedSingle({ id: 'member-1' });
      return queryResolvedArray([]);
    });

    const result = await getUserAccessibleBranches(
      mockSupabaseClient as never,
      'org-1',
      'user-1',
    );
    expect(result).toHaveLength(2);
  });

  it('returns only assigned branches for staff', async () => {
    const branches = [
      { id: 'b1', name: 'A', code: 'A-1', is_active: true },
      { id: 'b2', name: 'B', code: 'B-1', is_active: true },
    ];

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branches') return { ...queryResolvedArray(branches), order: vi.fn().mockReturnThis() };
      if (table === 'organization_members') return queryResolvedSingle(null);
      if (table === 'branch_staff') return queryResolvedArray([{ branch_id: 'b1' }]);
      return queryResolvedArray([]);
    });

    const result = await getUserAccessibleBranches(
      mockSupabaseClient as never,
      'org-1',
      'user-1',
    );
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe('b1');
  });

  it('returns empty array when no branches exist', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branches') return queryResolvedArray([]);
      if (table === 'organization_members') return queryResolvedSingle(null);
      return queryResolvedArray([]);
    });

    const result = await getUserAccessibleBranches(
      mockSupabaseClient as never,
      'org-1',
      'user-1',
    );
    expect(result).toEqual([]);
  });
});

describe('getBranchStaff', () => {
  it('returns staff with role names and user identifiers', async () => {
    let callCount = 0;
    mockSupabaseClient.from.mockImplementation((table: string) => {
      callCount++;
      if (table === 'branch_staff') {
        return queryResolvedArray([
          { id: 'a1', user_id: 'u1', role_id: 'r1', is_active: true },
          { id: 'a2', user_id: 'u2', role_id: null, is_active: false },
        ]);
      }
      if (table === 'profiles') {
        return queryResolvedArray([
          { id: 'u1', display_name: 'Alice' },
        ]);
      }
      if (table === 'roles') {
        return queryResolvedArray([
          { id: 'r1', name: 'Cashier' },
        ]);
      }
      return queryResolvedArray([]);
    });

    const result = await getBranchStaff(mockSupabaseClient as never, 'branch-1');
    expect(result).toHaveLength(2);

    const alice = result.find((s) => s.userId === 'u1')!;
    expect(alice.userIdentifier).toBe('Alice');
    expect(alice.roleName).toBe('Cashier');
    expect(alice.isActive).toBe(true);

    const unknown = result.find((s) => s.userId === 'u2')!;
    expect(unknown.userIdentifier).toBe('u2');
    expect(unknown.roleName).toBeNull();
    expect(unknown.isActive).toBe(false);
  });

  it('returns empty array when assignments is null', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branch_staff') return queryResolvedArray([]);
      return queryResolvedArray([]);
    });

    const result = await getBranchStaff(mockSupabaseClient as never, 'branch-1');
    expect(result).toEqual([]);
  });

  it('returns fallback user id when no profile', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branch_staff') {
        return queryResolvedArray([
          { id: 'a1', user_id: 'u1', role_id: null, is_active: true },
        ]);
      }
      if (table === 'profiles') return queryResolvedArray([]);
      return queryResolvedArray([]);
    });

    const result = await getBranchStaff(mockSupabaseClient as never, 'branch-1');
    expect(result[0]?.userIdentifier).toBe('u1');
  });
});

describe('getBranchesStaff', () => {
  it('batch-loads staff across multiple branches', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branch_staff') {
        return queryResolvedArray([
          { id: 'a1', branch_id: 'b1', user_id: 'u1', role_id: null, is_active: true },
          { id: 'a2', branch_id: 'b2', user_id: 'u1', role_id: null, is_active: true },
        ]);
      }
      if (table === 'profiles') {
        return queryResolvedArray([
          { id: 'u1', display_name: 'Alice' },
        ]);
      }
      return queryResolvedArray([]);
    });

    const result = await getBranchesStaff(mockSupabaseClient as never, ['b1', 'b2']);
    expect(result['b1']).toHaveLength(1);
    expect(result['b2']).toHaveLength(1);
    expect(result['b1']?.[0]?.userIdentifier).toBe('Alice');
  });

  it('returns empty record when no branch IDs given', async () => {
    const result = await getBranchesStaff(mockSupabaseClient as never, []);
    expect(result).toEqual({});
  });

  it('returns empty for branches with no staff', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'branch_staff') return queryResolvedArray([]);
      return queryResolvedArray([]);
    });

    const result = await getBranchesStaff(mockSupabaseClient as never, ['b1']);
    expect(result).toEqual({});
  });
});

describe('getOrganizationRoles', () => {
  it('returns roles scoped to org or global', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'roles') {
        const thenFn = (onfulfilled: (v: unknown) => unknown) =>
          Promise.resolve({
            data: [
              { id: 'r1', name: 'Org Role' },
              { id: 'r2', name: 'Global Role' },
            ],
            error: null,
          }).then(onfulfilled);
        return {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          then: thenFn,
          catch: vi.fn(),
        };
      }
      return queryResolvedArray([]);
    });

    const result = await getOrganizationRoles(mockSupabaseClient as never, 'org-1');
    expect(result).toHaveLength(2);
    expect(result[0]?.name).toBe('Org Role');
    expect(result[1]?.name).toBe('Global Role');
  });

  it('returns empty array when no roles', async () => {
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'roles') return queryResolvedArray([]);
      return queryResolvedArray([]);
    });

    const result = await getOrganizationRoles(mockSupabaseClient as never, 'org-1');
    expect(result).toEqual([]);
  });
});
