# 代码质量工具配置

本项目配置了完整的代码质量工具链，包括 ESLint、Prettier、lint-staged 和 Husky。

## 工具介绍

### ESLint

- 代码静态分析工具
- 检查代码错误、代码风格问题和最佳实践
- 配置文件：`.eslintrc.json`

### Prettier

- 代码格式化工具
- 自动格式化代码，保持代码风格一致
- 配置文件：`.prettierrc`
- 忽略文件：`.prettierignore`

### lint-staged

- 对 Git 暂存区中的文件运行代码检查
- 只检查本次修改的文件，提高性能
- 配置文件：`.lintstagedrc.json`

### Husky

- Git hooks 管理工具
- 在 Git 操作时自动运行脚本
- 配置目录：`.husky/`

## 可用脚本

```bash
# 代码检查
pnpm lint              # 运行 ESLint 检查
pnpm lint:fix          # 自动修复 ESLint 错误

# 代码格式化
pnpm format            # 格式化所有文件
pnpm format:check      # 检查文件格式

# Git hooks 自动执行
git commit             # 自动运行 lint-staged
```

## Git Hooks 工作流程

当执行 `git commit` 时，会自动运行：

1. **lint-staged** 对暂存文件执行：
   - 对 `.js/.jsx/.ts/.tsx` 文件运行 ESLint 并自动修复
   - 对所有支持的文件运行 Prettier 格式化
   - 如果有错误，提交会被中止

2. 自动修复后，文件会被重新添加到暂存区

3. 如果所有检查通过，提交成功

## 配置说明

### ESLint 配置 (`.eslintrc.json`)

```json
{
  "extends": ["next/core-web-vitals", "prettier"],
  "plugins": ["prettier"],
  "rules": {
    "prettier/prettier": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

### Prettier 配置 (`.prettierrc`)

```json
{
  "semi": true, // 使用分号
  "trailingComma": "es5", // 尾随逗号
  "singleQuote": true, // 使用单引号
  "printWidth": 100, // 行宽限制
  "tabWidth": 2, // 缩进宽度
  "useTabs": false, // 使用空格缩进
  "arrowParens": "always", // 箭头函数参数使用括号
  "endOfLine": "lf" // 换行符类型
}
```

### lint-staged 配置 (`.lintstagedrc.json`)

```json
{
  "*.{js,jsx,ts,tsx}": [
    "eslint --fix", // ESLint 自动修复
    "prettier --write" // Prettier 格式化
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write" // 其他文件格式化
  ],
  "*.{css,scss}": [
    "prettier --write" // 样式文件格式化
  ]
}
```

## 最佳实践

1. **提交前自动格式化**

   ```bash
   git add .
   git commit -m "your message"
   # lint-staged 会自动格式化并检查
   ```

2. **手动格式化所有文件**

   ```bash
   pnpm format
   ```

3. **检查代码规范**

   ```bash
   pnpm lint
   ```

4. **自动修复代码问题**
   ```bash
   pnpm lint:fix
   ```

## 忽略文件

某些文件会自动被忽略：

- `node_modules/` - 依赖包
- `.next/` - Next.js 构建输出
- `build/` - 构建输出
- `workers/` - Cloudflare Workers
- `*.tsbuildinfo` - TypeScript 构建信息
- `.env*` - 环境变量文件

## 故障排除

### 提交被中止怎么办？

如果 `git commit` 被中止：

1. 查看错误信息，了解具体问题
2. 运行 `pnpm lint:fix` 自动修复问题
3. 或手动修改文件
4. 重新 `git add` 和 `git commit`

### 跳过 hooks（不推荐）

如果确实需要跳过检查：

```bash
git commit --no-verify -m "your message"
```

**注意：** 这会绕过所有代码检查，不推荐使用。

## 自定义配置

如需修改规则，请编辑对应配置文件：

- **ESLint 规则**：`.eslintrc.json`
- **Prettier 规则**：`.prettierrc`
- **lint-staged 规则**：`.lintstagedrc.json`
- **Git hooks**：`.husky/` 目录下的脚本

## 参考资料

- [ESLint 文档](https://eslint.org/)
- [Prettier 文档](https://prettier.io/)
- [lint-staged 文档](https://github.com/okonet/lint-staged)
- [Husky 文档](https://github.com/typicode/husky)
