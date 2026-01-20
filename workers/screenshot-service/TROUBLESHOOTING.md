# 截图服务排查指南

## 问题现象
- 存储桶（R2 Bucket）被清空
- 触发截图任务后没有生成截图文件

## 排查步骤

### 1. 检查 Worker 日志（最重要）

访问 Cloudflare Dashboard 查看 Worker 日志：
```
https://dash.cloudflare.com/
→ Workers & Pages
→ design-treasure-screenshot
→ Logs (Real-time Logs)
```

**关键日志信息：**
- ✅ 成功：`✅ ID: xxx 截图完成并上报成功`
- ❌ 失败：`❌ ID: xxx 截图失败: [错误信息]`
- 🔍 任务发现：`📋 发现 X 个资源待处理`
- 🌐 浏览器启动：`🌐 正在启动浏览器...`

### 2. 验证 Worker 环境变量

检查 `wrangler.jsonc` 中的配置是否正确：

```jsonc
{
  "vars": {
    "R2_PUBLIC_URL": "https://images.thepexels.top",  // R2 公开访问域名
    "API_BASE_URL": "https://design.thepexels.top",   // Next.js 生产环境域名
    "DATABASE_API_KEY": "sb_secret_xxx"                // 与 Next.js 一致
  }
}
```

**验证方法：**
```bash
# 在 workers/screenshot-service 目录下
curl https://img.thepexels.top/
# 应该返回：
# {
#   "service": "Design Treasure Box Screenshot Service",
#   "version": "2.0.0 (Decoupled)",
#   "status": "running"
# }
```

### 3. 检查 R2 Bucket 配置

**问题：为什么存储桶被清空？**

可能原因：
1. **Bucket 名称不匹配**：`wrangler.jsonc` 中配置的是 `photos`，但实际 bucket 名称可能不同
2. **权限问题**：Worker 没有写入权限
3. **手动清理**：有人手动删除了文件

**验证步骤：**
```bash
# 1. 列出所有 R2 buckets
npx wrangler r2 bucket list

# 2. 检查 photos bucket 是否存在
npx wrangler r2 object list --bucket photos

# 3. 如果 bucket 不存在，创建它
npx wrangler r2 bucket create photos
```

### 4. 测试 Worker 手动触发

```bash
# 方法 1：通过 Next.js API 触发（推荐）
curl -X POST https://design.thepexels.top/api/admin/resources/screenshot/trigger \
  -H "Authorization: Bearer sb_secret_xxx" \
  -H "Content-Type: application/json" \
  -d '{"resourceIds": ["某个资源ID"]}'

# 方法 2：直接调用 Worker
curl -X POST https://img.thepexels.top/trigger
```

### 5. 检查 Next.js API 端点

Worker 依赖这两个 API：

**5.1 获取待处理资源：**
```bash
curl https://design.thepexels.top/api/admin/resources/screenshot/needed \
  -H "Authorization: Bearer sb_secret_xxx"

# 预期响应：
# {
#   "resources": [
#     { "id": "xxx", "url": "https://..." },
#     ...
#   ]
# }
```

**5.2 更新截图状态：**
```bash
curl -X PATCH https://design.thepexels.top/api/admin/resources/screenshot/[资源ID] \
  -H "Authorization: Bearer sb_secret_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "screenshotUrl": "https://images.thepexels.top/screenshots/xxx.jpg",
    "screenshotUpdatedAt": "2026-01-20T15:00:00.000Z"
  }'
```

### 6. 检查 R2 公开访问域名

**问题：截图上传成功但无法访问？**

验证 R2 Custom Domain 配置：
```bash
# 访问一个已知存在的截图（如果有的话）
curl -I https://images.thepexels.top/screenshots/test.jpg

# 或者通过 Worker 的 /images/ 路径访问
curl -I https://img.thepexels.top/images/screenshots/test.jpg
```

### 7. 常见错误及解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| `Failed to fetch tasks: 401` | API Key 不匹配 | 检查 `DATABASE_API_KEY` 是否与 Next.js `.env.production` 一致 |
| `Failed to fetch tasks: 404` | API 路径错误 | 确认 `API_BASE_URL` 正确，检查 Next.js 是否部署成功 |
| `Update API failed: 401` | 回填时鉴权失败 | 同上，检查 API Key |
| `TimeoutError` | 页面加载超时 | 增加 `SCREENSHOT_TIMEOUT` 或检查目标网站可访问性 |
| `R2 bucket not found` | Bucket 不存在 | 运行 `npx wrangler r2 bucket create photos` |
| `Browser launch failed` | 浏览器绑定问题 | 检查 Cloudflare 账户是否启用了 Browser Rendering |

### 8. 调试模式

**本地测试 Worker：**
```bash
cd workers/screenshot-service

# 本地运行（需要配置 .dev.vars）
npx wrangler dev

# 测试触发
curl -X POST http://localhost:8787/trigger
```

**查看实时日志：**
```bash
# 生产环境日志
npx wrangler tail

# 或在 Cloudflare Dashboard 查看 Real-time Logs
```

## 快速诊断命令

```bash
#!/bin/bash
# 一键诊断脚本

echo "=== 1. 检查 Worker 状态 ==="
curl https://img.thepexels.top/health

echo -e "\n=== 2. 检查 R2 Bucket ==="
npx wrangler r2 object list --bucket photos | head -n 10

echo -e "\n=== 3. 检查 API 端点 ==="
curl https://design.thepexels.top/api/admin/resources/screenshot/needed \
  -H "Authorization: Bearer sb_secret_xxx" | jq

echo -e "\n=== 4. 触发测试任务 ==="
curl -X POST https://img.thepexels.top/trigger

echo -e "\n=== 5. 等待 10 秒后检查日志 ==="
sleep 10
npx wrangler tail --format pretty
```

## 预期的正常流程

1. **触发**：Next.js → `POST /api/admin/resources/screenshot/trigger` → Worker `/trigger`
2. **拉取任务**：Worker → `GET /api/admin/resources/screenshot/needed` → 获取待处理资源列表
3. **截图**：Worker 启动浏览器 → 访问 URL → 截图 → 上传 R2
4. **回填**：Worker → `PATCH /api/admin/resources/screenshot/{id}` → 更新数据库
5. **访问**：用户 → `https://images.thepexels.top/screenshots/{id}.jpg` → 显示截图

## 下一步行动

1. ✅ **立即检查**：Cloudflare Worker 日志（最重要）
2. ✅ **验证配置**：R2 Bucket 是否存在且名称正确
3. ✅ **测试 API**：`/needed` 和 `/screenshot/{id}` 端点是否正常
4. ✅ **手动触发**：运行一次测试任务，观察完整流程
5. ✅ **查看日志**：确认每一步是否成功

## 联系信息

如果以上步骤都无法解决问题，请提供：
- Worker 日志截图
- R2 Bucket 列表
- API 端点测试结果
- 错误信息的完整堆栈
