# 开发工具脚本目录

此目录包含开发环境相关的脚本和工具。

## 脚本列表

### 状态检查

- `check-database-status.ts` - 检查数据库连接和表状态

### 测试工具

- `test-e2e.ts` - 端到端测试脚本

## 使用方法

```bash
# 检查数据库状态
npx tsx scripts/development/check-database-status.ts

# 运行E2E测试
npx tsx scripts/development/test-e2e.ts
```

## 开发流程

1. **环境检查** - 使用状态检查脚本验证环境配置
2. **功能测试** - 运行相关测试脚本
3. **问题排查** - 使用调试工具定位问题

## 环境要求

- 开发环境已配置
- 测试数据库可访问
- 相关依赖已安装
