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

/**
 * 创建 Supabase 客户端客户端实例（单例模式）
 *
 * ✅ 这个函数会返回一个全局单例，所有组件共享同一个实例。
 *
 * ## 为什么客户端使用单例模式？
 *
 * 与服务端不同，浏览器环境有以下特点：
 * - 只有一个当前用户，不存在多租户问题
 * - Cookies 由浏览器自动管理，所有请求共享
 * - 复用实例可以节省内存（每个实例约 50-100KB）
 * - 在 Next.js 多分片打包环境下，保证所有 chunk 使用同一个实例
 *
 * ## 性能优势
 *
 * 单例模式可以避免：
 * - 重复创建实例（节省内存）
 * - 重复读取环境变量
 * - 配置不一致问题
 *
 * ## ✅ 正确用法
 *
 * ```typescript
 * // 在 Client Component 中随意调用
 * function MyComponent() {
 *   const supabase = createClient(); // 会复用全局实例
 *   // 使用 supabase...
 * }
 *
 * // 在多个组件中调用
 * function ComponentA() {
 *   const supabase = createClient(); // 创建并缓存
 * }
 *
 * function ComponentB() {
 *   const supabase = createClient(); // 复用上面的实例
 * }
 *
 * // 在 hooks 中使用
 * export function useUserData() {
 *   const supabase = createClient();
 *   const [data, setData] = useState(null);
 *   useEffect(() => {
 *     supabase.from('users').select('*').then(setData);
 *   }, []);
 *   return data;
 * }
 * ```
 *
 * ## 工作原理
 *
 * 1. 检查全局对象 `window.__supabase_client` 是否已有实例
 * 2. 如果有，直接返回（复用）
 * 3. 如果没有，创建新实例并存入全局对象
 * 4. 所有后续调用都会复用同一个实例
 *
 * ## Next.js 多分片打包问题
 *
 * Next.js 在构建时会将代码分割成多个 JavaScript bundle（chunks）。
 * 如果不使用全局单例：
 * - Chunk A 创建实例 A
 * - Chunk B 创建实例 B
 * - 导致配置不一致、内存浪费
 *
 * 使用全局单例后：
 * - 所有 chunk 共享 `window.__supabase_client`
 * - 保证配置一致性
 * - 节省内存占用
 *
 * @returns Supabase 客户端客户端实例（全局单例）
 */
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
