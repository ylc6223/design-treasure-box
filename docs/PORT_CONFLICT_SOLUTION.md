# 端口冲突完整解决方案

## 问题诊断

✅ **dev 分支**：已修复，`package.json` 使用环境变量
❌ **main 分支**：仍硬编码 `--port 3000`

## 解决步骤

### 步骤 1：在 dev 分支提交当前修改

```bash
# 在 dev 分支
git add package.json .env.example docs/BRANCH_PORT_GUIDE.md
git commit -m "fix: 移除硬编码端口，使用环境变量避免分支冲突"
```

### 步骤 2：切换到 main 分支并应用相同修改

```bash
# 切换到 main 分支
git checkout main

# 确保 .env.local 存在并配置正确
# 如果不存在，创建它：
cp .env.example .env.local
# 编辑 .env.local，设置 PORT=3000

# 修改 package.json（与 dev 分支相同）
# 将 "dev": "next dev --turbopack --port 3000"
# 改为 "dev": "next dev --turbopack"

# 提交修改
git add package.json
git commit -m "fix: 移除硬编码端口，使用环境变量"
```

### 步骤 3：合并 dev 到 main（可选）

```bash
# 在 main 分支
git merge dev

# 此时不会有端口冲突，因为两个分支的 package.json 已经一致
# .env.local 不会被合并（Git 忽略）
```

---

## 方案对比

### 方案 A：两个分支都修改（推荐）⭐

**优点：**
- ✅ 彻底解决问题
- ✅ 未来合并不会冲突
- ✅ 所有分支使用统一的配置方式

**缺点：**
- 需要在两个分支都操作一次

### 方案 B：只修改 dev 分支

**优点：**
- ✅ dev 分支立即可用

**缺点：**
- ❌ 合并到 main 时会有冲突
- ❌ main 分支仍然硬编码端口
- ❌ 需要手动解决 merge conflict

---

## 推荐操作

**立即执行（dev 分支）：**

```bash
# 1. 提交当前修改
git add package.json .env.example docs/BRANCH_PORT_GUIDE.md
git commit -m "fix: 移除硬编码端口，使用环境变量避免分支冲突

- 移除 package.json 中的 --port 3000 参数
- 更新 .env.example 添加分支端口指引
- 添加 BRANCH_PORT_GUIDE.md 文档
"

# 2. 推送到远程
git push origin dev
```

**稍后执行（main 分支）：**

```bash
# 1. 切换到 main
git checkout main

# 2. 确保 .env.local 存在
[ ! -f .env.local ] && cp .env.example .env.local

# 3. 修改 package.json（手动或使用 sed）
sed -i '' 's/"dev": "next dev --turbopack --port 3000"/"dev": "next dev --turbopack"/' package.json

# 4. 提交
git add package.json
git commit -m "fix: 移除硬编码端口，使用环境变量"
git push origin main
```

---

## 验证

**dev 分支：**
```bash
git checkout dev
cat .env.local | grep PORT  # 应显示 PORT=3001
pnpm dev                     # 应启动在 3001
```

**main 分支：**
```bash
git checkout main
cat .env.local | grep PORT  # 应显示 PORT=3000
pnpm dev                     # 应启动在 3000
```

**同时运行两个分支：**
```bash
# 终端 1
cd /path/to/main
pnpm dev  # → http://localhost:3000

# 终端 2
cd /path/to/dev
pnpm dev  # → http://localhost:3001
```

✅ 两个服务器可以同时运行，互不冲突！
