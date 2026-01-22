# Supabase 数据库迁移文件

这个目录包含所有 Supabase 数据库的迁移 SQL 文件。

## 文件说明

### 001_initial_schema.sql

初始数据库架构，包含：

- `resources` 表：资源数据
- `ratings` 表：用户评分
- `profiles` 表：用户资料
- RLS 策略配置

### 002_auto_create_profile.sql

自动创建用户资料的触发器，当新用户注册时自动在 `profiles` 表中创建记录。

### 003_seed_resources.sql

资源数据种子文件，包含 32 个精选设计资源。

**使用方法：**

1. 打开 Supabase SQL Editor：https://supabase.com/dashboard/project/qtymidkusovwjamlntsk/sql/new
2. 复制此文件的全部内容
3. 粘贴并执行

**特点：**

- 使用 `ON CONFLICT` 避免重复插入
- 自动禁用/启用 RLS
- 包含数据验证查询

## 执行顺序

迁移文件按编号顺序执行：

1. `001_initial_schema.sql` - 创建表结构
2. `002_auto_create_profile.sql` - 添加触发器
3. `003_seed_resources.sql` - 导入初始数据

## 重新生成种子文件

如果需要更新资源数据：

```bash
node scripts/generate-insert-sql.js
```

这会根据 `data/resources.json` 重新生成 `003_seed_resources.sql`。

## 注意事项

- ✅ 这些文件应该提交到 Git
- ✅ 迁移文件是幂等的，可以重复执行
- ⚠️ 不要手动修改已执行的迁移文件
- ⚠️ 新的迁移文件应该使用递增的编号（004, 005...）
