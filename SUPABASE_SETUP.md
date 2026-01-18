# Supabase 配置指南

## 1. 创建 Supabase 项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project"
3. 填写项目信息：
   - **Name**: design-treasure-box（或你喜欢的名称）
   - **Database Password**: 设置一个强密码（请妥善保存）
   - **Region**: 选择离你最近的区域（建议：East Asia (Tokyo) 或 Southeast Asia (Singapore)）
4. 点击 "Create new project"，等待项目创建完成（约 2 分钟）

## 2. 获取 API 密钥

项目创建完成后：

1. 在左侧菜单点击 **Settings** (齿轮图标)
2. 点击 **API** 选项
3. 找到以下信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public**: 公开密钥（用于客户端）
   - **service_role**: 服务密钥（用于服务端，现在称为 Secret Key）

## 3. 配置环境变量

1. 复制 `.env.local.example` 为 `.env.local`：
   ```bash
   cp .env.local.example .env.local
   ```

2. 编辑 `.env.local`，填入你的 Supabase 凭据：
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SECRET_KEY=your-secret-key-here
   ```

## 4. 配置 OAuth 认证

### Google OAuth

1. 在 Supabase Dashboard 左侧菜单点击 **Authentication**
2. 点击 **Providers** 标签
3. 找到 **Google** 并点击
4. 启用 Google 提供商
5. 按照说明配置 Google OAuth：
   - 访问 [Google Cloud Console](https://console.cloud.google.com/)
   - 创建 OAuth 2.0 客户端 ID
   - 设置授权重定向 URI：`https://your-project.supabase.co/auth/v1/callback`
   - 复制 Client ID 和 Client Secret 到 Supabase

### GitHub OAuth

1. 在 **Providers** 标签找到 **GitHub** 并点击
2. 启用 GitHub 提供商
3. 按照说明配置 GitHub OAuth：
   - 访问 [GitHub Developer Settings](https://github.com/settings/developers)
   - 点击 **New OAuth App**
   - 填写应用信息：
     - **Application name**: Design Treasure Box（或你喜欢的名称）
     - **Homepage URL**: 
       - 开发环境：`http://localhost:3000`
       - 生产环境：`https://your-domain.com`（部署后的实际域名）
     - **Application description**: 设计资源聚合平台（可选）
     - **Authorization callback URL**: `https://your-project.supabase.co/auth/v1/callback`
   - 点击 **Register application**
   - 复制 **Client ID**
   - 点击 **Generate a new client secret**，复制 **Client Secret**
   - 将 Client ID 和 Client Secret 粘贴到 Supabase 的 GitHub Provider 配置中
   - 点击 **Save**

**提示**：
- 开发阶段先用 `http://localhost:3000` 作为 Homepage URL
- 部署后可以在 GitHub OAuth App 设置中更新为生产域名
- 或者创建两个 OAuth Apps 分别用于开发和生产环境

## 5. 验证配置

运行开发服务器：
```bash
pnpm dev
```

如果没有错误，说明 Supabase 配置成功！

## 6. 运行数据库迁移

配置完成后，需要创建数据库表结构：

### 使用 Supabase Dashboard（推荐）

1. 在 Supabase Dashboard 左侧菜单点击 **SQL Editor**
2. 点击 **New query**
3. 打开项目中的 `supabase/migrations/001_initial_schema.sql` 文件
4. 复制全部内容并粘贴到 SQL Editor
5. 点击 **Run** 执行迁移
6. 等待执行完成（应该显示 "Success"）

### 验证迁移

1. 点击左侧菜单的 **Table Editor**
2. 你应该能看到以下表：
   - `profiles` - 用户资料表
   - `resources` - 资源表（包含截图字段）
   - `ratings` - 用户评分表

### 验证截图字段

在 `resources` 表中，确认包含以下截图相关字段：
- `screenshot_url` - 截图 URL 地址
- `screenshot_updated_at` - 截图更新时间
- `screenshot_error` - 截图错误信息

## 下一步

数据库迁移完成后，继续执行 Task 2.4：生成 TypeScript 类型。

## 常见问题

### Q: 找不到 API 密钥在哪里？
A: Settings → API → Project URL 和 anon public key

### Q: OAuth 回调 URL 是什么？
A: `https://your-project.supabase.co/auth/v1/callback`（替换 your-project 为你的项目 ID）

### Q: 如何重置数据库密码？
A: Settings → Database → Database password → Reset password
