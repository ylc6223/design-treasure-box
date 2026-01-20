'use client';

import { useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/hooks/use-auth-store';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// ================== 类型定义 ==================

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AuthProviderProps {
  children: React.ReactNode;
  initialProfile?: Profile | null;
}

// ================== 常量 ==================

/** 认证初始化超时时间（毫秒） */
const AUTH_TIMEOUT_MS = 5000;

/** 需要处理的认证事件类型 */
type RelevantAuthEvent = 'INITIAL_SESSION' | 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED';

/** 可以复用SSR数据的事件类型 */
const SSR_REUSABLE_EVENTS: readonly RelevantAuthEvent[] = ['INITIAL_SESSION', 'SIGNED_IN'];

// ================== 辅助函数 ==================

/**
 * 判断事件是否需要处理
 */
function isRelevantAuthEvent(event: string): event is RelevantAuthEvent {
  return ['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT', 'USER_UPDATED'].includes(event);
}

/**
 * 判断是否应使用SSR提供的profile
 * 封装复杂的条件判断，提升可读性
 */
function shouldUseSSRProfile(
  event: string,
  initialProfile: Profile | null | undefined,
  hasSession: boolean
): boolean {
  return SSR_REUSABLE_EVENTS.includes(event as RelevantAuthEvent) && !!initialProfile && hasSession;
}

/**
 * 从数据库获取用户profile
 * 将重复的profile获取逻辑抽取为单一函数
 */
async function fetchUserProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching profile:', error.message);
    return null;
  }
  return data;
}

// ================== 组件 ==================

/**
 * 认证状态管理Provider
 *
 * 职责：
 * 1. 同步SSR获取的用户数据到客户端Store
 * 2. 监听Supabase认证事件并更新状态
 * 3. 提供超时保护，防止loading状态卡死
 */
export function AuthProvider({ children, initialProfile }: AuthProviderProps) {
  const supabase = useMemo(() => createClient(), []);

  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setLoading = useAuthStore((state) => state.setLoading);

  // Effect 1: SSR数据立即同步
  // 将服务端已获取的profile同步到客户端Store，减少loading时间
  useEffect(() => {
    if (initialProfile) {
      console.log('Hydrating auth store with initial profile:', initialProfile.email);
      setAuth({ id: initialProfile.id, email: initialProfile.email }, initialProfile);
      setLoading(false);
    }
  }, [initialProfile, setAuth, setLoading]);

  // Effect 2: 认证状态管理
  // 处理认证初始化、事件监听和超时保护
  useEffect(() => {
    let mounted = true;

    // 超时保护：防止某些极端情况下loading状态卡死
    const fallbackTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - forcing loading to false');
        setLoading(false);
      }
    }, AUTH_TIMEOUT_MS);

    /**
     * 处理认证事件
     */
    const handleAuthEvent = async (
      event: RelevantAuthEvent,
      session: { user: { id: string; email?: string } } | null
    ) => {
      // 优先使用SSR数据，避免不必要的数据库查询
      if (shouldUseSSRProfile(event, initialProfile, !!session?.user)) {
        console.log(`Using initial profile from SSR for ${event}`);
        setAuth({ id: session!.user.id, email: session!.user.email }, initialProfile!);
        setLoading(false);
        clearTimeout(fallbackTimeout);
        return;
      }

      setLoading(true);
      try {
        if (session?.user) {
          const profile = await fetchUserProfile(supabase, session.user.id);
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
        clearTimeout(fallbackTimeout);
      }
    };

    // 主动初始化：处理页面刷新时的session恢复
    const initializeAuth = async () => {
      console.log('Initializing Auth context...');
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          // 优先使用SSR提供的profile，避免不必要的数据库查询
          if (initialProfile) {
            setAuth({ id: session.user.id, email: session.user.email }, initialProfile);
          } else {
            const profile = await fetchUserProfile(supabase, session.user.id);
            if (profile) {
              setAuth({ id: session.user.id, email: session.user.email }, profile);
            }
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

    initializeAuth();

    // 监听认证状态变化
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);

      if (isRelevantAuthEvent(event)) {
        await handleAuthEvent(event, session);
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
