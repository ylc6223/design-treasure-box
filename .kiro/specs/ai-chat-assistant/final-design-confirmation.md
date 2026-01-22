# 最终设计方案确认

## ✅ 已确认的设计要点

### 1. PC端布局

- ✅ 右侧固定面板（400px宽度）
- ✅ 主内容区域不被遮挡
- ✅ 底部输入框作为触发开关
  - 用户输入内容后打开右侧面板
  - 自动隐藏并清空
  - 面板显示用户输入的内容
  - 关闭面板后底部输入框复原

### 2. 移动端布局

- ✅ 全屏模式（fixed定位覆盖）
- ✅ 主页面保留在DOM中（性能优化）
- ✅ 明显的返回按钮
- ✅ 输入框固定在屏幕底部

### 3. 澄清问题交互

- ✅ 快速回复按钮（一次显示所有选项）
- ✅ 不使用步骤式提问
- ✅ 用户可以点击按钮或直接输入

### 4. 资源展示

- ✅ 默认显示简化版（截图、名称、评分）
- ✅ 悬停/点击显示详细信息
- ✅ 符合"渐进式披露"原则

---

## 🎯 核心交互流程

### PC端完整流程

```
1. 用户在底部输入框输入："推荐一些高级感的设计资源"
   ↓
2. 用户按回车/点击发送
   ↓
3. 右侧面板滑入动画
   ↓
4. 底部输入框自动隐藏并清空
   ↓
5. 面板显示用户消息："推荐一些高级感的设计资源"
   ↓
6. AI回复："为了给您更精准的推荐，请问您主要需要哪方面的资源？"
   ↓
7. 显示快速回复按钮：[🎨 UI灵感] [🔤 字体资源] [🎨 配色工具]
   ↓
8. 用户点击"UI灵感"或直接在面板输入框输入
   ↓
9. AI回复 + 显示简化资源卡片
   ↓
10. 用户悬停/点击卡片查看详情
   ↓
11. 用户关闭面板
   ↓
12. 底部输入框复原（空白状态）
```

### 移动端完整流程

```
1. 用户在底部输入框输入："推荐一些高级感的设计资源"
   ↓
2. 用户按回车/点击发送
   ↓
3. 全屏聊天界面覆盖（fixed定位，滑入动画）
   ↓
4. 主页面保留在DOM中（性能优化）
   ↓
5. 显示用户消息 + AI回复 + 快速回复按钮
   ↓
6. 用户继续对话
   ↓
7. 用户点击返回按钮
   ↓
8. 聊天界面滑出，主页面恢复显示
```

---

## 📐 详细组件规范

### 1. 底部触发输入框（PC端）

```typescript
interface AIPromptInputProps {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  isLoading?: boolean;
}

// 使用示例
<AIPromptInput
  value={triggerInput}
  onValueChange={setTriggerInput}
  onSubmit={handleTriggerSubmit}
  placeholder="输入你想要的设计资源，AI 帮你找..."
  className={cn(
    "fixed bottom-6 left-1/2 -translate-x-1/2 z-40",
    "max-w-2xl w-full px-4",
    // 面板打开时隐藏
    isChatOpen && "opacity-0 pointer-events-none"
  )}
/>
```

### 2. 右侧聊天面板（PC端）

```typescript
interface AIChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

// 使用示例
<AIChatInterface
  isOpen={isChatOpen}
  onClose={handleCloseChat}
  initialQuery={initialQuery}
  className={cn(
    "fixed top-0 right-0 h-full w-[400px]",
    "bg-background border-l shadow-2xl z-50"
  )}
/>
```

### 3. 快速回复按钮

```typescript
interface QuickReplyButtonsProps {
  replies: string[];
  onSelect: (reply: string) => void;
}

// 使用示例
<QuickReplyButtons
  replies={[
    '🎨 UI设计灵感',
    '🔤 字体资源',
    '🎨 配色工具',
    '📐 布局模板'
  ]}
  onSelect={handleQuickReply}
  className="flex flex-wrap gap-2 mt-3"
/>

// 渲染
{replies.map(reply => (
  <Button
    key={reply}
    variant="outline"
    size="sm"
    className={cn(
      "rounded-full text-sm",
      "hover:bg-primary hover:text-primary-foreground",
      "transition-colors"
    )}
    onClick={() => onSelect(reply)}
  >
    {reply}
  </Button>
))}
```

### 4. 简化资源卡片

```typescript
interface ResourceInlineCardProps {
  resource: Resource;
  onViewDetails?: (resource: Resource) => void;
  variant?: 'default' | 'compact';
}

// 默认状态（简化版）
<ResourceInlineCard
  resource={resource}
  onViewDetails={handleViewDetails}
  variant="compact"
  className={cn(
    "flex items-center gap-3 p-3",
    "hover:bg-accent/50 transition-colors cursor-pointer",
    "rounded-lg border"
  )}
/>

// 渲染结构
<Card onClick={() => onViewDetails?.(resource)}>
  {/* 缩略图 */}
  <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
    <Image src={resource.screenshot} alt={resource.name} fill />
  </div>

  {/* 信息 */}
  <div className="flex-1 min-w-0">
    <h4 className="font-semibold text-sm truncate">{resource.name}</h4>
    <div className="flex items-center gap-2 mt-1">
      <RatingStars rating={resource.rating.overall} size="sm" />
      <span className="text-xs text-muted-foreground">{resource.category}</span>
    </div>
  </div>

  {/* 箭头 */}
  <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
</Card>
```

