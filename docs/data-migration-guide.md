# 数据迁移指南

## 问题说明

当前遇到的错误：
```
"insert or update on table \"ratings\" violates foreign key constraint \"ratings_resource_id_fkey\""
```

**原因**：数据库中没有资源数据，评分表的外键约束失败。

---

## 解决方案

需要将 `data/resources.json` 中的资源数据迁移到 Supabase 数据库。

---

## 迁移步骤

### 方案 1：使用 Service Role Key（推荐）

Service Role Key 可以绕过 RLS 策略，直接插入数据。

#### 1. 获取 Service Role Key

1. 访问 Supabase 控制台：https://supabase.com/dashboard
2. 选择你的项目：`qtymidkusovwjamlntsk`
3. 进入 **Settings** → **API**
4. 找到 **Project API keys** 部分
5. 复制 **service_role** key（⚠️ 这是敏感密钥，不要提交到 Git）

#### 2. 添加到环境变量

编辑 `.env.local`，添加：

```env
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

#### 3. 运行迁移脚本

```bash
npx tsx scripts/migrate-resources-to-supabase.ts
```

---

### 方案 2：临时禁用 RLS（不推荐）

如果无法获取 Service Role Key，可以临时禁用 RLS 策略。

#### 1. 在 Supabase SQL Editor 中执行

```sql
-- 临时禁用 resources 表的 RLS
ALTER TABLE public.resources DISABLE ROW LEVEL SECURITY;
```

#### 2. 运行迁移脚本

```bash
npx tsx scripts/migrate-resources-to-supabase.ts
```

#### 3. 重新启用 RLS

```sql
-- 重新启用 resources 表的 RLS
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
```

⚠️ **警告**：禁用 RLS 期间，任何人都可以修改数据！请尽快完成迁移并重新启用。

---

### 方案 3：使用 Supabase SQL Editor 直接插入（最简单）

SQL 文件已经生成好了，直接使用即可。

#### 1. 打开 SQL 文件

文件位置：`supabase/migrations/003_seed_resources.sql`

#### 2. 在 Supabase SQL Editor 中执行

1. 访问：https://supabase.com/dashboard/project/qtymidkusovwjamlntsk/sql/new
2. 复制 `supabase/migrations/003_seed_resources.sql` 的全部内容
3. 粘贴到 SQL Editor
4. 点击 **Run** 执行

SQL 会自动：
- 临时禁用 RLS
- 插入 32 个资源（使用 `ON CONFLICT` 避免重复）
- 重新启用 RLS
- 验证数据

#### 3. 重新生成 SQL（可选）

如果需要更新 SQL 文件：

```bash
node scripts/generate-insert-sql.js
```

---

## 验证迁移

迁移完成后，在 Supabase SQL Editor 中验证：

```sql
-- 查看资源数量
SELECT COUNT(*) FROM public.resources;

-- 查看前 5 个资源
SELECT id, name, url FROM public.resources LIMIT 5;
```

应该看到 32 个资源。

---

## 迁移后测试

1. 重新访问 http://localhost:3000
2. 登录账号
3. 选择任意资源
4. 提交评分
5. 应该成功！

---

## 常见问题

### Q: 为什么需要 Service Role Key？

A: 因为 RLS 策略限制只有管理员才能插入资源。Service Role Key 可以绕过 RLS。

### Q: Service Role Key 安全吗？

A: Service Role Key 拥有完全权限，**绝对不能**暴露在前端代码或提交到 Git。只在服务器端脚本中使用。

### Q: 迁移会覆盖现有数据吗？

A: 脚本使用 `upsert` 操作，如果资源 ID 已存在，会更新数据；否则插入新数据。

### Q: 可以重复运行迁移脚本吗？

A: 可以。脚本是幂等的，多次运行不会产生重复数据。

---

## 下一步

迁移完成后，你可以：

1. ✅ 测试评分功能
2. ✅ 继续开发管理员功能（任务 10）
3. ✅ 实现前端从数据库获取资源（任务 19）
