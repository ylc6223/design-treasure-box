# Supabase 数据库迁移

## 运行迁移

有两种方式运行数据库迁移：

### 方式 1: 使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 点击左侧菜单的 **SQL Editor**
4. 点击 **New query**
5. 复制 `migrations/001_initial_schema.sql` 的内容
6. 粘贴到 SQL Editor
7. 点击 **Run** 执行

### 方式 2: 使用 Supabase CLI

如果你安装了 Supabase CLI：

```bash
# 安装 Supabase CLI（如果还没安装）
npm install -g supabase

# 链接到你的项目
supabase link --project-ref your-project-ref

# 运行迁移
supabase db push
```

## 验证迁移

迁移成功后，你应该能在 Supabase Dashboard 的 **Table Editor** 中看到以下表：

- `profiles` - 用户资料表
- `resources` - 资源表
- `ratings` - 用户评分表

## 迁移文件说明

### 001_initial_schema.sql

创建初始数据库结构：

**表结构：**
- `profiles`: 用户资料（扩展 auth.users）
- `resources`: 设计资源
- `ratings`: 用户评分

**功能：**
- UUID 主键
- 自动更新 `updated_at` 时间戳
- Row Level Security (RLS) 策略
- 索引优化查询性能
- 外键约束和级联删除

**RLS 策略：**
- 所有人可以查看资源和评分
- 用户只能管理自己的评分
- 管理员可以管理所有资源
- 用户可以更新自己的资料

## 下一步

迁移完成后，继续执行：
- Task 2.4: 生成 TypeScript 类型
- Task 4: 创建用户 Profile 自动创建触发器
