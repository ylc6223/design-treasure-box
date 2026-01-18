# 截图服务测试指南

## 前置条件

### 1. 数据库准备

首先确保数据库包含截图相关字段：

#### 对于现有数据库
在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 添加截图字段（如果不存在）
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS screenshot_error TEXT;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_resources_screenshot_null 
ON public.resources(id) WHERE screenshot_url IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_screenshot_updated 
ON public.resources(screenshot_updated_at);
```

#### 对于新数据库
执行完整的迁移：
```sql
-- 执行 supabase/migrations/001_initial_schema.sql
-- 然后执行其他迁移文件
```

### 2. 环境配置

#### Cloudflare Workers 环境变量

在 `workers/screenshot-service/wrangler.jsonc` 中配置：

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "R2_PUBLIC_URL": "https://your-r2-domain.com"
      }
    }
  }
}
```

#### 设置密钥

```bash
cd workers/screenshot-service
wrangler secret put SUPABASE_SECRET_KEY --env production
# 输入你的 Supabase Secret Key
```

### 3. 依赖安装

```bash
cd workers/screenshot-service
npm install
```

## 测试步骤

### 第一步：TypeScript 编译检查

```bash
cd workers/screenshot-service
npm run type-check
```

预期结果：无编译错误

### 第二步：本地开发测试

```bash
# 启动本地开发服务器
npm run dev
```

在另一个终端测试：

```bash
# 健康检查
curl http://localhost:8787/health

# 预期响应
{
  "status": "healthy",
  "timestamp": "2024-01-18T...",
  "service": "screenshot-service",
  "batchSize": 5
}
```

### 第三步：手动触发测试

```bash
# 手动触发截图任务
curl -X POST http://localhost:8787/trigger

# 预期响应
{
  "message": "Screenshot batch triggered",
  "batchSize": 5,
  "timestamp": "2024-01-18T..."
}
```

### 第四步：数据库验证

在 Supabase Dashboard 中检查：

1. 打开 Table Editor → resources
2. 查看是否有资源的 `screenshot_url` 字段被填充
3. 检查 `screenshot_updated_at` 时间戳
4. 如有错误，查看 `screenshot_error` 字段

### 第五步：R2 存储验证

在 Cloudflare Dashboard 中：

1. 打开 R2 Object Storage
2. 进入你的存储桶
3. 查看 `screenshots/` 目录下是否有新生成的 `.jpg` 文件

### 第六步：图片访问测试

```bash
# 测试图片访问（替换为实际的资源ID）
curl http://localhost:8787/images/screenshots/your-resource-id.jpg

# 预期：返回图片数据或404
```

## 生产环境部署测试

### 第一步：部署到 Cloudflare

```bash
cd workers/screenshot-service
./scripts/deploy.sh
```

### 第二步：验证定时任务

1. 在 Cloudflare Dashboard 中打开 Workers & Pages
2. 找到你的 Worker
3. 点击 "Triggers" 标签
4. 确认看到 Cron Trigger: `*/5 * * * *`

### 第三步：监控日志

```bash
# 实时查看日志
wrangler tail --env production

# 手动触发并观察日志
curl -X POST https://your-worker.workers.dev/trigger
```

## 故障排除

### 常见问题

#### 1. 数据库连接失败
```
Error: Failed to fetch resources: ...
```

**解决方案**:
- 检查 `SUPABASE_URL` 配置
- 验证 `SUPABASE_SECRET_KEY` 密钥
- 确认 Supabase 项目状态正常

#### 2. 浏览器启动失败
```
Error: browser.launch is not a function
```

**解决方案**:
- 确认 Browser API 已在 Cloudflare 中启用
- 检查 `wrangler.jsonc` 中的 browser 绑定配置

#### 3. R2 上传失败
```
Error: R2 bucket not found
```

**解决方案**:
- 确认 R2 存储桶已创建
- 检查 `wrangler.jsonc` 中的 r2_buckets 配置
- 验证存储桶名称正确

#### 4. 截图超时
```
Screenshot failed: Navigation timeout
```

**解决方案**:
- 检查目标网站是否可访问
- 考虑增加超时时间（当前15秒）
- 查看网站是否有反爬虫机制

### 调试技巧

#### 1. 查看详细日志
```bash
wrangler tail --env production --format pretty
```

#### 2. 测试单个资源
在数据库中手动清空某个资源的 `screenshot_url` 字段，然后触发任务观察处理过程。

#### 3. 检查资源状态
```sql
-- 查看待处理的资源
SELECT id, name, url, screenshot_url, screenshot_error 
FROM resources 
WHERE screenshot_url IS NULL 
LIMIT 5;

-- 查看最近更新的截图
SELECT id, name, screenshot_url, screenshot_updated_at 
FROM resources 
WHERE screenshot_updated_at IS NOT NULL 
ORDER BY screenshot_updated_at DESC 
LIMIT 10;
```

## 性能监控

### 关键指标

1. **处理成功率**: 成功截图数 / 总尝试数
2. **平均处理时间**: 每个资源的截图时间
3. **错误率**: 失败截图数 / 总尝试数
4. **存储使用量**: R2 存储桶大小

### 监控查询

```sql
-- 统计截图状态
SELECT 
  COUNT(*) as total_resources,
  COUNT(screenshot_url) as with_screenshots,
  COUNT(screenshot_error) as with_errors,
  ROUND(COUNT(screenshot_url) * 100.0 / COUNT(*), 2) as success_rate
FROM resources;

-- 查看错误分布
SELECT screenshot_error, COUNT(*) as error_count
FROM resources 
WHERE screenshot_error IS NOT NULL 
GROUP BY screenshot_error 
ORDER BY error_count DESC;
```

## 预期结果

### 成功指标

- ✅ TypeScript 编译无错误
- ✅ 健康检查返回正常状态
- ✅ 手动触发成功响应
- ✅ 数据库中资源获得 `screenshot_url`
- ✅ R2 存储桶中生成截图文件
- ✅ 图片可通过 URL 正常访问
- ✅ 定时任务正常运行（每5分钟）

### 处理时间预期

- **单个截图**: 3-5秒
- **单批处理**: 3-5分钟（5个资源）
- **全部处理**: 约35分钟（32个资源，7批次）

### 成功率预期

- **目标成功率**: >95%
- **常见失败原因**: 网站无法访问、加载超时、反爬虫限制

完成测试后，截图服务应该能够自动为所有资源生成高质量的截图，并定期更新。