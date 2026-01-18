# 设计百宝箱截图服务

基于 Cloudflare Workers 的分批处理截图服务，每5分钟自动处理5个资源，避免超时问题。

## 架构概览

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  Cron Trigger   │    │ Cloudflare Worker│    │  Supabase DB    │
│  (每5分钟)      │───►│                  │◄──►│                 │
│                 │    │ 1. 任务发现      │    │ Resources       │
└─────────────────┘    │    (LIMIT 5)     │    │ - screenshot_url│
                       │ 2. 串行截图      │    │ - updated_at    │
                       │ 3. 数据回填      │    │                 │
                       │                  │    │                 │
                       │ ┌──────────────┐ │    │                 │
                       │ │ Puppeteer    │ │    │                 │
                       │ │ Browser      │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       │ ┌──────────────┐ │    │                 │
                       │ │ R2 Storage   │ │    │                 │
                       │ │ (Images)     │ │    │                 │
                       │ └──────────────┘ │    │                 │
                       └──────────────────┘    └─────────────────┘
```

## 核心功能

- **分批处理**: 每5分钟处理5个资源，避免Worker超时
- **任务发现**: 自动查询 `screenshot_url IS NULL` 的资源
- **串行执行**: 逐个处理资源，确保稳定性
- **直接集成**: Worker 直接访问 Supabase，无需 Next.js API
- **高质量截图**: 1200x800 视口，JPEG 80% 质量
- **中文字体支持**: 自动注入 Noto Sans SC 字体
- **错误处理**: 完善的重试机制和错误日志
- **缓存优化**: 7天强缓存，减少重复请求

## 技术栈

- **Cloudflare Workers**: 无服务器计算平台
- **Puppeteer**: 浏览器自动化 (`@cloudflare/puppeteer`)
- **Supabase**: 直接数据库访问 (`@supabase/supabase-js`)
- **R2 Storage**: 图片存储
- **Browser API**: Cloudflare 托管的浏览器实例
- **TypeScript**: 类型安全的开发体验

## 处理流程

### 第一步：任务发现 (Cron Trigger)
- **频率**: 每5分钟执行一次
- **查询**: `SELECT * FROM resources WHERE screenshot_url IS NULL LIMIT 5`
- **逻辑**: 获取5个未处理的资源

### 第二步：单步执行 (Puppeteer Worker)
- **串行处理**: 逐个截图，避免资源竞争
- **超时控制**: 15秒页面加载超时
- **文件命名**: 使用资源ID `screenshots/{resource.id}.jpg`
- **即时上传**: 截图完成立即上传到R2

### 第三步：数据回填 (Supabase Update)
- **直接更新**: Worker 直接更新数据库
- **字段更新**: `screenshot_url`, `screenshot_updated_at`
- **错误记录**: 失败时记录 `screenshot_error` 字段

## 部署指南

### 1. 环境准备

```bash
# 安装 wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 安装项目依赖
npm install
```

### 2. 配置环境变量

在 Cloudflare Workers 控制台或通过 CLI 设置：

```bash
# 设置 Supabase 密钥
wrangler secret put SUPABASE_SECRET_KEY --env production
```

### 3. 配置 wrangler.jsonc

更新配置文件中的以下值：

```jsonc
{
  "env": {
    "production": {
      "vars": {
        "SUPABASE_URL": "https://your-project.supabase.co",  // 替换为实际URL
        "R2_PUBLIC_URL": "https://screenshots.your-domain.com"  // 替换为实际域名
      },
      "r2_buckets": [
        {
          "binding": "SCREENSHOT_BUCKET",
          "bucket_name": "design-screenshots"  // 替换为实际存储桶名
        }
      ]
    }
  }
}
```

### 4. 部署

```bash
# 使用部署脚本 (推荐)
./scripts/deploy.sh

# 或手动部署
npm run deploy:production
```

## API 接口

### 健康检查

```bash
GET https://your-worker.workers.dev/health
```

### 手动触发截图任务

```bash
POST https://your-worker.workers.dev/trigger
```

### 图片访问

```bash
GET https://your-worker.workers.dev/images/screenshots/{resource_id}.jpg
```

## 数据库集成

### 直接 Supabase 访问

Worker 直接使用 Supabase JavaScript 客户端：

```typescript
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY)

// 获取待处理资源
const { data: resources } = await supabase
  .from('resources')
  .select('id, name, url, screenshot_url')
  .is('screenshot_url', null)
  .limit(5)

