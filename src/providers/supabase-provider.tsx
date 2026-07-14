'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

type SupabaseContextValue = {
  supabase: SupabaseClient | null;
};

export const SupabaseContext = createContext<SupabaseContextValue>({ supabase: null });

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const [supabase] = useState(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, _session: unknown) => {
      // handled by middleware
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context.supabase) {
    throw new Error(
      'Supabase client is not available. Check your environment variables.',
    );
  }
  return context.supabase;
}
