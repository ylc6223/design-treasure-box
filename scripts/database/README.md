# 数据库脚本目录

此目录包含数据库相关的TypeScript脚本，用于数据迁移、验证和管理。

## 脚本列表

### 迁移脚本
- `migrate-categories.ts` - Categories表数据迁移
- `migrate-resources.ts` - Resources表数据迁移  
- `migrate-data.ts` - 通用数据迁移脚本
- `run-categories-migration.ts` - 执行Categories迁移流程

### 验证脚本
- `verify-categories-migration.ts` - 验证Categories迁移结果

### 工具脚本
- `generate-insert-sql.js` - 生成SQL插入语句

## 使用方法

```bash
# 安装依赖
pnpm install

# 执行迁移脚本
npx tsx scripts/database/migrate-categories.ts

# 验证迁移结果
npx tsx scripts/database/verify-categories-migration.ts
```

## 环境要求

- Node.js 18+
- 配置好的 `.env.local` 文件
- Supabase项目访问权限

## 注意事项

- 执行前请确保环境变量配置正确
- 生产环境操作前请先在测试环境验证
- 重要数据操作建议先备份