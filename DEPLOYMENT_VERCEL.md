# Vercel 部署指南

本指南说明如何将 Design Treasure Box 部署到 Vercel 平台。

## 📋 目录

- [前置要求](#前置要求)
- [部署方式](#部署方式)
- [环境变量配置](#环境变量配置)
- [部署步骤](#部署步骤)
- [部署后验证](#部署后验证)
- [常见问题](#常见问题)

## 前置要求

- Node.js 18+ 本地开发环境
- Git 仓库（GitHub、GitLab 或 Bitbucket）
- Vercel 账号（[免费注册](https://vercel.com/signup)）
- Supabase 项目（用于数据库和认证）
- Cloudflare 账号（用于截图服务 Worker）

## 部署方式

Vercel 支持多种部署方式，推荐使用 **Git 集成部署**：

### 方式对比

| 方式 | 适用场景 | 优势 |
|------|---------|------|
| **Git 集成** | 生产环境 | 自动 CI/CD、预览部署、回滚简单 |
| **Vercel CLI** | 快速测试 | 命令行直接部署、适合首次部署 |
| **Deploy Hooks** | 自定义触发 | 需要特定事件触发部署 |

## 环境变量配置

### 必需的环境变量

在 Vercel 项目设置中配置以下环境变量：

#### Supabase 配置

```bash
# Supabase 项目 URL（在 Supabase Dashboard > Settings > API）
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co

# Supabase 服务端密钥（注意：这是 secret key，不是 anon key）
SUPABASE_SECRET_KEY=your_supabase_service_role_key_here
```

**获取方式：**
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 Settings > API
4. 复制 Project URL 和 `service_role` key

#### 截图服务配置

```bash
# Next.js 与 Worker 通信的鉴权密钥（生成一个随机字符串）
DATABASE_API_KEY=your_random_secure_api_key_here

# Worker 公网访问地址（Cloudflare Workers 部署后获得）
WORKER_API_URL=https://your-screenshot-worker.workers.dev
```

**获取方式：**
1. 生成 `DATABASE_API_KEY`：使用 UUID 或随机字符串生成器
   ```bash
   # 在终端运行
   openssl rand -base64 32
   ```

2. 部署 Cloudflare Worker 后，获取其 Workers 域名

#### AI 服务配置（可选）

```bash
# 智谱 AI API Key（用于 AI 聊天功能）
ZHIPU_API_KEY=your_zhipu_api_key_here
```

**获取方式：**
- 访问 [智谱 AI 开放平台](https://open.bigmodel.cn/)
- 注册并创建 API Key

### 环境变量安全提示

⚠️ **重要安全注意事项：**

- **不要**在代码中硬编码密钥
- **不要**将 `.env.local` 提交到 Git
- `SUPABASE_SECRET_KEY` 和 `DATABASE_API_KEY` 必须保密
- `NEXT_PUBLIC_*` 前缀的变量会暴露在浏览器中，只能放公开信息

## 部署步骤

### 方式一：通过 Vercel Dashboard（推荐首次部署）

#### 步骤 1：连接 Git 仓库

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 **"Add New..."** > **"Project"**
3. 导入你的 Git 仓库（需要授权 Vercel 访问）
4. 选择 `design-treasure-box` 仓库

#### 步骤 2：配置项目

Vercel 会自动检测到 Next.js 项目，配置如下：

```json
{
  "Framework Preset": "Next.js",
  "Build Command": "npm run build",
  "Output Directory": ".next",
  "Install Command": "npm install"
}
```

#### 步骤 3：设置环境变量

在 **Environment Variables** 部分添加上面列出的所有必需变量：

1. 展开 **Environment Variables** 区域
2. 逐个添加变量（Key 和 Value）
3. 选择适用的环境（Production / Preview / Development）
4. 点击 **Add** 添加每个变量

#### 步骤 4：部署

1. 点击 **"Deploy"** 按钮
2. 等待构建完成（首次部署约 2-5 分钟）
3. 部署成功后会获得一个 `*.vercel.app` 域名

#### 步骤 5：配置自定义域名（可选）

1. 在项目 Settings > Domains
2. 添加你的自定义域名
3. 按照提示配置 DNS 记录

### 方式二：通过 Vercel CLI

#### 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 登录

```bash
vercel login
```

#### 部署项目

```bash
# 在项目根目录
cd design-treasure-box

# 首次部署（生产环境）
vercel --prod

# 或者先部署预览环境
vercel
```

CLI 会引导你完成：
1. 关联 Vercel 项目
2. 设置项目名称
3. 配置环境变量
4. 开始构建和部署

### 方式三：Git 推送自动部署

首次部署后，每次推送代码到主分支会自动触发部署：

```bash
git add .
git commit -m "feat: new feature"
git push origin main
```

Vercel 会：
1. 自动检测新的提交
2. 创建预览部署（如果是 PR）
3. 部署到生产环境（如果是 main 分支）

## 部署后验证

### 1. 检查部署状态

访问 Vercel Dashboard > Deployments，确认：
- ✅ 构建状态为 "Ready"
- ✅ 没有错误或警告
- ✅ 所有函数正常编译

### 2. 功能测试清单

#### 基础功能
- [ ] 首页能正常访问
- [ ] 资源列表能正常加载
- [ ] 用户登录/注册功能正常
- [ ] 资源详情页能正常显示

#### API 路由
- [ ] `/api/admin/resources/*` 管理接口可用
- [ ] `/api/admin/resources/screenshot/*` 截图接口可用

#### 截图服务
- [ ] Worker 能正常调用 Next.js API
- [ ] 截图能正常生成并上传到 Supabase Storage
- [ ] 定时任务能正常执行（检查 Worker 日志）

#### AI 功能（如果配置）
- [ ] AI 聊天功能正常
- [ ] AI 推荐功能正常

### 3. 检查日志

如果出现问题，查看部署日志：

1. 在 Vercel Dashboard 选择部署
2. 点击 **"View Build Logs"**
3. 检查错误信息和警告

### 4. 监控和性能

Vercel 提供内置监控工具：

- **Analytics**：访问量、性能指标
- **Speed Insights**：页面加载速度
- **Logs**：实时日志查看
- **Error Tracking**：错误追踪（需集成）

## 常见问题

### Q1: 构建失败，提示环境变量缺失

**原因：** 环境变量未在 Vercel 中配置

**解决：**
1. 进入项目 Settings > Environment Variables
2. 添加所有必需的环境变量
3. 重新部署（Redeploy）

### Q2: Supabase 连接失败

**原因：** Supabase URL 或 Key 配置错误

**解决：**
1. 检查 `NEXT_PUBLIC_SUPABASE_URL` 格式是否正确
2. 确认使用的是 `service_role` key（不是 `anon` key）
3. 验证 Supabase 项目是否处于活跃状态

### Q3: 图片上传失败

**原因：** Supabase Storage 权限或配置问题

**解决：**
1. 检查 Supabase Storage bucket 是否创建
2. 验证 RLS（Row Level Security）策略
3. 确认 Storage 的 CORS 配置

### Q4: 截图服务无法调用

**原因：** Worker 或 API 配置问题

**解决：**
1. 验证 `WORKER_API_URL` 是否正确
2. 检查 `DATABASE_API_KEY` 是否一致
3. 查看 Worker 日志确认请求是否到达
4. 检查 API 路由的 CORS 配置

### Q5: 本地开发环境如何设置？

**本地环境变量文件：**

创建 `.env.local` 文件（不要提交到 Git）：

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_key_here
DATABASE_API_KEY=your_local_dev_api_key
WORKER_API_URL=http://localhost:8787  # Worker 本地地址
ZHIPU_API_KEY=your_zhipu_api_key_here
PORT=3000
```

然后运行：
```bash
npm run dev
```

### Q6: 如何回滚到之前的部署？

**方式一：通过 Dashboard**
1. 进入 Deployments 页面
2. 找到要回滚到的部署
3. 点击 **"..."** 菜单 > **"Promote to Production"**

**方式二：通过 CLI**
```bash
vercel rollback
```

### Q7: 部署太慢怎么办？

**优化建议：**

1. **使用 Vercel 的缓存**
   - Vercel 会自动缓存 `node_modules`
   - 确保 `.vercelignore` 配置正确

2. **优化构建时间**
   - 减少不必要的依赖
   - 使用 `next/image` 优化图片
   - 启用 ISR（增量静态再生）

3. **选择最近的部署区域**
   - 在 `vercel.json` 中配置 `regions`
   - 亚洲用户推荐 `hkg1`（香港）

### Q8: 如何配置自定义域名？

1. **购买域名**（可选）
   - 推荐在 Vercel、Namecheap、GoDaddy 等购买

2. **添加域名到 Vercel**
   - Settings > Domains > Add Domain
   - 输入你的域名

3. **配置 DNS**
   - 如果域名在 Vercel，会自动配置
   - 如果在第三方，需要添加 DNS 记录：
     ```
     Type: CNAME
     Name: www
     Value: cname.vercel-dns.com
     ```

4. **等待 DNS 生效**
   - 通常需要 5 分钟到 24 小时

5. **启用 HTTPS**
   - Vercel 会自动为自定义域名提供 SSL 证书

### Q9: 如何限制部署访问权限？

**方法一：使用 Vercel Teams**
- 创建 Team 项目
- 邀请成员并设置权限

**方法二：密码保护（预览部署）**
在 `vercel.json` 中配置：
```json
{
  "build": {
    "env": {
      "PREVIEW_DEPLOYMENT_PROTECTION": "password"
    }
  }
}
```

**方法三：IP 白名单**
- 使用 Vercel Edge Middleware
- 参考：[Vercel Edge Config](https://vercel.com/docs/concepts/projects/edge-config)

### Q10: 生产环境与预览环境的区别？

| 特性 | Production | Preview |
|------|-----------|---------|
| 域名 | 自定义域名 | `*.vercel.app` |
| 访问权限 | 公开 | 可配置密码保护 |
| 数据 | 使用生产数据库 | 通常使用生产数据库 |
| 用途 | 正式上线 | 测试、评审 |

**建议：**
- 为预览环境配置独立的 Supabase 项目（用于测试）
- 使用环境变量区分：`NODE_ENV=production` 或 `NODE_ENV=development`

## 进阶配置

### 自动化部署工作流

#### GitHub Actions 集成

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### 多环境部署

配置不同的环境：

```bash
# Production（生产环境）
- NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
- DATABASE_API_KEY=prod_key

# Preview（预览环境）
- NEXT_PUBLIC_SUPABASE_URL=https://staging.supabase.co
- DATABASE_API_KEY=staging_key
```

### 性能监控

集成 Vercel Analytics：

```bash
npm install @vercel/analytics
```

在 `app/layout.tsx` 中：

```tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## 成本估算

Vercel 免费计划包括：

- ✅ 无限项目
- ✅ 100GB 带宽/月
- ✅ 无限预览部署
- ✅ 自动 HTTPS
- ✅ 全球 CDN

**何时需要付费：**
- 超过免费带宽限制
- 需要更长的函数执行时间
- 需要团队成员协作

查看 [Vercel 定价](https://vercel.com/pricing) 了解详情。

## 相关资源

- [Vercel 官方文档](https://vercel.com/docs)
- [Next.js 部署文档](https://nextjs.org/docs/app/building-your-application/deploying)
- [Supabase 文档](https://supabase.com/docs)
- [项目代码仓库](https://github.com/yourusername/design-treasure-box)

## 技术支持

如果遇到问题：
1. 查看本文档的"常见问题"部分
2. 搜索 [Vercel 错误代码](https://vercel.com/docs/errors)
3. 在项目 Issues 页面提问

---

**最后更新：** 2025-01-19
**文档版本：** 1.0.0
