# MCP 配置测试指南

## 验证配置是否正确

### 1. 检查 MCP 服务器状态

在 Kiro 中运行以下命令来验证 MCP 服务器是否正常工作：

```
列出所有可用的 MCP 工具
显示 shadcn 和 prompt-kit 的连接状态
```

### 2. 测试 shadcn 组件

```
显示所有可用的 shadcn 组件
搜索按钮组件
安装一个 Button 组件到我的项目
```

### 3. 测试 prompt-kit 组件

```
显示所有 prompt-kit 组件
搜索 PromptInput 组件
将 PromptInput 组件添加到我的项目
```

### 4. 测试注册表配置

```
从 @prompt-kit 注册表安装 ChatContainer 组件
显示 @smoothui 注册表中的组件
```

## 预期结果

- ✅ MCP 服务器应该显示为"已连接"状态
- ✅ 能够浏览和搜索组件
- ✅ 能够成功安装组件到项目中
- ✅ 组件文件应该出现在正确的目录中

## 常见问题

### 如果 MCP 服务器未连接

1. 检查 `.kiro/settings/mcp.json` 配置
2. 确保 `npx` 和 `shadcn` 已安装
3. 重启 Kiro

### 如果组件安装失败

1. 检查 `components.json` 中的注册表配置
2. 确保 URL 包含 `{name}` 占位符
3. 验证目标目录权限

### 如果找不到 prompt-kit 组件

1. 确认 `components.json` 中有 `@prompt-kit` 注册表
2. 检查 MCP 配置中的 `REGISTRY_URL` 环境变量
3. 验证网络连接

## 配置文件摘要

### .kiro/settings/mcp.json
```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
    "prompt-kit": {
      "command": "npx",
      "args": ["-y", "shadcn@canary", "mcp"],
      "env": {
        "REGISTRY_URL": "https://www.prompt-kit.com/c/registry.json"
      }
    }
  }
}
```

### components.json (注册表部分)
```json
{
  "registries": {
    "@smoothui": "https://smoothui.dev/r/{name}.json",
    "@prompt-kit": "https://www.prompt-kit.com/c/{name}.json"
  }
}
```