# 数据迁移脚本

本目录包含将现有 JSON 数据迁移到 Supabase 数据库的脚本。

## 前置条件

1. **Supabase 项目已创建**
   - 确保已在 Supabase 控制台创建项目
   - 数据库迁移已运行（`supabase/migrations/` 中的 SQL 文件）

2. **环境变量已配置**
   
   在项目根目录的 `.env.local` 文件中添加：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

   > ⚠️ **重要**：`SUPABASE_SERVICE_ROLE_KEY` 是管理员密钥，可以绕过 RLS 策略。
   > 请妥善保管，不要提交到版本控制系统。

3. **安装依赖**
   ```bash
   pnpm install
   ```

## 使用方法

### 方式 1：使用 TypeScript 脚本（推荐）

运行数据迁移脚本：

```bash
npx tsx scripts/migrate-data.ts
```

这个脚本会：
- 读取 `data/resources.json` 中的资源数据
- 将数据转换为数据库格式
- 使用 `upsert` 插入到 Supabase（如果已存在则更新）
- 验证迁移结果

### 方式 2：使用 SQL 种子文件

如果你更喜欢使用 SQL，可以直接运行种子文件：

```bash
# 使用 Supabase CLI
supabase db reset

# 或者在 Supabase 控制台的 SQL Editor 中运行
# supabase/migrations/003_seed_resources.sql
```

## 迁移内容

脚本会迁移以下数据：

- ✅ **32 个设计资源**
  - 配色工具（3 个）
  - CSS 模板（4 个）
  - 字体资源（3 个）
  - 图标库（4 个）
  - 设计灵感（4 个）
  - 网站案例（3 个）
  - UI 组件（5 个）
  - 样机素材（3 个）
  - 其他（3 个）

- ✅ **13 个精选资源**（`is_featured = true`）

## 验证迁移

迁移完成后，脚本会自动验证：

1. 资源总数
2. 精选资源数量
3. 各分类的资源分布

你也可以在 Supabase 控制台的 Table Editor 中查看 `resources` 表。

## 重新迁移

如果需要重新迁移数据（例如 JSON 数据有更新）：

1. 直接再次运行迁移脚本：
   ```bash
   npx tsx scripts/migrate-data.ts
   ```

2. 脚本使用 `upsert` 操作，会自动更新已存在的记录

## 故障排除

### 错误：缺少环境变量

```
❌ 错误：缺少 Supabase 环境变量
```

**解决方法**：检查 `.env.local` 文件，确保包含所有必需的环境变量。

### 错误：权限不足

```
❌ 迁移资源失败: new row violates row-level security policy
```

**解决方法**：确保使用的是 `SUPABASE_SERVICE_ROLE_KEY` 而不是 `SUPABASE_ANON_KEY`。

### 错误：表不存在

```
❌ 迁移资源失败: relation "public.resources" does not exist
```

**解决方法**：先运行数据库迁移：
```bash
# 在 Supabase 控制台的 SQL Editor 中运行
# supabase/migrations/001_initial_schema.sql
```

## 下一步

迁移完成后，你可以：

1. 在管理后台查看和管理资源（`/admin/resources`）
2. 在前台浏览资源（`/`）
3. 测试评分功能

## 注意事项

- 迁移脚本是幂等的，可以安全地多次运行
- 使用 `upsert` 操作，不会创建重复数据
- Service Role Key 可以绕过 RLS，仅用于数据迁移
- 迁移完成后，正常的 API 请求会受 RLS 策略保护
