// lib/supabase/server.ts
// Supabase 客户端（服务器端）

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';

/**
 * 创建 Supabase 服务端客户端实例
 *
 * ⚠️ 重要：每个 HTTP 请求必须创建新的实例，不要复用！
 *
 * ## 为什么每次都要创建新实例？
 *
 * Next.js 服务端可能同时处理多个用户请求，每个请求携带不同的 cookies（session）。
 * 如果复用同一个 Supabase 实例，会导致：
 * - 用户 A 可能看到用户 B 的数据（严重的安全问题）
 * - Cookie 操作混乱
 * - Session 数据交叉污染
 *
 * ## 性能影响
 *
 * 创建客户端的开销约 ~1ms，相比于数据库查询（~50ms）可忽略不计。
 *
 * ## ✅ 正确用法
 *
 * ```typescript
 * // 在 Route Handler 中
 * export async function GET(request: Request) {
 *   const supabase = await createClient(); // 每个请求创建一次
 *   const { data } = await supabase.from('users').select('*');
 *   return Response.json(data);
 * }
 *
 * // 在 Server Component 中
 * export default async function Page() {
 *   const supabase = await createClient(); // 每次渲染创建一次
 *   const { data: { user } } = await supabase.auth.getUser();
 *   return <div>Welcome {user?.email}</div>;
 * }
 *
 * // 在辅助函数中
 * export async function requireAuth() {
 *   const supabase = await createClient(); // 每次调用创建一次
 *   const { data: { user } } = await supabase.auth.getUser();
 *   if (!user) throw new AuthenticationError();
 *   return user;
 * }
 * ```
 *
 * ## ❌ 错误用法
 *
 * ```typescript
 * // 错误 1：全局单例（会导致数据泄露！）
 * let globalSupabase: SupabaseClient;
 * export async function getSupabase() {
 *   if (!globalSupabase) {
 *     globalSupabase = await createClient();
 *   }
 *   return globalSupabase; // ❌ 多个用户共享同一个实例
 * }
 *
 * // 错误 2：在模块顶层创建
 * const supabase = await createClient(); // ❌ 请求间共享
 *
 * // 错误 3：一个函数内多次创建（虽然不会出错，但不必要）
 * export async function badExample() {
 *   const supabase1 = await createClient();
 *   const user = await supabase1.auth.getUser();
 *   const supabase2 = await createClient(); // ❌ 重复创建
 *   const profile = await supabase2.from('profiles').select('*');
 * }
 * ```
 *
 * ## 工作原理
 *
 * 1. 从当前 HTTP 请求读取 cookies（通过 `await cookies()`）
 * 2. 创建 Supabase 客户端，绑定当前请求的 cookies
 * 3. 后续的数据库操作会自动使用这些 cookies 进行认证
 * 4. 请求结束后，客户端实例会被垃圾回收
 *
 * @returns Supabase 服务端客户端实例
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // 在 Server Component 中调用时可能会失败
            // 这是预期行为，可以安全忽略
          }
        },
      },
    }
  );
}
