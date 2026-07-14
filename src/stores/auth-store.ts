import { create } from 'zustand';

interface AuthState {
  organizationId: string | null;
  branchId: string | null;
  isAuthenticated: boolean;
  setOrganization: (id: string) => void;
  setBranch: (id: string) => void;
  setAuthenticated: (value: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  organizationId: null,
  branchId: null,
  isAuthenticated: false,
  setOrganization: (id) => set({ organizationId: id }),
  setBranch: (id) => set({ branchId: id }),
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  reset: () =>
    set({
      organizationId: null,
      branchId: null,
      isAuthenticated: false,
    }),
}));
