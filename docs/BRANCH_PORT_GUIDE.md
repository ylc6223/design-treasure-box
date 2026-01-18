# 分支端口管理指南

## 问题背景

当多个分支同时运行开发服务器时，如果使用相同端口会导致冲突：
```
Error: listen EADDRINUSE: address already in use :::3000
```

## 解决方案

### 1. 端口分配规则

| 分支 | 端口 | 说明 |
|------|------|------|
| `main` | 3000 | 主分支默认端口 |
| `dev` | 3001 | 开发分支端口 |
| 其他功能分支 | 3002+ | 按需分配 |

### 2. 配置步骤

#### 首次设置（每个分支只需一次）

1. **复制环境变量模板**
   ```bash
   cp .env.example .env.local
   ```

2. **修改 `.env.local` 中的端口**
   ```bash
   # dev 分支
   PORT=3001
   
   # main 分支
   PORT=3000
   ```

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

### 3. 为什么这样设计？

✅ **优点：**
- `.env.local` 被 Git 忽略，**不会在分支合并时产生冲突**
- `package.json` 不硬编码端口，**所有分支共享同一配置**
- 每个开发者可以根据本地情况自定义端口

❌ **避免的错误做法：**
- ~~在 `package.json` 中硬编码 `--port 3000`~~（会在合并时冲突）
- ~~不同分支修改 `package.json` 的 `dev` 脚本~~（会产生 merge conflict）

### 4. 技术原理

Next.js 端口优先级：
```
命令行参数 --port > 环境变量 PORT > 默认值 3000
```

我们的配置：
- ✅ 移除了 `package.json` 中的 `--port` 参数
- ✅ 使用 `.env.local` 中的 `PORT` 环境变量
- ✅ `.env.local` 在 `.gitignore` 中被忽略

### 5. 常见问题

**Q: 切换分支后端口变了怎么办？**

A: 检查 `.env.local` 文件，确保端口配置正确。如果文件不存在，从 `.env.example` 复制一份。

**Q: 合并分支时会冲突吗？**

A: 不会！`.env.local` 被 Git 忽略，不会参与合并。`package.json` 的 `dev` 脚本在所有分支都一样。

**Q: 如何查看当前使用的端口？**

A: 运行 `pnpm dev` 后，终端会显示：
```
- Local:   http://localhost:3001
```

## 最佳实践

1. **新建分支时**：立即检查 `.env.local` 并设置合适的端口
2. **团队协作**：在 README 中记录各分支的端口分配
3. **CI/CD**：生产环境不依赖 `.env.local`，使用环境变量注入

---

**相关文件：**
- `.env.example` - 环境变量模板
- `.env.local` - 本地配置（Git 忽略）
- `.gitignore` - 确保 `.env*.local` 被忽略
- `package.json` - 开发脚本配置