// 更新截图URL
await supabase
  .from('resources')
  .update({
    screenshot_url: screenshotUrl,
    screenshot_updated_at: new Date().toISOString()
  })
  .eq('id', resource.id)
```

## 数据库 Schema

确保 Supabase 中的 `resources` 表包含以下字段：

```sql
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS screenshot_error TEXT;

-- 创建索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_resources_screenshot_null 
ON resources(id) WHERE screenshot_url IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_screenshot_updated 
ON resources(screenshot_updated_at);
```

## 性能指标

### 处理时间估算

- **32个资源**: 分为7批次处理
- **每批次**: 5个资源，约3-5分钟处理时间
- **总时间**: 约35分钟 (7批次 × 5分钟间隔)
- **单个截图**: 平均3-5秒

### 资源使用

- **CPU 时间**: 每批次约30-60秒
- **内存使用**: 自动管理，无需担心
- **并发限制**: 串行处理，避免资源竞争

## 监控和调试

### 查看日志

```bash
# 实时日志
wrangler tail --env production

# 查看特定时间段的日志
wrangler tail --env production --since 2024-01-01
```

### 性能监控

- **CPU 时间限制**: 15分钟 (900,000ms)
- **内存使用**: 自动管理
- **并发限制**: 单个 Worker 实例

### 常见问题

1. **浏览器超时**: 调整 `page.goto()` 的 timeout 参数
2. **内存不足**: 确保及时关闭页面和浏览器实例
3. **R2 上传失败**: 检查存储桶权限和网络连接

## 成本估算

基于 Cloudflare Workers 定价 (2024年):

- **Worker 执行**: 每5分钟1次，约 $0.05/月
- **Browser API**: 32个资源，约 $0.16/月 (一次性处理)
- **R2 存储**: 32张图片 × 100KB = 3.2MB，约 $0.01/月
- **后续维护**: 新资源添加时的增量处理

**总计**: 约 $0.22/月 (初始处理后成本极低)

## 开发指南

### 本地测试

```bash
# 快速测试（推荐）
npm run test:quick

# 完整本地测试
npm run test

# 仅 TypeScript 检查
npm run type-check
```

### 数据库准备

#### 1. 执行数据库迁移

**现有数据库**（在 Supabase SQL Editor 中执行）：
```sql
-- 执行 supabase/migrations/006_add_screenshot_fields.sql
ALTER TABLE public.resources 
ADD COLUMN IF NOT EXISTS screenshot_url TEXT,
ADD COLUMN IF NOT EXISTS screenshot_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS screenshot_error TEXT;

CREATE INDEX IF NOT EXISTS idx_resources_screenshot_null 
ON public.resources(id) WHERE screenshot_url IS NULL;

CREATE INDEX IF NOT EXISTS idx_resources_screenshot_updated 
ON public.resources(screenshot_updated_at);
```

**新数据库**：
```sql
-- 执行完整的迁移文件
-- supabase/migrations/001_initial_schema.sql (已包含截图字段)
```

#### 2. 验证数据库状态

```sql
-- 执行 scripts/verify-screenshot-schema.sql 验证配置
```

### 测试截图功能

```bash
# 启动本地开发服务器
npm run dev

# 在另一个终端测试
curl http://localhost:8787/health
curl -X POST http://localhost:8787/trigger
```

### 代码结构

```
src/
├── index.ts          # 主要 Worker 逻辑
├── types.ts          # TypeScript 类型定义 (已移除)
├── constants.ts      # 常量配置 (已移除)
└── utils.ts          # 工具函数 (已移除)
```

**注意**: 为了简化架构，已将所有逻辑合并到单个 `index.ts` 文件中。

### 最佳实践

1. **资源管理**: 始终在 `finally` 块中关闭浏览器和页面
2. **错误处理**: 为每个截图操作提供独立的错误处理
3. **性能优化**: 使用适当的延迟避免过度并发
4. **日志记录**: 详细记录操作状态便于调试

## 更新日志

### v1.0.0 (2024-01-18)

- ✅ 初始版本发布
- ✅ 基础截图功能
- ✅ 自动化定时任务
- ✅ R2 存储集成
- ✅ 数据库同步
- ✅ 错误处理和日志
- ✅ 简化单文件架构

## 许可证

MIT License - 详见 LICENSE 文件