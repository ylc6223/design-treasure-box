# 向量迁移验证指南

## 步骤 1：更新数据库表结构

请在 Supabase SQL 编辑器中运行 `scripts/update-vector-dimension.sql` 中的脚本。

## 步骤 2：验证迁移

运行以下命令验证迁移是否成功：

```bash
# 测试向量同步
npx tsx scripts/test-vector-migration.ts
```

## 预期结果

成功的迁移应该显示：

```
🧪 Starting vector migration test...

1️⃣ Testing database connection...
Health check result: { status: 'healthy', message: 'Database connection successful' }

2️⃣ Testing vector synchronization...
🔄 Starting full sync for 32 resources...
🎉 Full sync completed: {
  totalResources: 32,
  processedResources: 32,
  skippedResources: 0,
  errorResources: 0,
  duration: xxxx
}

3️⃣ Testing vector search...
Search results: [
  { id: 'xxx', name: 'xxx', similarity: 0.xx }
]

4️⃣ Testing statistics...
Vector store stats: { totalEmbeddings: 32, lastUpdated: 'xxx' }

✅ All tests passed! Vector migration is ready.
```

## 步骤 3：测试 AI 聊天功能

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3001
# 测试 AI 聊天功能，确认向量搜索正常工作
```

## 故障排除

### 如果看到维度不匹配错误：
```
expected 1536 dimensions, not 1024
```

这说明数据库表结构还没有更新，请重新运行步骤 1 中的 SQL 脚本。

### 如果同步失败：
1. 检查环境变量配置
2. 确认 Supabase 连接正常
3. 验证智谱 AI API 密钥有效

### 如果搜索结果为空：
1. 确认向量数据已同步到数据库
2. 检查搜索阈值设置
3. 验证查询向量生成正常