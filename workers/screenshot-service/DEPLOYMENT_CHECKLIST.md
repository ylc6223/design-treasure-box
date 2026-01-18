# 截图服务部署检查清单

## 部署前检查

### 1. 数据库准备 ✅

- [ ] **现有数据库**: 执行 `supabase/migrations/006_add_screenshot_fields.sql`
- [ ] **新数据库**: 执行完整迁移（`001_initial_schema.sql` 已包含截图字段）
- [ ] **验证字段**: 运行 `scripts/verify-screenshot-schema.sql` 确认字段存在
- [ ] **检查索引**: 确认 `idx_resources_screenshot_null` 和 `idx_resources_screenshot_updated` 索引存在

### 2. Cloudflare 配置 ✅

- [ ] **Workers 账户**: 确认有 Cloudflare Workers 账户
- [ ] **Browser API**: 在 Cloudflare Dashboard 中启用 Browser API
- [ ] **R2 存储桶**: 创建存储桶（如 `design-screenshots`）
- [ ] **域名配置**: 配置 R2 自定义域名（可选但推荐）

### 3. 环境配置 ✅

- [ ] **wrangler.jsonc**: 更新 `SUPABASE_URL` 和 `R2_PUBLIC_URL`
- [ ] **密钥设置**: 运行 `wrangler secret put SUPABASE_SECRET_KEY --env production`
- [ ] **存储桶绑定**: 确认 `r2_buckets` 配置正确
- [ ] **定时任务**: 确认 `triggers` 配置为 `*/5 * * * *`

### 4. 代码检查 ✅

- [ ] **TypeScript**: 运行 `npm run type-check` 无错误
- [ ] **依赖安装**: 运行 `npm install` 安装所有依赖
- [ ] **快速测试**: 运行 `npm run test:quick` 通过所有检查

## 部署步骤

### 1. 自动化部署（推荐）

```bash
cd workers/screenshot-service
./scripts/deploy.sh
```

### 2. 手动部署

```bash
cd workers/screenshot-service
npm run type-check
wrangler deploy --env production
```

## 部署后验证

### 1. 基础功能测试 ✅

- [ ] **健康检查**: `curl https://your-worker.workers.dev/health`
- [ ] **手动触发**: `curl -X POST https://your-worker.workers.dev/trigger`
- [ ] **定时任务**: 在 Cloudflare Dashboard 确认 Cron Trigger 存在

### 2. 监控设置 ✅

- [ ] **实时日志**: `wrangler tail --env production`
- [ ] **数据库监控**: 定期检查 `resources` 表的截图状态
- [ ] **存储监控**: 检查 R2 存储桶中的截图文件

### 3. 功能验证 ✅

等待5-10分钟后检查：

- [ ] **数据库更新**: 有资源的 `screenshot_url` 被填充
- [ ] **文件生成**: R2 存储桶中出现 `screenshots/*.jpg` 文件
- [ ] **图片访问**: 截图 URL 可以正常访问
- [ ] **错误处理**: 失败的截图有 `screenshot_error` 记录

## 监控查询

### 数据库状态检查

```sql
-- 总体状态
SELECT 
    COUNT(*) as total_resources,
    COUNT(screenshot_url) as with_screenshots,
    COUNT(screenshot_error) as with_errors,
    ROUND(COUNT(screenshot_url) * 100.0 / COUNT(*), 2) as success_rate
FROM resources;

-- 最近处理的资源
SELECT id, name, screenshot_url, screenshot_updated_at, screenshot_error
FROM resources 
WHERE screenshot_updated_at > NOW() - INTERVAL '1 hour'
ORDER BY screenshot_updated_at DESC;

-- 待处理的资源
SELECT COUNT(*) as pending_count
FROM resources 
WHERE screenshot_url IS NULL;
```

### Cloudflare 监控

```bash
# 查看实时日志
wrangler tail --env production --format pretty

# 查看最近的执行
wrangler tail --env production --since 1h
```

## 故障排除

### 常见问题检查

- [ ] **数据库连接**: 检查 `SUPABASE_URL` 和 `SUPABASE_SECRET_KEY`
- [ ] **浏览器 API**: 确认 Browser API 已启用且有配额
- [ ] **R2 权限**: 确认 Worker 有 R2 存储桶的读写权限
- [ ] **网络访问**: 确认目标网站可以从 Cloudflare 访问

### 性能指标

- **目标成功率**: >95%
- **平均处理时间**: 3-5秒/截图
- **批次处理时间**: 3-5分钟/批次
- **全量处理时间**: ~35分钟（32个资源）

## 维护任务

### 定期检查（每周）

- [ ] 检查截图成功率
- [ ] 清理失败的截图错误
- [ ] 监控 R2 存储使用量
- [ ] 检查 Worker 执行统计

### 故障恢复

如需重新生成所有截图：

```sql
-- 清空所有截图 URL（谨慎操作）
UPDATE resources SET 
    screenshot_url = NULL, 
    screenshot_updated_at = NULL, 
    screenshot_error = NULL;
```

## 成功标准

部署成功的标志：

✅ **自动化运行**: 每5分钟自动处理5个资源  
✅ **高成功率**: >95% 的资源成功生成截图  
✅ **稳定性**: 连续运行无崩溃  
✅ **可观测性**: 日志清晰，错误可追踪  
✅ **成本控制**: 月成本 <$1  

完成此检查清单后，截图服务应该能够稳定运行并自动为所有设计资源生成高质量截图。