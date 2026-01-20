'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/hooks/use-auth-store';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 确保 Supabase 客户端只创建一次，避免 useEffect 重复触发
  const supabase = useMemo(() => createClient(), []);

  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  useEffect(() => {
    // 监听 Auth 状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setLoading(true);

      try {
        if (session?.user) {
          // 获取最新的 profile
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error.message);
          }

          setAuth({ id: session.user.id, email: session.user.email }, profile);
        } else {
          clearAuth();
        }
      } catch (err) {
        console.error('AuthProvider callback unexpected error:', err);
        clearAuth();
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setAuth, clearAuth, setLoading]);

  return <>{children}</>;
}
