# 为什么我的 Supabase 单例在 Vercel 生产环境失效了？

![Supabase Production Debug Cover](./assets/supabase-production-debug-cover.png)
_▲ 封面：生产环境下的“单例碎裂”——探索 Next.js 分片机制与 Supabase 的博弈_

作者: Jerry (Beyond Frontend)
日期: 2026-01-20

## 0. 你可能也遇到过这个场景

在本地开发环境（Localhost）中，你的 **Next.js + Supabase** 应用跑得飞快，登录、注册、拉取数据一切如丝般顺滑。

但当你满怀信心执行完 `git push`，部署到 **Vercel** 生产环境后，诡异的事情发生了：

👉 用户点击登录后，页面突然陷入了 **永久的 Loading 状态**。
👉 打开浏览器控制台，没有报错，网络面板（Network）里甚至连一个 Supabase 的请求记录都没有。
👉 更神奇的是：如果你刷新页面，或者换个无痕窗口，又偶尔能恢复正常。

这通常不是代码逻辑问题，而是你精心设计的 **Supabase 客户端单例（Singleton）**，在生产环境复杂的 JS 分片（Chunks）机制下“碎裂”了。

---

## 1. 现场复盘：消失的环境变量与挂起的请求

我在开发 **“设计百宝箱”** 平台时就撞上了这个暗坑。为了性能，我严格遵循了 Supabase 官方推荐的 SSR 模式。

### 犯罪现场代码

通常我们会在 `lib/supabase/client.ts` 里这样写单例：

```typescript
// ❌ 看着没问题，但在生产环境有隐患
let supabaseClient: SupabaseClient | null = null;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return supabaseClient;
}
```

### 排查线索

通过在生产环境注入调试脚本，我抓到了真凶：**环境变量注入不一致**。

在 Next.js 的生产构建中，`process.env` 会被静态替换为字符串。然而，由于代码分片（Code Splitting）的存在，某些异步加载的 JS Chunk 可能由于构建时序或引用链问题，**没能拿到这两个变量**。

结果就是：这些分片创建了一个 URL 和 Key 均为 `undefined` 的“僵尸客户端”。

---

## 2. 根因拆解：单例模式的“次元壁”

为什么 `let supabaseClient` 挡不住这个 Bug？这里有三个硬核原因：

### 2.1 模块级作用域的孤岛

在生产环境下，Next.js 会把应用粉碎成几十个 `.js` 文件。如果 `client.ts` 被打包进了多个独立的分片中，那么每个分片都会拥有自己的一份 `let supabaseClient`。
**单例模式直接退化成了“分片单例”。**

### 2.2 环境变量的“静态替换”翻车

本地开发是动态取值，生产环境是静态硬编码。如果某个 Chunk 在构建时被判定为与主配置上下文脱节，它拿到的就是空字符串。

### 2.3 级联挂起

当一个“僵尸客户端”发起请求时，它既不会报错，也不会发出真正的 HTTP 请求（因为 URL 是空的）。在我们的 `AuthProvider` 逻辑里：

```tsx
// 💀 这里的 setLoading(false) 永远不会被执行，因为请求挂起了
setLoading(true);
const { data: profile } = await supabase.from('profiles').select().single();
setAuth(user, profile);
setLoading(false);
```

---

## 3. 解决方案：从 `let` 到 `globalThis`

要解决这个问题，我们需要打破 JS 分片之间的物理壁垒，建立一个真正的 **“全应用通行单例”**。

### 3.1 强力单例模式

通过浏览器的全局对象（`window` 或 `globalThis`）来存储实例，无视分片隔离。

```typescript
// ✅ lib/supabase/client.ts 增强版
'use client';

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  // 1. 优先从全局获取，确保跨分片唯一
  const globalInstance =
    typeof window !== 'undefined'
      ? (window as any).__supabase_client
      : (globalThis as any).__supabase_client;

  if (globalInstance) return globalInstance;

  // 2. 环境变量校验
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error('环境变量在当前 Chunk 中丢失！');
  }

  const client = createBrowserClient(url || '', key || '');

  // 3. 只有合法的实例才存入全局缓存
  if (url && key) {
    if (typeof window !== 'undefined') (window as any).__supabase_client = client;
  }

  return client;
}
```

### 3.2 增加防御性容错

在 `AuthProvider` 中增加铠甲，防止请求挂起拖慢整个应用：

```tsx
// ✅ components/auth-provider.tsx
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(async (event, session) => {
    setLoading(true);
    try {
      if (session?.user) {
        // 增加超时控制或错误捕获
        const { data: profile, error } = await supabase.from('profiles').select().single();
        if (error) throw error;
        setAuth(session.user, profile);
      }
    } catch (err) {
      console.error('认证探针报错:', err);
      clearAuth();
    } finally {
      // ⚠️ 无论如何都要关闭 Loading，这是对用户最后的温柔
      setLoading(false);
    }
  });
  return () => subscription.unsubscribe();
}, [supabase]);
```

---

## 4. 实践总结

如果你在做 Supabase SSR + Next.js 14/15 的项目，请记住这两条血泪教训：

1.  **外部资源单例化**：在客户端环境，不要相信跨文件的 `let`。用 `globalThis` 为你的核心客户端建立“根据地”。
2.  **强制关闭 Loading**：在异步认证流中，`finally { setLoading(false) }` 不是可选项，而是必须项。

理解代码运行的 **打包环境**，比理解代码本身的逻辑往往更重要。

希望这个避坑实操能帮你节约下一次深夜排障的时间。🚀

---

## 💡 互动交流

你在生产环境遇到过哪些“本地一切正常”的诡异 Bug？欢迎在评论区分享你的绝望瞬间。

👨‍💻 **前端之外**
写前端，也拆 AI。

#前端工程 #Supabase #Nextjs #Vercel #避坑指南
