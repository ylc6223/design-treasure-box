# MCP 配置指南 - shadcn 和 prompt-kit (最新版本)

本指南将帮助您在项目中配置 shadcn 和 prompt-kit 的 MCP 服务器，以便在 AI 工具中直接访问和使用这些组件库。

## ⚠️ 重要更新

根据最新的仓库 issue，prompt-kit MCP 配置已更改：

- **旧版本**: `"args": ["-y", "shadcn@canary", "registry:mcp"]`
- **新版本**: `"args": ["-y", "shadcn@canary", "mcp"]`

## 什么是 MCP？

模型上下文协议（Model Context Protocol，MCP）是一个开放协议，使 AI 助手能够安全地连接到外部数据源和工具。通过 MCP，您可以：

- 直接在 AI 工具中浏览和搜索组件
- 使用自然语言安装组件到项目中
- 获取组件文档和预览
- 构建完整的应用程序

## 支持的 AI 工具

- **Cursor** - 推荐使用
- **Claude Code**
- **VS Code** (with GitHub Copilot)
- **Codex**
- **Kiro** (当前环境)

## 配置方法

### 1. Cursor 配置

在项目根目录创建 `.cursor/mcp.json` 文件：

```json
{
  "mcpServers": {
    "shadcn": {
      "description": "shadcn/ui components",
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
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

### 2. Kiro 配置

在项目中创建 `.kiro/settings/mcp.json` 文件：

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"],
      "env": {
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": []
    },
    "prompt-kit": {
      "description": "prompt-kit registry",
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "shadcn@canary", "mcp"],
      "env": {
        "REGISTRY_URL": "https://www.prompt-kit.com/c/registry.json",
        "FASTMCP_LOG_LEVEL": "ERROR"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

### 3. VS Code 配置

在项目根目录创建 `.vscode/mcp.json` 文件：

```json
{
  "servers": {
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

### 4. Claude Code 配置

在项目根目录创建 `.mcp.json` 文件：

```json
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["shadcn@latest", "mcp"]
    },
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

## 使用示例

配置完成后，您可以使用以下自然语言提示：

### shadcn 组件

```
安装一个按钮组件
添加一个数据表格组件到我的项目
从 shadcn 注册表搜索表单组件
```

### prompt-kit 组件

```
显示所有可用的 prompt-kit 组件
将 prompt-kit 的 PromptInput 组件添加到我的项目中
使用 prompt-kit 构建一个聊天应用
```

### 组合使用

```
使用 shadcn 的 Card 组件和 prompt-kit 的 PromptInput 创建一个聊天界面
构建一个包含 shadcn 按钮和 prompt-kit 消息组件的应用
```

## 项目配置要求

### components.json 配置

确保您的项目有正确的 `components.json` 配置。**重要**：注册表 URL 必须包含 `{name}` 占位符：

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "radix",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@smoothui": "https://smoothui.dev/r/{name}.json",
    "@prompt-kit": "https://www.prompt-kit.com/c/{name}.json"
  }
}
```

### 注册表配置说明

1. **shadcn/ui**: 默认注册表，无需在 `components.json` 中显式配置
2. **@prompt-kit**: 使用 `https://www.prompt-kit.com/c/{name}.json` 格式
3. **@smoothui**: 第三方注册表示例
4. **{name} 占位符**: 必须包含，用于动态替换组件名称

### 错误的配置方式 ❌

```json
// 错误：缺少 {name} 占位符
"@prompt-kit": "https://www.prompt-kit.com/c/registry.json"

// 错误：使用对象格式而不是字符串
"@prompt-kit": {
  "url": "https://www.prompt-kit.com/c/registry.json"
}
```

### 正确的配置方式 ✅

```json
// 正确：包含 {name} 占位符
"@prompt-kit": "https://www.prompt-kit.com/c/{name}.json"
```

````

### 环境变量

如果使用私有注册表，在 `.env.local` 中设置：

```env
REGISTRY_TOKEN=your_token_here
API_KEY=your_api_key_here
````

## 故障排除

### 常见问题

1. **MCP 服务器无响应**
   - 检查配置文件格式是否正确
   - 重启 AI 工具
   - 确保 npx 和 shadcn 已安装

2. **组件安装失败**
   - 检查 `components.json` 配置
   - 确保目标目录存在
   - 验证项目权限

3. **找不到工具或提示**
   - 清除 npx 缓存：`npx clear-npx-cache`
   - 重新启用 MCP 服务器
   - 检查日志输出

### 验证配置

配置完成后，在 AI 工具中运行：

```
列出所有可用的 MCP 工具
显示 shadcn 和 prompt-kit 的连接状态
```

## 推荐工作流程

1. **初始设置**：配置 MCP 服务器
2. **浏览组件**：使用自然语言浏览可用组件
3. **安装组件**：选择需要的组件并安装
4. **构建应用**：组合使用不同来源的组件
5. **迭代开发**：根据需要添加更多组件

通过这种配置，您可以在 AI 工具中无缝地使用 shadcn/ui 和 prompt-kit 的组件，大大提高开发效率。
