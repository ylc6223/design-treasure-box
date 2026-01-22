# AI 聊天助手集成文档

## 概述

AI 聊天助手已成功集成到设计百宝箱主应用中，用户可以通过底部浮动输入框触发右侧聊天界面。

## 集成架构

### 组件层次结构

```
HomePage (components/home-page.tsx)
├── AIPromptInput (底部浮动输入框)
│   └── 触发聊天界面打开
└── AIChatInterface (右侧滑出聊天面板)
    ├── ResourceMessage (资源推荐显示)
    ├── ClarificationMessage (澄清问题显示)
    └── ResourcePreviewCard (资源预览卡片)
```

### 状态管理

HomePage 组件管理以下状态：

- `isChatOpen: boolean` - 控制聊天界面的打开/关闭
- `initialQuery: string | undefined` - 存储用户的初始查询

### 事件流程

1. **用户输入查询**
   - 用户在 `AIPromptInput` 中输入内容并提交
   - 触发 `handleAIPromptSubmit(prompt: string)`

2. **打开聊天界面**
   - 设置 `initialQuery = prompt`
   - 设置 `isChatOpen = true`
   - `AIChatInterface` 组件滑入显示

3. **显示初始消息**
   - `AIChatInterface` 接收 `initialQuery` prop
   - 自动发送初始查询到 AI 助手
   - 显示用户消息和 AI 响应

4. **关闭聊天界面**
   - 用户点击关闭按钮
   - 触发 `handleChatClose()`
   - 设置 `isChatOpen = false`
   - 清除 `initialQuery`

## 代码修改

### HomePage 组件修改

```typescript
// 新增导入
import { AIPromptInput } from '@/components/ai-prompt-input'
import { AIChatInterface } from '@/components/ai-chat-interface'

// 新增状态
const [isChatOpen, setIsChatOpen] = useState(false)
const [initialQuery, setInitialQuery] = useState<string | undefined>(undefined)

// 新增事件处理器
const handleAIPromptSubmit = (prompt: string) => {
  setInitialQuery(prompt)
  setIsChatOpen(true)
}

const handleChatClose = () => {
  setIsChatOpen(false)
  setInitialQuery(undefined)
}

// 新增组件渲染
<AIPromptInput
  onSubmit={handleAIPromptSubmit}
  placeholder="输入你想要的设计资源，AI 帮你找..."
/>

<AIChatInterface
  isOpen={isChatOpen}
  onClose={handleChatClose}
  initialQuery={initialQuery}
/>
```

## 测试覆盖

### 集成测试 (components/**tests**/home-page-ai-integration.test.tsx)

- ✅ 应该渲染 AI 输入框
- ✅ 应该渲染 AI 聊天界面（初始关闭）
- ✅ 当用户提交查询时应该打开聊天界面
- ✅ 应该将初始查询传递给聊天界面
- ✅ 当用户关闭聊天界面时应该隐藏
- ✅ 关闭后重新打开应该清除之前的查询

**测试结果**: 6/6 通过

## 响应式设计

### 断点适配

- **移动设备** (<768px): 聊天界面全屏显示
- **平板设备** (768px-1199px): 90% 宽度，最大 400px
- **桌面设备** (≥1200px): 固定 450px 宽度
- **超大屏** (≥1440px): 固定 500px 宽度

### 输入框显示

- 底部浮动输入框在滚动时自动隐藏
- 停止滚动后延迟显示（300ms）
- 使用 `useScrollVisibility` hook 管理可见性

## 用户体验

### 交互流程

1. 用户在主页浏览资源
2. 看到底部浮动的 AI 输入框
3. 输入查询（例如："高级感的排版参考"）
4. 按回车或点击发送按钮
5. 右侧滑出聊天界面
6. 显示用户的查询和 AI 的响应
7. 可以继续对话或关闭界面

### 视觉效果

- 聊天界面滑入/滑出动画（300ms ease-in-out）
- 半透明遮罩层（移动端：40% 黑色，桌面端：20% 黑色）
- 毛玻璃效果的输入框背景
- 平滑的过渡动画

## 兼容性

### 现有功能兼容

- ✅ 不影响资源浏览和筛选
- ✅ 不影响收藏功能
- ✅ 不影响分类过滤
- ✅ 不影响无限滚动加载
- ✅ 与主题切换兼容

### 浏览器兼容

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动浏览器 (iOS Safari, Chrome Mobile)

## 下一步

### 待完成任务

1. **动画优化** (任务 9.2)
   - 添加 motion/react 动画效果
   - 优化消息加载动画

2. **会话管理** (任务 10)
   - 实现会话持久化
   - 支持多轮对话历史

3. **资源操作** (任务 11)
   - 集成收藏功能
   - 实现资源详情跳转

4. **错误处理** (任务 12)
   - 完善错误提示
   - 添加重试机制

5. **最终调优** (任务 14.2)
   - 性能优化
   - 用户体验调优

## 验证方法

### 手动测试

1. 启动开发服务器：`pnpm dev`
2. 打开浏览器访问：`http://localhost:3000`
3. 滚动页面查看底部输入框
4. 输入查询并提交
5. 验证聊天界面打开
6. 验证初始查询显示
7. 点击关闭按钮
8. 验证界面关闭

### 自动化测试

```bash
# 运行集成测试
pnpm test components/__tests__/home-page-ai-integration.test.tsx --run

# 运行所有 AI 相关测试
pnpm test ai-chat --run
```

## 回滚方案

如需回滚此集成，执行以下步骤：

1. 恢复 `components/home-page.tsx` 到之前版本
2. 删除 `components/__tests__/home-page-ai-integration.test.tsx`
3. 可选：保留 `AIPromptInput` 和 `AIChatInterface` 组件供后续使用

## 参考文档

- [需求文档](.kiro/specs/ai-chat-assistant/requirements.md)
- [任务计划](.kiro/specs/ai-chat-assistant/tasks.md)
- [AI 聊天组件文档](../components/ai-chat/README.md)
- [设计系统规则](.kiro/steering/design-system.md)
