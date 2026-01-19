# Screenshot Service Reform - Deployment & Operation Manual (v2)

本次重构实现了 **控制面 (Next.js)** 与 **执行面 (Cloudflare Worker)** 的解耦。以下是完成部署和上线所需的详细步骤。

---

## 1. Next.js 端配置 (控制面)

在部署 Next.js 应用前，请确保设置以下环境变量。

### 1.1 环境变量配置
在您的生产环境（如 Vercel, Zeabur 或 .env.production）中配置：

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `DATABASE_API_KEY` | 是 | 用于 API 安全鉴权，必须与 Worker 端一致 | `your_long_random_secret_string` |
| `WORKER_API_URL` | 是 | Worker 的访问地址，用于手动触发截图 | `https://screenshot-service.xxx.workers.dev` |

### 1.2 部署命令
```bash
pnpm build
pnpm start
```

---

## 2. Cloudflare Worker 配置 (执行面)

Worker 现在不再直接访问数据库，而是调用 Next.js 提供的 API。

### 2.1 依赖项清理
由于移除了 `supabase-js` 客户端，您可以减小 Worker 的体积。

### 2.2 wrangler.jsonc / Environment Variables
更新您的 Worker 环境变量（通过 Cloudflare Dashboard 或 `wrangler.jsonc`）：

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :--- | :--- | :--- |
| `API_BASE_URL` | 是 | Next.js 应用的公网基础 URL | `https://design-treasure-box.com` |
| `DATABASE_API_KEY` | 是 | 必须与 Next.js 端的项一致 | `your_long_random_secret_string` |
| `R2_PUBLIC_URL` | 是 | R2 存储桶的公网访问地址 | `https://cdn.example.com` |

> **注意**：原有的 `SUPABASE_URL` 和 `SUPABASE_SECRET_KEY` 现在可以安全移除。

### 2.3 部署 Worker
```bash
cd workers/screenshot-service
npm install  # 更新依赖
npx wrangler deploy
```

---

## 3. 操作与日常维护

### 3.1 截图状态监控
您可以访问 **管理后台 -> 资源管理**：
- **🟢 已生成**：表示截图已就绪，可查看更新时间。
- **🟡 待更新**：表示资源新入库或截图已超过 7 天，Worker 会在下次定时任务中抓取。
- **🔴 失败**：悬停在徽章上可查看具体的 Puppeteer 报错信息（如：`Timeout exceeding 15000ms`）。

### 3.2 手动干预
- **单个重截**：在资源表格中点击“相机”图标，系统会立即将该 ID 发送给 Worker 处理。
- **批量修复**：在 **Admin Dashboard** 的“截图服务”卡片中，点击“重截失败资源”，系统会自动挑选最近失败的 10 个资源进行修复。

### 3.3 故障排查
1. **Next.js 访问失败**：检查 `DATABASE_API_KEY` 是否匹配，以及 Next.js 是否开启了防火墙拦截了 Cloudflare 的 IP。
2. **截图为空**：检查目标网站是否设置了防爬虫逻辑。
3. **Worker 超时**：Cloudflare Worker 免费版有 30 秒执行限制，建议保持每批处理数量在 3-5 个以内（当前逻辑已由 API 进行数量分块）。

---

## 4. 迁移验证清单
- [ ] 访问 `https://your-worker/health` 返回 `healthy`。
- [ ] 管理后台资源列表显示“截图状态”列。
- [ ] 手动点击一个资源的“捕获”图标，控制台无报错。
- [ ] 验证旧的 `/api/resources/all` 是否已返回 404（已删除）。
