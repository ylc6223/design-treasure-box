'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/hooks/use-auth-store';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthProviderProps {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}

export function AuthProvider({ children, initialProfile }: AuthProviderProps) {
  // 确保 Supabase 客户端只创建一次，避免 useEffect 重复触发
  const supabase = useMemo(() => createClient(), []);

  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    let mounted = true;

    // 如果 SSR 已经拿到了 profile，先同步到 Client Store，减少 Loading 时间
    if (initialProfile) {
      console.log('Hydrating auth store with initial profile:', initialProfile.email);
      setAuth({ id: initialProfile.id, email: initialProfile.email }, initialProfile);
      setLoading(false);
    }

    // 安全：无论 Auth 状态如何，5秒后强制关闭 Loading
    // 这是一个备用方案，防止某些极端情况下 onAuthStateChange 不触发
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    const initializeAuth = async () => {
      console.log('Initializing Auth context...');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          console.log('Session found on mount:', session.user.email);
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile) {
            setAuth({ id: session.user.id, email: session.user.email }, profile);
          }
        }
      } catch (err) {
        console.error('Initial session fetch failed:', err);
      } finally {
        if (mounted) {
          setLoading(false);
          clearTimeout(fallbackTimeout);
        }
      }
    };

    // 1. 先进行一次主动初始化
    initializeAuth();

    // 2. 监听后续状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      // 如果不是初始化阶段（初始化已由 initializeAuth 处理），或者出现了明确的状态转换
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setLoading(true);
        try {
          if (session?.user) {
            const { data: profile, error } = await (supabase as any)
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (error) console.error('Error fetching profile:', error.message);
            if (profile) {
              setAuth({ id: session.user.id, email: session.user.email }, profile);
            }
          } else {
            clearAuth();
          }
        } catch (err) {
          console.error('AuthProvider callback error:', err);
          clearAuth();
        } finally {
          setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, [supabase, setAuth, clearAuth, setLoading, initialProfile]);

  return <>{children}</>;
}
