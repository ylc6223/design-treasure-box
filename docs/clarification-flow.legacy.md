# 澄清问题交互流程

## 改进前 vs 改进后

### 改进前（批量卡片式）

```
用户: "推荐工具"

AI: [卡片]
    需要更多信息

    请选择或回答以下问题：

    [按钮] 您需要哪个类别的资源？（例如：配色工具、CSS框架...）
    [按钮] 您偏好什么风格的设计？（例如：简约、现代...）
    [按钮] 这个资源主要面向什么人群？（例如：新手、专业...）

    [自定义回答]

❌ 问题：
- 一次性显示所有问题，信息量大
- 点击后疑问句变成用户提问（"您需要哪个类别的资源？"）
- 不够自然，像填表单而不是对话
```

### 改进后（步骤式对话）

```
用户: "推荐工具"

AI: 您需要哪个类别的资源？

    [按钮] 我需要配色工具
    [按钮] 我需要CSS框架或模板
    [按钮] 我需要字体资源
    [按钮] 我需要图标库
    [按钮] 我需要设计灵感
    [按钮] 我需要UI组件或工具包

    [跳过这个问题]

---

用户: "我需要配色工具"  ← 点击后显示为用户消息

AI: 您偏好什么风格的设计？

    [按钮] 我偏好简约/极简风格
    [按钮] 我偏好现代/时尚风格
    [按钮] 我偏好复古/经典风格
    [按钮] 我偏好专业/商务风格
    [按钮] 我偏好创意/个性风格

    [跳过这个问题]

---

用户: "我偏好简约/极简风格"

AI: 这个资源主要面向什么人群？

    [按钮] 主要面向新手/初学者
    [按钮] 主要面向专业设计师
    [按钮] 主要面向开发者/程序员
    [按钮] 主要面向学生
    [按钮] 主要面向企业/商业用途

    [直接搜索]  ← 最后一个问题显示"直接搜索"

---

用户: "主要面向新手/初学者"

AI: 正在为您搜索...

    [加载动画]

---

AI: 根据您的需求，我为您推荐以下配色工具：

    [资源卡片 1]
    [资源卡片 2]
    [资源卡片 3]

✅ 优势：
- 一次只问一个问题，信息清晰
- 选项是陈述句，点击后自然地成为用户回答
- 像真实对话，体验自然流畅
- 可以随时跳过，灵活控制
```

## 技术实现

### 状态管理

```typescript
// 聊天界面组件状态
const [currentClarificationIndex, setCurrentClarificationIndex] = useState(0);
const [clarificationAnswers, setClarificationAnswers] = useState<string[]>([]);

// 问题数据结构
interface ClarificationQuestion {
  question: string; // "您需要哪个类别的资源？"
  options: string[]; // ["我需要配色工具", "我需要CSS框架..."]
  aspect: 'category' | 'style' | 'audience' | 'purpose';
}
```

### 交互流程

```typescript
// 1. 用户点击选项
handleClarificationAnswer("我需要配色工具")
  ↓
// 2. 添加为用户消息
setMessages([...messages, { type: 'user', content: "我需要配色工具" }])
  ↓
// 3. 保存回答
setClarificationAnswers([...answers, "我需要配色工具"])
  ↓
// 4. 检查是否还有更多问题
if (currentIndex + 1 < questions.length) {
  // 进入下一个问题
  setCurrentClarificationIndex(currentIndex + 1)
} else {
  // 所有问题回答完毕，组合查询
  const fullQuery = `${originalQuery} ${answers.join(' ')}`
  handleSendMessage(fullQuery, true)
}
```

### 组件结构

```typescript
<ClarificationMessage
  questions={clarificationQuestions}      // 所有问题
  currentQuestionIndex={currentIndex}     // 当前显示第几个
  onAnswerSelect={handleAnswer}           // 选择选项
  onSkip={handleSkip}                     // 跳过问题
/>
```

## 用户体验优化

### 1. 视觉一致性

- 使用 `MessageContent` 组件显示问题（与 AI 回复一致）
- 选项按钮使用 `Button` 组件（与整体风格统一）
- 保持与聊天界面相同的间距和圆角

### 2. 交互反馈

- 按钮 hover 时高亮（`hover:bg-primary hover:text-primary-foreground`）
- 点击后立即显示用户消息（无延迟）
- 自动滚动到最新消息

### 3. 灵活控制

- 每个问题都可以跳过
- 最后一个问题显示"直接搜索"（更明确的行动召唤）
- 跳过后使用已有回答继续（不会丢失信息）

## 数据流

```
用户输入模糊查询
    ↓
RAG引擎分析查询清晰度
    ↓
生成结构化澄清问题
    ↓
前端步骤式显示（一次一个）
    ↓
用户回答/跳过
    ↓
收集所有回答
    ↓
组合成完整查询
    ↓
重新搜索并返回结果
```

## 扩展性

### 未来可以添加的功能

1. **进度指示器**

   ```
   问题 1/3: 您需要哪个类别的资源？
   ●●○
   ```

2. **回退功能**

   ```
   [← 返回上一个问题]
   ```

3. **自定义输入**

   ```
   [自定义回答]
   → 展开文本输入框
   ```

4. **智能跳过**

   ```
   根据已有回答自动跳过某些问题
   例如：已选择"配色工具"，自动跳过"您需要什么类型的工具？"
   ```

5. **动画效果**
   ```typescript
   <motion.div
     initial={{ opacity: 0, y: 10 }}
     animate={{ opacity: 1, y: 0 }}
     exit={{ opacity: 0, y: -10 }}
   >
     {currentQuestion}
   </motion.div>
   ```
