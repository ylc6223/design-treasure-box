# 设计百宝箱截图服务 - 生产环境完整指南

## 概述

本文档提供截图服务从部署到运维的完整指南，包括部署步骤、使用方法、监控调试等。

## 📋 目录

1. [环境准备](#环境准备)
2. [部署步骤](#部署步骤)
3. [服务使用](#服务使用)
4. [监控和调试](#监控和调试)
5. [故障排除](#故障排除)
6. [维护操作](#维护操作)

---

## 环境准备

### 1. 本地环境要求

**在本地开发机器上安装：**

```bash
# 安装 Node.js (推荐 18+)
node --version

# 安装 wrangler CLI
npm install -g wrangler

# 验证安装
wrangler --version
```

### 2. Cloudflare 账户准备

**在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中：**

1. **登录账户**
2. **启用 Browser API**：
   - 进入 **Workers & Pages**
   - 点击 **Browser Rendering API**
   - 启用服务
3. **创建 R2 存储桶**：
   - 进入 **R2 Object Storage**
   - 点击 **Create bucket**
   - 名称：`photos`（与配置文件一致）
   - 选择合适的区域

### 3. Supabase 数据库准备

**在 [Supabase Dashboard](https://supabase.com/dashboard) 中：**

1. **获取连接信息**：
   - Project URL: `https://your-project.supabase.co`
   - Secret Key: 在 Settings → API 中获取
2. **执行数据库迁移**：
   ```sql
   -- 在 SQL Editor 中执行
   ALTER TABLE public.resources 
   ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
   ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ,
   ADD COLUMN IF NOT EXISTS screenshot_error TEXT;

   CREATE INDEX IF NOT EXISTS idx_resources_screenshot_null 
   ON public.resources(id) WHERE screenshot_url IS NULL;
   ```

---

## 部署步骤

### 第一步：登录 Cloudflare

**在本地终端执行：**

```bash
# 进入项目目录
cd workers/screenshot-service

# 登录 Cloudflare（会打开浏览器）
wrangler login

# 验证登录状态
wrangler whoami
```

### 第二步：配置环境变量

**检查配置文件：**

```bash
# 在本地查看配置
cat wrangler.jsonc
```

确保以下配置正确：
- `SUPABASE_URL`: 你的 Supabase 项目 URL
- `R2_PUBLIC_URL`: 你的 R2 公网访问域名
- `bucket_name`: R2 存储桶名称

### 第三步：设置密钥

**在本地终端执行：**

```bash
# 设置 Supabase 密钥
wrangler secret put SUPABASE_SECRET_KEY --env production

# 系统会提示输入密钥值，输入你的 Supabase Secret Key
# 例如：sb_secret_SP7zzAJrC89EBMq47GK29g_Uf6oyp20
```

**验证密钥设置：**

```bash
# 查看已设置的密钥
wrangler secret list --env production

# 应该看到：
# [
#   {
#     "name": "SUPABASE_SECRET_KEY",
#     "type": "secret_text"
#   }
# ]
```

### 第四步：部署 Worker

**方法1：使用自动化脚本（推荐）**

```bash
# 在本地执行
./scripts/deploy.sh
```

**方法2：手动部署**

```bash
# TypeScript 编译检查
npm run type-check

# 部署到生产环境
wrangler deploy --env production
```

**部署成功标志：**

```
✨ Successfully published your Worker to the following routes:
  - design-treasure-screenshot-production.your-subdomain.workers.dev
```

---

## 服务使用

### 1. 服务端点

部署成功后，你的 Worker 会有以下端点：

| 端点 | 方法 | 功能 | 示例 |
|------|------|------|------|
| `/` | GET | 服务信息 | `https://your-worker.workers.dev/` |
| `/health` | GET | 健康检查 | `https://your-worker.workers.dev/health` |
| `/trigger` | GET/POST | 手动触发 | `https://your-worker.workers.dev/trigger` |
| `/images/screenshots/{id}.jpg` | GET | 图片访问 | `https://your-worker.workers.dev/images/screenshots/abc123.jpg` |

### 2. 基本使用

**查看服务状态：**

```bash
# 在本地终端或浏览器访问
curl https://design-treasure-screenshot-production.ylc6223.workers.dev/

# 返回示例：
# {
#   "service": "Design Treasure Box Screenshot Service",
#   "status": "running",
#   "batchSize": 3,
#   "schedule": "Every 5 minutes"
# }
```

**健康检查：**

```bash
# 在本地终端执行
curl https://design-treasure-screenshot-production.ylc6223.workers.dev/health

# 返回示例：
# {
#   "status": "healthy",
#   "timestamp": "2024-01-18T10:30:00.000Z",
#   "service": "screenshot-service",
#   "batchSize": 3
# }
```

**手动触发截图任务：**

```bash
# 方法1：浏览器访问
https://design-treasure-screenshot-production.ylc6223.workers.dev/trigger

# 方法2：命令行触发
curl -X POST https://design-treasure-screenshot-production.ylc6223.workers.dev/trigger

# 返回示例：
# {
#   "message": "Screenshot batch triggered",
#   "batchSize": 3,
#   "timestamp": "2024-01-18T10:30:00.000Z"
# }
```

### 3. 自动化运行

服务部署后会自动运行：
- **执行频率**: 每5分钟
- **批处理大小**: 3个资源/批次
- **处理逻辑**: 查询 `screenshot_url IS NULL` 的资源
- **预期完成时间**: 约55分钟（32个资源）

---

## 监控和调试

### 1. 实时日志监控

**在本地终端执行：**

```bash
# 查看实时日志
wrangler tail --env production

# 格式化输出
wrangler tail --env production --format pretty

# 查看最近1小时的日志
wrangler tail --env production --since 1h
```

**日志示例：**

```
2024-01-18T10:30:00.000Z 🚀 Starting batch screenshot processing...
2024-01-18T10:30:01.000Z 🔍 Fetching 3 resources needing screenshots...
2024-01-18T10:30:02.000Z 📋 Found 3 resources to process
2024-01-18T10:30:03.000Z 🌐 Browser launched successfully
2024-01-18T10:30:05.000Z 📸 Processing Resource Name (https://example.com)
2024-01-18T10:30:08.000Z ✅ Screenshot completed for Resource Name
```

### 2. 查看工作进度

**方法1：通过数据库查询**

在 [Supabase Dashboard](https://supabase.com/dashboard) 的 SQL Editor 中执行：

```sql
-- 查看总体进度
SELECT 
    COUNT(*) as total_resources,
    COUNT(screenshot_url) as completed,
    COUNT(*) - COUNT(screenshot_url) as pending,
    ROUND(COUNT(screenshot_url) * 100.0 / COUNT(*), 2) as progress_percent
FROM resources;

-- 查看最近处理的资源
SELECT 
    id, name, screenshot_url, screenshot_updated_at, screenshot_error
FROM resources 
WHERE screenshot_updated_at > NOW() - INTERVAL '1 hour'
ORDER BY screenshot_updated_at DESC;

-- 查看待处理的资源
SELECT id, name, url
FROM resources 
WHERE screenshot_url IS NULL 
ORDER BY created_at 
LIMIT 10;
```

**方法2：通过 Worker 状态**

```bash
# 在本地终端执行，查看当前批次处理情况
curl https://design-treasure-screenshot-production.ylc6223.workers.dev/health
```

### 3. Cloudflare Dashboard 监控

**在 [Cloudflare Dashboard](https://dash.cloudflare.com/) 中：**

1. **进入 Workers & Pages**
2. **找到你的 Worker**: `design-treasure-screenshot-production`
3. **查看指标**：
   - **Requests**: 请求数量
   - **Errors**: 错误率
   - **CPU Time**: CPU 使用时间
   - **Duration**: 执行时长

4. **查看 Cron Triggers**：
   - 点击 **Triggers** 标签
   - 确认看到：`*/5 * * * *`（每5分钟）
   - 查看最近执行历史

### 4. R2 存储监控

**在 Cloudflare Dashboard 的 R2 部分：**

1. **进入存储桶**: `photos`
2. **查看文件**：
   - 进入 `screenshots/` 目录
   - 查看生成的 `.jpg` 文件
   - 检查文件大小和创建时间

---

## 故障排除

### 1. 常见错误及解决方案

#### 错误1：数据库连接失败

**错误信息：**
```
Error: Failed to fetch resources: 401
```

**排查步骤：**

```bash
# 1. 检查密钥配置
wrangler secret list --env production

# 2. 重新设置密钥
wrangler secret put SUPABASE_SECRET_KEY --env production

# 3. 测试连接
curl -X POST https://your-worker.workers.dev/trigger
```

**在 Supabase Dashboard 中验证：**
- 检查 API 密钥是否正确
- 确认项目状态正常

#### 错误2：浏览器启动失败

**错误信息：**
```
Error: browser.launch is not a function
```

**解决方案：**
1. 在 Cloudflare Dashboard 确认 Browser API 已启用
2. 检查 `wrangler.jsonc` 中的 browser 绑定配置

#### 错误3：R2 存储失败

**错误信息：**
```
Error: R2 bucket 'photos' not found
```

**解决方案：**
1. 在 Cloudflare Dashboard 创建存储桶
2. 确认 `wrangler.jsonc` 中的 `bucket_name` 正确

#### 错误4：执行超时

**错误信息：**
```
Error: Script exceeded CPU time limit
```

**解决方案：**
```bash
# 减少批处理大小（在代码中修改 BATCH_SIZE）
# 当前设置为 3，可以改为 2 或 1
```

### 2. 调试工具

**本地调试：**

```bash
# 启动本地开发服务器
wrangler dev --env production

# 在另一个终端测试
curl http://localhost:8787/health
curl -X POST http://localhost:8787/trigger
```

**线上调试：**

```bash
# 查看详细错误日志
wrangler tail --env production --format pretty

# 手动触发并观察日志
curl -X POST https://your-worker.workers.dev/trigger && wrangler tail --env production
```

### 3. 性能分析

**在 Cloudflare Dashboard 中：**

1. **查看 CPU 使用情况**
2. **分析请求延迟**
3. **监控错误率趋势**

**优化建议：**
- 如果 CPU 时间经常超限，减少 `BATCH_SIZE`
- 如果截图失败率高，检查目标网站的可访问性
- 如果存储上传慢，考虑优化图片大小

---

## 维护操作

### 1. 更新 Worker 代码

```bash
# 在本地修改代码后
cd workers/screenshot-service

# 检查编译
npm run type-check

# 重新部署
wrangler deploy --env production
```

### 2. 管理密钥

```bash
# 查看所有密钥
wrangler secret list --env production

# 更新密钥
wrangler secret put SUPABASE_SECRET_KEY --env production

# 删除密钥
wrangler secret delete SUPABASE_SECRET_KEY --env production
```

### 3. 数据库维护

**重新生成所有截图：**

```sql
-- 在 Supabase SQL Editor 中执行（谨慎操作）
UPDATE resources SET 
    screenshot_url = NULL, 
    screenshot_updated_at = NULL, 
    screenshot_error = NULL;
```

**清理错误记录：**

```sql
-- 清理失败的截图记录
UPDATE resources SET 
    screenshot_error = NULL 
WHERE screenshot_error IS NOT NULL;
```

### 4. 监控脚本

**创建监控脚本（在本地）：**

```bash
# 创建 monitor.sh
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== 截图服务状态监控 ==="
echo "时间: $(date)"
echo ""

# 健康检查
echo "1. 健康检查:"
curl -s https://design-treasure-screenshot-production.ylc6223.workers.dev/health | jq .

echo ""
echo "2. 最近日志:"
wrangler tail --env production --format pretty --since 10m

EOF

chmod +x monitor.sh
```

### 5. 备份和恢复

**备份配置：**

```bash
# 备份 wrangler 配置
cp wrangler.jsonc wrangler.jsonc.backup

# 备份密钥列表
wrangler secret list --env production > secrets.backup.json
```

**恢复部署：**

```bash
# 从备份恢复配置
cp wrangler.jsonc.backup wrangler.jsonc

# 重新设置密钥
wrangler secret put SUPABASE_SECRET_KEY --env production

# 重新部署
wrangler deploy --env production
```

---

## 📊 性能指标

### 预期性能

- **单个截图时间**: 3-5秒
- **批处理时间**: <30秒（免费计划限制）
- **成功率**: >95%
- **全量处理时间**: 约55分钟

### 监控指标

- **请求成功率**: 通过 Cloudflare Analytics 查看
- **CPU 使用率**: 避免接近 30秒限制
- **存储使用量**: 监控 R2 存储桶大小
- **数据库更新率**: 通过 SQL 查询统计

---

## 🔗 相关链接

- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [Supabase 文档](https://supabase.com/docs)
- [项目 GitHub 仓库](https://github.com/your-repo/design-treasure-box)

---

## 📞 支持

如遇到问题，请按以下顺序排查：

1. **查看本文档的故障排除部分**
2. **检查实时日志**: `wrangler tail --env production`
3. **验证配置**: 确认所有环境变量和密钥正确
4. **查看 Cloudflare Dashboard**: 检查服务状态和错误信息
5. **检查 Supabase Dashboard**: 验证数据库连接和数据状态

记住：所有 `wrangler` 命令都在**本地终端**执行，所有 Dashboard 操作都在**浏览器**中进行。