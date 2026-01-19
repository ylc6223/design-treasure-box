import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthState {
  user: {
    id: string;
    email?: string;
  } | null;
  profile: Profile | null;
  isLoading: boolean;
  setAuth: (user: AuthState['user'], profile: Profile | null) => void;
  clearAuth: () => void;
  setLoading: (isLoading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      isLoading: true,
      setAuth: (user, profile) => set({ user, profile, isLoading: false }),
      clearAuth: () => set({ user: null, profile: null, isLoading: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'design-treasure-auth',
      // 只持久化用户信息和 profile
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
      }),
    }
  )
);
