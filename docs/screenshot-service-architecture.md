# 截图服务架构与工作流文档 (Screenshot Service Architecture)

本文档详细说明了 Design Treasure Box 项目中自动化截图服务的设计架构、工作流程、安全机制以及针对 Cloudflare Workers 免费版的优化策略。

---

## 1. 架构概述

本项目采用 **“任务分发 - 执行回填”** 的解耦架构，主要由三个部分组成：

1.  **Next.js 后端 (Control Plane)**：负责任务调度、权限校验、数据持久化。
2.  **Cloudflare Worker (Data Plane)**：负责消耗配额的浏览器渲染、R2 存储、图片代理。
3.  **Supabase (Database)**：存储资源元数据与截图状态。

---

## 2. 核心工作流

截图系统通过一个闭环回路自动运转：

### 阶段 A：任务发现 (Discovery)

- **触发源**：
  - **定时任务 (Cron)**：每 15 分钟触发一次，带 0-30s 随机抖动（Jitter）。
  - **手动触发 (URL)**：通过 `POST /trigger` 接口由管理员手动拉起。
- **分发逻辑**：Worker 向 Next.js API (`/api/admin/resources/screenshot/needed`) 请求任务。
- **精准过滤**：后端仅返回满足以下条件的资源：
  - `screenshot_url` 为空（新资源）。
  - 或 `screenshot_updated_at` 早于 7 天前（过期资源）。
- **批次限制**：为了适配 Cloudflare 免费版配额，每批次仅取前 **3 个** 资源。

### 阶段 B：渲染与存储 (Execution)

- **启动浏览器**：Worker 调用 Cloudflare Browser Rendering API 启动匿名浏览器。
- **网页渲染**：
  - 访问目标 URL，设置 30s 导航超时。
  - 注入 Noto Sans SC 字体确保中文及符号显示正常。
  - 加载后额外停留 3s 等待动画背景稳定。
- **持久化存储**：生成 JPEG 截图并上传至 Cloudflare R2 存储桶。

### 阶段 C：状态回填 (Persistence)

- **回调 API**：Worker 完成上传后，调用 Next.js 的 `PATCH /api/admin/resources/screenshot/[id]` 接口。
- **管理员写入**：后端使用 `createAdminClient` (SUPABASE_SECRET_KEY) 绕过 RLS 策略。
- **即时校验**：API 更新后执行 `.select()` 确认数据库确实写入成功，防止静默失败。

---

## 3. 安全防护机制

由于截图 Worker 直接连接浏览器配额且暴露在公网，项目实施了多重安全措施：

1.  **Token 准入校验**：
    - 所有 Worker 的 HTTP 接口（除健康检查外）均需校验 `Authorization: Bearer ${DATABASE_API_KEY}`。
    - 彻底杜绝了扫描机器人访问 `/trigger` 导致浏览器配额被瞬间抽干的风险。
2.  **Admin 权限隔离**：
    - API 内部使用 `SUPABASE_SECRET_KEY` 显式创建 Admin 客户端，确保即便普通用户无法修改 `resources` 表，Worker 的后台回填依然能成功。
3.  **双命名环境变量兼容**：
    - 自动识别 `SUPABASE_SECRET_KEY` 和旧有的 `SUPABASE_SERVICE_ROLE_KEY`，确保脚本与线上环境一致性。

---

## 4. 针对配额限制的优化 (Cloudflare Free Tier)

Cloudflare 免费版对浏览器实例有严格限制（通常为 2 个并发会话），为此我们做了以下调优：

- **随机抖动 (Jitter)**：定时任务启动时延迟 0-30s，避开整点启动高峰。
- **低频调度**：将 Cron 频率从 5 分钟降至 15 钟。
- **并发收缩**：批次大小固定为 3。
- **429 异常捕获**：当遇到频率限制报错时，Worker 会捕捉错误并在日志中给出友好提示，而非抛出异常中断执行环境。

---

## 5. 环境配置参考

### Next.js (Vercel)

- `SUPABASE_SECRET_KEY`: Supabase service_role key.
- `DATABASE_API_KEY`: 与 Worker 同步的鉴权令牌。
- `WORKER_API_URL`: Worker 的自定义域名。

### Cloudflare Worker

- `API_BASE_URL`: 线上 Next.js 应用 URL。
- `DATABASE_API_KEY`: 访问回调接口的令牌。
- `R2_PUBLIC_URL`: 对应的 CDN 访问域名。

---

## 6. 常见问题排查 (Troubleshooting)

1.  **Worker 报 500 错误**：检查 Vercel 端环境变量是否配置了正确的 `SUPABASE_SECRET_KEY`，且 Next.js 是否已经 Redeploy。
2.  **Worker 报 429 错误**：说明当前时间点 Cloudflare 浏览器实例已满。请停止手动触发，等待一两个 Cron 周期后系统会自动恢复。
3.  **上报成功但数据库没变**：检查 API 回复。在 v0.2.16+ 中，如果数据库受 RLS 拦截，API 将返回 404/403，Worker 的日志会反馈这一点。

---

最后更新于: 2026-01-21
✍️ Antigravity (Powered by Deepmind)
