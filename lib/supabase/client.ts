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

  if (globalInstance) {
    return globalInstance;
  }

  // 2. 如果没有实例，尝试从全局窗口变量中“找回”可能被 RootLayout 注入的配置
  // 这解决了某些分片环境中 process.env 丢失的问题
  const fallbackConfig =
    typeof window !== 'undefined' ? (window as any).__SUPABASE_CONFIG__ : undefined;
  const finalUrl = supabaseUrl || fallbackConfig?.url;
  const finalKey = supabaseAnonKey || fallbackConfig?.key;

  // 3. 诊断并创建
  if (!finalUrl || !finalKey) {
    if (typeof window !== 'undefined') {
      console.warn('Supabase configuration is missing in this chunk! Initializing dummy client...');
    }
  }

  const client = createBrowserClient<Database>(finalUrl || '', finalKey || '');

  // 4. 存入全局缓存（只有在配置完整时）
  if (finalUrl && finalKey) {
    if (typeof window !== 'undefined') {
      (window as any).__supabase_client = client;
    } else if (typeof globalThis !== 'undefined') {
      (globalThis as any).__supabase_client = client;
    }
  }

  return client;
}
