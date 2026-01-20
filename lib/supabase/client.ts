'use client';

// lib/supabase/client.ts
// Supabase 客户端（浏览器端）- 增强单例模式
// 使用全局对象存储实例，确保在 Next.js 多分片打包环境下依然共享同一个实例

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

// 声明全局扩展
declare global {
  var __supabase_client: SupabaseClient<Database> | undefined;
}

export function createClient(): SupabaseClient<Database> {
  // 获取当前环境的环境变量（在不同分片中可能有差异）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 1. 优先从全局获取实例
  const globalInstance = (
    typeof window !== 'undefined'
      ? (window as any).__supabase_client
      : (globalThis as any).__supabase_client
  ) as SupabaseClient<Database> | undefined;

  // 检查已存在的实例是否“健康”（是否有基本的 URL 配置）
  // 注意：SupabaseClient 结构较复杂，这里仅通过环境变量可用性判断是否需要重新创建
  if (globalInstance) {
    // 如果已有实例，且当前分片拿不到环境变量，则信任已有实例
    if (!supabaseUrl || !supabaseAnonKey) {
      return globalInstance;
    }
    // 如果已有实例，但当前分片能拿到环境变量，也可以考虑直接返回实例
    return globalInstance;
  }

  // 2. 如果没有实例，且当前分片也没有环境变量，报错但尝试创建（可能导致挂起）
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase environment variables are missing in this chunk! ' +
        'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
    );
  }

  // 3. 创建新实例
  const client = createBrowserClient<Database>(supabaseUrl || '', supabaseAnonKey || '');

  // 4. 只在环境变量有效的情况下才存入全局，避免“坏实例”污染全局
  if (supabaseUrl && supabaseAnonKey) {
    if (typeof window !== 'undefined') {
      (window as any).__supabase_client = client;
    } else if (typeof globalThis !== 'undefined') {
      (globalThis as any).__supabase_client = client;
    }
  }

  return client;
}
