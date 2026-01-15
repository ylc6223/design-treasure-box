# Prompt-Kit MCP 文档 (最新版本)

模型上下文协议（MCP）允许 AI 工具直接访问 prompt-kit 组件。这使您能够在不离开编码环境的情况下浏览、预览和添加组件。

## ⚠️ 重要更新

根据最新的仓库更新，MCP 配置已更改：
- **旧版本**: `"args": ["-y", "shadcn@canary", "registry:mcp"]`
- **新版本**: `"args": ["-y", "shadcn@canary", "mcp"]`

## 什么是 MCP？

MCP 是一个开放协议，标准化了应用程序如何为大语言模型（LLM）提供上下文。可以将其视为连接您的 AI 工具与外部数据源和工具的插件系统。

了解更多关于 MCP 的信息：
- [Cursor MCP 文档](https://docs.cursor.com/mcp)
- [官方 MCP 文档](https://modelcontextprotocol.io/)

## 设置

设置过程取决于您的 AI 工具。

### Cursor

1. 在项目根目录创建 `.cursor/mcp.json` 文件
2. 添加 prompt-kit MCP 服务器配置：

```json
{
  "mcpServers": {
    "prompt-kit": {
      "description": "prompt-kit registry",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "shadcn@canary", "mcp"],
      "env": {
        "REGISTRY_URL": "https://www.prompt-kit.com/c/registry.json"
      }
    }
  }
}
```

3. 重启 Cursor

### components.json 配置

在您的 `components.json` 中添加 prompt-kit 注册表：

```json
{
  "registries": {
    "@prompt-kit": "https://www.prompt-kit.com/c/{name}.json"
  }
}
```

**注意**: URL 必须包含 `{name}` 占位符，用于动态替换组件名称。

### 其他 AI 工具

对于其他支持 MCP 的 AI 工具，请参考它们关于如何配置 MCP 服务器的具体文档。使用上面相同的服务器配置，根据需要调整文件位置。

## 使用方法

配置完成后，您可以开始在 AI 工具的聊天中使用 prompt-kit 组件。

### 浏览组件
```
显示所有可用的 prompt-kit 组件
```

### 添加特定组件
```
将 prompt-kit 的 PromptInput 组件添加到我的项目中
```

### 获取组件详情
```
显示 PromptTextarea 组件的文档和预览
```

### 构建基础聊天应用
```
使用 prompt-kit 构建一个聊天应用：使用 ChatContainer 内含 ScrollButton，加上 Message 和 PromptInput
```

---

*本文档翻译自 prompt-kit 官方 MCP 文档。*