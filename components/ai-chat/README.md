# AI 聊天组件

这个目录包含 AI 聊天助手功能的自定义消息渲染器组件。

## 组件

### ResourceMessage

在聊天界面中显示 AI 推荐的资源列表。内部使用 `ResourcePreviewCard` 组件渲染每个资源。

**功能特性：**

- 显示资源缩略图（带加载错误处理）
- 显示精选标识
- 显示资源名称和评分
- 显示匹配理由
- 显示匹配方面标签
- 提供操作按钮（收藏、访问、查看详情）
- 高相关度资源显示"高度匹配"指示器

**使用示例：**

```tsx
import { ResourceMessage } from '@/components/ai-chat';

<ResourceMessage
  resources={recommendations}
  onResourceClick={(resource) => {
    // 跳转到资源详情页
    router.push(`/resource/${resource.id}`);
  }}
  onFavorite={(resourceId) => {
    // 添加到收藏
    addToFavorites(resourceId);
  }}
  onVisit={(resourceId) => {
    // 打开资源链接
    window.open(resources.find((r) => r.id === resourceId)?.url, '_blank');
  }}
/>;
```

**Props：**

| 属性              | 类型                           | 必需 | 说明                 |
| ----------------- | ------------------------------ | ---- | -------------------- |
| `resources`       | `ResourceRecommendation[]`     | 是   | 资源推荐列表         |
| `onResourceClick` | `(resource: Resource) => void` | 是   | 点击资源卡片时的回调 |
| `onFavorite`      | `(resourceId: string) => void` | 是   | 点击收藏按钮时的回调 |
| `onVisit`         | `(resourceId: string) => void` | 是   | 点击访问按钮时的回调 |
| `className`       | `string`                       | 否   | 自定义类名           |

### ClarificationMessage

在聊天界面中显示 AI 的澄清问题，用于引导用户提供更多信息。

**功能特性：**

- 显示多个预设澄清问题
- 支持点击问题快速回答
- 支持自定义文本回答
- 输入验证（不允许空白回答）

**使用示例：**

```tsx
import { ClarificationMessage } from '@/components/ai-chat';

<ClarificationMessage
  questions={['您需要什么类型的设计资源？', '您的目标受众是什么？', '您的使用场景是什么？']}
  onQuestionSelect={(question) => {
    // 用户选择了预设问题
    handleSendMessage(question);
  }}
  onCustomResponse={(response) => {
    // 用户输入了自定义回答
    handleSendMessage(response);
  }}
/>;
```

**Props：**

| 属性               | 类型                         | 必需 | 说明                   |
| ------------------ | ---------------------------- | ---- | ---------------------- |
| `questions`        | `string[]`                   | 是   | 澄清问题列表           |
| `onQuestionSelect` | `(question: string) => void` | 是   | 选择预设问题时的回调   |
| `onCustomResponse` | `(response: string) => void` | 是   | 提交自定义回答时的回调 |
| `className`        | `string`                     | 否   | 自定义类名             |

### ResourcePreviewCard

通用的资源预览卡片组件，可在聊天界面和其他场景中复用。

**功能特性：**

- 缩略图显示（支持加载状态和错误处理）
- 精选标识
- 资源名称和评分
- 匹配理由和匹配方面标签（可选）
- 操作按钮（收藏、访问、查看详情）
- 相关度指示器（可选）
- 两种变体：compact（紧凑）和 default（默认）

**使用示例：**

```tsx
import { ResourcePreviewCard } from '@/components/ai-chat';

// 紧凑模式（用于聊天界面）
<ResourcePreviewCard
  resource={resource}
  matchReason="这个工具非常适合您的配色需求"
  matchedAspects={['配色方案', '易用性', '免费']}
  relevanceScore={0.95}
  variant="compact"
  onFavorite={(id) => toggleFavorite(id)}
  onVisit={(id) => window.open(resource.url)}
  onViewDetails={(res) => router.push(`/resource/${res.id}`)}
/>

// 默认模式（用于其他场景）
<ResourcePreviewCard
  resource={resource}
  variant="default"
  isFavorited={true}
  onFavorite={(id) => toggleFavorite(id)}
  onVisit={(id) => window.open(resource.url)}
/>
```

**Props：**

| 属性             | 类型                           | 必需 | 说明                                 |
| ---------------- | ------------------------------ | ---- | ------------------------------------ |
| `resource`       | `Resource`                     | 是   | 资源对象                             |
| `matchReason`    | `string`                       | 否   | 匹配理由                             |
| `matchedAspects` | `string[]`                     | 否   | 匹配方面标签                         |
| `relevanceScore` | `number`                       | 否   | 相关度分数（>0.8显示高度匹配指示器） |
| `isFavorited`    | `boolean`                      | 否   | 是否已收藏                           |
| `onFavorite`     | `(resourceId: string) => void` | 否   | 收藏回调                             |
| `onVisit`        | `(resourceId: string) => void` | 否   | 访问回调                             |
| `onViewDetails`  | `(resource: Resource) => void` | 否   | 查看详情回调                         |
| `variant`        | `'compact' \| 'default'`       | 否   | 变体样式（默认：'compact'）          |
| `className`      | `string`                       | 否   | 自定义类名                           |

## 集成到聊天界面

这些组件已经集成到 `AIChatInterface` 组件中。当 AI 助手的消息包含资源推荐或澄清问题时，会自动渲染相应的组件。

**消息数据结构：**

```typescript
interface ExtendedChatMessage {
  id: string;
  sessionId: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;

  // 可选：资源推荐
  resources?: ResourceRecommendation[];

  // 可选：澄清问题
  clarificationQuestions?: string[];

  // 可选：搜索元数据
  searchMetadata?: SearchMetadata;
}
```

## 测试

所有组件都有完整的单元测试覆盖：

```bash
# 运行测试
pnpm test components/ai-chat/__tests__/

# 测试覆盖：
# - ResourceMessage: 13 个测试
# - ClarificationMessage: 16 个测试
# - ResourcePreviewCard: 23 个测试
```

## 设计原则

1. **紧凑布局**：适合聊天界面的紧凑卡片设计
2. **响应式**：适配不同屏幕尺寸
3. **可访问性**：所有交互元素都有适当的 ARIA 标签
4. **错误处理**：优雅处理图片加载失败等错误情况
5. **用户体验**：清晰的视觉反馈和流畅的交互
6. **可复用性**：组件设计支持在不同场景中复用

## 相关文档

- [设计文档](../../.kiro/specs/ai-chat-assistant/design.md)
- [需求文档](../../.kiro/specs/ai-chat-assistant/requirements.md)
- [任务列表](../../.kiro/specs/ai-chat-assistant/tasks.md)
