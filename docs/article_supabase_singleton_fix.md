# Next.js 生产环境“灵异事件”排查：当 Auth 遇上代码分片

你可能遇到过这个场景：

本地开发 (`pnpm dev`) 一切完美，功能丝滑。
构建部署 (`pnpm build`) 也能顺利通过。
但一部署到线上，某些用户（特别是无痕模式或网络稍差的用户）打开首页，屏幕中间永远转着那个该死的 Loading 圈圈。

控制台没有红红的报错，网络面板里的 API 甚至都返回了 200 OK。
但页面就是卡住了。

这两天，我在 `Next.js 16` + `Supabase` 的生产环境中就撞上了这堵墙。
排查过程很有意思，涉及了 **代码分片 (Code Splitting)**、**环境变量注入机制** 和 **前端状态管理的竞态问题**。

写下来，希望能帮大家避开这个坑。

---

## 👻 现象：本地完美的“假象”

**问题描述：**
非 Admin 用户（特别是 Google 登录的新用户或无痕模式用户）访问生产环境首页时，页面长期处于 Loading 状态。

**诡异点：**

1.  **Admin 用户正常**：管理员登录后一切如常。
2.  **匿名用户正常**：不登录访问也正常。
3.  **Network 正常**：核心资源接口 `/api/resources` 其实已经返回了数据。
4.  **本地复现不了**：本地环境怎么测都测不出来。

这通常意味着：**环境差异** 或 **时序竞态**。

---

## 🔍 破案：三个隐形杀手

经过一通 Chrome DevTools 的深度排查（和几次发际线的后移），我们锁定了三个“共犯”。

### 1. 破碎的单例 (The Shattered Singleton)

我们都知道，在 Next.js 中使用 Supabase 需要维护一个全局单例客户端，防止多次初始化。我们通常这样写：

```typescript
// ❌ 常见的错误写法（在生产环境有隐患）
const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};
```

**问题出在哪里？**

在 Next.js 的生产构建中，代码会被拆分成很多个 Chunks（分片）。
在某些极端情况下（特别是 Vercel 的边缘网络或特定的分包策略下），某些 **异步加载的 chunk** 在执行时，可能无法通过 `process.env` 正确取到注入的环境变量。

结果就是：

1.  Chunk A 初始化了一个正常的 Supabase 客户端。
2.  Chunk B（异步加载）试图初始化，但读不到 URL，创建了一个**“哑巴客户端”**。
3.  业务逻辑调用了 Chunk B 的客户端，请求直接挂起，不报错也不返回。

这就是为什么控制台没有报错，但状态机死锁了。

### 2. 沉默的保安 (Auth Blocking)

我们的首页代码里有一段这种逻辑：

```tsx
// ❌ 典型的“身份优先”逻辑
const isInitialLoading = isListLoading || authLoading;

if (isInitialLoading) {
  return <FullScreenLoader />;
}
```

这看起来很合理：**“等身份确认了，再显示页面。”**

但在真实世界里，**身份确认是慢的**。
特别是 OAuth（如 Google 登录）的回调，或者在无痕模式下（Cookie 读取受限），Supabase 的 `getSession` 可能会消耗几百毫秒甚至更久。

**对于一个公开的首页，让用户看着 Loading 圈圈等后台查户口，是极差的体验。**

### 3. Hydration 的闪烁

Next.js 的 SSR 虽然在服务器端已经确认了用户身份，但到了客户端，`AuthProvider` 往往会**丢弃**服务器的信息，重新发起一次 `getSession`。

这导致了：

1.  SSR 渲染出带用户头像的 Header。
2.  页面 Hydrate，客户端 Store 初始化为空。
3.  用户变成“未登录状态”。
4.  客户端发起请求，几百毫秒后再次变成“登录状态”。

这个过程不仅导致闪烁，还延长了 Loading 时间。

---

## 🛠️ 解决方案：三道防线

为了彻底解决这个问题，我们实施了“纵深防御”策略。

### 防线一：全局环境注入 (Global Injection)

既然 `process.env` 在分片中不可靠，我们就把配置**焊死在 window 上**。

在 `app/layout.tsx` 中：

```tsx
<head>
  <script
    dangerouslySetInnerHTML={{
      __html: `
        window.__SUPABASE_CONFIG__ = {
          url: "${process.env.NEXT_PUBLIC_SUPABASE_URL || ''}",
          key: "${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''}"
        };
      `,
    }}
  />
</head>
```

然后在 `client.ts` 中增加兜底逻辑：如果 `process.env` 读不到，就去 `window.__SUPABASE_CONFIG__` 找。无论代码怎么拆分，浏览器全局变量永远都在。

### 防线二：内容优先 (Content First)

彻底解耦 **内容展示** 和 **身份验证**。

首页的逻辑改为：
**只要资源列表加载好了，立刻展示内容。**

```tsx
// ✅ 优化后的逻辑
// 即使 Auth 还在 loading，只要内容有了，就先让用户看
const isInitialLoading = isListLoading && resources.length === 0;
```

身份验证在后台静默进行。等验证通过了，右上角的“登录”按钮会自动变成“头像”，点赞按钮也会自动激活。但在那之前，用户已经可以愉快地浏览内容了。

### 防线三：SSR 数据直传 (Passport Passing)

不要浪费 SSR 的劳动成果。

在 `RootLayout` 中获取到 `profile` 后，直接传给 Client Component：

```tsx
// layout.tsx
const user = await getCurrentUser();
<Providers initialProfile={user?.profile}>...</Providers>;
```

在 `AuthProvider` 初始化时，直接使用这个 `initialProfile` 填充 Store。这样客户端启动的第一毫秒，用户就是“已登录”状态，**零延迟**。

---

## 总结

这次排查给我们上了生动的一课：

1.  **不要过度信任 `process.env`**：在复杂的构建产物中，它是脆弱的。
2.  **体验 > 逻辑洁癖**：公开内容不应被非必要的权限检查阻塞。
3.  **鲁棒性设计**：给所有 Loading 状态加最后一道防线（比如 5 秒超时强制关闭），永远不要让用户面对一个无限转圈的屏幕。

技术是为了服务体验的，而不是反过来。

希望这些坑，你不用再踩一遍。🖖
