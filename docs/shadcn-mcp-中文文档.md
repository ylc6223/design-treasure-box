# shadcn MCP 服务器文档

shadcn MCP 服务器允许 AI 助手与注册表中的项目进行交互。您可以浏览可用组件、搜索特定组件，并使用自然语言直接将它们安装到您的项目中。

例如，您可以要求 AI 助手"使用 acme 注册表中的组件构建一个着陆页"或"从 shadcn 注册表中找一个登录表单"。

注册表在您项目的 `components.json` 文件中配置。

```json
{
  "registries": {
    "@acme": "https://acme.com/r/{name}.json"
  }
}
```

## 快速开始

选择您的 MCP 客户端并按照说明配置 shadcn MCP 服务器。如果您想手动配置，请参阅配置部分。

## 什么是 MCP？

模型上下文协议（Model Context Protocol，MCP）是一个开放协议，使 AI 助手能够安全地连接到外部数据源和工具。通过 shadcn MCP 服务器，您的 AI 助手可以直接访问：

- 组件注册表
- shadcn CLI 工具
- 项目配置

## 工作原理

MCP 服务器充当您的 AI 助手、组件注册表和 shadcn CLI 之间的桥梁。

1. **注册表连接** - MCP 连接到配置的注册表（shadcn/ui、私有注册表、第三方源）
2. **自然语言** - 您用简单的英语描述您的需求
3. **AI 处理** - 助手将您的请求转换为注册表命令
4. **组件交付** - 资源被获取并安装到您的项目中

## 支持的注册表

shadcn MCP 服务器开箱即用地支持任何 shadcn 兼容的注册表。

## 配置

您可以使用任何 MCP 客户端与 shadcn MCP 服务器交互。以下是最流行客户端的配置说明。

### Claude Code

要在 Claude Code 中使用 shadcn MCP 服务器，请将以下配置添加到您项目的 `.mcp.json` 文件中：

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

添加配置后，重启 Claude Code 并运行 `/mcp` 查看列表中的 shadcn MCP 服务器。如果您看到"已连接"，就可以开始使用了。

更多详情请参阅 Claude Code MCP 文档。

### Cursor

要在 Cursor 中配置 MCP，请将 shadcn 服务器添加到您项目的 `.cursor/mcp.json` 配置文件中：

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

添加配置后，在 Cursor 设置中启用 shadcn MCP 服务器。

启用后，您应该在 MCP 服务器列表中看到 shadcn 服务器旁边有一个绿点，以及可用工具列表。

更多详情请参阅 Cursor MCP 文档。

### VS Code

要在 VS Code 中使用 GitHub Copilot 配置 MCP，请将 shadcn 服务器添加到您项目的 `.vscode/mcp.json` 配置文件中：

```json
{
  "servers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    }
  }
}
```

添加配置后，打开 `.vscode/mcp.json` 并点击 shadcn 服务器旁边的"启动"。

更多详情请参阅 VS Code MCP 文档。

### Codex

要在 Codex 中配置 MCP，请将 shadcn 服务器添加到 `~/.codex/config.toml`：

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["shadcn@latest", "mcp"]
```

添加配置后，重启 Codex 以加载 MCP 服务器。

## 配置注册表

MCP 服务器通过您项目的 `components.json` 配置支持多个注册表。这允许您访问来自各种源的组件，包括私有注册表和第三方提供商。

在您的 `components.json` 中配置其他注册表：

```json
{
  "registries": {
    "@acme": "https://registry.acme.com/{name}.json",
    "@internal": {
      "url": "https://internal.company.com/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REGISTRY_TOKEN}"
      }
    }
  }
}
```

## 身份验证

对于需要身份验证的私有注册表，请在您的 `.env.local` 中设置环境变量：

```env
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
```

有关注册表身份验证的更多详情，请参阅身份验证文档。

## 示例提示

配置 MCP 服务器后，您可以使用自然语言与注册表交互。尝试以下提示之一：

### 浏览和搜索
- "显示所有可用的组件"
- "搜索按钮组件"
- "列出表单相关的组件"

### 安装项目
- "安装一个按钮组件"
- "添加一个数据表格组件到我的项目"
- "安装登录表单组件"

### 使用命名空间
- "从 @acme 注册表安装按钮"
- "显示 @internal 命名空间中的所有组件"

## 故障排除

### MCP 无响应

如果 MCP 服务器对提示没有响应：

1. **检查配置** - 验证 MCP 服务器在您的 MCP 客户端中正确配置并启用
2. **重启 MCP 客户端** - 配置更改后重启您的 MCP 客户端
3. **验证安装** - 确保 shadcn 已安装在您的项目中
4. **检查网络** - 确认您可以访问配置的注册表

### 注册表访问问题

如果组件无法从注册表加载：

1. **检查 components.json** - 验证注册表 URL 是否正确
2. **测试身份验证** - 确保为私有注册表设置了环境变量
3. **验证注册表** - 确认注册表在线且可访问
4. **检查命名空间** - 确保命名空间语法正确（@namespace/component）

### 安装失败

如果组件安装失败：

1. **检查项目设置** - 确保您有一个有效的 `components.json` 文件
2. **验证路径** - 确认目标目录存在
3. **检查权限** - 确保对组件目录有写权限
4. **检查依赖项** - 检查是否安装了所需的依赖项

### 没有工具或提示

如果您看到"没有工具或提示"消息，请尝试以下操作：

1. **清除 npx 缓存** - 运行 `npx clear-npx-cache`
2. **重新启用 MCP 服务器** - 尝试在您的 MCP 客户端中重新启用 MCP 服务器
3. **检查日志** - 在 Cursor 中，您可以在"查看" -> "输出"下查看日志，并在下拉菜单中选择"MCP: project-*"

## 了解更多

有关 shadcn MCP 服务器的更多信息和高级用法，请访问官方文档。

---

*本文档翻译自 shadcn 官方 MCP 文档，内容遵循原文档的结构和信息。*