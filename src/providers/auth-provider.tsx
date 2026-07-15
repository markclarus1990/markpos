'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  startTransition,
  type ReactNode,
} from 'react';
import { SupabaseContext } from '@/providers/supabase-provider';
import { useAuthStore } from '@/stores/auth-store';
import type {
  AppContext,
  AuthUser,
  DatabaseOrganization,
  DatabaseBranch,
} from '@/types/database';

const AppContextCtx = createContext<AppContext>({
  user: null,
  organization: null,
  branch: null,
  organizations: [],
  branches: [],
  isLoading: true,
});

function readServerBranchData(): {
  activeBranchId: string;
  activeBranchName: string;
  activeBranchCode: string;
  branches: Array<{ id: string; name: string; code: string }>;
} | null {
  if (typeof document === 'undefined') return null;
  const el = document.getElementById('server-active-branch');
  if (!el?.textContent) return null;
  try {
    return JSON.parse(el.textContent);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabaseCtx = useContext(SupabaseContext);
  const supabase = supabaseCtx.supabase;
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organization, setOrganization] =
    useState<DatabaseOrganization | null>(null);
  const [branch, setBranch] = useState<DatabaseBranch | null>(null);
  const [organizations, setOrganizations] = useState<
    Array<Pick<DatabaseOrganization, 'id' | 'name' | 'slug'>>
  >([]);
  const [branches, setBranches] = useState<
    Array<Pick<DatabaseBranch, 'id' | 'name' | 'code'>>
  >([]);
  const [isLoading, setIsLoading] = useState(supabase !== null);

  const setStoreBranchId = useAuthStore((s) => s.setBranch);

  const loadUserContext = useCallback(async () => {
    if (!supabase) return;

    const serverData = readServerBranchData();

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      startTransition(() => {
        if (!authUser) {
          setUser(null);
          setOrganization(null);
          setBranch(null);
          setOrganizations([]);
          setBranches([]);
          setIsLoading(false);
          return;
        }

        setUser({
          id: authUser.id,
          email: authUser.email ?? '',
          displayName:
            (authUser.user_metadata?.display_name as string) ?? null,
          avatarUrl: (authUser.user_metadata?.avatar_url as string) ?? null,
        });
      });

      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', authUser!.id)
        .eq('is_active', true);

      if (!memberships || memberships.length === 0) {
        startTransition(() => {
          setOrganization(null);
          setBranch(null);
          setOrganizations([]);
          setBranches([]);
          setIsLoading(false);
        });
        return;
      }

      const orgIds = memberships.map((m) => m.organization_id);

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .in('id', orgIds)
        .eq('is_active', true);

      if (orgs && orgs.length > 0) {
        const firstOrg = orgs[0]!;

        const { data: branchesData } = await supabase
          .from('branches')
          .select('id, name, code')
          .eq('organization_id', firstOrg.id)
          .eq('is_active', true);

        startTransition(() => {
          setOrganizations(orgs);
          setOrganization(firstOrg as unknown as DatabaseOrganization);

          const allBranches = branchesData ?? [];

          if (serverData && serverData.activeBranchId) {
            const matchedBranch = allBranches.find(
              (b) => b.id === serverData.activeBranchId,
            );
            if (matchedBranch) {
              setBranches(allBranches);
              setBranch(matchedBranch as unknown as DatabaseBranch);
              setStoreBranchId(matchedBranch.id);
            } else if (allBranches.length > 0) {
              setBranches(allBranches);
              const firstBranch = allBranches[0]!;
              setBranch(firstBranch as unknown as DatabaseBranch);
              setStoreBranchId(firstBranch.id);
            } else {
              setBranches([]);
              setBranch(null);
            }
          } else if (allBranches.length > 0) {
            setBranches(allBranches);
            const firstBranch = allBranches[0]!;
            setBranch(firstBranch as unknown as DatabaseBranch);
            setStoreBranchId(firstBranch.id);
          } else {
            setBranches([]);
            setBranch(null);
          }
          setIsLoading(false);
        });
      } else {
        startTransition(() => {
          setOrganization(null);
          setBranch(null);
          setOrganizations(orgs ?? []);
          setBranches([]);
          setIsLoading(false);
        });
      }
    } catch {
      startTransition(() => {
        setUser(null);
        setIsLoading(false);
      });
    }
  }, [supabase, setStoreBranchId]);

  useEffect(() => {
    if (!supabase) return;

    loadUserContext();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUserContext();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, loadUserContext]);

  return (
    <AppContextCtx.Provider
      value={{
        user,
        organization,
        branch,
        organizations,
        branches,
        isLoading,
      }}
    >
      {children}
    </AppContextCtx.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContextCtx);
}
