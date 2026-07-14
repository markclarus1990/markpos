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
import { useSupabase } from '@/providers/supabase-provider';
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useSupabase();
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
  const [isLoading, setIsLoading] = useState(true);

  const setStoreBranch = useAuthStore((s) => s.setBranch);

  const loadUserContext = useCallback(async () => {
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
          if (branchesData && branchesData.length > 0) {
            setBranches(branchesData);
            const firstBranch = branchesData[0]!;
            setBranch(firstBranch as unknown as DatabaseBranch);
            setStoreBranch(firstBranch.id);
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
  }, [supabase, setStoreBranch]);

  useEffect(() => {
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