### 5. 资源详情展开（悬停/点击）

```typescript
// 使用 Sheet 组件（移动端）或 Popover（桌面端）
import { Sheet, SheetContent } from '@/components/ui/sheet';

<Sheet open={isDetailOpen} onOpenChange={setIsDetailOpen}>
  <SheetContent side="bottom" className="h-[80vh]">
    {/* 大图预览 */}
    <div className="relative w-full h-48 rounded-lg overflow-hidden">
      <Image src={resource.screenshot} alt={resource.name} fill />
    </div>

    {/* 详细信息 */}
    <div className="mt-4 space-y-4">
      <h2 className="text-2xl font-bold">{resource.name}</h2>

      <div className="flex items-center gap-4">
        <RatingStars rating={resource.rating.overall} size="lg" showValue />
        <Badge>{resource.category}</Badge>
      </div>

      <p className="text-muted-foreground">{resource.description}</p>

      {/* 详细评分 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>易用性</span>
          <RatingStars rating={resource.rating.usability} size="sm" />
        </div>
        <div className="flex justify-between">
          <span>美观度</span>
          <RatingStars rating={resource.rating.aesthetics} size="sm" />
        </div>
        {/* ... */}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2">
        <Button onClick={() => handleFavorite(resource.id)}>
          <Heart className="w-4 h-4 mr-2" />
          收藏
        </Button>
        <Button onClick={() => handleVisit(resource.id)}>
          <ExternalLink className="w-4 h-4 mr-2" />
          访问
        </Button>
      </div>
    </div>
  </SheetContent>
</Sheet>
```

---

## 🎨 动画效果

### 1. 面板滑入/滑出（PC端）

```typescript
import { motion, AnimatePresence } from 'motion/react';

<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 300,
        mass: 0.8
      }}
      className="fixed top-0 right-0 h-full w-[400px] bg-background"
    >
      {/* 聊天界面 */}
    </motion.div>
  )}
</AnimatePresence>
```

### 2. 底部输入框淡入/淡出

```typescript
<motion.div
  animate={{
    opacity: isChatOpen ? 0 : 1,
    y: isChatOpen ? 20 : 0
  }}
  transition={{ duration: 0.2 }}
  className="fixed bottom-6 left-1/2 -translate-x-1/2"
>
  <AIPromptInput />
</motion.div>
```

### 3. 消息进入动画

```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  <Message />
</motion.div>
```

### 4. 快速回复按钮动画

```typescript
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.1, duration: 0.2 }}
  className="flex flex-wrap gap-2"
>
  {replies.map((reply, index) => (
    <motion.div
      key={reply}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Button>{reply}</Button>
    </motion.div>
  ))}
</motion.div>
```

---

## 📊 性能优化策略

### 1. 移动端DOM保留

```typescript
// ❌ 错误：替换DOM（性能差）
{isChatOpen ? <ChatInterface /> : <ResourceGrid />}

// ✅ 正确：覆盖显示（性能好）
<>
  <ResourceGrid />  {/* 始终保留在DOM中 */}

  <AnimatePresence>
    {isChatOpen && (
      <motion.div className="fixed inset-0 z-50">
        <ChatInterface />
      </motion.div>
    )}
  </AnimatePresence>
</>
```

### 2. 虚拟滚动（对话历史）

```typescript
// 当对话历史很长时，使用虚拟滚动
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => scrollRef.current,
  estimateSize: () => 100,
  overscan: 5,
});
```

### 3. 图片懒加载

```typescript
<Image
  src={resource.screenshot}
  alt={resource.name}
  fill
  loading="lazy"  // 懒加载
  placeholder="blur"  // 模糊占位
  onError={handleImageError}
/>
```

---

## ✅ 实现检查清单

### P0 - 核心功能

- [ ] 底部触发输入框组件
- [ ] 右侧聊天面板组件（PC端）
- [ ] 全屏聊天界面（移动端）
- [ ] 快速回复按钮组件
- [ ] 简化资源卡片组件
- [ ] 输入框自动隐藏/复原逻辑
- [ ] 面板滑入/滑出动画

### P1 - 增强功能

- [ ] 资源详情展开（Sheet/Popover）
- [ ] 悬停预览效果
- [ ] 加载状态指示器
- [ ] 错误处理和重试
- [ ] 会话状态持久化

### P2 - 优化功能

- [ ] 虚拟滚动（长对话历史）
- [ ] 图片懒加载优化
- [ ] 手势滑动返回（移动端）
- [ ] 键盘快捷键支持
- [ ] 对话历史搜索

---

## 🎯 下一步行动

1. **更新 design.md** ✅
   - 将最终方案写入设计文档
   - 更新组件架构和接口定义

2. **更新 tasks.md**
   - 根据新设计重新规划实现任务
   - 明确优先级（P0/P1/P2）

3. **开始实现**
   - 从P0核心功能开始
   - 逐步迭代优化

**准备好开始了吗？** 🚀
